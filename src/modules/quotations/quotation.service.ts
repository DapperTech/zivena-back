import { AuthUser } from "../../shared/auth/types";
import {
  ConflictAppError,
  ForbiddenAppError,
  NotFoundAppError,
  ValidationAppError
} from "../../shared/errors/AppError";
import type { WebsiteLeadDto } from "../leads/lead.dto";
import { LeadRepository } from "../leads/lead.repository";
import type { LeadEntity } from "../leads/lead.types";
import {
  CreateQuotationDto,
  QuotationItemDto,
  UpdateQuotationDto
} from "./quotation.dto";
import {
  QuotationRepository,
  QuotationWritePayload
} from "./quotation.repository";
import {
  QuotationAssignee,
  QuotationEntity,
  QuotationItem
} from "./quotation.types";

const DEFAULT_TERMS =
  "Precios expresados en MXN. La disponibilidad y los tiempos de entrega se confirman al aprobar la cotización.";

const isAdmin = (user: AuthUser): boolean => user.roles?.includes("admin") ?? false;
const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const assigneeFromUser = (user: AuthUser): QuotationAssignee => ({
  uid: user.uid,
  name: user.name ?? user.email ?? "Ejecutivo Zivena",
  email: user.email
});

const calculateTotals = (
  products: Array<QuotationItemDto | QuotationItem>,
  taxRate: number
): Pick<QuotationWritePayload, "products" | "subtotal" | "taxRate" | "tax" | "total"> => {
  const normalizedProducts: QuotationItem[] = products.map((item) => {
    const unitPrice = roundMoney(item.unitPrice);
    return {
      productId: item.productId,
      sku: item.sku.trim().toUpperCase(),
      name: item.name.trim(),
      imageUrl: item.imageUrl,
      technique: item.technique,
      quantity: item.quantity,
      unitPrice,
      totalPrice: roundMoney(item.quantity * unitPrice),
      metadata: item.metadata ?? {}
    };
  });
  const subtotal = roundMoney(
    normalizedProducts.reduce((sum, item) => sum + item.totalPrice, 0)
  );
  const normalizedTaxRate = Math.min(Math.max(taxRate, 0), 100);
  const tax = roundMoney(subtotal * (normalizedTaxRate / 100));

  return {
    products: normalizedProducts,
    subtotal,
    taxRate: normalizedTaxRate,
    tax,
    total: roundMoney(subtotal + tax)
  };
};

const financialSignature = (products: QuotationItem[]): string =>
  JSON.stringify(
    products.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  );

export class QuotationService {
  private readonly leadRepository = new LeadRepository();

  constructor(private readonly repository: QuotationRepository) {}

  list(user: AuthUser): Promise<QuotationEntity[]> {
    return this.repository.findAll(isAdmin(user) ? undefined : user.uid);
  }

  async getById(id: string, user: AuthUser): Promise<QuotationEntity> {
    const quotation = await this.findOrThrow(id);
    this.assertCanAccess(quotation, user);
    return quotation;
  }

  async create(payload: CreateQuotationDto, user: AuthUser): Promise<QuotationEntity> {
    const totals = calculateTotals(payload.products, payload.taxRate);
    const assignedTo = isAdmin(user)
      ? (payload.assignedTo ?? assigneeFromUser(user))
      : assigneeFromUser(user);

    return this.repository.create({
      clientId: payload.clientId,
      source: "manual",
      contact: payload.contact,
      ...totals,
      address: payload.address,
      status: "draft",
      currency: payload.currency.toUpperCase(),
      expiresAt: payload.expiresAt ?? daysFromNow(15),
      notes: payload.notes,
      terms: payload.terms ?? DEFAULT_TERMS,
      assignedTo,
      metadata: {
        ...payload.metadata,
        createdByUid: user.uid,
        createdByName: user.name ?? user.email
      }
    });
  }

  async update(
    id: string,
    payload: UpdateQuotationDto,
    user: AuthUser
  ): Promise<QuotationEntity> {
    const current = await this.findOrThrow(id);
    this.assertCanAccess(current, user);

    if (payload.status === "generated") {
      throw new ValidationAppError("Use the generate action to generate a quotation");
    }
    if (!isAdmin(user) && payload.assignedTo) {
      throw new ForbiddenAppError("Sales users cannot reassign quotations");
    }
    if (
      current.status === "draft" &&
      payload.status &&
      ["sent", "approved"].includes(payload.status)
    ) {
      throw new ConflictAppError("Generate the quotation before changing its status");
    }

    const {
      products,
      taxRate,
      metadata,
      assignedTo,
      status,
      currency,
      ...editableFields
    } = payload;
    const updatePayload: Partial<QuotationWritePayload> = {
      ...editableFields,
      ...(currency ? { currency: currency.toUpperCase() } : {}),
      ...(status ? { status } : {}),
      ...(metadata ? { metadata: { ...current.metadata, ...metadata } } : {}),
      ...(assignedTo && isAdmin(user) ? { assignedTo } : {})
    };

    if (products || taxRate !== undefined) {
      const totals = calculateTotals(
        products ?? current.products,
        taxRate ?? current.taxRate
      );
      const financialChanged =
        (products
          ? financialSignature(totals.products) !==
            financialSignature(current.products)
          : false) || totals.taxRate !== current.taxRate;
      Object.assign(updatePayload, totals);
      if (current.status !== "draft") {
        if (financialChanged) {
          updatePayload.status = "draft";
          updatePayload.generatedAt = null;
        }
      }
    }

    const quotation = await this.repository.updateById(id, updatePayload);
    if (!quotation) throw new NotFoundAppError("Quotation not found");
    await this.syncLead(quotation);
    return quotation;
  }

  async generate(id: string, user: AuthUser): Promise<QuotationEntity> {
    const current = await this.findOrThrow(id);
    this.assertCanAccess(current, user);

    const missingPrices = current.products
      .filter((item) => item.unitPrice <= 0)
      .map((item) => item.sku);
    if (missingPrices.length) {
      throw new ValidationAppError("Every product needs a price before generating", {
        skus: missingPrices
      });
    }

    const totals = calculateTotals(current.products, current.taxRate);
    const quotation = await this.repository.updateById(id, {
      ...totals,
      status: "generated",
      generatedAt: new Date()
    });
    if (!quotation) throw new NotFoundAppError("Quotation not found");
    await this.syncLead(quotation);
    return quotation;
  }

  async delete(id: string, user: AuthUser): Promise<void> {
    const current = await this.findOrThrow(id);
    this.assertCanAccess(current, user);
    if (current.status !== "draft") {
      throw new ConflictAppError("Only draft quotations can be deleted");
    }
    if (current.source === "website") {
      throw new ConflictAppError(
        "Website quotation drafts stay linked to their CRM opportunity"
      );
    }
    if (!(await this.repository.deleteById(id))) {
      throw new NotFoundAppError("Quotation not found");
    }
  }

  async createWebsiteDraft(
    lead: LeadEntity,
    payload: WebsiteLeadDto
  ): Promise<QuotationEntity> {
    const existing = await this.repository.findByLeadId(lead.id);
    if (existing) return existing;

    const totals = calculateTotals(
      payload.products.map((item) => ({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        imageUrl: item.imageUrl,
        technique: item.technique,
        quantity: item.quantity,
        unitPrice: 0,
        metadata: {}
      })),
      16
    );

    return this.repository.create({
      leadId: lead.id,
      source: "website",
      contact: {
        name: payload.name,
        company: payload.company,
        email: payload.email,
        phone: payload.phone
      },
      ...totals,
      status: "draft",
      currency: "MXN",
      expiresAt: daysFromNow(15),
      notes: payload.message,
      terms: DEFAULT_TERMS,
      metadata: {
        channel: "zivena.mx",
        ...(payload.deadline
          ? { requestedDeadline: payload.deadline.toISOString() }
          : {})
      }
    });
  }

  async assignFromLead(
    leadId: string,
    assignedTo?: QuotationAssignee
  ): Promise<void> {
    if (!assignedTo) return;
    await this.repository.updateByLeadId(leadId, { assignedTo });
  }

  private async findOrThrow(id: string): Promise<QuotationEntity> {
    const quotation = await this.repository.findById(id);
    if (!quotation) throw new NotFoundAppError("Quotation not found");
    return quotation;
  }

  private async syncLead(quotation: QuotationEntity): Promise<void> {
    if (!quotation.leadId) return;
    await this.leadRepository.syncQuotation(quotation.leadId, {
      folio: quotation.folio,
      status: quotation.status,
      total: quotation.total,
      currency: quotation.currency
    });
  }

  private assertCanAccess(quotation: QuotationEntity, user: AuthUser): void {
    if (!isAdmin(user) && quotation.assignedTo?.uid !== user.uid) {
      throw new ForbiddenAppError(
        "This quotation is assigned to another sales executive"
      );
    }
  }
}

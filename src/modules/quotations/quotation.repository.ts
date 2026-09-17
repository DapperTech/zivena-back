import { QuotationModel } from "./quotation.model";
import { QuotationEntity } from "./quotation.types";

export type QuotationWritePayload = Omit<
  QuotationEntity,
  "id" | "folio" | "createdAt" | "updatedAt" | "generatedAt"
> & {
  generatedAt?: Date | null;
};

type QuotationRecord = Omit<
  QuotationEntity,
  "id" | "clientId" | "leadId" | "generatedAt"
> & {
  _id: { toString(): string };
  clientId?: { toString(): string } | null;
  leadId?: { toString(): string } | null;
  generatedAt?: Date | null;
};

const mapToEntity = (document: QuotationRecord): QuotationEntity => ({
  id: document._id.toString(),
  folio: document.folio,
  clientId: document.clientId?.toString(),
  leadId: document.leadId?.toString(),
  source: document.source,
  contact: {
    name: document.contact.name,
    company: document.contact.company ?? undefined,
    email: document.contact.email ?? undefined,
    phone: document.contact.phone ?? undefined
  },
  products: document.products.map((item) => ({
    productId: item.productId ?? undefined,
    sku: item.sku,
    name: item.name,
    imageUrl: item.imageUrl ?? undefined,
    technique: item.technique ?? undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    metadata: item.metadata ?? {}
  })),
  address: document.address ?? undefined,
  status: document.status,
  subtotal: document.subtotal,
  taxRate: document.taxRate,
  tax: document.tax,
  total: document.total,
  currency: document.currency,
  expiresAt: document.expiresAt,
  notes: document.notes ?? undefined,
  terms: document.terms ?? undefined,
  assignedTo: document.assignedTo ?? undefined,
  generatedAt: document.generatedAt ?? undefined,
  metadata: document.metadata ?? {},
  createdAt: document.createdAt,
  updatedAt: document.updatedAt
});

const createFolio = (id: string, date = new Date()): string =>
  `ZIV-${date.getFullYear()}-${id.slice(-6).toUpperCase()}`;

export class QuotationRepository {
  async findAll(assignedUid?: string): Promise<QuotationEntity[]> {
    const filter = assignedUid ? { "assignedTo.uid": assignedUid } : {};
    const documents = await QuotationModel.find(filter).sort({ updatedAt: -1 }).lean();
    return documents.map((document) =>
      mapToEntity(document as unknown as QuotationRecord)
    );
  }

  async findById(id: string): Promise<QuotationEntity | null> {
    const document = await QuotationModel.findById(id).lean();
    return document ? mapToEntity(document as unknown as QuotationRecord) : null;
  }

  async findByLeadId(leadId: string): Promise<QuotationEntity | null> {
    const document = await QuotationModel.findOne({ leadId }).lean();
    return document ? mapToEntity(document as unknown as QuotationRecord) : null;
  }

  async create(payload: QuotationWritePayload): Promise<QuotationEntity> {
    const document = new QuotationModel(payload);
    document.set("folio", createFolio(String(document._id)));
    await document.save();
    return mapToEntity(document.toObject() as unknown as QuotationRecord);
  }

  async updateById(
    id: string,
    payload: Partial<QuotationWritePayload>
  ): Promise<QuotationEntity | null> {
    const document = await QuotationModel.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
      runValidators: true
    }).lean();
    return document ? mapToEntity(document as unknown as QuotationRecord) : null;
  }

  async updateByLeadId(
    leadId: string,
    payload: Partial<QuotationWritePayload>
  ): Promise<QuotationEntity | null> {
    const document = await QuotationModel.findOneAndUpdate({ leadId }, payload, {
      returnDocument: "after",
      runValidators: true
    }).lean();
    return document ? mapToEntity(document as unknown as QuotationRecord) : null;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await QuotationModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

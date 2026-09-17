import { CreateLeadDto, UpdateLeadDto, WebsiteLeadDto } from "./lead.dto";
import { LeadModel } from "./lead.model";
import { LeadEntity } from "./lead.types";
import type { QuotationStatus } from "../quotations/quotation.types";

type LeadRecord = Omit<LeadEntity, "id"> & { _id: { toString(): string } };

const mapEntity = (document: LeadRecord): LeadEntity => ({
  id: document._id.toString(),
  title: document.title,
  contactName: document.contactName,
  company: document.company,
  email: document.email,
  phone: document.phone,
  source: document.source,
  stage: document.stage,
  priority: document.priority,
  estimatedValue: document.estimatedValue,
  currency: document.currency,
  deadline: document.deadline,
  message: document.message,
  notes: document.notes,
  products: document.products,
  assignedTo: document.assignedTo,
  metadata: document.metadata,
  lastActivityAt: document.lastActivityAt,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt
});

export class LeadRepository {
  async findAll(assignedUid?: string): Promise<LeadEntity[]> {
    const filter = assignedUid ? { "assignedTo.uid": assignedUid } : {};
    const documents = await LeadModel.find(filter).sort({ lastActivityAt: -1 }).lean();
    return documents.map((document) => mapEntity(document as unknown as LeadRecord));
  }

  async findById(id: string): Promise<LeadEntity | null> {
    const document = await LeadModel.findById(id).lean();
    return document ? mapEntity(document as unknown as LeadRecord) : null;
  }

  async createWebsite(payload: WebsiteLeadDto): Promise<LeadEntity> {
    const document = await LeadModel.create({
      title: payload.company ? `Cotización · ${payload.company}` : `Cotización · ${payload.name}`,
      contactName: payload.name,
      company: payload.company,
      email: payload.email,
      phone: payload.phone,
      source: "websiteQuote",
      stage: "new",
      priority: "medium",
      deadline: payload.deadline,
      message: payload.message,
      products: payload.products,
      metadata: { channel: "zivena.mx" },
      lastActivityAt: new Date()
    });
    return mapEntity(document.toObject() as unknown as LeadRecord);
  }

  async create(payload: CreateLeadDto): Promise<LeadEntity> {
    const document = await LeadModel.create({ ...payload, lastActivityAt: new Date() });
    return mapEntity(document.toObject() as unknown as LeadRecord);
  }

  async updateById(id: string, payload: UpdateLeadDto): Promise<LeadEntity | null> {
    const document = await LeadModel.findByIdAndUpdate(
      id,
      { ...payload, lastActivityAt: payload.lastActivityAt ?? new Date() },
      { returnDocument: "after", runValidators: true }
    ).lean();
    return document ? mapEntity(document as unknown as LeadRecord) : null;
  }

  async syncQuotation(
    id: string,
    quotation: {
      folio: string;
      status: QuotationStatus;
      total: number;
      currency: string;
    }
  ): Promise<void> {
    const stageByStatus = {
      generated: "proposal",
      sent: "proposal",
      approved: "won",
      rejected: "lost",
      expired: "lost"
    } as const;
    const stage = stageByStatus[quotation.status as keyof typeof stageByStatus];
    const fields: Record<string, unknown> = {
      "metadata.quotationFolio": quotation.folio,
      "metadata.quotationStatus": quotation.status,
      lastActivityAt: new Date()
    };

    if (stage) fields.stage = stage;
    if (quotation.status !== "draft") {
      fields.estimatedValue = quotation.total;
      fields.currency = quotation.currency;
    }

    await LeadModel.updateOne({ _id: id }, { $set: fields });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await LeadModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

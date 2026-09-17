import { AuthUser } from "../../shared/auth/types";
import { ForbiddenAppError, NotFoundAppError } from "../../shared/errors/AppError";
import { CreateLeadDto, UpdateLeadDto, WebsiteLeadDto } from "./lead.dto";
import { LeadRepository } from "./lead.repository";
import { LeadEntity } from "./lead.types";
import { QuotationService } from "../quotations/quotation.service";

const isAdmin = (user: AuthUser): boolean => user.roles?.includes("admin") ?? false;

export class LeadService {
  constructor(
    private readonly repository: LeadRepository,
    private readonly quotationService: QuotationService
  ) {}

  list(user: AuthUser): Promise<LeadEntity[]> {
    return this.repository.findAll(isAdmin(user) ? undefined : user.uid);
  }

  async getById(id: string, user: AuthUser): Promise<LeadEntity> {
    const lead = await this.findOrThrow(id);
    this.assertCanAccess(lead, user);
    return lead;
  }

  async createWebsite(payload: WebsiteLeadDto): Promise<LeadEntity> {
    const lead = await this.repository.createWebsite(payload);
    let quotation;

    try {
      quotation = await this.quotationService.createWebsiteDraft(lead, payload);
    } catch (error) {
      await this.repository.deleteById(lead.id);
      throw error;
    }

    const linkedLead = await this.repository.updateById(lead.id, {
      metadata: {
        ...lead.metadata,
        quotationId: quotation.id,
        quotationFolio: quotation.folio
      }
    });
    return linkedLead ?? lead;
  }

  create(payload: CreateLeadDto, user: AuthUser): Promise<LeadEntity> {
    if (!isAdmin(user)) {
      return this.repository.create({
        ...payload,
        assignedTo: {
          uid: user.uid,
          name: user.name ?? user.email ?? "Ejecutivo de ventas",
          email: user.email
        }
      });
    }
    return this.repository.create(payload);
  }

  async update(id: string, payload: UpdateLeadDto, user: AuthUser): Promise<LeadEntity> {
    const current = await this.findOrThrow(id);
    this.assertCanAccess(current, user);
    if (!isAdmin(user) && payload.assignedTo) {
      throw new ForbiddenAppError("Sales users cannot reassign leads");
    }
    const lead = await this.repository.updateById(id, payload);
    if (!lead) throw new NotFoundAppError("Lead not found");
    if (payload.assignedTo) {
      await this.quotationService.assignFromLead(id, payload.assignedTo);
    }
    return lead;
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repository.deleteById(id))) throw new NotFoundAppError("Lead not found");
  }

  private async findOrThrow(id: string): Promise<LeadEntity> {
    const lead = await this.repository.findById(id);
    if (!lead) throw new NotFoundAppError("Lead not found");
    return lead;
  }

  private assertCanAccess(lead: LeadEntity, user: AuthUser): void {
    if (!isAdmin(user) && lead.assignedTo?.uid !== user.uid) {
      throw new ForbiddenAppError("This lead is assigned to another sales executive");
    }
  }
}

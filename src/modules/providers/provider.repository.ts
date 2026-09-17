import { IRepository } from "../../shared/repositories/IRepository";
import { CreateProviderDto, UpdateProviderDto } from "./provider.dto";
import { ProviderModel } from "./provider.model";
import { ProviderEntity } from "./provider.types";

const mapToEntity = (doc: {
  _id: { toString(): string };
  name: string;
  fiscalData: ProviderEntity["fiscalData"];
  logo?: string;
  contact: ProviderEntity["contact"];
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProviderEntity => ({
  id: doc._id.toString(),
  name: doc.name,
  fiscalData: doc.fiscalData,
  logo: doc.logo,
  contact: doc.contact,
  metadata: doc.metadata,
  isActive: doc.isActive,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export class ProviderRepository implements IRepository<ProviderEntity, CreateProviderDto, UpdateProviderDto> {
  async findAll(): Promise<ProviderEntity[]> {
    const docs = await ProviderModel.find().sort({ createdAt: -1 });
    return docs.map((doc) => mapToEntity(doc));
  }

  async findById(id: string): Promise<ProviderEntity | null> {
    const doc = await ProviderModel.findById(id);
    return doc ? mapToEntity(doc) : null;
  }

  async create(payload: CreateProviderDto): Promise<ProviderEntity> {
    const doc = await ProviderModel.create(payload);
    return mapToEntity(doc);
  }

  async updateById(id: string, payload: UpdateProviderDto): Promise<ProviderEntity | null> {
    const doc = await ProviderModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    return doc ? mapToEntity(doc) : null;
  }
}

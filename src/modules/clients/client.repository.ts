import { IRepository } from "../../shared/repositories/IRepository";
import { CreateClientDto, UpdateClientDto } from "./client.dto";
import { ClientModel } from "./client.model";
import { ClientEntity } from "./client.types";

const mapToEntity = (doc: {
  _id: { toString(): string };
  name: string;
  email?: string;
  addresses: ClientEntity["addresses"];
  phone?: string;
  fiscalData: ClientEntity["fiscalData"];
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ClientEntity => ({
  id: doc._id.toString(),
  name: doc.name,
  email: doc.email,
  addresses: doc.addresses,
  phone: doc.phone,
  fiscalData: doc.fiscalData,
  metadata: doc.metadata,
  isActive: doc.isActive,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export class ClientRepository implements IRepository<ClientEntity, CreateClientDto, UpdateClientDto> {
  async findAll(): Promise<ClientEntity[]> {
    const docs = await ClientModel.find().sort({ createdAt: -1 });
    return docs.map((doc) => mapToEntity(doc));
  }

  async findById(id: string): Promise<ClientEntity | null> {
    const doc = await ClientModel.findById(id);
    return doc ? mapToEntity(doc) : null;
  }

  async create(payload: CreateClientDto): Promise<ClientEntity> {
    const doc = await ClientModel.create(payload);
    return mapToEntity(doc);
  }

  async updateById(id: string, payload: UpdateClientDto): Promise<ClientEntity | null> {
    const doc = await ClientModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    return doc ? mapToEntity(doc) : null;
  }
}

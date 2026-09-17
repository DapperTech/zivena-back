import { IRepository } from "../../shared/repositories/IRepository";
import { CreateRequestDto, UpdateRequestDto } from "./request.dto";
import { RequestModel } from "./request.model";
import { RequestEntity } from "./request.types";

const mapToEntity = (doc: {
  _id: { toString(): string };
  products: Array<{ productId?: { toString(): string } | null; sku?: string; quantity: number }>;
  name: string;
  phone: string;
  email?: string;
  postalCode?: string;
  status: RequestEntity["status"];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}): RequestEntity => ({
  id: doc._id.toString(),
  products: doc.products.map((item) => ({
    productId: item.productId ? item.productId.toString() : undefined,
    sku: item.sku,
    quantity: item.quantity
  })),
  name: doc.name,
  phone: doc.phone,
  email: doc.email,
  postalCode: doc.postalCode,
  status: doc.status,
  metadata: doc.metadata,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export class RequestRepository implements IRepository<RequestEntity, CreateRequestDto, UpdateRequestDto> {
  async findAll(): Promise<RequestEntity[]> {
    const docs = await RequestModel.find().sort({ createdAt: -1 });
    return docs.map((doc) => mapToEntity(doc));
  }

  async findById(id: string): Promise<RequestEntity | null> {
    const doc = await RequestModel.findById(id);
    return doc ? mapToEntity(doc) : null;
  }

  async create(payload: CreateRequestDto): Promise<RequestEntity> {
    const doc = await RequestModel.create(payload);
    return mapToEntity(doc);
  }

  async updateById(id: string, payload: UpdateRequestDto): Promise<RequestEntity | null> {
    const doc = await RequestModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    return doc ? mapToEntity(doc) : null;
  }
}

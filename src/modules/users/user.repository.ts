import { IRepository } from "../../shared/repositories/IRepository";
import { CreateUserDto, UpdateUserDto } from "./user.dto";
import { UserModel } from "./user.model";
import { UserEntity } from "./user.types";

const mapToEntity = (doc: {
  _id: { toString(): string };
  uid: string;
  name: string;
  email: string;
  profileImage?: string;
  role: UserEntity["role"];
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserEntity => ({
  id: doc._id.toString(),
  uid: doc.uid,
  name: doc.name,
  email: doc.email,
  profileImage: doc.profileImage,
  role: doc.role,
  metadata: doc.metadata,
  isActive: doc.isActive,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export class UserRepository {
  async findAll(): Promise<UserEntity[]> {
    const docs = await UserModel.find().sort({ createdAt: -1 });
    return docs.map((doc) => mapToEntity(doc));
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findById(id);
    return doc ? mapToEntity(doc) : null;
  }

  async create(payload: CreateUserDto & { uid: string }): Promise<UserEntity> {
    const doc = await UserModel.create(payload);
    return mapToEntity(doc);
  }

  async updateById(id: string, payload: UpdateUserDto): Promise<UserEntity | null> {
    const doc = await UserModel.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
      runValidators: true
    });

    return doc ? mapToEntity(doc) : null;
  }

  async countActiveAdmins(): Promise<number> {
    return UserModel.countDocuments({ role: "admin", isActive: true });
  }

  async deleteById(id: string): Promise<UserEntity | null> {
    const doc = await UserModel.findByIdAndDelete(id);
    return doc ? mapToEntity(doc) : null;
  }
}

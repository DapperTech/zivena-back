import { FirebaseUserAdminProvider } from "../../providers/auth/firebaseUserAdminProvider";
import {
  ConflictAppError,
  NotFoundAppError
} from "../../shared/errors/AppError";
import { CreateUserDto, UpdateUserDto } from "./user.dto";
import { UserRepository } from "./user.repository";
import { UserEntity } from "./user.types";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly firebaseUsers: FirebaseUserAdminProvider
  ) {}

  async listUsers(): Promise<UserEntity[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundAppError("User not found");
    }
    return user;
  }

  async createUser(payload: CreateUserDto): Promise<UserEntity> {
    const account = await this.firebaseUsers.createAccount({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
      profileImage: payload.profileImage
    });

    try {
      return await this.userRepository.create({
        ...payload,
        uid: account.uid,
        metadata: {
          ...payload.metadata,
          authProvider: "firebase",
          invitationStatus: "pending"
        }
      });
    } catch (error) {
      await this.firebaseUsers.deleteAccount(account.uid).catch(() => undefined);
      throw error;
    }
  }

  async updateUser(id: string, payload: UpdateUserDto): Promise<UserEntity> {
    const current = await this.userRepository.findById(id);
    if (!current) throw new NotFoundAppError("User not found");

    const removesLastAdmin =
      current.role === "admin" &&
      current.isActive &&
      (payload.role === "sales" || payload.isActive === false);
    if (removesLastAdmin && (await this.userRepository.countActiveAdmins()) <= 1) {
      throw new ConflictAppError("At least one active administrator is required");
    }

    await this.firebaseUsers.updateAccount(current.uid, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.role !== undefined ? { role: payload.role } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.profileImage !== undefined
        ? { profileImage: payload.profileImage }
        : {})
    });

    const user = await this.userRepository.updateById(id, payload);
    if (!user) {
      throw new NotFoundAppError("User not found");
    }
    return user;
  }

  async deleteUser(id: string, requesterUid?: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundAppError("User not found");
    if (user.uid === requesterUid) {
      throw new ConflictAppError("You cannot delete your own user");
    }
    if (
      user.role === "admin" &&
      user.isActive &&
      (await this.userRepository.countActiveAdmins()) <= 1
    ) {
      throw new ConflictAppError("At least one active administrator is required");
    }

    await this.firebaseUsers.deleteAccount(user.uid);
    await this.userRepository.deleteById(id);
  }
}

import { AuthRole } from "../../shared/auth/types";
import { Metadata } from "../../shared/types/common";

export type UserRole = AuthRole;

export type UserEntity = {
  id: string;
  uid: string;
  name: string;
  email: string;
  profileImage?: string;
  role: UserRole;
  metadata: Metadata;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

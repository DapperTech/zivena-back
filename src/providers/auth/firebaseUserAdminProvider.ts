import { getAuth } from "firebase-admin/auth";
import {
  AppError,
  ConflictAppError,
  NotFoundAppError,
  ValidationAppError
} from "../../shared/errors/AppError";
import { AuthRole } from "../../shared/auth/types";
import { getFirebaseAdminApp } from "./firebaseAdmin";

export type FirebaseAccountInput = {
  name: string;
  email: string;
  role: AuthRole;
  isActive: boolean;
  profileImage?: string;
};

export class FirebaseUserAdminProvider {
  async createAccount(input: FirebaseAccountInput): Promise<{ uid: string }> {
    const auth = getAuth(getFirebaseAdminApp());

    try {
      const account = await auth.createUser({
        email: input.email,
        displayName: input.name,
        disabled: !input.isActive,
        emailVerified: false,
        ...(input.profileImage ? { photoURL: input.profileImage } : {})
      });

      try {
        await auth.setCustomUserClaims(account.uid, { role: input.role });
      } catch (error) {
        await auth.deleteUser(account.uid).catch(() => undefined);
        throw error;
      }

      return { uid: account.uid };
    } catch (error) {
      this.throwMappedError(error);
    }
  }

  async updateAccount(
    uid: string,
    input: Partial<FirebaseAccountInput>
  ): Promise<void> {
    const auth = getAuth(getFirebaseAdminApp());

    try {
      await auth.updateUser(uid, {
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.name !== undefined ? { displayName: input.name } : {}),
        ...(input.isActive !== undefined ? { disabled: !input.isActive } : {}),
        ...(input.profileImage !== undefined ? { photoURL: input.profileImage } : {})
      });

      if (input.role) {
        await auth.setCustomUserClaims(uid, { role: input.role });
      }
      if (input.role || input.isActive === false) {
        await auth.revokeRefreshTokens(uid);
      }
    } catch (error) {
      this.throwMappedError(error);
    }
  }

  async deleteAccount(uid: string): Promise<void> {
    try {
      await getAuth(getFirebaseAdminApp()).deleteUser(uid);
    } catch (error) {
      if ((error as { code?: string }).code === "auth/user-not-found") return;
      this.throwMappedError(error);
    }
  }

  private throwMappedError(error: unknown): never {
    if (error instanceof AppError) throw error;

    const code = (error as { code?: string }).code;
    if (
      code === "auth/email-already-exists" ||
      code === "auth/uid-already-exists"
    ) {
      throw new ConflictAppError("A Firebase account already uses this email");
    }
    if (code === "auth/user-not-found") {
      throw new NotFoundAppError("Firebase user not found");
    }
    if (
      code === "auth/invalid-email" ||
      code === "auth/invalid-display-name" ||
      code === "auth/invalid-photo-url"
    ) {
      throw new ValidationAppError("Firebase rejected the user profile", { code });
    }

    throw error;
  }
}

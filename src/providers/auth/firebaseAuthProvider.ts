import { getAuth } from "firebase-admin/auth";
import { env } from "../../config/env";
import { AuthUser, IAuthProvider } from "../../shared/auth/types";
import { UnauthorizedAppError } from "../../shared/errors/AppError";
import { getFirebaseAdminApp } from "./firebaseAdmin";

export class FirebaseAuthProvider implements IAuthProvider {
  async verifyIdToken(token: string): Promise<AuthUser> {
    if (!env.firebaseProjectId) {
      throw new UnauthorizedAppError("Firebase auth is not configured yet");
    }

    try {
      const decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(
        token,
        env.firebaseCheckRevoked
      );
      const roles = Array.isArray(decoded.roles)
        ? decoded.roles.filter(
            (role): role is "admin" | "sales" =>
              role === "admin" || role === "sales"
          )
        : decoded.role === "admin" || decoded.role === "sales"
          ? [decoded.role]
          : [];

      return {
        uid: decoded.uid,
        email: decoded.email,
        name: typeof decoded.name === "string" ? decoded.name : undefined,
        roles
      };
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (
        code === "auth/id-token-expired" ||
        code === "auth/id-token-revoked" ||
        code === "auth/user-disabled" ||
        code === "auth/user-not-found"
      ) {
        throw new UnauthorizedAppError("Your Firebase session is no longer valid");
      }
      throw new UnauthorizedAppError("Invalid Firebase ID token");
    }
  }
}

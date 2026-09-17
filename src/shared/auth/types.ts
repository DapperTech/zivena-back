export type AuthRole = "admin" | "sales";

export type AuthUser = {
  userId?: string;
  uid: string;
  email?: string;
  name?: string;
  roles?: AuthRole[];
};

export interface IAuthProvider {
  verifyIdToken(token: string): Promise<AuthUser>;
}

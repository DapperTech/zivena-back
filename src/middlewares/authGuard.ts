import { RequestHandler } from "express";
import { env } from "../config/env";
import { UnauthorizedAppError } from "../shared/errors/AppError";
import { IAuthProvider } from "../shared/auth/types";
import { FirebaseAuthProvider } from "../providers/auth/firebaseAuthProvider";
import { UserModel } from "../modules/users/user.model";

const authProvider: IAuthProvider = new FirebaseAuthProvider();

export const authGuard: RequestHandler = async (req, _res, next) => {
  if (env.authBypass) {
    req.user = {
      uid: "dev-bypass-user",
      email: "dev@zivena.local",
      roles: ["admin"]
    };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedAppError("Missing Bearer token"));
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    next(new UnauthorizedAppError("Invalid Bearer token"));
    return;
  }

  try {
    const identity = await authProvider.verifyIdToken(token);
    const profile = await UserModel.findOne({ uid: identity.uid }).lean();
    if (!profile) {
      next(new UnauthorizedAppError("This account does not have panel access"));
      return;
    }
    if (!profile.isActive) {
      next(new UnauthorizedAppError("This panel account is disabled"));
      return;
    }

    req.user = {
      userId: profile._id.toString(),
      uid: identity.uid,
      email: profile.email,
      name: profile.name,
      roles: [profile.role]
    };
    next();
  } catch (error) {
    next(error);
  }
};

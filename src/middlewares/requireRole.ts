import { RequestHandler } from "express";
import { AuthRole } from "../shared/auth/types";
import { ForbiddenAppError, UnauthorizedAppError } from "../shared/errors/AppError";

export const requireRole = (...allowedRoles: AuthRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedAppError());
      return;
    }

    const hasPermission = req.user.roles?.some((role) => allowedRoles.includes(role)) ?? false;
    if (!hasPermission) {
      next(new ForbiddenAppError("Your role does not allow this action"));
      return;
    }

    next();
  };
};

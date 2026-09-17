import { Request } from "express";
import { AuthUser } from "../shared/auth/types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};

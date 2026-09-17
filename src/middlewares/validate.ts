import { RequestHandler } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { ValidationAppError } from "../shared/errors/AppError";

export const validate = (schema: ZodTypeAny): RequestHandler => {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body ?? {},
        params: req.params,
        query: req.query
      }) as {
        body: unknown;
        params: Record<string, string>;
        query: unknown;
      };

      req.body = parsed.body;
      req.params = parsed.params;
      Object.defineProperty(req, "query", {
        value: parsed.query,
        writable: true,
        configurable: true,
        enumerable: true
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationAppError("Request validation failed", error.flatten()));
        return;
      }

      next(error);
    }
  };
};

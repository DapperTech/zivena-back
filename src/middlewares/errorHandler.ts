import { ErrorRequestHandler } from "express";
import { AppError } from "../shared/errors/AppError";
import { sendError } from "../shared/http/response";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    sendError(res, error.code, error.message, error.statusCode, error.details);
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    sendError(res, "INVALID_JSON", "Malformed JSON body", 400);
    return;
  }

  console.error("[error]", error);
  sendError(res, "INTERNAL_ERROR", "Internal server error", 500);
};

import { RequestHandler } from "express";
import { sendError } from "../shared/http/response";

export const notFound: RequestHandler = (req, res) => {
  sendError(res, "NOT_FOUND", `Route ${req.originalUrl} not found`, 404);
};

import { Request, Response, NextFunction, RequestHandler } from "express";
import { sendSuccess } from "../http/response";

export class BaseController {
  protected ok<T>(res: Response, data: T, statusCode = 200): Response {
    return sendSuccess(res, data, statusCode);
  }

  protected execute(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
    return (req, res, next) => {
      handler(req, res, next).catch(next);
    };
  }
}

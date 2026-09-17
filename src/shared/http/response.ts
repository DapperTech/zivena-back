import { Response } from "express";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): Response<ApiSuccess<T>> => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
  details?: unknown
): Response<ApiError> => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {})
    }
  });
};

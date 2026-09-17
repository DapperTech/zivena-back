import { RequestHandler } from "express";
import morgan from "morgan";

export const requestLogger: RequestHandler = morgan("dev");

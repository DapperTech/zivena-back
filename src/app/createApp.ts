import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "../config/env";
import { requestLogger } from "../middlewares/requestLogger";
import { apiRoutes } from "./routes";
import { notFound } from "../middlewares/notFound";
import { errorHandler } from "../middlewares/errorHandler";

export const createApp = () => {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          env.allowedOrigins.length === 0 ||
          env.allowedOrigins.includes(origin)
        ) {
          callback(null, true);
          return;
        }
        callback(null, false);
      }
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  app.use("/api/v1", apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { apiRouter } from "./routes/apiRouter.js";

export function createApp() {
  const app = express();

  // No anunciar que el servidor usa Express (cabecera X-Powered-By)
  app.disable("x-powered-by");

  // Solo el frontend puede llamar a la API desde el navegador
  app.use(cors({ origin: env.CORS_ORIGINS.split(",") }));

  // Máximo 60 peticiones por minuto y por IP
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 60,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.use("/api", apiRouter);

  // Siempre al final: primero "ruta no encontrada" y después el manejador de errores
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

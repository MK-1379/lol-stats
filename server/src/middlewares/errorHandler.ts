import type { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";

// Error con código HTTP: lo lanzan los servicios cuando algo "esperado" sale mal
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
}

// Express reconoce un middleware de errores porque tiene 4 parámetros
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Parámetros no válidos",
      details: z.flattenError(err).fieldErrors,
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Error inesperado: lo registramos completo, pero al cliente no le damos detalles
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
}

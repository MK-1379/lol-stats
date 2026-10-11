import type { Request, Response } from "express";
import { z } from "zod";
import * as statsService from "../services/statsService.js";

const matchesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const matchParamsSchema = z.object({
  matchId: z.string().max(30).regex(/^[A-Z0-9]+_\d+$/),
});

const rankHistoryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const trendsQuerySchema = z.object({
  last: z.coerce.number().int().min(1).max(100).default(20),
});

export async function getSummary(req: Request, res: Response) {
  res.json(await statsService.getSummary());
}

export async function getMatches(req: Request, res: Response) {
  const { limit, offset } = matchesQuerySchema.parse(req.query);
  res.json(await statsService.getMatches(limit, offset));
}

export async function getScoreboard(req: Request, res: Response) {
  const { matchId } = matchParamsSchema.parse(req.params);
  res.json(await statsService.getScoreboard(matchId));
}

export async function getChampions(req: Request, res: Response) {
  res.json(await statsService.getChampionStats());
}

export async function getRankHistory(req: Request, res: Response) {
  const { days } = rankHistoryQuerySchema.parse(req.query);
  res.json(await statsService.getRankHistory(days));
}

export async function getTrends(req: Request, res: Response) {
  const { last } = trendsQuerySchema.parse(req.query);
  res.json(await statsService.getTrends(last));
}

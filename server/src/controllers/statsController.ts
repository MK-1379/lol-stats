import type { Request, Response } from "express";
import { z } from "zod";
import { QUEUE_FILTERS } from "../config/queues.js";
import * as coachService from "../services/coachService.js";
import * as coachSummaryService from "../services/coachSummaryService.js";
import * as statsService from "../services/statsService.js";

const queueSchema = z.enum(QUEUE_FILTERS).default("all");

const queueQuerySchema = z.object({
  queue: queueSchema,
});

const matchesQuerySchema = z.object({
  queue: queueSchema,
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const matchParamsSchema = z.object({
  matchId: z.string().max(30).regex(/^[A-Z0-9]+_\d+$/),
});

const rankHistoryQuerySchema = z.object({
  queue: z.enum(["solo", "flex"]).default("solo"),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const trendsQuerySchema = z.object({
  queue: queueSchema,
  last: z.coerce.number().int().min(1).max(100).default(20),
});

const coachQuerySchema = z.object({
  queue: queueSchema,
  last: z.coerce.number().int().min(coachService.MIN_GAMES).max(100).default(20),
});

export async function getSummary(req: Request, res: Response) {
  const { queue } = queueQuerySchema.parse(req.query);
  res.json(await statsService.getSummary(queue));
}

export async function getMatches(req: Request, res: Response) {
  const { limit, offset, queue } = matchesQuerySchema.parse(req.query);
  res.json(await statsService.getMatches(limit, offset, queue));
}

export async function getScoreboard(req: Request, res: Response) {
  const { matchId } = matchParamsSchema.parse(req.params);
  res.json(await statsService.getScoreboard(matchId));
}

export async function getChampions(req: Request, res: Response) {
  const { queue } = queueQuerySchema.parse(req.query);
  res.json(await statsService.getChampionStats(queue));
}

export async function getMasteries(req: Request, res: Response) {
  res.json(await statsService.getMasteries());
}

export async function getRankHistory(req: Request, res: Response) {
  const { days, queue } = rankHistoryQuerySchema.parse(req.query);
  res.json(await statsService.getRankHistory(days, queue));
}

export async function getTrends(req: Request, res: Response) {
  const { last, queue } = trendsQuerySchema.parse(req.query);
  res.json(await statsService.getTrends(last, queue));
}

export async function getCoach(req: Request, res: Response) {
  const { last, queue } = coachQuerySchema.parse(req.query);
  res.json(await coachService.getCoachReport(last, queue));
}

export async function getCoachSummary(req: Request, res: Response) {
  const { queue } = queueQuerySchema.parse(req.query);
  res.json(await coachSummaryService.getCoachSummary(queue));
}

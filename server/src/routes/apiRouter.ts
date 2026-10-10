import { Router } from "express";
import * as statsController from "../controllers/statsController.js";

export const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

apiRouter.get("/summary", statsController.getSummary);
apiRouter.get("/matches", statsController.getMatches);
apiRouter.get("/champions", statsController.getChampions);
apiRouter.get("/rank-history", statsController.getRankHistory);
apiRouter.get("/trends", statsController.getTrends);

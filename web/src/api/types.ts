import type { RankedQueue } from "../utils/queue";

export type RankInfo = {
  queue: RankedQueue;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  peak: {
    tier: string;
    rank: string;
    leaguePoints: number;
    reachedAt: string;
  } | null;
};

export type Summary = {
  player: {
    gameName: string;
    tagLine: string;
    profileIconId: number;
  };
  ranks: RankInfo[];
  stats: {
    games: number;
    wins: number;
    winrate: number;
    kda: number;
  };
};

export type MatchItem = {
  matchId: string;
  queue: RankedQueue;
  playedAt: string;
  durationSeconds: number;
  champion: string;
  position: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  visionScore: number;
};

export type MatchPage = {
  total: number;
  limit: number;
  offset: number;
  items: MatchItem[];
};

export type RankPoint = {
  takenAt: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  totalLp: number;
};

export type ChampionStat = {
  championId: number;
  champion: string;
  games: number;
  wins: number;
  winrate: number;
  kda: number;
};

export type ChampionMastery = {
  championId: number;
  champion: string;
  level: number;
  points: number;
  lastPlayedAt: string;
};

export type TrendPoint = {
  matchId: string;
  playedAt: string;
  win: boolean;
  kda: number;
  csPerMinute: number;
  visionScore: number;
};

export type ScoreboardPlayer = {
  gameName: string;
  tagLine: string;
  isMe: boolean;
  champion: string;
  position: string;
  champLevel: number;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  visionScore: number;
  goldEarned: number;
  damageToChampions: number;
};

export type ScoreboardTeam = {
  teamId: number;
  isMyTeam: boolean;
  win: boolean;
  kills: number;
  goldEarned: number;
  players: ScoreboardPlayer[];
};

export type Scoreboard = {
  matchId: string;
  teams: ScoreboardTeam[];
};

export type CoachMetric =
  | "deaths"
  | "csPerMinute"
  | "visionPerMinute"
  | "killParticipation"
  | "csDiffPerMinute"
  | "goldDiff";

export type CoachDirection = "higher" | "lower";

export type CoachStrength = {
  metric: CoachMetric;
  label: string;
  direction: CoachDirection;
  value: number;
  target: number;
};

export type CoachTip = CoachStrength & {
  advice: string;
  inWins: number | null;
  inLosses: number | null;
};

export type WeeklyGoal = {
  metric: CoachMetric;
  label: string;
  direction: CoachDirection;
  target: number;
  outOf: number;
  currentHits: number;
  requiredHits: number;
};

export type CoachReport = {
  position: string;
  gamesAnalyzed: number;
  winrate: number;
  tips: CoachTip[];
  strengths: CoachStrength[];
  weeklyGoal: WeeklyGoal | null;
};

export type CoachSummary = {
  text: string;
  generatedAt: string;
  model: string;
};

export type GameEntry = {
  id: number;
  name: string;
  icon: string;
};

export type BuildOption<T> = {
  value: T;
  games: number;
  wins: number;
  winrate: number;
};

export type RunePage = {
  primary: GameEntry;
  secondary: GameEntry;
  perks: GameEntry[];
  shards: GameEntry[];
};

export type SkillOrder = {
  priority: string;
  sequence: string | null;
  games: number;
  winrate: number;
};

export type ChampionBuild = {
  champion: { id: number; key: string; name: string };
  version: string;
  position: string | null;
  positions: { position: string; games: number }[];
  games: number;
  wins: number;
  winrate: number;
  sources: { own: number; highElo: number };
  patches: string[];
  runes: BuildOption<RunePage>[];
  spells: BuildOption<GameEntry[]>[];
  startItems: BuildOption<GameEntry[]>[];
  boots: BuildOption<GameEntry>[];
  coreItems: BuildOption<GameEntry[]>[];
  lateItems: BuildOption<GameEntry>[];
  skills: SkillOrder | null;
};

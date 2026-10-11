export type Summary = {
  player: {
    gameName: string;
    tagLine: string;
    profileIconId: number;
  };
  rank: {
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
  stats: {
    games: number;
    wins: number;
    winrate: number;
    kda: number;
  };
};

export type MatchItem = {
  matchId: string;
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

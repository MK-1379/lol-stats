import { DDRAGON_VERSION } from "../config";

const TIER_NAMES: Record<string, string> = {
  IRON: "Hierro",
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
  PLATINUM: "Platino",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Maestro",
  GRANDMASTER: "Gran Maestro",
  CHALLENGER: "Aspirante",
};

export function formatTier(tier: string) {
  return TIER_NAMES[tier] ?? tier;
}

const POSITION_NAMES: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungla",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

export function formatPosition(position: string) {
  return POSITION_NAMES[position] ?? "—";
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate));
}

const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
});

export function formatShortDate(isoDate: string) {
  return shortDateFormatter.format(new Date(isoDate));
}

const TIERS = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"];
const DIVISIONS = ["IV", "III", "II", "I"];

export function formatTotalLp(totalLp: number) {
  const tierIndex = Math.floor(totalLp / 400);
  if (tierIndex >= TIERS.length) {
    return "Maestro+";
  }
  const division = DIVISIONS[Math.floor((totalLp % 400) / 100)];
  return `${formatTier(TIERS[tierIndex])} ${division}`;
}

export function profileIconUrl(profileIconId: number) {
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${profileIconId}.png`;
}

export function nextDivision(tier: string, rank: string) {
  const tierIndex = TIERS.indexOf(tier);
  if (tierIndex === -1) {
    return null;
  }
  const divisionIndex = DIVISIONS.indexOf(rank);
  if (divisionIndex < DIVISIONS.length - 1) {
    return `${formatTier(tier)} ${DIVISIONS[divisionIndex + 1]}`;
  }
  const nextTier = tierIndex + 1 < TIERS.length ? TIERS[tierIndex + 1] : "MASTER";
  return nextTier === "MASTER" ? "Maestro" : `${formatTier(nextTier)} IV`;
}

const relativeFormatter = new Intl.RelativeTimeFormat("es-ES", { numeric: "auto" });

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60],
  ["hour", 60 * 60],
  ["day", 60 * 60 * 24],
  ["week", 60 * 60 * 24 * 7],
  ["month", 60 * 60 * 24 * 30],
];

export function formatRelative(isoDate: string, now = Date.now()) {
  const seconds = Math.round((new Date(isoDate).getTime() - now) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 60) {
    return "ahora mismo";
  }
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let size = 60;
  for (const [stepUnit, stepSize] of RELATIVE_STEPS) {
    if (absolute >= stepSize) {
      unit = stepUnit;
      size = stepSize;
    }
  }
  return relativeFormatter.format(Math.round(seconds / size), unit);
}

const CHAMPION_KEY_EXCEPTIONS: Record<string, string> = {
  Wukong: "MonkeyKing",
  "Nunu & Willump": "Nunu",
  "Renata Glasc": "Renata",
  "Kai'Sa": "Kaisa",
  "Kha'Zix": "Khazix",
  "Cho'Gath": "Chogath",
  "Vel'Koz": "Velkoz",
  "Bel'Veth": "Belveth",
  LeBlanc: "Leblanc",
};

export function championIconUrl(championName: string) {
  const key = CHAMPION_KEY_EXCEPTIONS[championName] ?? championName.replace(/[^A-Za-z0-9]/g, "");
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${key}.png`;
}

export function kdaTone(kda: number) {
  if (kda >= 4) return "text-perf-4";
  if (kda >= 3) return "text-perf-3";
  return "text-ink";
}

export function winrateTone(winrate: number) {
  return winrate >= 50 ? "text-win" : "text-loss";
}

export function csPerMinute(cs: number, durationSeconds: number) {
  return Math.round((cs / (durationSeconds / 60)) * 10) / 10;
}

export function opggUrl(gameName: string, tagLine: string) {
  return `https://op.gg/lol/summoners/euw/${encodeURIComponent(`${gameName}-${tagLine}`)}`;
}

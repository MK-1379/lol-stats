import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import type { ChampionStat } from "../api/types";
import { useSummary } from "../hooks/useSummary";
import { useChampionStats, useRankHistory } from "../hooks/useStats";
import { championSplashUrl, formatRelative, profileIconUrl, tierColor } from "../utils/format";

type ProfileHeaderProps = {
  tabs: ReactNode;
};

export function ProfileHeader({ tabs }: ProfileHeaderProps) {
  const { data, isPending, isError, error } = useSummary();
  const { data: snapshots } = useRankHistory(30);
  const { data: champions } = useChampionStats();
  const main = mostPlayed(champions);
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const lastSync = snapshots?.at(-1)?.takenAt;

  return (
    <div className="relative isolate overflow-hidden border-b border-line bg-panel">
      {main && <Banner champion={main} />}
      <div className="mx-auto max-w-[1080px] px-4 pt-5">
        {isPending ? (
          <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-5">
            <span className="sr-only">Cargando perfil…</span>
            <div className="size-14 shrink-0 rounded-ui bg-panel-2 motion-safe:animate-pulse sm:size-[72px]" />
            <div className="min-w-0 flex-1 basis-48 space-y-2">
              <div className="h-7 w-48 max-w-full rounded-ui bg-panel-2 motion-safe:animate-pulse" />
              <div className="h-4 w-64 max-w-full rounded-ui bg-panel-2 motion-safe:animate-pulse" />
            </div>
            <div className="h-9 w-full rounded-ui bg-panel-2 motion-safe:animate-pulse sm:w-36" />
          </div>
        ) : isError ? (
          <p role="alert" className="pb-5 text-loss">
            No se pudo cargar el perfil: {error.message}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-5">
            <ProfileIcon
              iconId={data.player.profileIconId}
              name={data.player.gameName}
              tier={data.rank?.tier}
            />
            <div className="min-w-0 flex-1 basis-48">
              <h1 className="text-name font-bold break-words">
                {data.player.gameName}{" "}
                <span className="font-semibold text-faint">#{data.player.tagLine}</span>
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-small text-muted">
                <span className="rounded-ui bg-panel-2 px-1.5 font-semibold text-ink">EUW</span>
                <span>Clasificatoria Solo/Dúo</span>
                {lastSync && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Sincronizado {formatRelative(lastSync)}</span>
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              className="btn w-full sm:w-auto"
              disabled={isFetching}
              onClick={() => queryClient.invalidateQueries()}
            >
              <RefreshIcon spinning={isFetching} />
              {isFetching ? "Recargando…" : "Recargar datos"}
            </button>
          </div>
        )}
        {tabs}
      </div>
    </div>
  );
}

function mostPlayed(champions: ChampionStat[] = []) {
  return champions.reduce<ChampionStat | null>(
    (best, champion) => (!best || champion.games > best.games ? champion : best),
    null,
  )?.champion;
}

function Banner({ champion }: { champion: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <img
        src={championSplashUrl(champion)}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`absolute inset-y-0 right-0 h-full w-full object-cover object-[50%_20%] transition-opacity duration-700 [mask-image:linear-gradient(to_right,transparent,black_60%)] sm:w-3/4 sm:[mask-image:linear-gradient(to_right,transparent,black_45%)] ${loaded ? "opacity-(--banner-opacity) motion-safe:animate-banner-in" : "opacity-0"}`}
      />
      <div className="absolute inset-0 bg-linear-to-t from-panel via-panel/40 to-transparent" />
    </div>
  );
}

function ProfileIcon({ iconId, name, tier }: { iconId: number; name: string; tier?: string }) {
  const [failed, setFailed] = useState(false);
  const color = tierColor(tier);
  const box = "size-14 shrink-0 rounded-ui border-2 sm:size-[72px]";
  const frame = {
    borderColor: color,
    boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 22%, transparent), 0 0 18px color-mix(in srgb, ${color} 45%, transparent)`,
  };

  if (failed) {
    return (
      <div
        style={{ ...frame, color }}
        className={`${box} grid place-items-center bg-panel-2 font-display text-3xl font-bold`}
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={profileIconUrl(iconId)}
      alt=""
      width={72}
      height={72}
      onError={() => setFailed(true)}
      style={frame}
      className={box}
    />
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-4 ${spinning ? "motion-safe:animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

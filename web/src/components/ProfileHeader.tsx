import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useSummary } from "../hooks/useSummary";
import { useRankHistory } from "../hooks/useStats";
import { formatRelative, profileIconUrl } from "../utils/format";

type ProfileHeaderProps = {
  tabs: ReactNode;
};

export function ProfileHeader({ tabs }: ProfileHeaderProps) {
  const { data, isPending, isError, error } = useSummary();
  const { data: snapshots } = useRankHistory(30);
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const lastSync = snapshots?.at(-1)?.takenAt;

  return (
    <div className="border-b border-line bg-panel">
      <div className="mx-auto max-w-[1080px] px-4 pt-5">
        {isPending ? (
          <div role="status" className="flex items-center gap-4 pb-5">
            <span className="sr-only">Cargando perfil…</span>
            <div className="size-[72px] rounded-ui bg-panel-2 motion-safe:animate-pulse" />
            <div className="h-6 w-48 rounded-ui bg-panel-2 motion-safe:animate-pulse" />
          </div>
        ) : isError ? (
          <p role="alert" className="pb-5 text-loss">
            No se pudo cargar el perfil: {error.message}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-5">
            <ProfileIcon iconId={data.player.profileIconId} name={data.player.gameName} />
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

function ProfileIcon({ iconId, name }: { iconId: number; name: string }) {
  const [failed, setFailed] = useState(false);
  const box = "size-14 shrink-0 rounded-ui border-2 border-gold sm:size-[72px]";

  if (failed) {
    return (
      <div
        className={`${box} grid place-items-center bg-panel-2 font-display text-3xl font-bold text-gold`}
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

import { Link, useParams, useSearchParams } from "react-router";
import type { ChampionBuild } from "../api/types";
import { ItemsPanel } from "../components/build/ItemsPanel";
import { RunesPanel } from "../components/build/RunesPanel";
import { SkillsPanel } from "../components/build/SkillsPanel";
import { SpellsPanel } from "../components/build/SpellsPanel";
import { ChampionIcon } from "../components/ChampionIcon";
import { Panel } from "../components/ui/Panel";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { SplashBanner } from "../components/ui/SplashBanner";
import { StateMessage } from "../components/ui/StateMessage";
import { useChampionBuild } from "../hooks/useChampionBuild";
import { opggBuildUrl, patchRange } from "../utils/build";
import { formatPosition, winrateTone } from "../utils/format";

export const SMALL_SAMPLE = 20;

export function ChampionBuildPage() {
  const { championKey = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const position = searchParams.get("posicion");
  const { data, isPending, isError, error } = useChampionBuild(championKey, position);
  const name = data?.champion.name ?? championKey;

  return (
    <>
      <title>{`${name} · Build · LoLStats`}</title>
      <div className="relative isolate overflow-hidden border-b border-line bg-panel">
        {data && <SplashBanner champion={data.champion.name} />}
        <div className="mx-auto max-w-[1080px] px-4 py-5">
          <Link
            to={{ pathname: "/", hash: "campeones" }}
            className="focus-ring rounded-ui text-small text-muted hover:text-ink"
          >
            ← Volver al perfil
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <ChampionIcon name={name} size="lg" />
            <div className="min-w-0 flex-1 basis-48">
              <h1 className="text-name font-bold">{name}</h1>
              <p className="text-small text-muted">
                Build recomendada
                {data?.position && ` · ${formatPosition(data.position)}`}
              </p>
            </div>
            {data && data.positions.length > 1 && (
              <SegmentedControl
                label="Posición"
                value={data.position ?? ""}
                onChange={(next) => setSearchParams({ posicion: next })}
                options={data.positions.map(({ position: value, games }) => ({
                  value,
                  label: formatPosition(value),
                  count: games,
                }))}
              />
            )}
            <a
              href={opggBuildUrl(data?.champion.key ?? championKey)}
              target="_blank"
              rel="noreferrer"
              className="btn w-full sm:w-auto"
            >
              Ver en op.gg
            </a>
          </div>
        </div>
      </div>

      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-4 outline-none"
      >
        {isPending ? (
          <Panel title="Build">
            <StateMessage kind="loading" message="Calculando la build…" />
          </Panel>
        ) : isError ? (
          <Panel title="Build">
            <StateMessage kind="error" message={`No se pudo cargar la build: ${error.message}`} />
          </Panel>
        ) : data.games === 0 ? (
          <Panel title="Build">
            <StateMessage
              kind="empty"
              message={`Todavía no hay partidas guardadas con ${data.champion.name}.`}
            />
          </Panel>
        ) : (
          <BuildContent build={data} />
        )}
      </main>
    </>
  );
}

function BuildContent({ build }: { build: ChampionBuild }) {
  return (
    <div className="grid gap-gap motion-safe:animate-panel-in">
      <SampleSummary build={build} />
      <div className="grid items-start gap-gap lg:grid-cols-2">
        <div className="grid gap-gap">
          <RunesPanel options={build.runes} />
          <SpellsPanel options={build.spells} />
        </div>
        <div className="grid gap-gap">
          <ItemsPanel build={build} />
          <SkillsPanel skills={build.skills} />
        </div>
      </div>
    </div>
  );
}

function SampleSummary({ build }: { build: ChampionBuild }) {
  const patches = patchRange(build.patches);

  return (
    <section aria-label="Muestra" className="panel flex flex-wrap items-center gap-x-6 gap-y-2 p-panel">
      <p>
        <span className={`text-stat font-bold tabular-nums ${winrateTone(build.winrate)}`}>
          {build.winrate}%
        </span>{" "}
        <span className="text-small text-muted">de victorias</span>
      </p>
      <p className="text-small text-muted">
        <span className="font-semibold text-ink tabular-nums">{build.games}</span> partidas:{" "}
        {build.sources.own} tuyas y {build.sources.highElo} de jugadores Master+
        {patches && ` · ${patches}`}
      </p>
      {build.games < SMALL_SAMPLE && (
        <p className="w-full text-small text-gold">
          Muestra pequeña: tómalo como orientación. Con más partidas los porcentajes serán más
          fiables.
        </p>
      )}
    </section>
  );
}

import { ChampionPool } from "./components/ChampionPool";
import { ChampionsMini } from "./components/ChampionsMini";
import { KdaChart } from "./components/charts/KdaChart";
import { RankChart } from "./components/charts/RankChart";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { MatchList } from "./components/MatchList";
import { ProfileHeader } from "./components/ProfileHeader";
import { RankCard } from "./components/RankCard";
import { RecentSummary } from "./components/RecentSummary";
import { Panel } from "./components/ui/Panel";
import { StateMessage } from "./components/ui/StateMessage";
import { Tabs } from "./components/ui/Tabs";
import { useRecentMatches } from "./hooks/useMatches";
import { useChampionStats } from "./hooks/useStats";
import { useTab } from "./hooks/useTab";

const TAB_IDS = ["resumen", "campeones", "rendimiento"] as const;
type TabId = (typeof TAB_IDS)[number];

function App() {
  const [tab, selectTab] = useTab<TabId>(TAB_IDS, "resumen");
  const { data: champions } = useChampionStats();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only z-30 rounded-ui bg-brand px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Header />
      <ProfileHeader
        tabs={
          <Tabs<TabId>
            label="Secciones del perfil"
            selected={tab}
            onSelect={selectTab}
            tabs={[
              { id: "resumen", label: "Resumen" },
              { id: "campeones", label: "Campeones", count: champions?.length },
              { id: "rendimiento", label: "Rendimiento" },
            ]}
          />
        }
      />

      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-4 outline-none"
      >
        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === "resumen" && <SummaryTab onShowChampions={() => selectTab("campeones")} />}
          {tab === "campeones" && <ChampionPool />}
          {tab === "rendimiento" && (
            <div className="grid gap-gap lg:grid-cols-2">
              <RankChart />
              <KdaChart />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SummaryTab({ onShowChampions }: { onShowChampions: () => void }) {
  const { data, isPending, isError, error } = useRecentMatches();

  return (
    <div className="grid items-start gap-gap lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="contents lg:grid lg:gap-gap">
        <div className="order-1 lg:order-none">
          <RankCard />
        </div>
        <div className="order-3 lg:order-none">
          <ChampionsMini onShowAll={onShowChampions} />
        </div>
      </div>

      <div className="order-2 grid gap-gap">
        {isPending ? (
          <Panel title="Historial">
            <StateMessage kind="loading" message="Cargando partidas…" />
          </Panel>
        ) : isError ? (
          <Panel title="Historial">
            <StateMessage
              kind="error"
              message={`No se pudo cargar el historial: ${error.message}`}
            />
          </Panel>
        ) : data.items.length === 0 ? (
          <Panel title="Historial">
            <StateMessage
              kind="empty"
              message="Todavía no hay partidas guardadas. El worker las sincroniza cada 30 minutos."
            />
          </Panel>
        ) : (
          <>
            <RecentSummary matches={data.items.slice(0, 20)} />
            <MatchList matches={data.items} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;

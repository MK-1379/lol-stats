import { Navigate, Route, Routes } from "react-router";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ChampionBuildPage } from "./pages/ChampionBuildPage";
import { ProfilePage } from "./pages/ProfilePage";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only z-30 rounded-ui bg-brand px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Header />
      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/campeon/:championKey" element={<ChampionBuildPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;

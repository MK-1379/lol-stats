import { useState } from "react";
import { championSplashUrl } from "../../utils/format";

export function SplashBanner({ champion }: { champion: string }) {
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

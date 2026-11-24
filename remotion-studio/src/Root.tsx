import { Composition, Folder } from "remotion";
import { KineticVideo, calcKinetic, FPS } from "./Kinetic/KineticVideo";
import { script } from "./Kinetic/script";
import { HiAd, calcHiAd, FPS as HI_FPS } from "./HiStudio/HiAd";
import { fatigue } from "./HiStudio/productions/fatigue";
import { tiktokLabsOk } from "./HiStudio/productions/tiktokLabsOk";
import { PopAd, calcPop, FPS as POP_FPS } from "./HiStudio/Pop/PopAd";
import { tiktokPop } from "./HiStudio/Pop/tiktokPop";

// Brand rule: every composition must render the Hidden Impact logo on top of all frames
// (Kinetic: <BrandLogo/> from src/Brand.tsx; HiStudio: <CornerLogo/> + end card).

const ASPECTS = [
  { id: "9x16", width: 1080, height: 1920 },
  { id: "16x9", width: 1920, height: 1080 },
  { id: "1x1", width: 1080, height: 1080 },
] as const;

// Register each production here (one line per production)
const PRODUCTIONS = [fatigue, tiktokLabsOk];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="HiddenImpact">
        {PRODUCTIONS.flatMap((p) =>
          ASPECTS.map((a) => (
            <Composition
              key={`${p.id}-${a.id}`}
              id={`${p.id}-${a.id}`}
              component={HiAd}
              durationInFrames={300}
              calculateMetadata={calcHiAd}
              fps={HI_FPS}
              width={a.width}
              height={a.height}
              defaultProps={{ production: p }}
            />
          )),
        )}
        {/* Pop style (dark kinetic TikTok) — 9:16 only */}
        <Composition id={`${tiktokPop.id}-9x16`} component={PopAd} durationInFrames={300} calculateMetadata={calcPop} fps={POP_FPS} width={1080} height={1920} defaultProps={{ production: tiktokPop }} />
      </Folder>
      {/* Arabic kinetic-typography reel, styled after Refrences/فيديو 1.mp4 — edit src/Kinetic/script.ts */}
      <Composition
        id="Kinetic"
        component={KineticVideo}
        durationInFrames={300}
        calculateMetadata={calcKinetic}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ script }}
      />
    </>
  );
};

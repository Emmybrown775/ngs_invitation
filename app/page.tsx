"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Generating } from "@/components/Generating";
import { Landing } from "@/components/Landing";
import { PixelHorizon } from "@/components/PixelHorizon";
import { PhotoStudio, type StudioValues } from "@/components/PhotoStudio";
import { Result } from "@/components/Result";
import { event, sponsorBox, sponsors } from "@/lib/event.config";
import { type RenderedSet, identityTransform, renderAll } from "@/lib/render";
import { makeThumbnail, reportIdentity } from "@/lib/share";

type Stage = "landing" | "studio" | "generating" | "result";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/**
 * Yield once so the loading state can paint before canvas work blocks the
 * main thread. Backgrounded tabs never fire requestAnimationFrame, so race
 * it against a timer — otherwise anyone who switches apps mid-generation
 * comes back to a spinner that never resolves.
 */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    requestAnimationFrame(finish);
    setTimeout(finish, 50);
  });
}

const emptyValues: StudioValues = {
  name: "",
  role: "",
  transform: identityTransform,
  shareFace: true,
  participation: "attending",
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("landing");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [values, setValues] = useState<StudioValues>(emptyValues);
  const [assets, setAssets] = useState<RenderedSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedKey, setFeedKey] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);

  // Revoke the last object URL whenever it is replaced, and on unmount.
  const setPhotoFromUrl = useCallback(async (url: string) => {
    // `window.Image`, not `Image` \u2014 next/image shadows the DOM constructor.
    const img = new window.Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = url;
    setPhoto(img);
  }, []);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("That file isn’t an image. Try a JPG, PNG or HEIC photo.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That photo is over 12MB. Try a smaller one.");
      return;
    }

    try {
      await setPhotoFromUrl(URL.createObjectURL(file));
      setError(null);
      setStage("studio");
    } catch {
      setError("We couldn’t open that photo. Try a different one.");
    }
  };

  const generate = async () => {
    if (!photo) return;
    setStage("generating");
    setError(null);
    try {
      // Let the loader paint before the main thread goes busy on canvas work.
      await nextPaint();
      const set = await renderAll({
        photo,
        transform: values.transform,
        name: values.name.trim(),
        role: values.role.trim(),
        participation: values.participation,
      });
      setAssets(set);
      setStage("result");

      const thumb = values.shareFace
        ? await makeThumbnail(photo, values.transform)
        : undefined;
      await reportIdentity(thumb);
      setFeedKey((k) => k + 1);
    } catch (err) {
      console.error("render failed:", err);
      setError("Something went wrong making your assets. Please try again.");
      setStage("studio");
    }
  };

  const restart = () => {
    setAssets(null);
    setValues(emptyValues);
    setStage("landing");
  };

  return (
    <>
      <PixelHorizon />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="sr-only"
      />

      {/* Top banner */}
      <header className="relative z-10 flex justify-center px-4 pt-5">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-5 pr-1.5 backdrop-blur">
          <span className="text-xs font-medium text-cream sm:text-sm">
            {event.bannerText}
          </span>
          <a
            href={event.registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-lime px-4 py-1.5 text-xs font-bold text-accent-ink transition-transform hover:scale-105"
          >
            Register
          </a>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-8 sm:py-12">
        {error && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-magenta/40 bg-magenta/10 px-4 py-3 text-sm text-cream"
          >
            {error}
          </p>
        )}

        {stage === "landing" && (
          <Landing
            refreshKey={feedKey}
            onPick={() => fileRef.current?.click()}
          />
        )}

        {stage === "studio" && photo && (
          <PhotoStudio
            photo={photo}
            values={values}
            onChange={setValues}
            onBack={() => setStage("landing")}
            onChangePhoto={() => fileRef.current?.click()}
            onSubmit={generate}
          />
        )}

        {stage === "generating" && <Generating />}

        {stage === "result" && assets && (
          <Result
            assets={assets}
            mode={values.participation}
            onRestart={restart}
          />
        )}
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-2 px-5 pb-5 text-center sm:pb-8">
        <p className="ngs-on-glow text-xs font-semibold tracking-[0.14em] text-cream/80">
          {event.dateLabel.toUpperCase()} &middot;{" "}
          {event.venueShort.toUpperCase()}
        </p>
        <p className="ngs-on-glow text-[0.7rem] text-cream/55">
          {event.tagline}
        </p>

        {sponsors.length > 0 && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <p className="ngs-on-glow text-[0.65rem] font-semibold tracking-[0.22em] text-cream/45">
              SPONSORED BY
            </p>
            <ul className="flex flex-wrap items-end justify-center gap-x-6 gap-y-3">
              {sponsors.map((sponsor) => {
                /*
                 * Same layout call as the generated assets, so the site and
                 * the downloads agree. Whatever sits below the shared
                 * baseline - a descender, or a mark that overshoots the type
                 * - hangs beneath the row via a negative bottom margin, so
                 * the baselines line up rather than the box bottoms.
                 */
                const X = 11;
                const { height, toBaseline } = sponsorBox(sponsor, X);
                const overhang = height - toBaseline;
                const logo = (
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={320}
                    height={80}
                    style={{ height, marginBottom: -overhang }}
                    className="w-auto opacity-75 transition-opacity hover:opacity-100"
                  />
                );
                return (
                  <li key={sponsor.name} className="flex items-end">
                    {sponsor.url ? (
                      <a
                        href={sponsor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={sponsor.name}
                      >
                        {logo}
                      </a>
                    ) : (
                      logo
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </footer>
    </>
  );
}

"use client";

import { useState } from "react";
import { event } from "@/lib/event.config";
import type { Transform } from "@/lib/render/primitives";
import { CropPreview } from "./CropPreview";

export type StudioValues = {
  name: string;
  role: string;
  transform: Transform;
  shareFace: boolean;
};

export function PhotoStudio({
  photo,
  values,
  onChange,
  onBack,
  onChangePhoto,
  onSubmit,
}: {
  photo: HTMLImageElement;
  values: StudioValues;
  onChange: (next: StudioValues) => void;
  onBack: () => void;
  onChangePhoto: () => void;
  onSubmit: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const nameMissing = touched && !values.name.trim();

  const set = <K extends keyof StudioValues>(key: K, v: StudioValues[K]) =>
    onChange({ ...values, [key]: v });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!values.name.trim()) return;
    onSubmit();
  };

  return (
    <form
      onSubmit={submit}
      className="ngs-rise w-full max-w-lg rounded-3xl border border-white/10 bg-surface/80 p-6 backdrop-blur-xl sm:p-8"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-cream"
      >
        <span aria-hidden>&larr;</span> Back
      </button>

      <div className="flex flex-col items-center gap-4">
        <CropPreview
          photo={photo}
          transform={values.transform}
          onChange={(t) => set("transform", t)}
        />
        <p className="text-xs text-muted">Drag the photo to reposition</p>

        <label className="flex w-full max-w-xs items-center gap-3">
          <span className="sr-only">Zoom</span>
          <span aria-hidden className="text-xs text-muted">
            &minus;
          </span>
          <input
            type="range"
            className="ngs-range w-full"
            min={1}
            max={3}
            step={0.01}
            value={values.transform.zoom}
            onChange={(e) =>
              set("transform", {
                ...values.transform,
                zoom: Number(e.target.value),
              })
            }
          />
          <span aria-hidden className="text-xs text-muted">
            +
          </span>
        </label>

        <button
          type="button"
          onClick={onChangePhoto}
          className="text-sm font-medium text-lime underline-offset-4 hover:underline"
        >
          Change photo
        </button>
      </div>

      <div className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="ngs-name"
            className="mb-2 block text-xs font-semibold tracking-[0.18em] text-muted"
          >
            NAME
          </label>
          <input
            id="ngs-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={event.sampleName}
            maxLength={40}
            autoComplete="name"
            aria-invalid={nameMissing}
            aria-describedby={nameMissing ? "ngs-name-error" : undefined}
            className="w-full border-b border-line bg-transparent pb-2 text-2xl font-bold text-cream outline-none transition-colors placeholder:text-white/20 focus:border-lime"
          />
          {nameMissing && (
            <p id="ngs-name-error" className="mt-2 text-xs text-magenta">
              Add your name so we can put it on the card.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="ngs-role"
            className="mb-2 block text-xs font-semibold tracking-[0.18em] text-muted"
          >
            ROLE <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            id="ngs-role"
            value={values.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder={event.sampleRole}
            maxLength={48}
            className="w-full border-b border-line bg-transparent pb-2 text-lg text-cream outline-none transition-colors placeholder:text-white/20 focus:border-lime"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <input
            type="checkbox"
            checked={values.shareFace}
            onChange={(e) => set("shareFace", e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-lime"
          />
          <span className="text-xs leading-relaxed text-muted">
            Add my face to the public attendee wall.
            <span className="mt-0.5 block text-white/40">
              Sends a 96px thumbnail. Your full photo always stays on your
              device  every image is made right here in your browser.
            </span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="mt-8 w-full rounded-full bg-lime px-6 py-4 text-base font-bold text-accent-ink transition-transform hover:scale-[1.02] active:scale-[0.99]"
      >
        Generate my identity
      </button>
    </form>
  );
}

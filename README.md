# Next Gen Summit 26 — Summit Identity Generator

Attendees upload one photo and get four branded assets: an **attending card**,
a **circular profile picture**, a **formal invitation letter** and a **story**
image for WhatsApp/Instagram.

Modelled on the Solana Summit Nigeria PFP wrapper, rebuilt on the NGS brand.

## How it works

Every image is composed **client-side on a `<canvas>`**. The uploaded photo
never touches the server. The only thing that is ever sent — and only if the
attendee ticks the box — is a 96px WebP thumbnail for the public "faces" wall.

```
app/
  page.tsx                  stage machine: landing -> studio -> generating -> result
  layout.tsx                fonts (Archivo + Geist Mono), metadata
  globals.css               brand tokens mirrored from lib/event.config.ts
  api/frames/feed/          GET           -> { count, thumbnails[] }
  api/frames/increment/     POST -> records one identity (thumbnail optional)
components/
  PixelHorizon.tsx          the page backdrop
  Landing.tsx  Countdown.tsx  FacesWall.tsx
  PhotoStudio.tsx  CropPreview.tsx
  Generating.tsx  Result.tsx
lib/
  event.config.ts           *** all event copy, dates, colours and asset paths ***
  store.ts                  counter + faces persistence (Upstash, memory fallback)
  share.ts                  download / Web Share / thumbnail
  render/
    primitives.ts           canvas helpers: cover-fit, curved text, glyphs, horizon
    common.ts               shared backdrop, lockup, footer
    card.ts  pfp.ts  letter.ts  story.ts
public/brand/               the logo artwork from the brand kit
```

## Changing the event details

Almost everything lives in [`lib/event.config.ts`](lib/event.config.ts):
dates, venue, copy, share text, registration URL, colours and output sizes.

Two things to keep in step by hand:

- **Colours** are declared twice — in `brand` (read by the canvas renderers,
  which cannot read CSS) and as `--ngs-*` custom properties in
  `app/globals.css` (read by the DOM). Edit both.
- **`startsAt`** drives the countdown and must be a future ISO timestamp.

To swap the logo, replace the files in `public/brand/` keeping the same names.

## The pixel horizon

The glow rising out of black is the brand's signature, and it is generated
procedurally by `drawPixelHorizon` in `lib/render/primitives.ts` — no image
asset. The page backdrop and all four exports call that same function, so the
site and the downloads are literally the same artwork.

## Running it

```bash
npm install
npm run dev
```

## Persistence

The attendee counter and faces wall need a shared store, because serverless
functions do not share memory between invocations.

- **With `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`** (see
  `.env.example`): numbers persist. This is what production needs.
- **Without them**: an in-process fallback keeps everything working for
  `npm run dev`, but the numbers reset whenever the server restarts.

`/api/frames/increment` is public, so it caps thumbnails at 24KB, requires the
exact `data:image/webp;base64,` prefix, and rate-limits to 8 requests per
minute per IP.

## Deploying

Push to GitHub, import into Vercel, add the two Upstash variables, deploy.

## Sponsors

Sponsors come from the `sponsors` array in `lib/event.config.ts` and render in
four places automatically: the site footer, the attending card, the invitation
letter and the story. (Not the profile picture \u2014 the ring already carries the
event name and the city, and there is no room left.)

To add one, run the prep script and paste what it prints:

```bash
python3 scripts/logo-metrics.py ~/Downloads/acme-logo.png acme
```

It writes a white-on-transparent PNG into `public/brand/sponsors/` (the assets
are black-first, so white artwork is what reads) and prints the entry:

```ts
{
  name: "Acme",
  url: "",                               // optional; no url renders as a plain logo
  logo: "/brand/sponsors/acme.png",
  markOnly: true,                        // only if the file has no wordmark
  xHeight: 0.534,
  baseline: 0.772,
}
```

### Why `xHeight` and `baseline`

Logos cannot be aligned on their bounding boxes. A box contains something
different for each file: `talksign` has both an ascender and a descender,
`trame` has neither, and `Blockroll` and `trame` carry marks that overshoot
their own type. Scale those boxes to a common height and the letterforms come
out different sizes; centre them and the baselines sit ragged.

So `drawSponsorStrip` scales every logo to a common **x-height** and sits them
on a shared **baseline**, letting descenders and overshooting marks hang below
it. Symbols have no baseline, so `markOnly` ones are centred on the x-height
band instead. The row is then scaled down as a whole until it fits, so a sixth
sponsor shrinks the row rather than overflowing it.

The two numbers are measured from the artwork: row ink peaks across the
x-height band, so the rows at or above 55% of that peak isolate it, and the
band's lower edge is the baseline. The site footer applies the same metrics in
CSS, so it matches the generated images.

## Attending or volunteering

People pick one in the studio, and every string either mode changes lives in
the `participation` map in `lib/event.config.ts`: the chip on the card, the big
line on the story, the curved text on the profile picture, the letter's kicker
and opening paragraph, and the share text. Adding a third mode (speaker,
sponsor, crew) means adding one entry there \u2014 the UI toggle and all four
renderers pick it up.

## A note on venue strings

`venue` is the full name (used on the invitation letter); `venueShort` is for
the card footer and the story pill, where a long name would collide with the
date. Both the card footer and the story pill shrink their type to fit, so a
longer name degrades gracefully rather than overflowing.

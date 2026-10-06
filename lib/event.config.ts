/**
 * Single source of truth for everything brand- and event-specific.
 * Colours and copy are taken from the official NGS brand kit
 * (Logo/, Social Media Assets/, Designs/ in the brand zip).
 */

export const event = {
  name: "Next Gen Summit",
  shortName: "NGS",
  year: "2026",
  yearShort: "26",
  fullName: "Next Gen Summit 26",
  tagline: "Built for the next generation by the next generation.",
  bannerText: "Built for the next generation",

  /** ISO 8601 with timezone — drives the countdown. Must be in the future. */
  startsAt: "2026-10-10T09:00:00+01:00",
  dateLabel: "Sat, Oct. 10",
  timeLabel: "9AM – 5PM",
  /** Full venue, for the letter. */
  venue: "Breakfort Hotel and Suites, Uyo",
  /** Short form, for the places where the full name will not fit. */
  venueShort: "Breakfort Hotel, Uyo",

  city: "Uyo",
  cityLine: "See you in Uyo.",

  registerUrl: "https://nextgensummit.xyz",
  siteUrl: "https://nextgensummit.xyz",
  hashtag: "#NextGenSummit",

  /** Headline printed on the attending card. */
  cardHeadline: "Meet me at",

  sampleName: "Ada Obi",
  sampleRole: "Software Engineer",
} as const;

/**
 * Brand tokens, sampled directly from the official logo artwork.
 * Consumed by BOTH the DOM (mirrored as CSS custom properties in
 * globals.css) and the canvas renderers, which cannot read CSS.
 */
export const brand = {
  /** The brand is black-first — see the teaser and X banner. */
  ink: "#000000",
  base: "#050506",
  surface: "#0E1114",
  surfaceRaised: "#171B20",
  line: "#2A3038",

  /** The four logo glyph colours. */
  lime: "#C6FF33",
  violet: "#7D39EB",
  cyan: "#43D9E7",
  magenta: "#FF50EA",

  /** Primary action colour. */
  accent: "#C6FF33",
  accentInk: "#0A1200",

  /**
   * The pale-blue "pixel horizon" glow that rises from the bottom of every
   * official asset, light -> dark.
   */
  glowNear: "#DCE9F7",
  glowMid: "#8FA8C0",
  glowFar: "#2B3A47",

  cream: "#FFFFFF",
  muted: "#8A929B",
} as const;

/** Glyph colour cycle, used wherever we accent one letter at a time. */
export const glyphColors = [
  brand.lime,
  brand.violet,
  brand.magenta,
  brand.cyan,
] as const;

/**
 * Event sponsors, shown in the site footer. Add more entries and they
 * render automatically.
 */
export type Sponsor = {
  name: string;
  url: string;
  /** White-on-transparent PNG under /public/brand/sponsors. */
  logo: string;
  /**
   * True when the file is a symbol with no wordmark, so there is no baseline
   * to sit on. Those are centred on the type's x-height band instead.
   */
  markOnly?: boolean;
  /**
   * Typographic metrics of the artwork, as fractions of the file's height.
   * Matching logos on bounding box alone looks wrong: a wordmark with a
   * descender ends up with smaller letters than one without, and centring
   * boxes leaves the baselines out of line. These let the strip scale on
   * x-height and sit everything on a shared baseline.
   *
   * Measured from the files themselves \u2014 see `scripts/logo-metrics.py`.
   */
  xHeight: number;
  baseline: number;
};

export const sponsors: readonly Sponsor[] = [
  {
    name: "Blockroll",
    url: "https://x.com/ourblockroll",
    logo: "/brand/sponsors/blockroll.png",
    xHeight: 0.529,
    baseline: 0.851,
  },
  {
    name: "Talksign",
    url: "",
    logo: "/brand/sponsors/talksign.png",
    xHeight: 0.534,
    baseline: 0.772,
  },
  {
    name: "Providum",
    url: "",
    logo: "/brand/sponsors/providum.png",
    xHeight: 0.650,
    baseline: 0.975,
  },
  {
    name: "Trame",
    url: "",
    logo: "/brand/sponsors/trame.png",
    xHeight: 0.581,
    baseline: 0.846,
  },
  {
    name: "Watchup",
    url: "",
    logo: "/brand/sponsors/watchup.png",
    markOnly: true,
    xHeight: 0.796,
    baseline: 0.956,
  },
];

/**
 * People get one of two identities. Every string either mode changes lives
 * here, so the renderers and the UI stay in step.
 */
export type Participation = "attending" | "volunteering";

export const participation: Record<
  Participation,
  {
    /** Toggle label in the studio. */
    option: string;
    /** The chip on the card and the big line on the story. */
    statement: string;
    /** Curved text around the profile picture. */
    ringText: string;
    /** Opening line of the invitation letter. */
    letterOpening: string;
    /** What the letter calls the document. */
    letterKicker: string;
    shareText: string;
  }
> = {
  attending: {
    option: "Attending",
    statement: "I'M ATTENDING",
    ringText: "ATTENDING NEXT GEN SUMMIT 26",
    letterOpening:
      "It is our pleasure to invite you to Next Gen Summit 26, a gathering of the builders, founders and creatives shaping what comes next.",
    letterKicker: "OFFICIAL INVITATION",
    shareText:
      "I'm attending Next Gen Summit 26 in Uyo.\n\nCreate your official Summit identity \ud83d\udc47",
  },
  volunteering: {
    option: "Volunteering",
    statement: "I'M VOLUNTEERING",
    ringText: "VOLUNTEERING AT NEXT GEN SUMMIT 26",
    letterOpening:
      "Thank you for volunteering at Next Gen Summit 26. You are part of the team making the day happen for everyone who walks through the door.",
    letterKicker: "OFFICIAL VOLUNTEER PASS",
    shareText:
      "I'm volunteering at Next Gen Summit 26 in Uyo.\n\nCreate your official Summit identity \ud83d\udc47",
  },
};

/** Asset paths under /public. Replace the files, keep the names. */
export const assets = {
  /** Full horizontal lockup: glyph grid + "NEXT GEN 2 / SUMMIT 26". */
  logoLockup: "/brand/logo-lockup.png",
  /** 2x2 glyph grid only — the square mark. */
  logoGrid: "/brand/logo-grid.png",
  /** Single-row glyph mark. */
  logoRow: "/brand/logo-row.png",
  avatar: "/brand/avatar.png",
  banner: "/brand/banner.png",
} as const;

/** Output sizes in px. */
export const canvasSizes = {
  pfp: { w: 1080, h: 1080 },
  card: { w: 1080, h: 1350 }, // 4:5 — feed-optimal
  letter: { w: 1240, h: 1754 }, // A4 at 150dpi
  story: { w: 1080, h: 1920 }, // 9:16
} as const;

export type AssetKind = keyof typeof canvasSizes;

export const assetOrder: AssetKind[] = ["card", "pfp", "letter", "story"];

export const assetMeta: Record<
  AssetKind,
  { label: string; blurb: string; filename: string }
> = {
  card: {
    label: "Attending card",
    blurb: "Your shareable “I’m attending” card",
    filename: "next-gen-summit-26-attending-card.png",
  },
  pfp: {
    label: "Profile picture",
    blurb: "Avatar for X, LinkedIn and Telegram",
    filename: "next-gen-summit-26-pfp.png",
  },
  letter: {
    label: "Invitation letter",
    blurb: "A formal letter addressed to you",
    filename: "next-gen-summit-26-invitation-letter.png",
  },
  story: {
    label: "Story",
    blurb: "For WhatsApp Status and Instagram Stories",
    filename: "next-gen-summit-26-story.png",
  },
};

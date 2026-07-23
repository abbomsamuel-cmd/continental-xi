/**
 * The single source of truth for the production URL. Everything that needs the
 * site address (share cards, SEO metadata, README) reads it from here, so a
 * future domain change is a one-line edit. Override at build time with
 * NEXT_PUBLIC_SITE_URL if the deployment domain ever changes again.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://continentalxi.vercel.app";

/** Host without the scheme — for footers and share-card captions. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

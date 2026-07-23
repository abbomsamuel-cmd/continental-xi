"use client";

/**
 * One club crest component. With no licensed badges, this renders the original
 * ContinentalXI fallback: the club's colours as a gradient shield with its
 * short code — clean, minimalist, and it can never show a broken image. The
 * API is ready to prefer a real crest URL later without changing call sites.
 */
export function ClubCrest({
  name, short, colors, size = 40, src,
}: {
  name?: string;
  short: string;
  colors: [string, string];
  size?: number;
  src?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? short} width={size} height={size}
      className="shrink-0 rounded-[8px] object-contain" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="badge-crest shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        background: `linear-gradient(150deg, ${colors[0]}, ${colors[1]})`,
      }}
      title={name ?? short}
      aria-label={name ?? short}
    >
      {short}
    </span>
  );
}

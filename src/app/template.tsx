// A fresh instance mounts on every navigation, so this replays a subtle fade —
// smooth page transitions without a transform (which would break fixed overlays).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

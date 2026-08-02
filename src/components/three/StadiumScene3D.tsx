"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, SpotLight, Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";

export interface StadiumTheme {
  primary: string;
  secondary: string;
}

export const STADIUM_DEFAULT_THEME: StadiumTheme = { primary: "#00f0ff", secondary: "#0f172a" };

/** Stylized tiers framing the pitch — abstract, not a literal stadium model,
 *  matching the app's existing original-art (never-real-world-accurate) look. */
function Bowl() {
  // a tight ring close around the camera, wrapping nearly all the way
  // round — only the tunnel-mouth gap ahead stays open — so the tiers
  // actually surround you instead of sitting off in the distance
  const tiers = [
    { radius: 17, y: 3.2, tilt: 0.5, color: "#0a1a30" },
    { radius: 15, y: 1.9, tilt: 0.44, color: "#0d2038" },
    { radius: 13, y: 0.8, tilt: 0.36, color: "#0f2440" },
  ];
  return (
    <group position={[0, 0, 3]}>
      {tiers.map((tier, i) => (
        <mesh key={i} position={[0, tier.y, 0]} rotation={[-tier.tilt, 0, 0]}>
          <torusGeometry args={[tier.radius, 0.9, 8, 48, Math.PI * 1.7]} />
          <meshStandardMaterial color={tier.color} roughness={0.85} metalness={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Floodlights({ theme }: { theme: StadiumTheme }) {
  const a = useRef<THREE.SpotLight>(null);
  const b = useRef<THREE.SpotLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flicker = 0.85 + Math.sin(t * 9) * 0.05 + Math.sin(t * 23) * 0.03;
    if (a.current) a.current.intensity = 34 * flicker;
    if (b.current) b.current.intensity = 34 * flicker;
  });
  return (
    <>
      <SpotLight ref={a} position={[-14, 17, 6]} angle={0.32} penumbra={0.65} color={theme.primary}
        intensity={34} distance={40} volumetric opacity={0.35} attenuation={22} anglePower={5} />
      <SpotLight ref={b} position={[14, 17, 6]} angle={0.32} penumbra={0.65} color={theme.primary}
        intensity={34} distance={40} volumetric opacity={0.35} attenuation={22} anglePower={5} />
      <ambientLight intensity={0.18} />
      <hemisphereLight args={[theme.primary, "#020306", 0.25]} />
    </>
  );
}

function Pitch() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[26, 40]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={512}
        mixBlur={1}
        mixStrength={12}
        roughness={0.85}
        depthScale={1}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.2}
        color="#062d1a"
        metalness={0.4}
      />
    </mesh>
  );
}

/** Floating original-art trophy silhouettes (emissive polyhedra, not real
 *  trophy models) — cheap, on-brand, no licensing concerns. */
function Trophies({ theme }: { theme: StadiumTheme }) {
  const shapes: Array<{ pos: [number, number, number]; geo: "octa" | "icosa" }> = [
    { pos: [-8, 5, -2], geo: "octa" },
    { pos: [8, 6, -3], geo: "icosa" },
    { pos: [0, 7.5, -9], geo: "octa" },
  ];
  return (
    <>
      {shapes.map((s, i) => (
        <Float key={i} speed={1.4 + i * 0.3} rotationIntensity={1.1} floatIntensity={1.4}>
          <mesh position={s.pos}>
            {s.geo === "octa" ? <octahedronGeometry args={[1.1, 0]} /> : <icosahedronGeometry args={[1, 0]} />}
            <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={0.6} roughness={0.25} metalness={0.7} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

/** Idle: slow autonomous drift, a showcase camera, not user-draggable.
 *  On `entering`: dolly down the tunnel toward the pitch, timed to match
 *  the ModeTransition overlay's hold before navigation. */
function CameraRig({ entering }: { entering: boolean }) {
  const enterStart = useRef<number | null>(null);
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const cam = camera as THREE.PerspectiveCamera;
    if (entering) {
      if (enterStart.current === null) enterStart.current = t;
      const k = Math.min(1, (t - enterStart.current) / 0.9);
      const ease = 1 - (1 - k) ** 3;
      cam.position.set(0, 2.6 - ease * 1.2, 9 - ease * 8);
      cam.fov = 62 + ease * 20;
      cam.updateProjectionMatrix();
      cam.lookAt(0, 2, 0);
    } else {
      enterStart.current = null;
      cam.position.set(Math.sin(t * 0.12) * 1, 2.6 + Math.sin(t * 0.09) * 0.2, 9);
      cam.fov = 62;
      cam.updateProjectionMatrix();
      cam.lookAt(0, 2.4, 0);
    }
  });
  return null;
}

export default function StadiumScene3D({
  theme = STADIUM_DEFAULT_THEME,
  entering = false,
}: {
  theme?: StadiumTheme;
  entering?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[85vh] min-h-[600px] overflow-hidden" aria-hidden>
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 2.6, 9], fov: 62 }}>
        <fog attach="fog" args={["#050910", 10, 30]} />
        <Suspense fallback={null}>
          <Floodlights theme={theme} />
          <Bowl />
          <Pitch />
          <Trophies theme={theme} />
          <Sparkles count={60} scale={[20, 10, 20]} size={2} speed={0.3} color={theme.primary} opacity={0.5} />
        </Suspense>
        <CameraRig entering={entering} />
      </Canvas>
    </div>
  );
}

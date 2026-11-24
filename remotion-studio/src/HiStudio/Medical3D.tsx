import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HI } from "./brand";

/* Deterministic pseudo-random so every render is identical */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const Lights: React.FC<{ warm?: boolean }> = ({ warm }) => (
  <>
    <ambientLight intensity={0.55} />
    <hemisphereLight args={["#ffffff", HI.tint, 0.8]} />
    <directionalLight position={[4, 6, 5]} intensity={1.6} color={warm ? "#fff3df" : "#ffffff"} />
    <directionalLight position={[-5, -2, -3]} intensity={0.6} color={HI.sage} />
    <pointLight position={[0, 0, 4]} intensity={8} distance={14} color={HI.gold} />
  </>
);

const Canvas: React.FC<{ children: React.ReactNode; bg: string; fog?: [number, number] }> = ({ children, bg, fog = [6, 22] }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 42, position: [0, 0, 9], near: 0.1, far: 100 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ background: bg }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog(bg, fog[0], fog[1]); // depth falloff = cinematic depth of field feel
      }}
    >
      {children}
    </ThreeCanvas>
  );
};

/* Camera rig driven by the frame: slow dolly + gentle orbit (3D camera movement) */
const Rig: React.FC<{ from: [number, number, number]; to: [number, number, number]; look?: [number, number, number]; orbit?: number }> = ({ from, to, look = [0, 0, 0], orbit = 0.25 }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = Math.min(1, f / Math.max(1, durationInFrames - 1));
  const e = 1 - Math.pow(1 - t, 3);
  return (
    <CameraUpdater
      position={[from[0] + (to[0] - from[0]) * e + Math.sin(t * Math.PI) * orbit, from[1] + (to[1] - from[1]) * e, from[2] + (to[2] - from[2]) * e]}
      look={look}
    />
  );
};

import { useThree } from "@react-three/fiber";
const CameraUpdater: React.FC<{ position: [number, number, number]; look: [number, number, number] }> = ({ position, look }) => {
  const camera = useThree((s) => s.camera);
  camera.position.set(...position);
  camera.lookAt(...look);
  return null;
};

/* ───────────── Cells: translucent glass cells with nuclei floating in depth ───────────── */
export const Cells3D: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const aspect = width / height; // spread cells to fill wide frames too
  const cells = useMemo(
    () =>
      Array.from({ length: Math.round(22 * Math.max(1, aspect * 1.4)) }, (_, i) => ({
        p: [(rand(i) - 0.5) * 12 * Math.max(1, aspect * 1.5), (rand(i + 50) - 0.5) * 15, -rand(i + 99) * 16 - 1] as [number, number, number],
        r: 0.45 + rand(i + 7) * 0.6,
        ph: rand(i + 3) * 6.28,
      })),
    [aspect],
  );
  return (
    <Canvas bg={HI.ivory}>
      <Lights />
      <Rig from={[0, 0, 11]} to={[0.6, -0.4, 7.5]} />
      {cells.map((c, i) => {
        const y = c.p[1] + Math.sin(f / 40 + c.ph) * 0.35;
        const x = c.p[0] + Math.cos(f / 55 + c.ph) * 0.25;
        return (
          <group key={i} position={[x, y, c.p[2]]} rotation={[f / 120 + c.ph, f / 90, 0]}>
            <mesh scale={[1, 0.86, 0.94]}>
              <sphereGeometry args={[c.r, 48, 48]} />
              <meshPhysicalMaterial color={HI.tint} roughness={0.15} transmission={0.6} thickness={1.2} clearcoat={1} clearcoatRoughness={0.1} ior={1.35} transparent opacity={0.9} />
            </mesh>
            <mesh position={[c.r * 0.15, 0.05, 0]}>
              <sphereGeometry args={[c.r * 0.38, 32, 32]} />
              <meshStandardMaterial color={i % 4 === 0 ? HI.gold : HI.green} roughness={0.35} metalness={0.1} emissive={i % 4 === 0 ? HI.gold : HI.sage} emissiveIntensity={0.15} />
            </mesh>
          </group>
        );
      })}
    </Canvas>
  );
};

/* ───────────── Blood flow: biconcave red cells streaming through a glass vessel ───────────── */
const rbcGeometry = () => {
  // Biconcave disc profile (Evans–Fung shape), revolved
  const pts: THREE.Vector2[] = [];
  const R = 1;
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * R;
    const r2 = (x / R) ** 2;
    const h = 0.5 * Math.sqrt(Math.max(0, 1 - r2)) * (0.207 + 2.003 * r2 - 1.123 * r2 * r2);
    pts.push(new THREE.Vector2(Math.max(x, 0.001), h));
  }
  for (let i = 40; i >= 0; i--) pts.push(new THREE.Vector2(Math.max(pts[i].x, 0.001), -pts[i].y));
  return new THREE.LatheGeometry(pts, 48);
};

export const Blood3D: React.FC = () => {
  const f = useCurrentFrame();
  const geo = useMemo(rbcGeometry, []);
  const cells = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        a: rand(i) * Math.PI * 2,
        rr: Math.sqrt(rand(i + 11)) * 1.5,
        z0: rand(i + 21) * 40,
        spin: [rand(i + 31) * 6, rand(i + 41) * 6] as [number, number],
        s: 0.42 + rand(i + 51) * 0.12,
      })),
    [],
  );
  return (
    <Canvas bg="#F3EEE9" fog={[3, 26]}>
      <Lights warm />
      <Rig from={[0, 0.3, 6]} to={[0, 0, 3.2]} look={[0, 0, -10]} orbit={0.15} />
      {/* vessel wall */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -15]}>
        <cylinderGeometry args={[2.3, 2.3, 50, 64, 1, true]} />
        <meshPhysicalMaterial color="#E8CFC6" side={THREE.BackSide} roughness={0.6} transmission={0.2} transparent opacity={0.55} />
      </mesh>
      {cells.map((c, i) => {
        const z = ((c.z0 + f * 0.09) % 40) - 34; // flow toward camera
        return (
          <mesh key={i} geometry={geo} scale={c.s} position={[Math.cos(c.a) * c.rr, Math.sin(c.a) * c.rr, z]} rotation={[c.spin[0] + f / 50, c.spin[1] + f / 70, 0]}>
            <meshPhysicalMaterial color={HI.rbc} roughness={0.35} clearcoat={0.6} sheen={0.5} sheenColor="#ffd9cf" />
          </mesh>
        );
      })}
    </Canvas>
  );
};

/* ───────────── DNA: rotating double helix in brand green + gold ───────────── */
export const Dna3D: React.FC = () => {
  const f = useCurrentFrame();
  const N = 34;
  const items = Array.from({ length: N }, (_, i) => {
    const y = (i - N / 2) * 0.34;
    const a = i * 0.48 + f / 45;
    return { y, a };
  });
  return (
    <Canvas bg={HI.ivory}>
      <Lights />
      <Rig from={[0, -1.5, 11]} to={[1.2, 0.5, 7]} look={[0, 0, 0]} />
      <group rotation={[0, 0, 0.35]}>
        {items.map(({ y, a }, i) => {
          const p1 = new THREE.Vector3(Math.cos(a) * 1.3, y, Math.sin(a) * 1.3);
          const p2 = new THREE.Vector3(-Math.cos(a) * 1.3, y, -Math.sin(a) * 1.3);
          const mid = p1.clone().add(p2).multiplyScalar(0.5);
          const len = p1.distanceTo(p2);
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
          return (
            <group key={i}>
              <mesh position={p1}>
                <sphereGeometry args={[0.2, 24, 24]} />
                <meshPhysicalMaterial color={HI.green} roughness={0.25} clearcoat={1} />
              </mesh>
              <mesh position={p2}>
                <sphereGeometry args={[0.2, 24, 24]} />
                <meshPhysicalMaterial color={HI.gold} roughness={0.25} metalness={0.3} clearcoat={1} />
              </mesh>
              <mesh position={mid} quaternion={q}>
                <cylinderGeometry args={[0.045, 0.045, len, 12]} />
                <meshPhysicalMaterial color={HI.sage} roughness={0.2} transmission={0.4} transparent opacity={0.85} />
              </mesh>
            </group>
          );
        })}
      </group>
    </Canvas>
  );
};

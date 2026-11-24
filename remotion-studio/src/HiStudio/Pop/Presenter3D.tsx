import React from "react";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { HI } from "../brand";

/*
  "Athar" (أثر) — the Hidden Impact presenter. Original stylized low-poly 3D character built in code:
  young Saudi health specialist, white thobe collar, open sage-green coat, champagne-gold pin.
  Poses blend between scenes, the mouth follows the voice (talk 0..1), idle breathing + blinking.
*/

export type Pose = "rest" | "point" | "present";
type Arm = { sx: number; sz: number; ez: number; hand: "fist" | "point" | "open" };
const POSES: Record<Pose, { R: Arm; L: Arm; head: number }> = {
  rest: { R: { sx: 0.12, sz: -0.12, ez: -0.18, hand: "fist" }, L: { sx: 0.12, sz: 0.12, ez: 0.18, hand: "fist" }, head: 0 },
  point: { R: { sx: 0.3, sz: -2.3, ez: -0.3, hand: "point" }, L: { sx: 0.12, sz: 0.12, ez: 0.18, hand: "fist" }, head: 0.25 },
  present: { R: { sx: 0.7, sz: -0.95, ez: -0.95, hand: "open" }, L: { sx: 0.7, sz: 0.95, ez: 0.95, hand: "open" }, head: -0.05 },
};

const SKIN = "#C69673";
const HAIR = "#1F1A17";
const BEARD = "#2B221D";
const WHITE = "#F7F6F0";

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({ sx: mix(a.sx, b.sx, t), sz: mix(a.sz, b.sz, t), ez: mix(a.ez, b.ez, t), hand: t < 0.5 ? a.hand : b.hand });

const M: React.FC<{ c: string; metal?: number; rough?: number; side?: THREE.Side }> = ({ c, metal = 0, rough = 0.75, side }) => (
  <meshStandardMaterial color={c} flatShading roughness={rough} metalness={metal} side={side} />
);

const ArmRig: React.FC<{ a: Arm; side: 1 | -1 }> = ({ a, side }) => (
  <group position={[0.8 * side, -0.18, 0]} rotation={[a.sx, 0, a.sz]}>
    <mesh position={[0, -0.36, 0]}>
      <cylinderGeometry args={[0.17, 0.15, 0.78, 10]} />
      <M c={HI.sage} />
    </mesh>
    <group position={[0, -0.74, 0]} rotation={[0, 0, a.ez]}>
      <mesh>
        <sphereGeometry args={[0.15, 10, 8]} />
        <M c={HI.sage} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.15, 0.13, 0.62, 10]} />
        <M c={HI.sage} />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.125, 0.125, 0.07, 10]} />
        <M c={WHITE} />
      </mesh>
      <group position={[0, -0.76, 0]}>
        {a.hand === "open" ? (
          <mesh position={[0, -0.05, 0]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.24, 0.3, 0.08]} />
            <M c={SKIN} />
          </mesh>
        ) : (
          <mesh>
            <sphereGeometry args={[0.13, 10, 8]} />
            <M c={SKIN} />
          </mesh>
        )}
        {a.hand === "point" ? (
          <mesh position={[0, -0.2, 0.02]}>
            <cylinderGeometry args={[0.038, 0.034, 0.26, 8]} />
            <M c={SKIN} />
          </mesh>
        ) : null}
      </group>
    </group>
  </group>
);

const Character: React.FC<{ from: Pose; to: Pose; t: number; talk: number; frame: number }> = ({ from, to, t, talk, frame }) => {
  const A = POSES[from], B = POSES[to];
  const R = mixArm(A.R, B.R, t), L = mixArm(A.L, B.L, t);
  const breathe = 1 + Math.sin(frame / 22) * 0.012;
  const blink = frame % 96 < 4 ? 0.12 : 1;
  const headY = -0.35 + mix(A.head, B.head, t) * 0.4 + Math.sin(frame / 47) * 0.06;
  const headX = Math.sin(frame / 31) * 0.04 + talk * 0.03;
  const open = 0.18 + talk * 0.75;
  return (
    <group rotation={[0, -0.38, 0]}>
      {/* torso: white thobe inside, open sage coat outside */}
      <group scale={[1, breathe, 1]}>
        <mesh position={[0, -1.05, 0]}>
          <cylinderGeometry args={[0.7, 0.8, 1.7, 14]} />
          <M c={WHITE} />
        </mesh>
        <mesh position={[0, -1.05, 0]}>
          <cylinderGeometry args={[0.76, 0.87, 1.72, 14, 1, true, 0.42, Math.PI * 2 - 0.84]} />
          <M c={HI.sage} side={THREE.DoubleSide} />
        </mesh>
        {/* lapels */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.24 * s, -0.42, 0.66]} rotation={[0.25, 0, 0.35 * s]}>
            <boxGeometry args={[0.16, 0.6, 0.05]} />
            <M c={HI.green} />
          </mesh>
        ))}
        <mesh position={[0, -0.18, 0]} scale={[1.6, 0.42, 0.95]}>
          <sphereGeometry args={[0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <M c={HI.sage} />
        </mesh>
        {/* gold pin */}
        <mesh position={[0.42, -0.62, 0.72]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.04, 12]} />
          <M c={HI.gold} metal={0.8} rough={0.25} />
        </mesh>
        {/* thobe collar + neck */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.27, 0.32, 0.2, 12]} />
          <M c={WHITE} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.19, 0.21, 0.32, 10]} />
          <M c={SKIN} />
        </mesh>
      </group>

      <ArmRig a={R} side={-1} />
      <ArmRig a={L} side={1} />

      {/* head */}
      <group position={[0, 0.78, 0]} rotation={[headX, headY, 0]}>
        <mesh scale={[0.92, 1.06, 0.96]}>
          <sphereGeometry args={[0.52, 16, 12]} />
          <M c={SKIN} />
        </mesh>
        {/* hair cap */}
        <mesh rotation={[-0.32, 0, 0]} scale={[0.97, 1.08, 1.0]}>
          <sphereGeometry args={[0.535, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
          <M c={HAIR} />
        </mesh>
        {/* beard (jawline shell) + moustache */}
        <mesh position={[0, -0.1, 0.4]} scale={[1.2, 0.5, 0.6]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <M c={BEARD} />
        </mesh>
        <mesh scale={[0.95, 1.07, 0.99]}>
          <sphereGeometry args={[0.53, 16, 10, Math.PI / 2 - 1.15, 2.3, Math.PI * 0.66, Math.PI * 0.27]} />
          <M c={BEARD} />
        </mesh>
        {/* ears */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.47 * s, 0, -0.02]} scale={[0.4, 0.7, 0.5]}>
            <sphereGeometry args={[0.14, 8, 6]} />
            <M c={SKIN} />
          </mesh>
        ))}
        {/* eyes + brows */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[0.17 * s, 0.07, 0.46]} scale={[1, blink, 0.6]}>
              <sphereGeometry args={[0.062, 10, 8]} />
              <meshStandardMaterial color="#1A1513" roughness={0.3} />
            </mesh>
            <mesh position={[0.17 * s + 0.02, 0.095, 0.5]} scale={[1, blink, 1]}>
              <sphereGeometry args={[0.016, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.17 * s, 0.22, 0.45]} rotation={[0, 0, -0.12 * s]}>
              <boxGeometry args={[0.18, 0.04, 0.04]} />
              <M c={HAIR} />
            </mesh>
          </group>
        ))}
        {/* nose */}
        <mesh position={[0, -0.03, 0.52]} scale={[0.8, 1, 0.9]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <M c="#B9876A" />
        </mesh>
        {/* mouth: smile arc + opening that follows the voice */}
        <mesh position={[0, -0.21, 0.52]} scale={[0.9, open, 0.4]}>
          <sphereGeometry args={[0.1, 12, 8]} />
          <meshStandardMaterial color="#4A2522" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.18, 0.54]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.1, 0.018, 6, 12, Math.PI]} />
          <M c="#8C5A4A" />
        </mesh>
      </group>
    </group>
  );
};

export const Presenter3D: React.FC<{ width: number; height: number; from: Pose; to: Pose; t: number; talk: number; frame: number }> = ({ width, height, ...p }) => (
  <ThreeCanvas width={width} height={height} camera={{ fov: 32, position: [0, 0.1, 6.4], near: 0.1, far: 50 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} style={{ background: "transparent" }}>
    <hemisphereLight args={["#fff8ec", HI.green, 0.9]} />
    <directionalLight position={[-3, 4, 5]} intensity={2.0} color="#fff3e0" />
    <directionalLight position={[4, 2, -3]} intensity={1.4} color={HI.gold} />
    <ambientLight intensity={0.35} />
    <group position={[0.18, -0.02, 0]} scale={0.8}>
      <Character {...p} />
    </group>
  </ThreeCanvas>
);

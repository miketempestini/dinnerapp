import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

const PALETTE = ['#fb923c', '#22c55e', '#3b82f6', '#f43f5e', '#a855f7', '#eab308', '#14b8a6', '#ec4899'];

type Props = {
  options: string[];
  onLanded: (index: number) => void;
  spinSignal: number; // bumped by parent to trigger a spin
  targetIndex?: number; // when set, land on this specific index instead of random
};

export default function Wheel({ options, onLanded, spinSignal, targetIndex }: Props) {
  const size = 360;
  const radius = size / 2;
  const rot = useMotionValue(0);
  const [confetti, setConfetti] = useState(0);
  const [highlight, setHighlight] = useState<number | null>(null);

  useEffect(() => {
    // Only spin when the user explicitly clicks — spinSignal 0 means "not yet clicked"
    if (spinSignal === 0) return;
    if (options.length === 0) return;

    const winner = targetIndex !== undefined ? targetIndex : Math.floor(Math.random() * options.length);
    const sliceDeg = 360 / options.length;
    const targetMid = winner * sliceDeg + sliceDeg / 2;
    const extraRotations = 4 + Math.floor(Math.random() * 3);

    // Account for accumulated rotation from prior spins so the wheel always
    // lands at exactly the right slice, not just on the first spin.
    const current = rot.get();
    const currentMod = ((current % 360) + 360) % 360;
    const rawTarget = ((360 - targetMid - currentMod) % 360 + 360) % 360;
    const targetAngle = rawTarget + 360 * extraRotations;
    const dest = current + targetAngle;

    const controls = animate(rot, dest, {
      duration: 4.2,
      ease: [0.17, 0.67, 0.24, 1],
      onComplete: () => {
        setHighlight(winner);
        setConfetti((c) => c + 1);
        onLanded(winner);
      },
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinSignal]);

  const n = Math.max(options.length, 1);
  const sliceDeg = 360 / n;

  const buildSlicePath = (i: number) => {
    const a0 = (i * sliceDeg * Math.PI) / 180;
    const a1 = ((i + 1) * sliceDeg * Math.PI) / 180;
    const x0 = radius + radius * Math.sin(a0);
    const y0 = radius - radius * Math.cos(a0);
    const x1 = radius + radius * Math.sin(a1);
    const y1 = radius - radius * Math.cos(a1);
    const largeArc = sliceDeg > 180 ? 1 : 0;
    return `M ${radius} ${radius} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1} Z`;
  };

  const fontSize = options.length <= 5 ? 13 : options.length <= 10 ? 11 : 9;
  const maxChars = options.length <= 5 ? 20 : options.length <= 10 ? 13 : 9;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* pointer */}
      <div
        aria-hidden
        className="absolute left-1/2 -top-2 -translate-x-1/2 z-10"
        style={{
          width: 0,
          height: 0,
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderTop: '22px solid #ef4444',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))',
        }}
      />
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ rotate: rot }}
        className="drop-shadow-lg"
      >
        <defs>
          {options.map((_, i) => (
            <clipPath key={i} id={`wheel-clip-${i}`}>
              <path d={buildSlicePath(i)} />
            </clipPath>
          ))}
        </defs>

        {options.length === 0 ? (
          <circle cx={radius} cy={radius} r={radius} fill="#e5e7eb" />
        ) : (
          options.map((label, i) => {
            const mid = i * sliceDeg + sliceDeg / 2;
            const labelRadius = radius * 0.68;
            const x = radius + labelRadius * Math.sin((mid * Math.PI) / 180);
            const y = radius - labelRadius * Math.cos((mid * Math.PI) / 180);
            // Radial orientation: text reads from outer rim inward, always upright.
            // Right half: rotate(mid-90) — at mid=90 that's 0° (horizontal).
            // Left half: rotate(mid+90) — flips 180° so text stays right-reading.
            const radialRotation = mid < 180 ? mid - 90 : mid + 90;
            return (
              <g key={i} clipPath={`url(#wheel-clip-${i})`}>
                <path
                  d={buildSlicePath(i)}
                  fill={PALETTE[i % PALETTE.length]}
                  stroke="white"
                  strokeWidth={2}
                  opacity={highlight === null || highlight === i ? 1 : 0.55}
                />
                <text
                  x={x}
                  y={y}
                  fill="white"
                  fontSize={fontSize}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${radialRotation} ${x} ${y})`}
                  style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}
                >
                  {truncate(label, maxChars)}
                </text>
              </g>
            );
          })
        )}
        <circle cx={radius} cy={radius} r={24} fill="#fff" stroke="#fb923c" strokeWidth={4} />
      </motion.svg>
      {confetti > 0 && <Confetti key={confetti} />}
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((i) => {
        const color = PALETTE[i % PALETTE.length];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const dur = 1.2 + Math.random() * 0.8;
        const size = 6 + Math.random() * 6;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-10px',
              width: size,
              height: size,
              background: color,
              borderRadius: 2,
              animation: `dw-fall ${dur}s ${delay}s ease-in forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes dw-fall {
          to { transform: translateY(360px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

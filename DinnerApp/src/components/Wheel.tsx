import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const PALETTE = ['#fb923c', '#22c55e', '#3b82f6', '#f43f5e', '#a855f7', '#eab308', '#14b8a6', '#ec4899'];

type Props = {
  options: string[];
  onLanded: (index: number) => void;
  spinSignal: number; // bumped by parent to trigger a spin
};

export default function Wheel({ options, onLanded, spinSignal }: Props) {
  const size = 320;
  const radius = size / 2;
  const n = Math.max(options.length, 1);
  const rot = useMotionValue(0);
  const [confetti, setConfetti] = useState(0);
  const [highlight, setHighlight] = useState<number | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (options.length === 0) return;
    const winner = Math.floor(Math.random() * options.length);
    const sliceDeg = 360 / options.length;
    const targetMid = winner * sliceDeg + sliceDeg / 2;
    const extraRotations = 4 + Math.floor(Math.random() * 3); // 4-6
    const current = rot.get();
    // The pointer is at the top (0deg). We want the midpoint of the winner slice to end at 0.
    // Slices are drawn starting from angle 0 going clockwise.
    const targetAngle = 360 * extraRotations + (360 - targetMid);
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

  // Build slices
  const slices = options.length === 0 ? [{ path: '', fill: '#e5e7eb', label: '' }] : options.map((label, i) => {
    const sliceDeg = 360 / options.length;
    const a0 = (i * sliceDeg * Math.PI) / 180;
    const a1 = ((i + 1) * sliceDeg * Math.PI) / 180;
    const x0 = radius + radius * Math.sin(a0);
    const y0 = radius - radius * Math.cos(a0);
    const x1 = radius + radius * Math.sin(a1);
    const y1 = radius - radius * Math.cos(a1);
    const largeArc = sliceDeg > 180 ? 1 : 0;
    const path = `M ${radius} ${radius} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1} Z`;
    return { path, fill: PALETTE[i % PALETTE.length], label };
  });

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
        {slices.map((s, i) => {
          const sliceDeg = 360 / Math.max(options.length, 1);
          const mid = i * sliceDeg + sliceDeg / 2;
          const labelRadius = radius * 0.62;
          const x = radius + labelRadius * Math.sin((mid * Math.PI) / 180);
          const y = radius - labelRadius * Math.cos((mid * Math.PI) / 180);
          return (
            <g key={i}>
              <path
                d={s.path}
                fill={s.fill}
                stroke="white"
                strokeWidth={2}
                opacity={highlight === null || highlight === i ? 1 : 0.55}
              />
              {options.length > 0 && (
                <text
                  x={x}
                  y={y}
                  fill="white"
                  fontSize={Math.max(10, 18 - options.length * 0.6)}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid} ${x} ${y})`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
                >
                  {truncate(s.label, options.length)}
                </text>
              )}
            </g>
          );
        })}
        <circle cx={radius} cy={radius} r={24} fill="#fff" stroke="#fb923c" strokeWidth={4} />
      </motion.svg>
      {confetti > 0 && <Confetti key={confetti} />}
    </div>
  );
}

function truncate(s: string, count: number): string {
  const max = count <= 4 ? 22 : count <= 8 ? 14 : 10;
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

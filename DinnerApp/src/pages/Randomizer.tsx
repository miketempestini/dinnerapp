import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Wheel from '../components/Wheel';
import { useStore } from '../store/useStore';
import { DAY_KEYS, DAY_LABELS, type Assignment, type DayKey } from '../types';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

type Mode = 'meals' | 'restaurants' | 'both';

type Option = { label: string; assign: Assignment };

export default function Randomizer() {
  const navigate = useNavigate();
  const meals = useStore((s) => s.meals);
  const restaurants = useStore((s) => s.restaurants);
  const week = useStore((s) => s.week);
  const assignDay = useStore((s) => s.assignDay);

  const [mode, setMode] = useState<Mode>('both');
  const [spinSignal, setSpinSignal] = useState(0);
  const [winner, setWinner] = useState<Option | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [pendingDay, setPendingDay] = useState<DayKey | null>(null);

  const options = useMemo<Option[]>(() => {
    const list: Option[] = [];
    if (mode !== 'restaurants') {
      meals.forEach((m) =>
        list.push({ label: m.name, assign: { kind: 'meal', mealId: m.id } }),
      );
    }
    if (mode !== 'meals') {
      restaurants.forEach((r) =>
        list.push({ label: r.name, assign: { kind: 'restaurant', restaurantId: r.id } }),
      );
    }
    return list;
  }, [mode, meals, restaurants]);

  if (meals.length === 0 && restaurants.length === 0) {
    return (
      <EmptyState
        emoji="🎡"
        title="The wheel needs some options"
        body="Add a few meals or restaurants to your favorites to spin."
        action={
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-soft"
          >
            Go to Favorites
          </button>
        }
      />
    );
  }

  const disabled = options.length === 0 || spinning;

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">What's for dinner?</h2>

      <div className="flex flex-wrap gap-2">
        {([
          { id: 'meals', label: '🍽️ Home Meals', color: 'bg-orange-500' },
          { id: 'restaurants', label: '🥡 Takeout', color: 'bg-blue-500' },
          { id: 'both', label: '🎲 Both', color: 'bg-green-500' },
        ] as { id: Mode; label: string; color: string }[]).map((b) => (
          <button
            key={b.id}
            onClick={() => {
              setMode(b.id);
              setWinner(null);
            }}
            className={[
              'px-4 py-2 rounded-full text-sm font-bold text-white shadow-soft transition',
              mode === b.id ? `${b.color} scale-105` : 'bg-slate-300 hover:bg-slate-400',
            ].join(' ')}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6 py-4">
        <Wheel
          options={options.map((o) => o.label)}
          spinSignal={spinSignal}
          onLanded={(i) => {
            setWinner(options[i] ?? null);
            setSpinning(false);
          }}
        />

        {options.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No options in this mode yet.</p>
        ) : winner && !spinning ? (
          <div className="text-center bg-white rounded-2xl shadow-soft border border-green-100 px-6 py-4">
            <p className="text-xs uppercase tracking-wide text-green-600 font-bold">Winner!</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{winner.label}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  setWinner(null);
                  setSpinning(true);
                  setSpinSignal((s) => s + 1);
                }}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-soft"
              >
                🔄 Spin Again
              </button>
              <AddToDaySelect
                onChoose={(d) => {
                  const a = week[d].assignment;
                  if (a) setPendingDay(d);
                  else {
                    assignDay(d, winner.assign);
                    setWinner(null);
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <button
            disabled={disabled}
            onClick={() => {
              setWinner(null);
              setSpinning(true);
              setSpinSignal((s) => s + 1);
            }}
            className="px-8 py-3 rounded-full text-lg font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-pop disabled:opacity-50"
          >
            🎯 SPIN
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDay}
        title={`Replace ${pendingDay ? DAY_LABELS[pendingDay] : ''}'s dinner?`}
        body="That day already has a meal assigned."
        confirmLabel="Replace"
        onCancel={() => setPendingDay(null)}
        onConfirm={() => {
          if (pendingDay && winner) assignDay(pendingDay, winner.assign);
          setPendingDay(null);
          setWinner(null);
        }}
      />
    </section>
  );
}

function AddToDaySelect({ onChoose }: { onChoose: (d: DayKey) => void }) {
  return (
    <div className="relative">
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            onChoose(e.target.value as DayKey);
            e.target.value = '';
          }
        }}
        className="appearance-none px-4 py-2 pr-8 rounded-full text-sm font-semibold bg-green-500 hover:bg-green-600 text-white shadow-soft cursor-pointer"
      >
        <option value="" disabled>
          ➕ Add to day…
        </option>
        {DAY_KEYS.map((d) => (
          <option key={d} value={d}>
            {DAY_LABELS[d]}
          </option>
        ))}
      </select>
    </div>
  );
}

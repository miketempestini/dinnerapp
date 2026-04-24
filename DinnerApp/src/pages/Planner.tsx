import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  DAY_KEYS,
  DAY_LABELS,
  type Assignment,
  type DayKey,
} from '../types';
import { dayIndex, deriveLeftoverTiles } from '../lib/leftovers';
import { hasAnyCookedAssignment } from '../lib/shoppingList';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';

type DragId =
  | { kind: 'meal'; mealId: string }
  | { kind: 'leftover'; sourceMealId: string }
  | { kind: 'restaurant'; restaurantId: string };

const encodeDragId = (d: DragId): string => {
  if (d.kind === 'meal') return `meal:${d.mealId}`;
  if (d.kind === 'restaurant') return `rest:${d.restaurantId}`;
  return `leftover:${d.sourceMealId}`;
};
const decodeDragId = (id: string): DragId | null => {
  const [kind, val] = id.split(':');
  if (kind === 'meal') return { kind: 'meal', mealId: val };
  if (kind === 'rest') return { kind: 'restaurant', restaurantId: val };
  if (kind === 'leftover') return { kind: 'leftover', sourceMealId: val };
  return null;
};

export default function Planner() {
  const navigate = useNavigate();
  const meals = useStore((s) => s.meals);
  const restaurants = useStore((s) => s.restaurants);
  const week = useStore((s) => s.week);
  const assignDay = useStore((s) => s.assignDay);
  const clearWeek = useStore((s) => s.clearWeek);

  const [activeDrag, setActiveDrag] = useState<DragId | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleQuickAdd = (dragId: DragId) => {
    let eligibleDays = DAY_KEYS.filter((d) => !week[d].skipped && !week[d].assignment);

    if (dragId.kind === 'leftover') {
      const sourceDay = DAY_KEYS.find((d) => {
        const a = week[d].assignment;
        return a?.kind === 'meal' && a.mealId === dragId.sourceMealId;
      });
      if (sourceDay) {
        eligibleDays = eligibleDays.filter((d) => dayIndex(d) > dayIndex(sourceDay));
      }
    }

    if (eligibleDays.length === 0) return;

    const assignment: Assignment =
      dragId.kind === 'meal'
        ? { kind: 'meal', mealId: dragId.mealId }
        : dragId.kind === 'restaurant'
        ? { kind: 'restaurant', restaurantId: dragId.restaurantId }
        : { kind: 'leftover', sourceMealId: dragId.sourceMealId };

    assignDay(eligibleDays[0], assignment);
  };

  const handlePlanForMe = () => {
    if (meals.length === 0) return;

    // Collect days that are empty and not skipped
    const emptyDays = DAY_KEYS.filter((d) => !week[d].skipped && !week[d].assignment);
    if (emptyDays.length === 0) return;

    // Fisher-Yates shuffle for a fair random order
    const shuffled = [...meals];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign meals, repeating the shuffled list if there are more empty days than meals
    emptyDays.forEach((day, i) => {
      const meal = shuffled[i % shuffled.length];
      assignDay(day, { kind: 'meal', mealId: meal.id });
    });
  };

  const assignedCount = DAY_KEYS.filter((d) => week[d].assignment !== null && !week[d].skipped).length;
  const canExport = assignedCount > 4;

  const buildExportText = () => {
    const byId = new Map([...meals.map((m) => [m.id, m.name] as const), ...restaurants.map((r) => [r.id, r.name] as const)]);
    const lines = ['🍽️ This Week\'s Dinner Plan', ''];
    DAY_KEYS.forEach((d) => {
      const plan = week[d];
      if (plan.skipped) {
        lines.push(`${DAY_LABELS[d]}: Skipped`);
      } else if (!plan.assignment) {
        lines.push(`${DAY_LABELS[d]}: —`);
      } else {
        const a = plan.assignment;
        let label = '';
        if (a.kind === 'meal') label = byId.get(a.mealId) ?? 'Unknown';
        else if (a.kind === 'restaurant') label = `${byId.get(a.restaurantId) ?? 'Unknown'} (Takeout)`;
        else label = `Leftovers – ${byId.get(a.sourceMealId) ?? 'Unknown'}`;
        lines.push(`${DAY_LABELS[d]}: ${label}`);
      }
      if (plan.note.trim()) lines.push(`  📝 ${plan.note.trim()}`);
    });
    return lines.join('\n');
  };

  const handleExport = async () => {
    await navigator.clipboard.writeText(buildExportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const leftoverTiles = useMemo(() => deriveLeftoverTiles(week, meals), [week, meals]);
  const canGenerateList = hasAnyCookedAssignment(week);

  const onDragStart = (e: DragStartEvent) => {
    const dragId = decodeDragId(String(e.active.id));
    if (dragId) setActiveDrag(dragId);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    if (!e.over) return;
    const dragId = decodeDragId(String(e.active.id));
    const dayKey = String(e.over.id) as DayKey;
    if (!dragId || !DAY_KEYS.includes(dayKey)) return;

    if (dragId.kind === 'leftover') {
      // Only allow on days strictly after the source day
      const sourceDay = DAY_KEYS.find((d) => {
        const a = week[d].assignment;
        return a?.kind === 'meal' && a.mealId === dragId.sourceMealId;
      });
      if (sourceDay && dayIndex(dayKey) <= dayIndex(sourceDay)) return;
    }

    const assignment: Assignment =
      dragId.kind === 'meal'
        ? { kind: 'meal', mealId: dragId.mealId }
        : dragId.kind === 'restaurant'
        ? { kind: 'restaurant', restaurantId: dragId.restaurantId }
        : { kind: 'leftover', sourceMealId: dragId.sourceMealId };
    assignDay(dayKey, assignment);
  };

  if (meals.length === 0 && restaurants.length === 0) {
    return (
      <EmptyState
        emoji="📅"
        title="Add some favorites first"
        body="The planner needs at least one meal or restaurant before you can drag anything into a day."
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

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-slate-800 mr-auto">This Week</h2>
        <button
          onClick={() => setConfirmClear(true)}
          className="px-4 py-2 rounded-full text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-50 shadow-soft"
        >
          Clear Week
        </button>
        <button
          disabled={meals.length === 0}
          onClick={handlePlanForMe}
          title={meals.length === 0 ? 'Add meals to Favorites first' : 'Randomly fill empty days with your saved meals'}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-purple-500 hover:bg-purple-600 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🎲 Plan for me
        </button>
        {canExport && (
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 shadow-soft"
          >
            {copied ? '✓ Copied!' : '📤 Export'}
          </button>
        )}
        <button
          disabled={!canGenerateList}
          onClick={() => navigate('/shopping')}
          className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-green-500 hover:bg-green-600 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🛒 Generate Grocery List
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="bg-white rounded-2xl shadow-soft border border-orange-100 p-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] overflow-y-auto">
            <p className="text-xs text-slate-400 mb-3">Drag to a day, or double-tap to add to the next open day.</p>

            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Meals</h3>
            <ul className="mt-2 space-y-2">
              {meals.map((m) => (
                <DraggablePill
                  key={m.id}
                  id={encodeDragId({ kind: 'meal', mealId: m.id })}
                  color="orange"
                  onDoubleClick={() => handleQuickAdd({ kind: 'meal', mealId: m.id })}
                >
                  🍽️ {m.name}
                </DraggablePill>
              ))}
              {meals.length === 0 && (
                <li className="text-xs text-slate-400 italic">No meals yet.</li>
              )}
            </ul>

            {leftoverTiles.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Leftovers
                </h3>
                <ul className="mt-2 space-y-2">
                  {leftoverTiles.map((t) => (
                    <DraggablePill
                      key={t.id}
                      id={encodeDragId({ kind: 'leftover', sourceMealId: t.sourceMealId })}
                      color="amber"
                      onDoubleClick={() => handleQuickAdd({ kind: 'leftover', sourceMealId: t.sourceMealId })}
                    >
                      ♻️ Leftovers – {t.mealName}
                    </DraggablePill>
                  ))}
                </ul>
              </>
            )}

            <h3 className="mt-5 text-sm font-bold text-slate-700 uppercase tracking-wide">
              Restaurants
            </h3>
            <ul className="mt-2 space-y-2">
              {restaurants.map((r) => (
                <DraggablePill
                  key={r.id}
                  id={encodeDragId({ kind: 'restaurant', restaurantId: r.id })}
                  color="blue"
                  onDoubleClick={() => handleQuickAdd({ kind: 'restaurant', restaurantId: r.id })}
                >
                  🥡 {r.name}
                </DraggablePill>
              ))}
              {restaurants.length === 0 && (
                <li className="text-xs text-slate-400 italic">No restaurants yet.</li>
              )}
            </ul>
          </aside>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {DAY_KEYS.map((d) => (
              <DayCard key={d} day={d} activeDrag={activeDrag} />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeDrag ? (
            <div className="px-3 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold shadow-pop">
              {activeDrag.kind === 'meal' && '🍽️ '}
              {activeDrag.kind === 'leftover' && '♻️ '}
              {activeDrag.kind === 'restaurant' && '🥡 '}
              Dragging…
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        open={confirmClear}
        title="Clear entire week?"
        body="This wipes every day (assignments, notes, skip marks). Your favorites are not affected."
        confirmLabel="Clear week"
        danger
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearWeek();
          setConfirmClear(false);
        }}
      />
    </section>
  );
}

function DraggablePill({
  id,
  color,
  children,
  onDoubleClick,
}: {
  id: string;
  color: 'orange' | 'blue' | 'amber';
  children: React.ReactNode;
  onDoubleClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  const palette =
    color === 'orange'
      ? 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100 active:bg-orange-200'
      : color === 'blue'
      ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100 active:bg-blue-200'
      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 active:bg-amber-200';
  return (
    <li>
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onDoubleClick={onDoubleClick}
        title="Double-tap to add to next open day"
        className={[
          'w-full text-left text-sm font-medium border rounded-xl px-3 py-2 shadow-soft transition touch-none select-none',
          palette,
          isDragging ? 'opacity-40' : '',
        ].join(' ')}
      >
        {children}
      </button>
    </li>
  );
}

function DayCard({ day, activeDrag }: { day: DayKey; activeDrag: DragId | null }) {
  const week = useStore((s) => s.week);
  const meals = useStore((s) => s.meals);
  const restaurants = useStore((s) => s.restaurants);
  const assignDay = useStore((s) => s.assignDay);
  const setNote = useStore((s) => s.setNote);
  const setSkipped = useStore((s) => s.setSkipped);

  const plan = week[day];
  const idx = dayIndex(day);

  // Determine if this day is a valid drop target for the current drag
  let blocked = false;
  if (activeDrag?.kind === 'leftover') {
    const sourceDay = DAY_KEYS.find((d) => {
      const a = week[d].assignment;
      return a?.kind === 'meal' && a.mealId === activeDrag.sourceMealId;
    });
    if (sourceDay && dayIndex(sourceDay) >= idx) blocked = true;
  }

  const { isOver, setNodeRef } = useDroppable({ id: day, disabled: plan.skipped || blocked });

  const label = (() => {
    const a = plan.assignment;
    if (!a) return null;
    if (a.kind === 'meal') {
      const m = meals.find((x) => x.id === a.mealId);
      return m ? `🍽️ ${m.name}` : null;
    }
    if (a.kind === 'leftover') {
      const m = meals.find((x) => x.id === a.sourceMealId);
      return m ? `♻️ Leftovers – ${m.name}` : null;
    }
    const r = restaurants.find((x) => x.id === a.restaurantId);
    return r ? `🥡 ${r.name}` : null;
  })();

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-2xl border shadow-soft p-3 flex flex-col min-h-[180px] transition',
        plan.skipped ? 'bg-slate-100 border-slate-200 opacity-70' : 'bg-white border-orange-100',
        isOver && !blocked ? 'ring-2 ring-orange-400 bg-orange-50/50' : '',
        blocked && activeDrag ? 'opacity-50' : '',
      ].join(' ')}
      aria-label={`${DAY_LABELS[day]} slot`}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800">{DAY_LABELS[day]}</h4>
        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            checked={plan.skipped}
            onChange={(e) => setSkipped(day, e.target.checked)}
          />
          Skip
        </label>
      </div>

      <div className="mt-2 flex-1">
        {plan.skipped ? (
          <p className="text-sm text-slate-500 italic">Skipped</p>
        ) : label ? (
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm font-semibold text-slate-800 break-words">{label}</p>
            <button
              aria-label="Remove meal"
              onClick={() => assignDay(day, null)}
              className="text-rose-500 hover:text-rose-700"
              title="Remove"
            >
              🗑
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">Drop a meal here</p>
        )}
      </div>

      <label className="block mt-2">
        <span className="sr-only">Note for {DAY_LABELS[day]}</span>
        <textarea
          value={plan.note}
          onChange={(e) => setNote(day, e.target.value)}
          placeholder="Note (optional)"
          rows={2}
          className="w-full text-xs rounded-lg border border-slate-200 px-2 py-1 bg-slate-50/50 resize-none"
        />
      </label>
    </div>
  );
}

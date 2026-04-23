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
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Meals</h3>
            <ul className="mt-2 space-y-2">
              {meals.map((m) => (
                <DraggablePill key={m.id} id={encodeDragId({ kind: 'meal', mealId: m.id })} color="orange">
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
}: {
  id: string;
  color: 'orange' | 'blue' | 'amber';
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  const palette =
    color === 'orange'
      ? 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100'
      : color === 'blue'
      ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100';
  return (
    <li>
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={[
          'w-full text-left text-sm font-medium border rounded-xl px-3 py-2 shadow-soft transition touch-none',
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

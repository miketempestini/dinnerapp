import { useMemo, useRef, useState } from 'react';
import { CATEGORIES, type Category, type Ingredient, type Meal, type Restaurant } from '../types';
import { useStore } from '../store/useStore';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportBackup, readBackup } from '../lib/backup';

type Tab = 'meals' | 'restaurants';

export default function Favorites() {
  const [tab, setTab] = useState<Tab>('meals');
  const meals = useStore((s) => s.meals);
  const restaurants = useStore((s) => s.restaurants);

  const showOnboarding = meals.length === 0 && restaurants.length === 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-slate-800 mr-auto">Favorites</h2>
        <BackupButtons />
      </div>

      {showOnboarding ? (
        <Onboarding onAddMeal={() => setTab('meals')} onAddRestaurant={() => setTab('restaurants')} />
      ) : null}

      <div className="inline-flex rounded-full bg-white border border-orange-100 shadow-soft p-1" role="tablist">
        {(['meals', 'restaurants'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 rounded-full text-sm font-semibold capitalize transition',
              tab === t ? 'bg-green-500 text-white' : 'text-slate-600 hover:bg-green-50',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'meals' ? <MealsSection /> : <RestaurantsSection />}
    </section>
  );
}

function Onboarding({ onAddMeal, onAddRestaurant }: { onAddMeal: () => void; onAddRestaurant: () => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <EmptyState
        emoji="🥘"
        title="Add your first meal"
        body="Start with home-cooked favorites. Just a name is required; ingredients are optional."
        action={
          <button
            onClick={onAddMeal}
            className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-soft"
          >
            + New meal
          </button>
        }
      />
      <EmptyState
        emoji="🥡"
        title="Add your first restaurant"
        body="Save your go-to takeout spots with tags (Pizza, Mexican, etc.)."
        action={
          <button
            onClick={onAddRestaurant}
            className="px-5 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-soft"
          >
            + New restaurant
          </button>
        }
      />
    </div>
  );
}

/* ---------- Meals ---------- */

function MealsSection() {
  const meals = useStore((s) => s.meals);
  const addMeal = useStore((s) => s.addMeal);
  const updateMeal = useStore((s) => s.updateMeal);
  const deleteMeal = useStore((s) => s.deleteMeal);

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Meal | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Meal | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter((m) => m.name.toLowerCase().includes(q));
  }, [meals, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search meals…"
          aria-label="Search meals"
          className="flex-1 min-w-[180px] rounded-full bg-white border border-orange-100 px-4 py-2 text-sm shadow-soft"
        />
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-soft"
        >
          + New meal
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No meals match that search.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((m) => (
            <li key={m.id} className="bg-white rounded-2xl shadow-soft border border-orange-100 p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{m.name}</h3>
                  {m.ingredients.length > 0 ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {m.ingredients.length} ingredient{m.ingredients.length !== 1 ? 's' : ''}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400 italic">No ingredients listed</p>
                  )}
                </div>
                <button
                  onClick={() => setEditing(m)}
                  className="px-3 py-1 rounded-full text-xs font-semibold text-blue-600 hover:bg-blue-50"
                  aria-label={`Edit ${m.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setToDelete(m)}
                  className="px-3 py-1 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  aria-label={`Delete ${m.name}`}
                >
                  Delete
                </button>
              </div>
              {m.ingredients.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {m.ingredients.map((ing, i) => (
                    <li
                      key={i}
                      className="text-xs bg-green-50 text-green-800 rounded-full px-2 py-0.5"
                    >
                      {ing.name}
                      {ing.qty ? ` · ${ing.qty}${ing.unit ? ` ${ing.unit}` : ''}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <MealEditor
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(name, ings) => {
            if (editing) updateMeal(editing.id, { name, ingredients: ings });
            else addMeal(name, ings);
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete "${toDelete?.name}"?`}
        body="This will remove the meal and clear it from any scheduled days."
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteMeal(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

function MealEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: Meal;
  onSave: (name: string, ingredients: Ingredient[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [rows, setRows] = useState<Ingredient[]>(
    initial?.ingredients.length ? initial.ingredients : [],
  );

  const addRow = () =>
    setRows((r) => [...r, { name: '', qty: '', unit: '', category: 'Other' as Category }]);
  const updateRow = (i: number, patch: Partial<Ingredient>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const canSave = name.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-pop w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-800">{initial ? 'Edit meal' : 'New meal'}</h3>

        <label className="block mt-4">
          <span className="text-sm font-semibold text-slate-700">Meal name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Frozen Pepperoni Pizza"
            className="mt-1 w-full rounded-xl border border-orange-200 px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Ingredients (optional)</span>
            <button
              onClick={addRow}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              + Add ingredient
            </button>
          </div>

          {rows.length === 0 && (
            <p className="text-xs text-slate-400 italic">
              No ingredients yet. Add them to power the shopping list.
            </p>
          )}

          <ul className="space-y-2">
            {rows.map((row, i) => (
              <li key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  aria-label="Ingredient name"
                  placeholder="Name"
                  value={row.name}
                  onChange={(e) => updateRow(i, { name: e.target.value })}
                  className="col-span-4 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <input
                  aria-label="Quantity"
                  placeholder="Qty"
                  value={row.qty ?? ''}
                  onChange={(e) => updateRow(i, { qty: e.target.value })}
                  className="col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <input
                  aria-label="Unit"
                  placeholder="Unit"
                  value={row.unit ?? ''}
                  onChange={(e) => updateRow(i, { unit: e.target.value })}
                  className="col-span-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
                <select
                  aria-label="Category"
                  value={row.category}
                  onChange={(e) => updateRow(i, { category: e.target.value as Category })}
                  className="col-span-3 rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeRow(i)}
                  aria-label="Remove ingredient"
                  className="col-span-1 text-rose-500 hover:text-rose-700 text-lg leading-none"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            disabled={!canSave}
            onClick={() => {
              const cleaned = rows
                .filter((r) => r.name.trim())
                .map<Ingredient>((r) => ({
                  name: r.name.trim(),
                  qty: r.qty?.trim() || undefined,
                  unit: r.unit?.trim() || undefined,
                  category: r.category,
                }));
              onSave(name.trim(), cleaned);
              onClose();
            }}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 shadow-soft disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Restaurants ---------- */

function RestaurantsSection() {
  const restaurants = useStore((s) => s.restaurants);
  const addRestaurant = useStore((s) => s.addRestaurant);
  const updateRestaurant = useStore((s) => s.updateRestaurant);
  const deleteRestaurant = useStore((s) => s.deleteRestaurant);

  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [toDelete, setToDelete] = useState<Restaurant | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [restaurants, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants or tags…"
          aria-label="Search restaurants"
          className="flex-1 min-w-[180px] rounded-full bg-white border border-blue-100 px-4 py-2 text-sm shadow-soft"
        />
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-soft"
        >
          + New restaurant
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No restaurants match that search.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((r) => (
            <li key={r.id} className="bg-white rounded-2xl shadow-soft border border-blue-100 p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{r.name}</h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <li key={t} className="text-xs bg-blue-50 text-blue-800 rounded-full px-2 py-0.5">
                        {t}
                      </li>
                    ))}
                    {r.tags.length === 0 && (
                      <li className="text-xs text-slate-400 italic">No tags</li>
                    )}
                  </ul>
                </div>
                <button
                  onClick={() => setEditing(r)}
                  className="px-3 py-1 rounded-full text-xs font-semibold text-blue-600 hover:bg-blue-50"
                  aria-label={`Edit ${r.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setToDelete(r)}
                  className="px-3 py-1 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  aria-label={`Delete ${r.name}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <RestaurantEditor
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(name, tags) => {
            if (editing) updateRestaurant(editing.id, { name, tags });
            else addRestaurant(name, tags);
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete "${toDelete?.name}"?`}
        body="This will remove the restaurant and clear it from any scheduled days."
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteRestaurant(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

function RestaurantEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: Restaurant;
  onSave: (name: string, tags: string[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '');
  const canSave = name.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-pop w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-800">
          {initial ? 'Edit restaurant' : 'New restaurant'}
        </h3>
        <label className="block mt-4">
          <span className="text-sm font-semibold text-slate-700">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2 text-sm"
            placeholder="e.g. Luigi's Pizzeria"
          />
        </label>
        <label className="block mt-4">
          <span className="text-sm font-semibold text-slate-700">Tags (comma-separated)</span>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2 text-sm"
            placeholder="Pizza, Italian"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            disabled={!canSave}
            onClick={() => {
              const tags = tagsText
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
              onSave(name.trim(), tags);
              onClose();
            }}
            className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 shadow-soft disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Backup / Restore ---------- */

function BackupButtons() {
  const state = useStore((s) => ({ meals: s.meals, restaurants: s.restaurants, week: s.week }));
  const replaceAll = useStore((s) => s.replaceAll);
  const [pending, setPending] = useState<{ meals: any; restaurants: any; week: any } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportBackup(state)}
        className="px-3 py-2 rounded-full text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-50 shadow-soft"
      >
        ⬇︎ Backup
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="px-3 py-2 rounded-full text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-50 shadow-soft"
      >
        ⬆︎ Restore
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const b = await readBackup(f);
            setPending({ meals: b.meals, restaurants: b.restaurants, week: b.week });
          } catch (err: any) {
            alert(`Restore failed: ${err.message}`);
          } finally {
            if (fileRef.current) fileRef.current.value = '';
          }
        }}
      />
      <ConfirmDialog
        open={!!pending}
        title="Replace all data with backup?"
        body="Your current meals, restaurants, and week will be overwritten. This cannot be undone."
        confirmLabel="Replace"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) replaceAll(pending as any);
          setPending(null);
        }}
      />
    </div>
  );
}

import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CATEGORIES } from '../types';
import {
  buildShoppingList,
  buildWeekPlan,
  customItemsToText,
  gatherSides,
  hasAnyCookedAssignment,
  shoppingListToText,
  sidesToText,
  weekPlanToText,
} from '../lib/shoppingList';
import EmptyState from '../components/EmptyState';

export default function ShoppingList() {
  const navigate = useNavigate();
  const meals = useStore((s) => s.meals);
  const restaurants = useStore((s) => s.restaurants);
  const sides = useStore((s) => s.sides);
  const week = useStore((s) => s.week);
  const customItems = useStore((s) => s.customItems);
  const addCustomItem = useStore((s) => s.addCustomItem);
  const removeCustomItem = useStore((s) => s.removeCustomItem);

  const [copied, setCopied] = useState(false);
  const [newItem, setNewItem] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const grouped = useMemo(() => buildShoppingList(week, meals), [week, meals]);
  const weekPlan = useMemo(() => buildWeekPlan(week, meals, restaurants), [week, meals, restaurants]);
  const sideNames = useMemo(() => gatherSides(week, sides), [week, sides]);
  const totalItems = CATEGORIES.reduce((t, c) => t + grouped[c].length, 0);

  if (!hasAnyCookedAssignment(week)) {
    return (
      <EmptyState
        emoji="🛒"
        title="Nothing to shop for yet"
        body="Assign at least one home-cooked meal to a day, then come back."
        action={
          <button
            onClick={() => navigate('/planner')}
            className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-soft"
          >
            Go to Planner
          </button>
        }
      />
    );
  }

  if (totalItems === 0) {
    return (
      <EmptyState
        emoji="📝"
        title="No ingredients listed"
        body="Your scheduled meals don't have ingredients yet. Add them on the Favorites page to build a shopping list."
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
        <h2 className="text-2xl font-bold text-slate-800 mr-auto">Shopping List</h2>
        <button
          onClick={async () => {
            const text = weekPlanToText(weekPlan) + '\n\n\n🛒  Grocery List\n' + '─'.repeat(30) + '\n' + shoppingListToText(grouped) + sidesToText(sideNames) + customItemsToText(customItems);
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="px-4 py-2 rounded-full text-sm font-semibold bg-green-500 hover:bg-green-600 text-white shadow-soft"
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
        <button
          onClick={() => window.open('/print', '_blank', 'noopener')}
          className="px-4 py-2 rounded-full text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-50 shadow-soft"
        >
          🖨 Print
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const items = grouped[cat];
          if (items.length === 0) return null;
          return (
            <details
              key={cat}
              open
              className="group bg-white rounded-2xl shadow-soft border border-orange-100 p-4"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between">
                <h3 className="font-bold text-slate-800">{cat}</h3>
                <span className="text-xs text-slate-500">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </summary>
              <ul className="mt-3 space-y-1.5">
                {items.map((i, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span aria-hidden className="text-green-500">•</span>
                    <span className="flex-1">
                      {i.name}
                      {i.qtyDisplay && (
                        <span className="text-slate-500"> — {i.qtyDisplay}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>

      {/* Sides */}
      {sideNames.length > 0 && (
        <details open className="bg-white rounded-2xl shadow-soft border border-teal-100 p-4">
          <summary className="cursor-pointer list-none flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Sides</h3>
            <span className="text-xs text-slate-500">
              {sideNames.length} item{sideNames.length !== 1 ? 's' : ''}
            </span>
          </summary>
          <ul className="mt-3 space-y-1.5">
            {sideNames.map((name, idx) => (
              <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                <span aria-hidden className="text-teal-500">•</span>
                <span className="flex-1">{name}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Custom "Other" items */}
      <details open className="bg-white rounded-2xl shadow-soft border border-blue-100 p-4">
        <summary className="cursor-pointer list-none flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Other</h3>
          <span className="text-xs text-slate-500">
            {customItems.length} item{customItems.length !== 1 ? 's' : ''}
          </span>
        </summary>
        <ul className="mt-3 space-y-1.5">
          {customItems.map((item, idx) => (
            <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
              <span aria-hidden className="text-blue-500">•</span>
              <span className="flex-1">{item}</span>
              <button
                onClick={() => removeCustomItem(idx)}
                className="text-slate-400 hover:text-red-500 text-xs font-bold px-1"
                aria-label={`Remove ${item}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newItem.trim()) {
              addCustomItem(newItem);
              setNewItem('');
              inputRef.current?.focus();
            }
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={!newItem.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40"
          >
            Add
          </button>
        </form>
      </details>
    </section>
  );
}

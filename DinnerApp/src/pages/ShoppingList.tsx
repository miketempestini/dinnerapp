import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CATEGORIES } from '../types';
import { buildShoppingList, hasAnyCookedAssignment, shoppingListToText } from '../lib/shoppingList';
import EmptyState from '../components/EmptyState';

export default function ShoppingList() {
  const navigate = useNavigate();
  const meals = useStore((s) => s.meals);
  const week = useStore((s) => s.week);

  const [copied, setCopied] = useState(false);

  const grouped = useMemo(() => buildShoppingList(week, meals), [week, meals]);
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
            await navigator.clipboard.writeText(shoppingListToText(grouped));
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
    </section>
  );
}

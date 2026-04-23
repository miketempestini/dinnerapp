import { useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { CATEGORIES } from '../types';
import { buildShoppingList } from '../lib/shoppingList';

export default function PrintView() {
  const meals = useStore((s) => s.meals);
  const week = useStore((s) => s.week);
  const grouped = useMemo(() => buildShoppingList(week, meals), [week, meals]);

  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto print:p-0 print:mx-0 print:max-w-none">
      <div className="flex items-baseline justify-between border-b border-slate-300 pb-2 mb-4">
        <h1 className="text-2xl font-bold">DinnerWheel – Shopping List</h1>
        <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
      </div>
      {CATEGORIES.map((cat) => {
        const items = grouped[cat];
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mb-5 break-inside-avoid">
            <h2 className="text-lg font-bold border-b border-slate-200 mb-2">{cat}</h2>
            <ul className="pl-5 list-disc space-y-1 text-sm">
              {items.map((i, idx) => (
                <li key={idx}>
                  {i.name}
                  {i.qtyDisplay && <span className="text-slate-600"> — {i.qtyDisplay}</span>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <button
        onClick={() => window.print()}
        className="no-print mt-6 px-4 py-2 rounded-full text-sm font-semibold bg-orange-500 text-white"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}

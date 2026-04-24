import { useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { CATEGORIES } from '../types';
import { buildShoppingList, buildWeekPlan } from '../lib/shoppingList';

export default function PrintView() {
  const meals = useStore((s) => s.meals);
  const restaurants = useStore((s) => s.restaurants);
  const week = useStore((s) => s.week);
  const grouped = useMemo(() => buildShoppingList(week, meals), [week, meals]);
  const weekPlan = useMemo(() => buildWeekPlan(week, meals, restaurants), [week, meals, restaurants]);

  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto print:p-0 print:mx-0 print:max-w-none">
      <div className="flex items-baseline justify-between border-b border-slate-300 pb-2 mb-6">
        <h1 className="text-2xl font-bold">DinnerWheel</h1>
        <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
      </div>

      {/* Week plan */}
      <section className="mb-8 break-inside-avoid">
        <h2 className="text-lg font-bold mb-3">This Week's Dinner Plan</h2>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {weekPlan.map((p) => (
              <tr key={p.day} className="border-b border-slate-100">
                <td className="py-1.5 pr-4 font-semibold text-slate-700 w-28">{p.day}</td>
                <td className={`py-1.5 ${p.isSkipped || p.isEmpty ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                  {p.label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Grocery list */}
      <h2 className="text-lg font-bold border-b border-slate-300 pb-1 mb-4">Grocery List</h2>
      {CATEGORIES.map((cat) => {
        const items = grouped[cat];
        if (items.length === 0) return null;
        return (
          <section key={cat} className="mb-5 break-inside-avoid">
            <h3 className="text-base font-semibold border-b border-slate-200 mb-2">{cat}</h3>
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

import { CATEGORIES, DAY_KEYS, DAY_LABELS, type Category, type Ingredient, type Meal, type Restaurant, type Week } from '../types';

export type LineItem = {
  name: string;
  unit?: string;
  qtyDisplay: string; // "2" or "2 + 1 pack" etc.
  category: Category;
};

type Bucket = {
  name: string;
  unit?: string;
  category: Category;
  numericQty: number;
  extras: string[]; // non-numeric qty strings
  hadAnyQty: boolean;
};

const key = (ing: Ingredient) =>
  `${ing.name.trim().toLowerCase()}|${(ing.unit ?? '').trim().toLowerCase()}`;

function parseNumeric(qty?: string): number | null {
  if (!qty) return null;
  const m = qty.trim().match(/^(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const d = m[2] ? parseFloat(m[2]) : 1;
  return d ? n / d : null;
}

function gather(week: Week, meals: Meal[]): Ingredient[] {
  const byId = new Map(meals.map((m) => [m.id, m]));
  const out: Ingredient[] = [];
  DAY_KEYS.forEach((d) => {
    const a = week[d].assignment;
    if (!a) return;
    let mealId: string | null = null;
    if (a.kind === 'meal') mealId = a.mealId;
    else if (a.kind === 'leftover') mealId = a.sourceMealId;
    if (!mealId) return;
    const meal = byId.get(mealId);
    if (!meal) return;
    out.push(...meal.ingredients);
  });
  return out;
}

export function buildShoppingList(week: Week, meals: Meal[]): Record<Category, LineItem[]> {
  const buckets = new Map<string, Bucket>();
  gather(week, meals).forEach((ing) => {
    const k = key(ing);
    let b = buckets.get(k);
    if (!b) {
      b = {
        name: ing.name.trim(),
        unit: ing.unit?.trim() || undefined,
        category: ing.category,
        numericQty: 0,
        extras: [],
        hadAnyQty: false,
      };
      buckets.set(k, b);
    }
    if (ing.qty && ing.qty.trim()) {
      b.hadAnyQty = true;
      const n = parseNumeric(ing.qty);
      if (n !== null) b.numericQty += n;
      else b.extras.push(ing.qty.trim());
    }
  });

  const grouped: Record<Category, LineItem[]> = {} as Record<Category, LineItem[]>;
  CATEGORIES.forEach((c) => (grouped[c] = []));

  Array.from(buckets.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((b) => {
      let qtyDisplay = '';
      if (b.hadAnyQty) {
        const parts: string[] = [];
        if (b.numericQty > 0) {
          const num = Number.isInteger(b.numericQty)
            ? String(b.numericQty)
            : b.numericQty.toFixed(2).replace(/\.?0+$/, '');
          parts.push(b.unit ? `${num} ${b.unit}${b.numericQty > 1 && !b.unit.endsWith('s') ? 's' : ''}` : num);
        }
        if (b.extras.length) parts.push(...b.extras);
        qtyDisplay = parts.join(' + ');
      }
      grouped[b.category].push({
        name: b.name,
        unit: b.unit,
        qtyDisplay,
        category: b.category,
      });
    });

  return grouped;
}

export function shoppingListToText(grouped: Record<Category, LineItem[]>): string {
  const lines: string[] = [];
  CATEGORIES.forEach((cat) => {
    const items = grouped[cat];
    if (!items.length) return;
    lines.push(cat);
    items.forEach((i) => {
      lines.push(`  - ${i.name}${i.qtyDisplay ? ` (${i.qtyDisplay})` : ''}`);
    });
    lines.push('');
  });
  return lines.join('\n').trimEnd();
}

export type WeekPlanLine = { day: string; label: string; isSkipped: boolean; isEmpty: boolean };

export function buildWeekPlan(week: Week, meals: Meal[], restaurants: Restaurant[]): WeekPlanLine[] {
  const mealById = new Map(meals.map((m) => [m.id, m.name]));
  const restById = new Map(restaurants.map((r) => [r.id, r.name]));
  return DAY_KEYS.map((d) => {
    const plan = week[d];
    if (plan.skipped) return { day: DAY_LABELS[d], label: 'Skipped', isSkipped: true, isEmpty: false };
    const a = plan.assignment;
    if (!a) return { day: DAY_LABELS[d], label: '—', isSkipped: false, isEmpty: true };
    let label = '';
    if (a.kind === 'meal') label = mealById.get(a.mealId) ?? 'Unknown';
    else if (a.kind === 'restaurant') label = `${restById.get(a.restaurantId) ?? 'Unknown'} (Takeout)`;
    else label = `Leftovers – ${mealById.get(a.sourceMealId) ?? 'Unknown'}`;
    return { day: DAY_LABELS[d], label, isSkipped: false, isEmpty: false };
  });
}

export function weekPlanToText(plan: WeekPlanLine[]): string {
  const lines = ['🍽️  This Week\'s Dinner Plan', '─'.repeat(30)];
  plan.forEach((p) => lines.push(`${p.day}: ${p.label}`));
  return lines.join('\n');
}

export function hasAnyCookedAssignment(week: Week): boolean {
  return DAY_KEYS.some((d) => {
    const a = week[d].assignment;
    return a?.kind === 'meal' || a?.kind === 'leftover';
  });
}

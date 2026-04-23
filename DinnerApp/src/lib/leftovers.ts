import { DAY_KEYS, type DayKey, type Meal, type Week } from '../types';

export type LeftoverTile = {
  id: string; // dnd id: `leftover:<mealId>`
  sourceMealId: string;
  mealName: string;
  earliestFromIndex: number; // 0 = Monday
};

/** For each home-cooked meal assigned to a day, expose a leftover tile usable
 *  on any later day. No cascade: leftover-of-leftover is not generated. */
export function deriveLeftoverTiles(week: Week, meals: Meal[]): LeftoverTile[] {
  const byId = new Map(meals.map((m) => [m.id, m]));
  const earliest = new Map<string, number>();
  DAY_KEYS.forEach((k, i) => {
    const a = week[k].assignment;
    if (a && a.kind === 'meal') {
      const prev = earliest.get(a.mealId);
      if (prev === undefined || i < prev) earliest.set(a.mealId, i);
    }
  });
  const tiles: LeftoverTile[] = [];
  earliest.forEach((dayIndex, mealId) => {
    const m = byId.get(mealId);
    if (!m) return;
    tiles.push({
      id: `leftover:${mealId}`,
      sourceMealId: mealId,
      mealName: m.name,
      earliestFromIndex: dayIndex + 1, // strictly later
    });
  });
  return tiles.sort((a, b) => a.mealName.localeCompare(b.mealName));
}

export const dayIndex = (d: DayKey) => DAY_KEYS.indexOf(d);

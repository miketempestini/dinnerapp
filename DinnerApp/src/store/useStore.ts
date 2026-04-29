import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Assignment,
  type DayKey,
  type Ingredient,
  type Meal,
  type Restaurant,
  type SideDish,
  type Week,
  DAY_KEYS,
  emptyWeek,
} from '../types';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

type State = {
  meals: Meal[];
  restaurants: Restaurant[];
  sides: SideDish[];
  week: Week;
  seededIds: string[];
  customItems: string[];
};

type Actions = {
  addMeal: (name: string, ingredients: Ingredient[]) => Meal;
  updateMeal: (id: string, patch: Partial<Omit<Meal, 'id'>>) => void;
  deleteMeal: (id: string) => void;

  addRestaurant: (name: string, tags: string[]) => Restaurant;
  updateRestaurant: (id: string, patch: Partial<Omit<Restaurant, 'id'>>) => void;
  deleteRestaurant: (id: string) => void;

  addSide: (name: string) => SideDish;
  updateSide: (id: string, name: string) => void;
  deleteSide: (id: string) => void;
  addSideToDay: (day: DayKey, sideId: string) => void;
  removeSideFromDay: (day: DayKey, sideId: string) => void;

  assignDay: (day: DayKey, a: Assignment) => void;
  setNote: (day: DayKey, note: string) => void;
  setSkipped: (day: DayKey, skipped: boolean) => void;
  clearWeek: () => void;

  addCustomItem: (item: string) => void;
  removeCustomItem: (index: number) => void;

  replaceAll: (s: State) => void;
  applySeed: (seedMeals: Meal[], seedRestaurants: Restaurant[], seedSides?: SideDish[]) => void;
};

export type Store = State & Actions;

export const useStore = create<Store>()(
  persist(
    (set) => ({
      meals: [],
      restaurants: [],
      sides: [],
      week: emptyWeek(),
      seededIds: [],
      customItems: [],

      addMeal: (name, ingredients) => {
        const meal: Meal = { id: uid(), name: name.trim(), ingredients };
        set((s) => ({ meals: [...s.meals, meal] }));
        return meal;
      },
      updateMeal: (id, patch) =>
        set((s) => ({
          meals: s.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      deleteMeal: (id) =>
        set((s) => {
          const week = { ...s.week };
          (Object.keys(week) as DayKey[]).forEach((k) => {
            const a = week[k].assignment;
            if (
              a &&
              ((a.kind === 'meal' && a.mealId === id) ||
                (a.kind === 'leftover' && a.sourceMealId === id))
            ) {
              week[k] = { ...week[k], assignment: null };
            }
          });
          return { meals: s.meals.filter((m) => m.id !== id), week };
        }),

      addRestaurant: (name, tags) => {
        const r: Restaurant = { id: uid(), name: name.trim(), tags };
        set((s) => ({ restaurants: [...s.restaurants, r] }));
        return r;
      },
      updateRestaurant: (id, patch) =>
        set((s) => ({
          restaurants: s.restaurants.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRestaurant: (id) =>
        set((s) => {
          const week = { ...s.week };
          (Object.keys(week) as DayKey[]).forEach((k) => {
            const a = week[k].assignment;
            if (a && a.kind === 'restaurant' && a.restaurantId === id) {
              week[k] = { ...week[k], assignment: null };
            }
          });
          return { restaurants: s.restaurants.filter((r) => r.id !== id), week };
        }),

      addSide: (name) => {
        const side: SideDish = { id: uid(), name: name.trim() };
        set((s) => ({ sides: [...s.sides, side] }));
        return side;
      },
      updateSide: (id, name) =>
        set((s) => ({
          sides: s.sides.map((sd) => (sd.id === id ? { ...sd, name: name.trim() } : sd)),
        })),
      deleteSide: (id) =>
        set((s) => {
          const week = { ...s.week };
          DAY_KEYS.forEach((k) => {
            const daySides = week[k].sides;
            if (daySides.includes(id)) {
              week[k] = { ...week[k], sides: daySides.filter((sid) => sid !== id) };
            }
          });
          return { sides: s.sides.filter((sd) => sd.id !== id), week };
        }),
      addSideToDay: (day, sideId) =>
        set((s) => {
          const plan = s.week[day];
          if (plan.sides.includes(sideId)) return s; // already there
          return { week: { ...s.week, [day]: { ...plan, sides: [...plan.sides, sideId] } } };
        }),
      removeSideFromDay: (day, sideId) =>
        set((s) => ({
          week: {
            ...s.week,
            [day]: { ...s.week[day], sides: s.week[day].sides.filter((id) => id !== sideId) },
          },
        })),

      assignDay: (day, a) =>
        set((s) => ({
          week: { ...s.week, [day]: { ...s.week[day], assignment: a, skipped: false } },
        })),
      setNote: (day, note) =>
        set((s) => ({ week: { ...s.week, [day]: { ...s.week[day], note } } })),
      setSkipped: (day, skipped) =>
        set((s) => ({
          week: {
            ...s.week,
            [day]: {
              ...s.week[day],
              skipped,
              assignment: skipped ? null : s.week[day].assignment,
              sides: skipped ? [] : s.week[day].sides,
            },
          },
        })),
      clearWeek: () => set({ week: emptyWeek(), customItems: [] }),

      addCustomItem: (item) =>
        set((s) => ({ customItems: [...s.customItems, item.trim()] })),
      removeCustomItem: (index) =>
        set((s) => ({ customItems: s.customItems.filter((_, i) => i !== index) })),

      replaceAll: (next) => set({ ...next }),
      applySeed: (seedMeals, seedRestaurants, seedSides) =>
        set((s) => {
          const seen = new Set(s.seededIds);
          const mealIds = new Set(s.meals.map((m) => m.id));
          const restIds = new Set(s.restaurants.map((r) => r.id));
          const sideIds = new Set(s.sides.map((sd) => sd.id));
          const newMeals: Meal[] = [];
          const newRests: Restaurant[] = [];
          const newSides: SideDish[] = [];
          const newSeen: string[] = [];
          for (const m of seedMeals) {
            if (!seen.has(m.id)) {
              newSeen.push(m.id);
              if (!mealIds.has(m.id)) newMeals.push(m);
            }
          }
          for (const r of seedRestaurants) {
            if (!seen.has(r.id)) {
              newSeen.push(r.id);
              if (!restIds.has(r.id)) newRests.push(r);
            }
          }
          if (seedSides) {
            for (const sd of seedSides) {
              if (!seen.has(sd.id)) {
                newSeen.push(sd.id);
                if (!sideIds.has(sd.id)) newSides.push(sd);
              }
            }
          }
          if (!newMeals.length && !newRests.length && !newSides.length && !newSeen.length) return s;
          return {
            meals: [...s.meals, ...newMeals],
            restaurants: [...s.restaurants, ...newRests],
            sides: [...s.sides, ...newSides],
            seededIds: [...s.seededIds, ...newSeen],
          };
        }),
    }),
    {
      name: 'dinnerwheel-v1',
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | undefined;
        const merged = { ...(current as Store), ...p } as Store;
        // Migrate: ensure `sides` array exists at state level
        if (!Array.isArray(merged.sides)) (merged as any).sides = [];
        // Migrate: ensure each DayPlan has a `sides` array
        if (merged.week) {
          DAY_KEYS.forEach((d) => {
            if (merged.week[d] && !Array.isArray(merged.week[d].sides)) {
              merged.week[d] = { ...merged.week[d], sides: [] };
            }
          });
        }
        return merged;
      },
    },
  ),
);

export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Pantry/Grains',
  'Condiments & Spices',
  'Frozen',
  'Bakery',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Ingredient = {
  name: string;
  qty?: string;
  unit?: string;
  category: Category;
};

export type Meal = {
  id: string;
  name: string;
  ingredients: Ingredient[];
};

export type Restaurant = {
  id: string;
  name: string;
  tags: string[];
};

export type SideDish = {
  id: string;
  name: string;
};

export const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export type Assignment =
  | { kind: 'meal'; mealId: string }
  | { kind: 'leftover'; sourceMealId: string }
  | { kind: 'restaurant'; restaurantId: string }
  | null;

export type DayPlan = {
  assignment: Assignment;
  sides: string[];
  note: string;
  skipped: boolean;
};

export type Week = Record<DayKey, DayPlan>;

export const EMPTY_DAY: DayPlan = { assignment: null, sides: [], note: '', skipped: false };

export const emptyWeek = (): Week =>
  DAY_KEYS.reduce((acc, k) => {
    acc[k] = { ...EMPTY_DAY };
    return acc;
  }, {} as Week);

import { saveAs } from 'file-saver';
import type { Store } from '../store/useStore';

type BackupShape = {
  version: 1;
  exportedAt: string;
  meals: Store['meals'];
  restaurants: Store['restaurants'];
  sides: Store['sides'];
  week: Store['week'];
};

export function exportBackup(state: Pick<Store, 'meals' | 'restaurants' | 'sides' | 'week'>) {
  const payload: BackupShape = {
    version: 1,
    exportedAt: new Date().toISOString(),
    meals: state.meals,
    restaurants: state.restaurants,
    sides: state.sides,
    week: state.week,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const date = new Date().toISOString().slice(0, 10);
  saveAs(blob, `dinnerwheel-backup-${date}.json`);
}

export async function readBackup(file: File): Promise<BackupShape> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || parsed.version !== 1) {
    throw new Error('Unsupported backup file version');
  }
  if (!Array.isArray(parsed.meals) || !Array.isArray(parsed.restaurants) || !parsed.week) {
    throw new Error('Backup file is missing required fields');
  }
  // Backward compat: old backups may not have sides
  return { ...parsed, sides: parsed.sides ?? [] } as BackupShape;
}

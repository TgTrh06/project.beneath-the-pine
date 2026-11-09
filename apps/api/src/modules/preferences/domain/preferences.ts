import { defaultForestArrangement, type ForestArrangement, type Preferences, type UpdatePreferences } from '@pyneath/contracts';
export interface PreferencesRecord {
  accountId: string; sharePresence: boolean; remindAcceptedPacts: boolean; presetDurationMinutes: number | null;
  presetSoundscapeId: string | null; forestLayout: string; forestHidden: number[]; forestVersion: number; updatedAt: Date;
}
export type PreferencesPatch = Partial<Pick<PreferencesRecord, 'sharePresence' | 'remindAcceptedPacts' | 'presetDurationMinutes' | 'presetSoundscapeId'>>;
export const defaultPreferences: Preferences = { sharePresence: false, remindAcceptedPacts: false, focusPreset: null, forestArrangement: defaultForestArrangement };
export function preferencePatch(patch: UpdatePreferences): PreferencesPatch {
  return {
    ...(patch.sharePresence !== undefined ? { sharePresence: patch.sharePresence } : {}),
    ...(patch.remindAcceptedPacts !== undefined ? { remindAcceptedPacts: patch.remindAcceptedPacts } : {}),
    ...(patch.focusPreset !== undefined ? { presetDurationMinutes: patch.focusPreset?.durationMinutes ?? null, presetSoundscapeId: patch.focusPreset?.soundscapeId ?? null } : {}),
  };
}
export function projectPreferences(row: PreferencesRecord): Preferences {
  return { sharePresence: row.sharePresence, remindAcceptedPacts: row.remindAcceptedPacts,
    forestArrangement: { layout: row.forestLayout as ForestArrangement['layout'], hidden: row.forestHidden as ForestArrangement['hidden'], version: row.forestVersion },
    focusPreset: row.presetDurationMinutes === null ? null : { durationMinutes: row.presetDurationMinutes as 5 | 10 | 25 | 50, soundscapeId: row.presetSoundscapeId as 'rain' | 'forest' | 'stream' | null },
  };
}

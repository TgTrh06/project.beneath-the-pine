import { request, mutation } from '../transport';
import { forestArrangementSchema, type ForestArrangement, type Preferences, type UpdatePreferences } from '@pyneath/contracts';

export const getPreferences = () => request<{ preferences: Preferences }>("/me/preferences");

export const updatePreferences = (value: UpdatePreferences) => mutation<{ preferences: Preferences }>("/me/preferences", "PATCH", value);

export const saveForestArrangement = async (value: ForestArrangement) => forestArrangementSchema.parse((await mutation<{ forestArrangement: ForestArrangement }>("/me/preferences/forest", "PATCH", value)).forestArrangement);

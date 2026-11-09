import { request } from '../transport';
import { personalForestSchema, campForestsSchema } from '@pyneath/contracts';

export const getMemory = () => request<{ milestones: Array<{ id: string; campId: string; recordedAt: string }> }>("/me/memory");

export const getPersonalForest = async () => personalForestSchema.parse(await request<unknown>('/me/memory/personal'));

export const getCampForests = async () => campForestsSchema.parse(await request<unknown>('/me/memory/camps'));

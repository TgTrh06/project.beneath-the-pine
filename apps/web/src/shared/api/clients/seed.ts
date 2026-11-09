import { mutation } from '../transport';
import type { ReturnState } from '@pyneath/contracts';

export const putSeed = (text: string) => mutation<{ openSeed: NonNullable<ReturnState["openSeed"]> }>("/me/open-seed", "PUT", { text });

export const deleteSeed = () => mutation<void>("/me/open-seed", "DELETE");

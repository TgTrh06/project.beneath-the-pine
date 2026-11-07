import type { AssistanceOutput, AssistanceRequest } from '@pyneath/contracts';
export type ProviderResult =
  | { kind: 'validated'; output: AssistanceOutput }
  | { kind: 'fallback' }
  | { kind: 'boundary' };
export interface AssistanceProvider { generate(input: AssistanceRequest): Promise<ProviderResult>; }
export const ASSISTANCE_PROVIDER = Symbol('ASSISTANCE_PROVIDER');

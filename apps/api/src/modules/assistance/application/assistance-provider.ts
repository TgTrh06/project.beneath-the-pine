import type { AssistanceOutput, AssistanceRequest } from '@pyneath/contracts';
import type { AssistanceToolSession } from './assistance-tools';
export type ProviderResult =
  | { kind: 'validated'; output: AssistanceOutput }
  | { kind: 'fallback' }
  | { kind: 'boundary' };
export interface AssistanceProvider { generate(input: AssistanceRequest, tools?: AssistanceToolSession): Promise<ProviderResult>; }
export const ASSISTANCE_PROVIDER = Symbol('ASSISTANCE_PROVIDER');

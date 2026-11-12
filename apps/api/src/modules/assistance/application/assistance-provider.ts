import type { AssistanceOutput, AssistanceRequest } from '@pyneath/contracts';
import type { AssistanceToolSession } from './assistance-tools';
export type ProviderResult =
  | { kind: 'validated'; output: AssistanceOutput; usage?: ProviderUsage }
  | { kind: 'fallback'; usage?: ProviderUsage }
  | { kind: 'boundary'; usage?: ProviderUsage };
export interface ProviderUsage { promptTokens?: number; completionTokens?: number; costUsd?: number }
export class ProviderRateLimitError extends Error { constructor() { super('Provider quota exceeded'); } }
export interface AssistanceProvider { generate(input: AssistanceRequest, tools?: AssistanceToolSession): Promise<ProviderResult>; }
export const ASSISTANCE_PROVIDER = Symbol('ASSISTANCE_PROVIDER');

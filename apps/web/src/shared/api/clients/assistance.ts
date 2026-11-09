import { request, mutation } from '../transport';
import type { AssistanceInteraction, AssistanceRequest, AssistanceResponse } from '@pyneath/contracts';

export const requestAssistance = (value: AssistanceRequest) => mutation<AssistanceResponse>('/me/assistance', 'POST', value);

export const getAssistanceConfig = () => request<import('@pyneath/contracts').AssistanceConfig>('/me/assistance/config');

export const recordAssistanceInteraction = (value: AssistanceInteraction) => mutation<void>('/me/assistance/interactions', 'POST', value);

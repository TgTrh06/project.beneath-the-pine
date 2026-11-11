import type { AssistanceContext, AssistanceToolName, AssistanceToolRequest } from '@pyneath/contracts';
export interface AssistanceToolSession {
  names: AssistanceToolName[];
  read(name: AssistanceToolName): Promise<unknown>;
}
export interface AssistanceContextAccess {
  preview(accountId: string): Promise<AssistanceContext>;
  authorize(accountId: string, grants: AssistanceToolRequest['grants']): Promise<AssistanceToolSession>;
}

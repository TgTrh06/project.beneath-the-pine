export interface SharedMemory {
  record(campId: string, sessionId: string, participantCount: number): Promise<string | null>;
}
export interface SharedMemoryRepository { insert(campId: string, sessionId: string): Promise<string | null>; }
export const SHARED_MEMORY = Symbol('SHARED_MEMORY');

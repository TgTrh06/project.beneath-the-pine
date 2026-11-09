import type { SharedMemory, SharedMemoryRepository } from './shared-memory.ports';
export class SharedMemoryService implements SharedMemory {
  constructor(private readonly repository: SharedMemoryRepository) {}
  record(campId: string, sessionId: string, participantCount: number) {
    return participantCount < 2 ? Promise.resolve(null) : this.repository.insert(campId, sessionId);
  }
}

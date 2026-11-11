import { Inject, Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { assistanceContextSchema, assistanceToolRequestSchema, seedContextSchema, type AssistanceToolName, type AssistanceToolRequest } from '@pyneath/contracts';
import { FOCUS_CONTEXT_READER, type FocusContextReader } from '../../focus/public-api';
import { SEED_ACCESS, type SeedAccess } from '../../seed/public-api';
import type { AssistanceContextAccess, AssistanceToolSession } from '../application/assistance-tools';
import { BusinessError } from '../../../shared/kernel/business-error';

@Injectable()
export class AssistanceContext implements AssistanceContextAccess {
  private readonly secret = randomBytes(32);
  constructor(@Inject(FOCUS_CONTEXT_READER) private readonly focus: FocusContextReader,
    @Inject(SEED_ACCESS) private readonly seeds: SeedAccess) {}
  private async read(accountId: string, name: AssistanceToolName) {
    if (name === 'get_current_focus_context') return this.focus.readOwnContext(accountId);
    const seed = await this.seeds.get(accountId);
    return seedContextSchema.parse(seed ? { text: seed.text } : null);
  }
  private sign(accountId: string, name: AssistanceToolName, data: unknown, expires: number) {
    return createHmac('sha256', this.secret).update(JSON.stringify([accountId, name, data, expires])).digest('hex');
  }
  async preview(accountId: string) {
    const expires = Date.now() + 5 * 60000;
    const tools = await Promise.all((['get_current_focus_context', 'get_my_open_seed'] as const).map(async name => {
      const data = await this.read(accountId, name);
      return { name, data, consentToken: `${expires}.${this.sign(accountId, name, data, expires)}` };
    }));
    return assistanceContextSchema.parse({ tools });
  }
  async authorize(accountId: string, grants: AssistanceToolRequest['grants']): Promise<AssistanceToolSession> {
    // Defensive validation also applies to non-HTTP consumers.
    assistanceToolRequestSchema.shape.grants.parse(grants);
    const checked = async (name: AssistanceToolName) => {
      const grant = grants.find(g => g.name === name);
      if (!grant || !/^\d{13}\.[a-f0-9]{64}$/.test(grant.consentToken)) throw new BusinessError('STATE_CONFLICT');
      const [time, signature] = grant.consentToken.split('.'); const expires = Number(time);
      if (expires < Date.now() || expires > Date.now() + 5 * 60000) throw new BusinessError('STATE_CONFLICT');
      const data = await this.read(accountId, name);
      if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(this.sign(accountId, name, data, expires), 'hex'))) throw new BusinessError('STATE_CONFLICT');
      return data;
    };
    for (const grant of grants) await checked(grant.name);
    const used = new Set<AssistanceToolName>();
    return { names: grants.map(g => g.name), read: async name => {
      if (used.has(name)) throw new BusinessError('STATE_CONFLICT');
      used.add(name);
      return checked(name); // Recheck ownership/content immediately before any tool result leaves server.
    } };
  }
}

import type { AssistanceConfig } from '@pyneath/contracts';
import type { ApiConfig } from '../../../platform/config/api-config';
export function assistanceConfiguration(config: ApiConfig): AssistanceConfig {
  if (config.API_ASSISTANCE_PROVIDER === 'local') return { enabled: true, processing: 'self_hosted', capabilities: ['assisted_start', 'open_seed_draft', 'stuck_recovery'] };
  if (config.API_ASSISTANCE_PROVIDER === 'openai' && config.OPENAI_API_KEY) return { enabled: true, processing: 'external', capabilities: ['assisted_start', 'open_seed_draft'] };
  return { enabled: false, processing: 'disabled', capabilities: [] };
}

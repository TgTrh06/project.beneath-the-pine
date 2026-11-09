import type { CampPrivacyAccess } from '../../camp/public-api';
import type { FocusPrivacyAccess } from '../../focus/public-api';
import type { MemoryPrivacyAccess } from '../../memory/public-api';
import type { PactPrivacyAccess } from '../../pact/public-api';
import type { PreferencesPrivacyAccess } from '../../preferences/public-api';
import type { ProfileAccess } from '../../profile/public-api';
import type { SeedAccess } from '../../seed/public-api';

/** Export fields come from their owners; Privacy does not read or write their tables. */
export interface PrivacySources {
  camps: CampPrivacyAccess;
  focus: FocusPrivacyAccess;
  memory: MemoryPrivacyAccess;
  pacts: PactPrivacyAccess;
  preferences: PreferencesPrivacyAccess;
  profile: Pick<ProfileAccess, 'get'>;
  seeds: Pick<SeedAccess, 'get'>;
}

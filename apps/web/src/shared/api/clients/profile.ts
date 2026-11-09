import { request, mutation } from '../transport';
import type { Profile } from '@pyneath/contracts';

export const getProfile = () => request<{ profile: Profile | null }>("/me/profile");

export const updateProfile = (value: Partial<Profile>) => mutation<{ profile: Profile }>("/me/profile", "PATCH", value);

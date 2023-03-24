import type { User } from '@annotorious/core';

export interface SupabasePluginEvents {

  presence: (users: User[]) => void;

}
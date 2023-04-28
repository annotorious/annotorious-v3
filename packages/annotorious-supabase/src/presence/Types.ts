import type { User } from '@annotorious/core';

export interface SelectEvent {

  from: User & { presenceKey: string };

  ids: string[] | null;

}
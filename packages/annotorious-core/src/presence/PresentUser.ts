import type { User } from '../model';

export interface PresentUser {

  presenceKey: string;

  user: User;

  selection?: string | string[] | null;

  color: string;

  lastActive: Date;

}
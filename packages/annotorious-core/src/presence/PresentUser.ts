import type { User } from '../model';

export interface PresentUser {

  presenceKey: string;

  user: User;

  color: string;

}
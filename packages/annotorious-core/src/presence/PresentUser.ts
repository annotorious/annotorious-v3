import type { User } from '../model';

export interface PresentUser extends User {

  presenceKey: string;

  presenceLabel: string;

  presenceColor: string;

}
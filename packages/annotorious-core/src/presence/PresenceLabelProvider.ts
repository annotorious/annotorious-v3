import type { User } from '../model';

export interface PresenceLabelProvider {

  getLabel(presenceKey: string, user: User): string;

}
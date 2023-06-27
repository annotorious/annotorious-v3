import { PRESENCE_KEY } from './PresenceState';
import type { User } from '../model';
import type { Appearance } from './Appearance';

export interface PresentUser extends User {

  presenceKey: string;

  appearance: Appearance

}

export const isMe = (user: PresentUser) => user.presenceKey === PRESENCE_KEY;
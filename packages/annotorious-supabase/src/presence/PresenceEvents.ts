import type { UserPresenceState } from './Presence';

export interface PresenceEvents {

  presence: (users: UserPresenceState[]) => void;

  selectionChange: (user: UserPresenceState, ids: string | string[] | null) => void;

}
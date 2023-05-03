import type { Annotation } from './Annotation';
import type { User } from './User';
import type { PresenceProvider } from '../presence';
import type { LifecycleEvents, Selection, Store } from '../state';

export interface Annotator<T extends Annotation = Annotation> {

  getUser: () => User;

  setUser: (user: User) => void;

  setPresenceProvider: (provider: PresenceProvider) => void;

  on: <E extends keyof LifecycleEvents<T>>(event: E, callback: LifecycleEvents<T>[E]) => void;

  off: <E extends keyof LifecycleEvents<T>>(event: E, callback: LifecycleEvents<T>[E]) => void;

  store: Store<T>;

  selection: Selection<T>;

}
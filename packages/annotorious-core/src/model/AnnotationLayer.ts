import type { Annotation } from './Annotation';
import type { User } from './User';
import type { LifecycleEvents, Store } from '../state';

export interface AnnotationLayer<T extends Annotation> {

  getUser: (() => User);

  on: <E extends keyof LifecycleEvents<T>>(event: E, callback: LifecycleEvents<T>[E]) => void;

  off: <E extends keyof LifecycleEvents<T>>(event: E, callback: LifecycleEvents<T>[E]) => void;

  setUser: (user: User) => void;

  store: Store<T>;

}
import type { Annotation } from './Annotation';
import type { User } from './User';
import type { Store } from '../state';

export interface AnnotationLayer<T extends Annotation> {

  getUser: (() => User);

  setUser: (user: User) => void;

  store: Store<T>;

}
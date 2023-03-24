import type { User } from './User';

export interface Annotation {

  id: string;

  target: AnnotationTarget;

  bodies: AnnotationBody[];

}

export interface AnnotationTarget {

  annotation: string;

  selector: AbstractSelector;

  creator?: User;

  created?: Date;

  updatedBy?: User;

  updated?: Date;

}

export interface AbstractSelector { }

export interface AnnotationBody {

  annotation: string;

  type?: string;

  purpose?: string;

  value: string;

  creator?: User;

  created?: Date;

  upatedBy?: User;

  updated?: Date;

} 


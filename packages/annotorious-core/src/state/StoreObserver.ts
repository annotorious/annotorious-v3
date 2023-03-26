import type { Annotation, AnnotationBody, AnnotationTarget } from '../model';

/** Interface for listening to changes in the annotation store **/
export interface StoreObserver<T extends Annotation> { 

  onChange: { (event: StoreChangeEvent<T>): void };

  options: StoreObserveOptions;

}

/** A change event fired when the store state changes **/
export interface StoreChangeEvent<T extends Annotation> {

  origin: Origin;

  changes: ChangeSet<T>;

  state: T[];

}

/** Enum to indicate whether the change originated locally or from a remote source **/
export enum Origin { LOCAL = 'LOCAL', REMOTE = 'REMOTE' };

export interface ChangeSet<T extends Annotation> {

  added?: T[];

  deleted?: T[];

  updated?: Update<T>[];

}

export interface Update<T extends Annotation> {

  oldValue: T;

  newValue: T;

  bodiesAdded?: AnnotationBody[];

  bodiesDeleted?: AnnotationBody[];

  bodiesUpdated?: Array<{ oldBody: AnnotationBody, newBody: AnnotationBody }>;

  targetUpdated?: { oldTarget: AnnotationTarget, newTarget: AnnotationTarget};

}

/** Options to control which events the observer want to get notified of **/
export interface StoreObserveOptions {

  // Observe changes on targets, bodies or both?
  affects?: Affects;

  // Observe changes on one more specific annotations
  annotations?: string | string[];

  // Observer changes only for a specific origin
  origin?: Origin

}

/** Allows observers to register for events that affect specific annotation parts **/
export enum Affects { 

  ANNOTATION = 'ANNOTATION',
  
  BODY = 'BODY',

  TARGET = 'TARGET'

}


/** Tests if this observer should be notified about this event **/
export const shouldNotify = <T extends Annotation>(observer: StoreObserver<T>, event: StoreChangeEvent<T>) => {
  const { changes, origin } = event;

  const isRelevantOrigin = 
    !observer.options.origin || observer.options.origin === origin;

  if (!isRelevantOrigin)
    return false;

  if (observer.options.affects) {
    const { affects } = observer.options;

    const hasAnnotationChange = 
      changes.added?.length > 0 || changes.deleted?.length > 0;

    if (affects === Affects.ANNOTATION && !hasAnnotationChange)
      return false;

    const hasTargetChange =
      hasAnnotationChange || changes.updated?.some(u => u.targetUpdated);

    if (affects === Affects.TARGET && !hasTargetChange)
      return false;

    const hasBodyChange = 
      changes.updated?.some(u => u.bodiesAdded?.length > 0 || u.bodiesDeleted?.length > 0 || u.bodiesUpdated?.length > 0);

    if (affects === Affects.BODY && !hasBodyChange)
      return false;
  }

  if (observer.options.annotations) {
    // This observer has a filter set on specific annotations - check affected
    const affectedAnnotations = new Set([
      ...changes.added.map(a => a.id),
      ...changes.deleted.map(a => a.id),
      ...changes.updated.map(({ oldValue }) => oldValue.id)
    ]);

    const observed = Array.isArray(observer.options.annotations) ?
      observer.options.annotations : [ observer.options.annotations ];

    return Boolean(observed.find(id => affectedAnnotations.has(id)));
  } else {
    return true;
  }

}
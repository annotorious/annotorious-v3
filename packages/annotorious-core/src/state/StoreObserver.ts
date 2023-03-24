import type { Annotation, AnnotationBody, AnnotationTarget } from '../model';

/** Interface for listening to changes in the annotation store **/
export interface StoreObserver<T extends Annotation> { 

  onChange: { (event: StoreChangeEvent<T>): void };

  options: StoreObserveOptions;

}

/** A change event fired when the store state changes **/
export interface StoreChangeEvent<T extends Annotation> {

  origin: Origin;

  affects: ChangeType;

  changes: ChangeSet<T>;

  state: T[];

}

export enum Origin { LOCAL = 'LOCAL', REMOTE = 'REMOTE' };

export interface ChangeSet<T extends Annotation> {

  added?: T[];

  deleted?: T[];

  updated?: UpdateChange<T>[];

}

export interface UpdateChange<T extends Annotation> {

  oldValue: T;

  newValue: T;

  bodiesAdded?: AnnotationBody[];

  bodiesDeleted?: AnnotationBody[];

  bodiesUpdated?: Array<{ oldBody: AnnotationBody, newBody: AnnotationBody }>;

  targetUpdated?: { oldTarget: AnnotationTarget, newTarget: AnnotationTarget};

}

/** Enum to indicate whether the change affects annotation targets, bodies or both **/
export enum ChangeType { BOTH, TARGET, BODY }

/** Options to control which events the observer want to get notified of **/
export interface StoreObserveOptions {

  // Observe changes on targets, bodies or both?
  affects?: ChangeType;

  // Observe changes on one more specific annotations
  annotations?: string | string[];

  // Observer changes only for a specific origin
  origin?: Origin

}

/** Tests if this observer should be notified about this event **/
export const shouldNotify = <T extends Annotation>(observer: StoreObserver<T>, event: StoreChangeEvent<T>) => {
  const { affects, changes, origin } = event;

  const isRelevantOrigin = 
    !observer.options.origin || observer.options.origin === origin;

  if (!isRelevantOrigin)
    return false;

  // Should this observer be notified of body changes?
  const shouldNotifyBodies = 
    observer.options.affects === undefined ||
    observer.options.affects === ChangeType.BODY || 
    observer.options.affects === ChangeType.BOTH;

  // Should this observer be notified of target changes?
  const shouldNotifyTargets = 
    observer.options.affects === undefined ||
    observer.options.affects === ChangeType.TARGET || 
    observer.options.affects === ChangeType.BOTH;

  // Is this change relevant to this observer?
  const isRelevantChangeType = 
    (affects === ChangeType.BOTH) ||
    (affects === ChangeType.BODY && shouldNotifyBodies) ||
    (affects === ChangeType.TARGET && shouldNotifyTargets);

  if (!isRelevantChangeType)
    return false;

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
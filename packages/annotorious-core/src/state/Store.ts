import type { Annotation, AnnotationBody, AnnotationTarget } from '../model';
import { Origin, shouldNotify, type Update, type ChangeSet } from './StoreObserver';
import type { StoreObserver, StoreChangeEvent, StoreObserveOptions } from './StoreObserver';

export type Store<T extends Annotation> = ReturnType<typeof createStore<T>>;

export function createStore<T extends Annotation>() {

  const index = new Map<string, T>();

  const observers: StoreObserver<T>[] = [];

  const observe = (onChange: { (event: StoreChangeEvent<T>): void }, options: StoreObserveOptions = {}) =>
    observers.push({ onChange, options });

  const unobserve = (onChange: { (event: StoreChangeEvent<T>): void }) => {
    const idx = observers.findIndex(observer => observer.onChange == onChange);
    if (idx > -1)
      observers.splice(idx, 1);
  }

  const emit = (origin: Origin, changes: ChangeSet<T>) => {
    const event: StoreChangeEvent<T> = {
      origin,
      changes: {
        created: changes.created || [],
        updated: changes.updated || [],
        deleted: changes.deleted || []
      },
      state: [...index.values()]
    };

    observers.forEach(observer => {
      if (shouldNotify(observer, event))
        observer.onChange(event)
    });
  }

  const addAnnotation = (annotation: T, origin = Origin.LOCAL) => {
    const existing = index.get(annotation.id);

    if (existing) {
      throw Error(`Cannot add annotation ${annotation.id} - exists already`);
    } else {
      index.set(annotation.id, annotation);
      emit(origin, { created: [annotation] });
    }
  }

  const addBody = (body: AnnotationBody, origin = Origin.LOCAL) => {
    const oldValue = index.get(body.annotation);
    if (oldValue) {
      const newValue = { 
        ...oldValue,
        bodies: [ ...oldValue.bodies, body ]
      };

      index.set(oldValue.id, newValue);

      const update: Update<T> = {
        oldValue, newValue, bodiesCreated: [ body ]
      };

      emit(origin, { updated: [update] });
    } else {
      console.warn(`Attempt to add body to missing annotation: ${body.annotation}`);
    }
  }

  const bulkAddAnnotation = (annotations: T[], replace = true, origin = Origin.LOCAL) => {
    if (replace) {
      // Delete existing first
      const deleted = [...index.values()];
      index.clear();

      annotations.forEach(annotation => index.set(annotation.id, annotation));

      emit(origin, { created: annotations, deleted });
    } else {
      // Don't allow overwriting of existing annotations
      const existing = annotations.reduce((all, next) => {
        const existing = index.get(next.id);
        return existing ? [...all, existing ] : all;
      }, []);

      if (existing.length > 0)
        throw Error(`Bulk insert would overwrite the following annotations: ${existing.map(a => a.id).join(', ')}`);

      annotations.forEach(annotation => index.set(annotation.id, annotation));

      emit(origin, { created: annotations });
    }
  }

  const deleteAnnotation = (annotationOrId: T | string, origin = Origin.LOCAL) => {
    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;

    const existing = index.get(id);
    if (existing) {
      index.delete(id);
      emit(origin, { deleted: [ existing ] });
    } else {
      console.warn(`Attempt to delete missing annotation: ${id}`);
    }
  }

  const deleteBody = (body: AnnotationBody, origin = Origin.LOCAL) => {
    const oldValue = index.get(body.annotation);
    if (oldValue) {
      const newValue = {
        ...oldValue,
        bodies: oldValue.bodies.filter(b => b !== body)
      };
      
      index.set(oldValue.id, newValue);

      const update: Update<T> = {
        oldValue, newValue, bodiesDeleted: [body]
      };

      emit(origin, { updated: [update] });
    } else {
      console.warn(`Attempt to delete body from missing annotation: ${body.annotation}`);
    }
  }

  const getAnnotation = (id: string): T | undefined => {
    const a = index.get(id);
    return a ? {...a} : undefined;
  }

  const updateBody = (oldBody: AnnotationBody, newBody: AnnotationBody, origin = Origin.LOCAL) => {
    if (oldBody.annotation !== newBody.annotation)
      throw 'Annotation integrity violation: annotation ID must be the same when updating bodies';

    const oldValue = index.get(oldBody.annotation);
    if (oldValue) {
      const newValue = { 
        ...oldValue,
        bodies: oldValue.bodies.map(b => b === oldBody ? newBody : b)
      };

      const update: Update<T> = {
        oldValue, newValue,
        bodiesUpdated: [{ oldBody, newBody }]
      }

      index.set(oldValue.id, newValue);
      emit(origin, { updated: [update] });
    } else {
      console.warn(`Attempt to add body to missing annotation: ${oldBody.annotation}`);
    }
  }

  const updateOneTarget = (target: AnnotationTarget): Update<T> => {
    const oldValue = index.get(target.annotation);
    
    if (oldValue) {
      const newValue = { ...oldValue, target };

      index.set(oldValue.id, newValue);

      return {
        oldValue, newValue, targetUpdated: { 
          oldTarget: oldValue.target,
          newTarget: target
        }
      };
    } else {
      console.warn(`Attempt to update target on missing annotation: ${target.annotation}`);
    }
  }

  const updateTarget = (target: AnnotationTarget, origin = Origin.LOCAL) => {
    const update = updateOneTarget(target);
    emit(origin, { updated: [ update ]} );
  }

  const bulkUpdateTarget = (targets: AnnotationTarget[], origin = Origin.LOCAL) => {
    const updated = targets.map(updateOneTarget)
    emit(origin, { updated });
  }

	return {
    addAnnotation,
    addBody,
    bulkAddAnnotation,
    bulkUpdateTarget,
    deleteAnnotation,
    deleteBody,
    getAnnotation,
    observe,
    unobserve,
    updateBody,
    updateTarget
	};

}
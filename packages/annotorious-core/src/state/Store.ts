import type { Annotation, AnnotationBody, AnnotationTarget } from '../model';
import { Origin, shouldNotify, type Update, type ChangeSet } from './StoreObserver';
import type { StoreObserver, StoreChangeEvent, StoreObserveOptions } from './StoreObserver';

// Shorthand
type AnnotationBodyIdentifier = { id: string, annotation: string }; 

export type Store<T extends Annotation> = ReturnType<typeof createStore<T>>;

export function createStore<T extends Annotation>() {

  const annotationIndex = new Map<string, T>();

  const bodyIndex = new Map<string, string>();

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
      state: [...annotationIndex.values()]
    };

    observers.forEach(observer => {
      if (shouldNotify(observer, event))
        observer.onChange(event)
    });
  }

  const addAnnotation = (annotation: T, origin = Origin.LOCAL) => {
    const existing = annotationIndex.get(annotation.id);

    if (existing) {
      throw Error(`Cannot add annotation ${annotation.id} - exists already`);
    } else {
      annotationIndex.set(annotation.id, annotation);

      annotation.bodies.forEach(b => bodyIndex.set(b.id, annotation.id));

      emit(origin, { created: [annotation] });
    }
  }

  const addBody = (body: AnnotationBody, origin = Origin.LOCAL) => {
    const oldValue = annotationIndex.get(body.annotation);
    if (oldValue) {
      const newValue = { 
        ...oldValue,
        bodies: [ ...oldValue.bodies, body ]
      };

      annotationIndex.set(oldValue.id, newValue);

      bodyIndex.set(body.id, newValue.id);

      const update: Update<T> = {
        oldValue, newValue, bodiesCreated: [ body ]
      };

      emit(origin, { updated: [update] });
    } else {
      console.warn(`Attempt to add body to missing annotation: ${body.annotation}`);
    }
  }

  const all = () => [...annotationIndex.values()];

  const bulkAddAnnotation = (annotations: T[], replace = true, origin = Origin.LOCAL) => {
    if (replace) {
      // Delete existing first
      const deleted = [...annotationIndex.values()];
      annotationIndex.clear();
      bodyIndex.clear();

      annotations.forEach(annotation => {
        annotationIndex.set(annotation.id, annotation);
        annotation.bodies.forEach(b => bodyIndex.set(b.id, annotation.id));
      });

      emit(origin, { created: annotations, deleted });
    } else {
      // Don't allow overwriting of existing annotations
      const existing = annotations.reduce((all, next) => {
        const existing = annotationIndex.get(next.id);
        return existing ? [...all, existing ] : all;
      }, []);

      if (existing.length > 0)
        throw Error(`Bulk insert would overwrite the following annotations: ${existing.map(a => a.id).join(', ')}`);

      annotations.forEach(annotation => {
        annotationIndex.set(annotation.id, annotation);
        annotation.bodies.forEach(b => bodyIndex.set(b.id, annotation.id));
      });

      emit(origin, { created: annotations });
    }
  }

  const deleteAnnotation = (annotationOrId: T | string, origin = Origin.LOCAL) => {
    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;

    const existing = annotationIndex.get(id);
    if (existing) {
      annotationIndex.delete(id);
      existing.bodies.forEach(b => bodyIndex.delete(b.id));
      emit(origin, { deleted: [ existing ] });
    } else {
      console.warn(`Attempt to delete missing annotation: ${id}`);
    }
  }

  const deleteBody = (body: AnnotationBodyIdentifier, origin = Origin.LOCAL) => {
    const oldAnnotation = annotationIndex.get(body.annotation);

    if (oldAnnotation) {
      const oldBody = oldAnnotation.bodies.find(b => b.id === body.id);

      if (oldBody) {
        bodyIndex.delete(oldBody.id);

        const newAnnotation = {
          ...oldAnnotation,
          bodies: oldAnnotation.bodies.filter(b => b.id !== body.id)
        };

        annotationIndex.set(oldAnnotation.id, newAnnotation);

        const update: Update<T> = {
          oldValue: oldAnnotation, newValue: newAnnotation, bodiesDeleted: [oldBody]
        };

        emit(origin, { updated: [update] });
      } else {
        console.warn(`Attempt to delete missing body ${body.id} from annotation ${body.annotation}`);
      }
    } else {
      console.warn(`Attempt to delete body from missing annotation ${body.annotation}`);
    }
  }

  const getAnnotation = (id: string): T | undefined => {
    const a = annotationIndex.get(id);
    return a ? {...a} : undefined;
  }

  const getBody = (id: string): AnnotationBody | undefined => {
    const annotationId = bodyIndex.get(id);
    if (annotationId) {
      const annotation = getAnnotation(annotationId);
      const body = annotation.bodies.find(b => b.id === id);
      if (body) {
        return body;
      } else {
        console.error(`Store integrity error: body ${id} in index, but not in annotation`);
      }
    } else {
      console.warn(`Attempt to retrieve missing body: ${id}`);
    }
  }

  const updateOneBody = (oldBodyId: AnnotationBodyIdentifier, newBody: AnnotationBody) => {
    if (oldBodyId.annotation !== newBody.annotation)
      throw 'Annotation integrity violation: annotation ID must be the same when updating bodies';

    const oldAnnotation = annotationIndex.get(oldBodyId.annotation);
    if (oldAnnotation) {
      const oldBody = oldAnnotation.bodies.find(b => b.id === oldBodyId.id);

      const newAnnotation = { 
        ...oldAnnotation,
        bodies: oldAnnotation.bodies.map(b => b.id === oldBody.id ? newBody : b)
      };

      annotationIndex.set(oldAnnotation.id, newAnnotation);

      return {
        oldValue: oldAnnotation, 
        newValue: newAnnotation,
        bodiesUpdated: [{ oldBody, newBody }]
      }
    } else {
      console.warn(`Attempt to add body to missing annotation ${oldBodyId.annotation}`);
    }
  }

  const updateBody = (oldBodyId: AnnotationBodyIdentifier, newBody: AnnotationBody, origin = Origin.LOCAL) => {
    const update = updateOneBody(oldBodyId, newBody);
    emit(origin, { updated: [ update ]} );
  }

  const bulkUpdateBodies = (bodies: AnnotationBody[], origin = Origin.LOCAL) => {
    const updated = bodies.map(b => updateOneBody({ id: b.id, annotation: b.annotation }, b));
    emit(origin, { updated });
  }

  const updateOneTarget = (target: AnnotationTarget): Update<T> => {
    const oldValue = annotationIndex.get(target.annotation);
    
    if (oldValue) {
      const newValue = { 
        ...oldValue, 
        target: {
          ...oldValue.target,
          ...target 
        }
      };

      annotationIndex.set(oldValue.id, newValue);

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

  const bulkUpdateTargets = (targets: AnnotationTarget[], origin = Origin.LOCAL) => {
    const updated = targets.map(updateOneTarget)
    emit(origin, { updated });
  }

	return {
    addAnnotation,
    addBody,
    all,
    bulkAddAnnotation,
    bulkUpdateBodies,
    bulkUpdateTargets,
    deleteAnnotation,
    deleteBody,
    getAnnotation,
    getBody,
    observe,
    unobserve,
    updateBody,
    updateTarget
	};

}
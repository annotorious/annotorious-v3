import { Origin } from '@annotorious/core';
import type { Annotation, Store, StoreChangeEvent } from '@annotorious/core';
import { BroadcastEventType } from './Types';
import type { BroadcastEvent, CreateBodyEvent, CreateAnnotationEvent } from './Types';

/**
 * Returns a list of unique IDs of annotations that are 
 * affected the list of events.
 */
export const affectedAnnotations = (events: BroadcastEvent[]) => {
  const affectedAnnotations = events.reduce((annotationIds, e) => {
    if (e.type === BroadcastEventType.CREATE_ANNOTATION) {
      return [...annotationIds, e.annotation.id];
    } else if (e.type === BroadcastEventType.CREATE_BODY) {
      return [...annotationIds, e.body.annotation];
    } else if (e.type === BroadcastEventType.DELETE_BODY) {
      return [...annotationIds, e.annotation];
    } else if (e.type === BroadcastEventType.UPDATE_BODY) {
      return [...annotationIds, e.body.annotation];
    } else if (e.type === BroadcastEventType.UPDATE_TARGET) {
      return [...annotationIds, e.target.annotation];
    }
  }, [] as string[]);

  // Unique IDs only
  return Array.from(new Set(affectedAnnotations));
}

export const marshal = (storeEvents: StoreChangeEvent<Annotation>[], store: Store<Annotation>): BroadcastEvent[] =>
  storeEvents.reduce((all, storeEvent) => {
    const { created, deleted, updated } = storeEvent.changes;

    const createAnnotationEvents: BroadcastEvent[] = created.map(annotation => ({
      type: BroadcastEventType.CREATE_ANNOTATION, 
      annotation: {
        ...annotation,
        // Set target version to 1
        target: {
          ...annotation.target,
          version: 1
        }
      }
    }));

    const deleteAnnotationEvents: BroadcastEvent[] = deleted.map(annotation =>
      ({ type: BroadcastEventType.DELETE_ANNOTATION, id: annotation.id }));

    // Bodies may contain privacy-relevant information - we 
    // won't broadcast them for now, but rely on secured CDC events instead
    // const createBodyEvents: BroadcastEvent[] = updated
    //   .filter(update => update.bodiesCreated?.length > 0)
    //   .reduce((all, update) => ([
    //     ...all, 
    //    ...update.bodiesCreated.map(body => { return ({ 
    //       type: BroadcastEventType.CREATE_BODY, 
    //       body: { ...body, version: 1 } 
    //     }) })]
    //   ), []);

    const deleteBodyEvents: BroadcastEvent[] = updated
      .filter(update => update.bodiesDeleted?.length > 0)
      .reduce((all, update) => ([
        ...all, 
        ...update.bodiesDeleted.map(body => ({ 
          type: BroadcastEventType.DELETE_BODY, 
          id: body.id, 
          annotation: body.annotation 
        }))]
      ), []);

    // Bodies may contain privacy-relevant information - see above 
    // const updateBodyEvents: BroadcastEvent[] = updated
    //   .filter(update => update.bodiesUpdated?.length > 0)
    //   .reduce((all, update) => ([
    //     ...all,
    //     ...update.bodiesUpdated.map(({ newBody }) => ({
    //       type: BroadcastEventType.UPDATE_BODY,
    //       body: newBody
    //     }))]
    //   ), []);

    const updateTargetEvents: BroadcastEvent[] = updated
      .filter(update => update.targetUpdated)
      .reduce((all, update) => ([
        ...all,
        { type: BroadcastEventType.UPDATE_TARGET, target: update.targetUpdated.newTarget }
      ]), []);

    // Apply version updates to the store
    const createdTargets = 
      createAnnotationEvents.map(evt => (evt as CreateAnnotationEvent).annotation.target);

    if (createdTargets.length > 0) {
      store.bulkUpdateTargets(createdTargets, Origin.REMOTE);
    }

    // Versioned copies of the created bodies
    // const createdBodies = 
    //   createBodyEvents.map(evt => (evt as CreateBodyEvent).body);

    // if (createdBodies.length > 0)
    //   store.bulkUpdateBodies(createdBodies, Origin.REMOTE);

    return [
      ...all,
      ...createAnnotationEvents,
      ...deleteAnnotationEvents,
      // ...createBodyEvents,
      ...deleteBodyEvents,
      // ...updateBodyEvents,
      ...updateTargetEvents
    ];
  }, []);

const reviveDateFields = (obj: any, keyOrKeys: string | string[]) => {
  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [ keyOrKeys ];

  keys.forEach(key => {
    if (obj[key])
      obj[key] = new Date(obj[key]);
  });

  return obj;
}

const reviveDates = (event: BroadcastEvent) => {
  if (event.type === BroadcastEventType.CREATE_ANNOTATION) {
    return { 
      ...event,
      annotation: {
        ...event.annotation,
        target: reviveDateFields(event.annotation.target, ['created', 'updated']),
        bodies: event.annotation.bodies.map(b => reviveDateFields(b, ['created', 'updated']))
      }
    }
  } else if (event.type === BroadcastEventType.CREATE_BODY || event.type === BroadcastEventType.UPDATE_BODY) {
    return {
      ...event,
      body: reviveDateFields(event.body, ['created', 'updated'])
    }
  } else if (event.type === BroadcastEventType.UPDATE_TARGET) {
    return  {
      ...event,
      target: reviveDateFields(event.target, ['created', 'updated'])
    }
  } else {
    return event;
  }
}
  
export const apply = (store: Store<Annotation>, event: BroadcastEvent) => {
  const e = reviveDates(event);

  if (e.type === BroadcastEventType.CREATE_ANNOTATION) {
    store.addAnnotation(e.annotation, Origin.REMOTE);
  } else if (e.type === BroadcastEventType.DELETE_ANNOTATION) {
    store.deleteAnnotation(e.id, Origin.REMOTE);
  } else if (e.type === BroadcastEventType.CREATE_BODY) {
    store.addBody(e.body, Origin.REMOTE);
  } else if (e.type === BroadcastEventType.DELETE_BODY) {
    store.deleteBody({ id: e.id, annotation: e.annotation }, Origin.REMOTE);
  } else if (e.type === BroadcastEventType.UPDATE_BODY) {
    const { id, annotation } = e.body;
    store.updateBody({ id, annotation }, e.body, Origin.REMOTE);
  } else if (e.type === BroadcastEventType.UPDATE_TARGET) {
    store.updateTarget(e.target, Origin.REMOTE);
  }
}

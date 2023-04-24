import { Origin } from '@annotorious/core';
import type { Annotation, Store, StoreChangeEvent } from '@annotorious/core';
import { type BroadcastEvent, BroadcastEventType } from './Types';

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

export const marshal = (storeEvents: StoreChangeEvent<Annotation>[]): BroadcastEvent[] =>
  storeEvents.reduce((all, storeEvent) => {
    const { created, deleted, updated } = storeEvent.changes;

    const createAnnotation: BroadcastEvent[] = created.map(annotation => 
      ({ type: BroadcastEventType.CREATE_ANNOTATION, annotation }));

    const deleteAnnotation: BroadcastEvent[] = deleted.map(annotation =>
      ({ type: BroadcastEventType.DELETE_ANNOTATION, id: annotation.id }));

    const createBody: BroadcastEvent[] = updated
      .filter(update => update.bodiesCreated?.length > 0)
      .reduce((all, update) => ([
        ...all, 
        ...update.bodiesCreated.map(body => ({ 
          type: BroadcastEventType.CREATE_BODY, 
          body 
        }))]
      ), []);

    const deleteBody: BroadcastEvent[] = updated
      .filter(update => update.bodiesDeleted?.length > 0)
      .reduce((all, update) => ([
        ...all, 
        ...update.bodiesDeleted.map(body => ({ 
          type: BroadcastEventType.DELETE_BODY, 
          id: body.id, 
          annotation: body.annotation 
        }))]
      ), []);

    const updateBody: BroadcastEvent[] = updated
      .filter(update => update.bodiesUpdated?.length > 0)
      .reduce((all, update) => ([
        ...all,
        ...update.bodiesUpdated.map(({ newBody }) => ({
          type: BroadcastEventType.UPDATE_BODY,
          body: newBody
        }))]
      ), []);

    const updateTarget: BroadcastEvent[] = updated
      .filter(update => update.targetUpdated)
      .reduce((all, update) => ([
        ...all,
        { type: BroadcastEventType.UPDATE_TARGET, target: update.targetUpdated.newTarget }
      ]), []);

    return [
      ...all,
      ...createAnnotation,
      ...deleteAnnotation,
      ...createBody,
      ...deleteBody,
      ...updateBody,
      ...updateTarget
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

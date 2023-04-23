import { Origin } from '@annotorious/core';
import type { Annotation, Store, StoreChangeEvent } from '@annotorious/core';
import { type BroadcastChangeEvent, BroadcastChangeEventType } from './Types';

export const marshal = (storeEvents: StoreChangeEvent<Annotation>[]): BroadcastChangeEvent[] =>
  storeEvents.reduce((all, storeEvent) => {
    const { created, deleted, updated } = storeEvent.changes;

    const createAnnotation: BroadcastChangeEvent[] = created.map(annotation => 
      ({ type: BroadcastChangeEventType.CREATE_ANNOTATION, annotation }));

    const deleteAnnotation: BroadcastChangeEvent[] = deleted.map(annotation =>
      ({ type: BroadcastChangeEventType.DELETE_ANNOTATION, id: annotation.id }));

    const createBody: BroadcastChangeEvent[] = updated
      .filter(update => update.bodiesCreated?.length > 0)
      .reduce((all, update) => ([
        ...all, 
        ...update.bodiesCreated.map(body => ({ 
          type: BroadcastChangeEventType.CREATE_BODY, 
          body 
        }))]
      ), []);

    const deleteBody: BroadcastChangeEvent[] = updated
      .filter(update => update.bodiesDeleted?.length > 0)
      .reduce((all, update) => ([
        ...all, 
        ...update.bodiesDeleted.map(body => ({ 
          type: BroadcastChangeEventType.DELETE_BODY, 
          id: body.id, 
          annotation: body.annotation 
        }))]
      ), []);

    const updateBody: BroadcastChangeEvent[] = updated
      .filter(update => update.bodiesUpdated?.length > 0)
      .reduce((all, update) => ([
        ...all,
        ...update.bodiesUpdated.map(({ newBody }) => ({
          type: BroadcastChangeEventType.UPDATE_BODY,
          body: newBody
        }))]
      ), []);

    const updateTarget: BroadcastChangeEvent[] = updated
      .filter(update => update.targetUpdated)
      .reduce((all, update) => ([
        ...all,
        { type: BroadcastChangeEventType.UPDATE_TARGET, target: update.targetUpdated.newTarget }
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

const reviveDates = (event: BroadcastChangeEvent) => {
  if (event.type === BroadcastChangeEventType.CREATE_ANNOTATION) {
    return { 
      ...event,
      annotation: {
        ...event.annotation,
        target: reviveDateFields(event.annotation.target, ['created', 'updated']),
        bodies: event.annotation.bodies.map(b => reviveDateFields(b, ['created', 'updated']))
      }
    }
  } else if (event.type === BroadcastChangeEventType.CREATE_BODY || event.type === BroadcastChangeEventType.UPDATE_BODY) {
    return {
      ...event,
      body: reviveDateFields(event.body, ['created', 'updated'])
    }
  } else if (event.type === BroadcastChangeEventType.UPDATE_TARGET) {
    return  {
      ...event,
      target: reviveDateFields(event.target, ['created', 'updated'])
    }
  } else {
    return event;
  }
}
  
export const apply = (store: Store<Annotation>, event: BroadcastChangeEvent) => {
  const e = reviveDates(event);

  if (e.type === BroadcastChangeEventType.CREATE_ANNOTATION) {
    store.addAnnotation(e.annotation, Origin.REMOTE);
  } else if (e.type === BroadcastChangeEventType.DELETE_ANNOTATION) {
    store.deleteAnnotation(e.id, Origin.REMOTE);
  } else if (e.type === BroadcastChangeEventType.CREATE_BODY) {
    store.addBody(e.body, Origin.REMOTE);
  } else if (e.type === BroadcastChangeEventType.DELETE_BODY) {
    store.deleteBody({ id: e.id, annotation: e.annotation }, Origin.REMOTE);
  } else if (e.type === BroadcastChangeEventType.UPDATE_BODY) {
    const { id, annotation } = e.body;
    store.updateBody({ id, annotation }, e.body, Origin.REMOTE);
  } else if (e.type === BroadcastChangeEventType.UPDATE_TARGET) {
    store.updateTarget(e.target, Origin.REMOTE);
  }
}

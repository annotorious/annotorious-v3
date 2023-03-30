import { Annotation, Origin, Store, StoreChangeEvent } from '@annotorious/core';
import { BroadcastEvent, BroadcastEventType } from './BroadcastMessage';

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

export const reviveDates = (event: BroadcastEvent) => {
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
  if (event.type === BroadcastEventType.CREATE_ANNOTATION) {
    store.addAnnotation(event.annotation, Origin.REMOTE);
  } else if (event.type === BroadcastEventType.DELETE_ANNOTATION) {
    store.deleteAnnotation(event.id, Origin.REMOTE);
  } else if (event.type === BroadcastEventType.CREATE_BODY) {
    store.addBody(event.body, Origin.REMOTE);
  } else if (event.type === BroadcastEventType.DELETE_BODY) {
    store.deleteBody({ id: event.id, annotation: event.annotation }, Origin.REMOTE);
  } else if (event.type === BroadcastEventType.UPDATE_BODY) {
    const { id, annotation } = event.body;
    store.updateBody({ id, annotation }, event.body, Origin.REMOTE);
  } else if (event.type === BroadcastEventType.UPDATE_TARGET) {
    store.updateTarget(event.target, Origin.REMOTE);
  }
}

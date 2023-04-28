import { Annotation, AnnotationLayer, Origin } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from 'src/SupabasePluginEvents';
import type { AnnotationChangeEvent, BodyChangeEvent, ChangeEvent, TargetChangeEvent } from '../Types';
import { resolveBodyChange, resolveTargetChange } from './pgCDCMessageResolver';

export const createReceiver = (anno: AnnotationLayer<Annotation>, channel: RealtimeChannel, emitter: Emitter<SupabasePluginEvents>) => {

  const { store } = anno;

  /**
   * After DELETE ANNOTATION:
   * - Check if annotation exists.
   * - Delete if it does.
   */
  const onDeleteAnnotation = (event: AnnotationChangeEvent) => {
    const { id } = event.old;

    const annotation = store.getAnnotation(id);
    if (annotation) {
      store.deleteAnnotation(id, Origin.REMOTE);
    }
  }

  /**
   * After INSERT BODY:
   * - Check if annotation exists.
   * - If it does not: throw INTEGRITY ERROR if it does not.
   * - If it does: check if body exists.
   * - If it does: update if different.
   * - If it does not: insert.
   */
  const onUpsertBody = (event: BodyChangeEvent) => {
    const { annotation_id, id, version } = event.new;

    const annotation = store.getAnnotation(annotation_id);

    if (annotation) {
      const existingBody = annotation.bodies.find(b => b.id === id);

      if (existingBody) {
        if (existingBody.version <= version) {
          store.updateBody(existingBody, resolveBodyChange(event), Origin.REMOTE);
        }
      } else {
        // Body doesn't exist - add
        store.addBody(resolveBodyChange(event), Origin.REMOTE);
      }
    } else {
      emitter.emit('integrityError', 'Attempt to upsert body on missing annotation: ' + annotation_id);
    }
  }

  /**
   * After DELETE BODY:
   * - Check if body exists.
   * - Delete if it does.
   * - Throw INTEGRITY ERROR if not.
   */
  const onDeleteBody = (event: BodyChangeEvent) => {
    const body = store.getBody(event.old.id);
    if (body) {
      store.deleteBody(body, Origin.REMOTE);
    } else {
      emitter.emit('integrityError', 'Attempt to delete missing body: ' + event.old.id);
    }
  }

  /** 
   * After INSERT TARGET:
   * 1. check if annotation exists.
   * 2. if it does: update target if different.
   * 3. if it doesn't: create annotation with target.
   */
  const onInsertTarget = (event: TargetChangeEvent) => {
    const { annotation_id, version } = event.new;

    const annotation = store.getAnnotation(annotation_id);

    if (annotation) {
      if (annotation.target.version <= version)
        store.updateTarget(resolveTargetChange(event), Origin.REMOTE);
    } else {
      store.addAnnotation({
        id: annotation_id,
        bodies: [],
        target: resolveTargetChange(event)
      }, Origin.REMOTE);
    }
  }

  /** 
   * After UPDATE TARGET:
   * 1. check if annotation exists.
   * 2. update target if different.
   * 
   * Throw integrity error if annotation does not exist.
   */
  const onUpdateTarget = (event: TargetChangeEvent) => {
    const { annotation_id, version } = event.new;

    const annotation = store.getAnnotation(annotation_id);

    if (annotation) {
      if (annotation.target.version <= version) {
        store.updateTarget(resolveTargetChange(event), Origin.REMOTE);
      }
    } else {
      emitter.emit('integrityError', 'Attempt to update target on missing annotation: ' + annotation_id);
    }
  }

  channel.on(
    'postgres_changes', 
    { 
      event: '*', 
      schema: 'public' 
    }, (payload) => {
      const event = payload as unknown as ChangeEvent;

      const { table, eventType } = event;

      console.log('CDC event', table, eventType);

      if (table === 'annotations' && eventType === 'DELETE') {
        onDeleteAnnotation(event);
      } else if (table === 'bodies' && eventType === 'INSERT') {
        onUpsertBody(event);
      } else if (table === 'bodies' && eventType === 'UPDATE') {
        onUpsertBody(event);
      } else if (table === 'bodies' && eventType === 'DELETE') {
        onDeleteBody(event);
      } else if (table === 'targets' && eventType === 'INSERT') {
        onInsertTarget(event);
      } else if (table === 'targets' && eventType === 'UPDATE') {
        onUpdateTarget(event);
      }  
    });
  
}
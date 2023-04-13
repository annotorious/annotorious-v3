import { Annotation, AnnotationBody, AnnotationLayer, AnnotationTarget, Origin, SignedIn, User, UserType } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import equal from 'deep-equal';
import type { AnnotationRecord, ChangeEvent, ProfileRecord } from './PostgresSchema';

const hasTargetChanged = (oldValue: Annotation, newValue: Annotation) => 
  !equal(oldValue.target, newValue.target);

const bodiesAdded = (oldValue: Annotation, newValue: Annotation, anno: AnnotationLayer<Annotation>) => {
  const oldBodyIds = new Set(oldValue.bodies.map(b => b.id));

  const added = newValue.bodies.filter(b => !oldBodyIds.has(b.id));

  if (added.some(b => b.creator.id !== anno.getUser().id)) {
    console.error('Integrity exception: invalid creator on added body', added);
    console.error('Current user:', anno.getUser());
    throw 'Integrity exception: invalid creator on added body';
  }

  return added;
}

const bodiesRemoved = (oldValue: Annotation, newValue: Annotation) => {
  const newBodyIds = new Set(oldValue.bodies.map(b => b.id));
  return oldValue.bodies.filter(b => !newBodyIds.has(b.id));
}

const bodiesChanged = (oldValue: Annotation, newValue: Annotation, anno: AnnotationLayer<Annotation>) => 
  newValue.bodies.filter(newBody => {
    const oldBody = oldValue.bodies.find(b => b.id === newBody.id);
    return oldBody ? !equal(oldBody, newBody) : false;
  });

const toAnnotation = (record: AnnotationRecord) => {
  if (record.targets.length === 0)
    throw { message: 'Invalid annotation: target missing', record };

  if (record.targets.length > 1)
    console.warn('Invalid annotation: too many targets', record);

  const toUser = (p: ProfileRecord): SignedIn => p ? ({
    type: UserType.SIGNED_IN,
    id: p.id,
    name: p.nickname,
    email: p.email,
    avatar: p.avatar_url
  }) : null;

  const t = record.targets[0];

  const target: AnnotationTarget = {
    annotation: t.annotation_id,
    selector: JSON.parse(t.value),
    creator: toUser(t.created_by),
    created: new Date(t.created_at),
    updatedBy: toUser(t.created_by),
    updated: t.updated_at ? new Date(t.updated_at) : null
  };

  const bodies: AnnotationBody[] = record.bodies.map(body => ({
    id: body.id,
    annotation: body.annotation_id,
    purpose: body.purpose,
    value: JSON.parse(body.value),
    creator: toUser(body.created_by),
    created: new Date(body.created_at),
    updatedBy: toUser(body.updated_by),
    updated: t.updated_at ? new Date(t.updated_at) : null
  }));

  return {
    id: record.id,
    target,
    bodies
  };
}

export const PostgresConnector = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient, channel: RealtimeChannel) => {

  const createAnnotation = (a: Annotation) => supabase
    .from('annotations')
    .insert({
      id: a.id,
      created_at: new Date(),
      created_by: anno.getUser().id
    });

  const createBody = (b: AnnotationBody) => supabase
    .from('bodies')
    .insert({
      id: b.id,
      created_at: b.created,
      created_by: anno.getUser().id,
      updated_at: b.created,
      updated_by: anno.getUser().id,
      annotation_id: b.annotation,
      purpose: b.purpose,
      value: b.value
    });

  const createTarget = (t: AnnotationTarget) => {
    console.log('CREATING TARGET')
    return supabase
      .from('targets')
      .insert({
        created_at: t.created,
        created_by: anno.getUser().id,
        updated_at: t.created,
        updated_by: anno.getUser().id,
        annotation_id: t.annotation,
        value: JSON.stringify(t.selector)
      });
  }

  const updateTarget = (t: AnnotationTarget) => {
    console.log('UPDATING TARGET');

    return supabase
      .from('targets')
      .update({
        updated_at: t.updated,
        updated_by: anno.getUser().id,
        value: JSON.stringify(t.selector)
      })
      .eq('annotation_id', t.annotation);
  }

  const onCreateAnnotation = (a: Annotation) => createAnnotation(a)
    .then(() => createTarget(a.target))
    .then(({ error, status }) => {
      if (status !== 201) {
        console.error(error);
        throw 'Error storing annotation';
      }
    });

  const onDeleteAnnotation = (a: Annotation) => {
    // TODO
    console.log('deleting', a);
  }

  const onUpdateAnnotation = (a: Annotation, previous: Annotation) => {
    if (hasTargetChanged(previous, a))
      updateTarget(a.target).then(() => console.log('updated', previous, 'with', a));

    const add = bodiesAdded(previous, a, anno);
    const drop = bodiesRemoved(previous, a);
    const update = bodiesChanged(previous, a, anno);

    console.log('Body updates:', { add, drop, update });

    // TODO
  }

  anno.on('createAnnotation', onCreateAnnotation);
  anno.on('deleteAnnotation', onDeleteAnnotation);
  anno.on('updateAnnotation', onUpdateAnnotation);

  channel.on(
    'postgres_changes', 
    { 
      event: '*', 
      schema: 'public'
    }, (payload) => {
      const event = payload as unknown as ChangeEvent;
      console.log('[PG Rx]', event.commit_timestamp);

      if (event.table === 'targets') {
        const t = event.new;

        console.log('updating target', t);

        const toUser = (p: ProfileRecord): SignedIn => p ? ({
          type: UserType.SIGNED_IN,
          id: p.id,
          name: p.nickname,
          email: p.email,
          avatar: p.avatar_url
        }) : null;

        const target: AnnotationTarget = {
          annotation: t.annotation_id,
          selector: JSON.parse(t.value),
          creator: toUser(t.created_by),
          created: new Date(t.created_at),
          updatedBy: toUser(t.created_by),
          updated: t.updated_at ? new Date(t.updated_at) : null
        };

        anno.store.updateTarget(target);
      }
    });

  // Initial load
  supabase.from('annotations').select(`
    id,
    targets ( 
      annotation_id,
      created_at,
      created_by:profiles!targets_created_by_fkey(
        id,
        email,
        nickname,
        first_name,
        last_name,
        avatar_url
      ),
      updated_at,
      updated_by:profiles!targets_updated_by_fkey(
        id,
        email,
        nickname,
        first_name,
        last_name,
        avatar_url
      ),
      version,
      value
    ),
    bodies ( 
      id,
      annotation_id,
      created_at,
      created_by:profiles!bodies_created_by_fkey(
        id,
        email,
        nickname,
        first_name,
        last_name,
        avatar_url
      ),
      updated_at,
      updated_by:profiles!bodies_updated_by_fkey(
        id,
        email,
        nickname,
        first_name,
        last_name,
        avatar_url
      ),
      version,
      purpose,
      value
    )
  `).then(({ data, error }) => {
    if (!error) {
      const annotations = (data as AnnotationRecord[]).map(toAnnotation);
      console.log(annotations);
      anno.store.bulkAddAnnotation(annotations, true, Origin.REMOTE);
    } else {
      console.error('Initial load failed', error);
    }
  })

  return {
    destroy: () => {
      anno.off('createAnnotation', onCreateAnnotation);
      anno.off('deleteAnnotation', onDeleteAnnotation);
      anno.off('updateAnnotation', onUpdateAnnotation);
    }
  }

}

import type { Annotation, AnnotationBody, AnnotationLayer, AnnotationTarget } from '@annotorious/core';
import type { SupabaseClient } from '@supabase/supabase-js';

export const pgOps = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient) => {

  const initialLoad = () =>
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
    `);

  const createAnnotation = (a: Annotation) => supabase
    .from('annotations')
    .insert({
      id: a.id,
      created_at: new Date(),
      created_by: anno.getUser().id
    });

  const upsertBodies = (bodies: AnnotationBody[]) => supabase
    .from('bodies')
    .upsert(bodies.map(b => ({
      id: b.id,
      created_at: b.created,
      created_by: anno.getUser().id,
      updated_at: b.created,
      updated_by: anno.getUser().id,
      annotation_id: b.annotation,
      purpose: b.purpose,
      value: b.value
    })))
    .select();

  const createTarget = (t: AnnotationTarget) => supabase
    .from('targets')
    .insert({
      created_at: t.created,
      created_by: anno.getUser().id,
      updated_at: t.created,
      updated_by: anno.getUser().id,
      annotation_id: t.annotation,
      value: JSON.stringify(t.selector)
    });

  const deleteAnnotation = (a: Annotation) => supabase
    .from('annotations')
    .delete()
    .eq('id', a.id);
  
  const deleteBodies = (b: AnnotationBody[]) => supabase
    .from('bodies')
    .delete()
    .in('id', b.map(body => body.id));

  const updateTarget = (t: AnnotationTarget) => supabase
    .from('targets')
    .update({
      updated_at: t.updated,
      updated_by: anno.getUser().id,
      value: JSON.stringify(t.selector)
    })
    .eq('annotation_id', t.annotation);

  return {
    createAnnotation,
    createTarget,
    deleteAnnotation,
    deleteBodies,
    initialLoad,
    updateTarget,
    upsertBodies
  }

}

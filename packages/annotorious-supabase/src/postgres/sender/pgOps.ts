import { Origin } from '@annotorious/core';
import type { Annotation, AnnotationBody, AnnotationLayer, AnnotationTarget } from '@annotorious/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestBuilder, PostgrestSingleResponse } from '@supabase/postgrest-js';

export const pgOps = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient) => {

  const { store } = anno;

  // Generic Supabase retry handler
  const withRetry = async (requestFn: () => PostgrestBuilder<{ [x: string]: any}[]>, retries: number = 3) => {
    return new Promise<PostgrestSingleResponse<{ [x: string]: any}[]>>((resolve, reject) => {
      const doRequest = () => requestFn().then(response => {
        if (response.error || !(response.data?.length > 0)) {
          if (retries > 0) {
            retries--;
            console.warn('[PG] Supbase save error - retrying');
            setTimeout(doRequest, 250);
          } else {
            reject('Too many retries');
          }
        } else {
          resolve(response);
        } 
      });

      doRequest();
    });
  }

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

  const createAnnotation = (a: Annotation) => {
    console.log('[PG] Creating annotation');

    const versioned = {
      ...a.target,
      version: 1
    };

    store.updateTarget(versioned, Origin.REMOTE);
    
    return supabase
      .from('annotations')
      .insert({
        id: a.id,
        created_at: new Date(),
        created_by: anno.getUser().id
      });
  }

  const upsertBodies = (bodies: AnnotationBody[]) => {
    // Increment body version numbers
    const versioned = bodies.map(b => ({
      ...b,
      version: b.version ? b.version + 1 : 1
    }));

    store.bulkUpdateBodies(versioned, Origin.REMOTE);

    return supabase
      .from('bodies')
      .upsert(versioned.map(b => ({
        id: b.id,
        created_at: b.created,
        created_by: anno.getUser().id,
        updated_at: b.created,
        updated_by: anno.getUser().id,
        annotation_id: b.annotation,
        purpose: b.purpose,
        value: b.value
      })));
  }

  const createTarget = (t: AnnotationTarget) => supabase
    .from('targets')
    .insert({
      created_at: t.created,
      created_by: anno.getUser().id,
      updated_at: t.created,
      updated_by: anno.getUser().id,
      annotation_id: t.annotation,
      value: JSON.stringify(t.selector)
    })
    .select();

  const deleteAnnotation = (a: Annotation) => supabase
    .from('annotations')
    .delete()
    .eq('id', a.id);
  
  const deleteBodies = (b: AnnotationBody[]) => supabase
    .from('bodies')
    .delete()
    .in('id', b.map(body => body.id));

  const updateTarget = (t: AnnotationTarget, retries = 3) => {
    console.log('[PG] Updating target');

    // Increment target version number
    const versioned = {
      ...t,
      version: t.version ? t.version + 1 : 1
    };

    store.updateTarget(versioned, Origin.REMOTE);
    
    return withRetry(() => supabase
      .from('targets')
      .update({
        updated_at: versioned.updated,
        updated_by: anno.getUser().id,
        value: JSON.stringify(versioned.selector)
      })
      .eq('annotation_id', versioned.annotation)
      .select());
  }

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

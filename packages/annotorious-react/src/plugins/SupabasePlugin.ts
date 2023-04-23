import { useEffect } from 'react';
import { Annotation, PresentUser } from '@annotorious/core';
import { type SupabasePluginConfig, SupabasePlugin as Supabase } from '@annotorious/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import { useAnnotationLayer } from '../useAnnotationLayer';

export interface SupabasePluginProps extends SupabasePluginConfig {

  onInitialLoad(annotations: Annotation[]): void;

  onInitialLoadError(error: PostgrestError): void;

  onIntegrityError(message: string): void;

  onPresence(users: PresentUser[]): void;

  onSaveError(error: PostgrestError): void;

  onSelectionChange(user: PresentUser): void;

}

export const SupabasePlugin = (props: SupabasePluginProps) => {

  const anno = useAnnotationLayer();

  useEffect(() => {
    const supabase = Supabase(anno, props);
    
    supabase.connect();

    supabase.on('initialLoad', annotations => props.onInitialLoad && props.onInitialLoad(annotations));
    supabase.on('initialLoadError', error => props.onInitialLoadError && props.onInitialLoadError(error));
    supabase.on('integrityError', message => props.onIntegrityError && props.onIntegrityError(message));
    supabase.on('presence', users => props.onPresence && props.onPresence(users));
    supabase.on('saveError', error => props.onSaveError && props.onSaveError(error));
    supabase.on('selectionChange', user => props.onSelectionChange && props.onSelectionChange(user));

    return () => supabase.destroy();
  }, [props.onPresence]);

  return null;

}
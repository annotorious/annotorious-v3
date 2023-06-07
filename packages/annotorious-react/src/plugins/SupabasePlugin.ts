import { useEffect, useState } from 'react';
import { Annotation, PresentUser } from '@annotorious/core';
import { type SupabasePluginConfig, SupabasePlugin as Supabase } from '@annotorious/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import { useAnnotator } from 'src/Annotorious';

export interface SupabasePluginProps extends SupabasePluginConfig {

  privacyMode?: boolean

  onInitialLoad?(annotations: Annotation[]): void;

  onInitialLoadError?(error: PostgrestError): void;

  onIntegrityError?(message: string): void;

  onPresence?(users: PresentUser[]): void;

  onSaveError?(error: PostgrestError): void;

  onSelectionChange?(user: PresentUser): void;

}

export const SupabasePlugin = (props: SupabasePluginProps) => {

  const anno = useAnnotator();

  const [plugin, setPlugin] = useState<ReturnType<typeof Supabase>>(null);

  useEffect(() => {
    if (anno) {
      console.log('Running Supabase plugin setup effect');

      const supabase = Supabase(anno, props);
      
      supabase.connect();

      supabase.on('initialLoad', annotations => props.onInitialLoad && props.onInitialLoad(annotations));
      supabase.on('initialLoadError', error => props.onInitialLoadError && props.onInitialLoadError(error));
      supabase.on('integrityError', message => props.onIntegrityError && props.onIntegrityError(message));
      supabase.on('presence', users => props.onPresence && props.onPresence(users));
      supabase.on('saveError', error => props.onSaveError && props.onSaveError(error));
      supabase.on('selectionChange', user => props.onSelectionChange && props.onSelectionChange(user));

      setPlugin(supabase);

      return () => {
        supabase.destroy();
      }
    }
  }, [
    anno, 
    props.onInitialLoad,
    props.onInitialLoadError,
    props.onIntegrityError,
    props.onPresence,
    props.onSaveError,
    props.onSelectionChange
  ]);

  useEffect(() => {
    if (plugin)
      plugin.privacyMode = props.privacyMode;
  }, [props.privacyMode, plugin])

  return null;

}
import { useEffect } from 'react';
import { PresentUser } from '@annotorious/core';
import { type SupabasePluginConfig, SupabasePlugin as Supabase } from '@annotorious/supabase';
import { useAnnotationLayer } from '../useAnnotationLayer';

export interface SupabasePluginProps extends SupabasePluginConfig {

  onPresence(users: PresentUser[]): void;

}

export const SupabasePlugin = (props: SupabasePluginProps) => {

  const anno = useAnnotationLayer();

  useEffect(() => {
    const supabase = Supabase(anno, props);
    
    supabase.connect();

    supabase.on('presence', props.onPresence);

    return () => supabase.destroy();
  }, [props.onPresence]);

  return null;

}
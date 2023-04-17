import { useEffect } from 'react';
import { PresentUser } from '@annotorious/core';
import { type SupabasePluginConfig, SupabasePlugin as Supabase } from '@annotorious/supabase';
import { useAnnotationLayer } from '../AnnotationLayerContext';

export interface SupabasePluginProps extends SupabasePluginConfig {

  onPresence(users: PresentUser[]): void;

}

export const SupabasePlugin = (props: SupabasePluginProps) => {

  const anno = useAnnotationLayer();

  useEffect(() => {
    const supabase = Supabase(anno, props);
    
    supabase.connect();
    supabase.auth.getUser().then(data => {
       anno.setUser({ id: data.id, name: data.email });
       supabase.setUser({ id: data.id, name: data.email });
    });

    supabase.on('presence', props.onPresence);

    return () => supabase.disconnect();
  }, [props.onPresence]);

  return null;

}
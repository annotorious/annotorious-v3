import type { Annotation, PresenceEvents } from '@annotorious/core';
import type { PostgrestError } from '@supabase/supabase-js';

export interface SupabasePluginEvents extends PresenceEvents {

  initialLoad: (annotations: Annotation[]) => void;

  initialLoadError: (error: PostgrestError) => void;

  saveError: (message: PostgrestError) => void;

  integrityError: (message: string) => void;

}
import type { Annotation, PresenceEvents, User } from '@annotorious/core';
import type { PostgrestError } from '@supabase/supabase-js';

export interface SupabasePluginEvents extends PresenceEvents {

  initialLoad: (annotations: Annotation[]) => void;

  initialLoadError: (error: PostgrestError) => void;

  saveError: (message: PostgrestError) => void;

  selectionChanged: (from: User & { presenceKey: string }, selection: string[] | null) => void;

  integrityError: (message: string) => void;

}
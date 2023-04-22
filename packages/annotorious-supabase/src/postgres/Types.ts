export interface AnnotationRecord {

  id: string;

  targets: TargetRecord[];

  bodies: BodyRecord[];

}

export interface TargetRecord {

  annotation_id: string;

  created_at: string;

  created_by: ProfileRecord;

  updated_at?: string;

  updated_by?: ProfileRecord;

  version?: number;

  value: string;

}

export interface BodyRecord {

  id: string;

  annotation_id: string;

  created_at: string;

  created_by: ProfileRecord;

  updated_at?: string;

  updated_by?: ProfileRecord;

  version?: number;

  purpose?: string;

  value: string;

}

export interface ProfileRecord {

  id: string;

  email: string;

  nickname?: string;

  first_name?: string;

  last_name?: string;

  avatar_url?: string;

}

export type AnnotationChangeEvent = {

  table: 'annotations';

  commit_timestamp: string;

  eventType: 'UPDATE' | 'INSERT' | 'DELETE';

  new: { annotation_id: string }

}

export type TargetChangeEvent = {

  table: 'targets';

  commit_timestamp: string;

  eventType: 'UPDATE' | 'INSERT' | 'DELETE';

  new: TargetRecord;

  old: { id: string }

}

export type BodyChangeEvent = {

  table: 'bodies';

  commit_timestamp: string;

  eventType: 'UPDATE' | 'INSERT' | 'DELETE';

  new: BodyRecord;

  old: { id: string }

}

export type ChangeEvent = AnnotationChangeEvent | TargetChangeEvent | BodyChangeEvent;
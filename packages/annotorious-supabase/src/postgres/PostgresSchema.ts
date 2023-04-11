import type { AnnotationTarget } from '@annotorious/core';

export interface AnnotationRecord {

  id: string;

  created_at: string;

  created_by: string;

  updated_at?: string;

  updated_by?: string;

  version?: number;

  targets: TargetRecord[];

  bodies: BodyRecord[];

}

export interface TargetRecord {

  id: string;

  created_at: string;

  created_by: string;

  updated_at?: string;

  updated_by?: string;

  version?: number;

  annotation_id: string;

  value: string;

}

export interface BodyRecord {

  id: string;

  created_at: string;

  created_by: string;

  updated_at?: string;

  updated_by?: string;

  version?: number;

  annotation_id: string;

  purpose?: string;

  value: string;

}

/*
export const toAnnotation = (record: AnnotationRecord) => {
  if (record.targets.length === 0)
    throw { message: 'Invalid annotation: target missing', record };

  if (record.targets.length > 1)
    console.warn('Invalid annotation: too many targets', record);

  const t = record.targets[0];

  const target: AnnotationTarget = {
    
    annotation: t.annotation_id,

    selector: JSON.parse(t.value),

    creator: t.created_by

//
  annotation: string;

  selector: AbstractSelector;

  creator?: User;

  created?: Date;

  updatedBy?: User;

  updated?: Date;
*/

// }
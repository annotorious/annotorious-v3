import type { AnnotationBody, AnnotationTarget } from '@annotorious/core';
import type { BodyChangeEvent, TargetChangeEvent } from '../Types';

export const resolveBodyChange = (event: BodyChangeEvent): AnnotationBody => {
  const b = event.new;

  return {
    id: b.id,
    annotation: b.annotation_id,
    purpose: b.purpose,
    value: JSON.parse(b.value),
    creator: undefined, // TODO parseProfileRecord(body.created_by),
    created: new Date(b.created_at),
    updatedBy: undefined, // TODO parseProfileRecord(body.updated_by),
    updated: b.updated_at ? new Date(b.updated_at) : null
  }
}

export const resolveTargetChange = (event: TargetChangeEvent): AnnotationTarget => {
  const t = event.new;

  return {
    annotation: t.annotation_id,
    selector: JSON.parse(t.value),
    creator: undefined, // TODO parseProfileRecord(target.created_by),
    created: new Date(t.created_at),
    updatedBy: undefined, // TODO parseProfileRecord(target.created_by),
    updated: t.updated_at ? new Date(t.updated_at) : null
  }
}
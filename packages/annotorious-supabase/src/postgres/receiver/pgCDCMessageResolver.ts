import { Annotation, AnnotationBody, AnnotationTarget, getCollaborators, PresentUser } from '@annotorious/core';
import type { BodyChangeEvent, TargetChangeEvent } from '../Types';

const findUser = (id: string, presentUsers: PresentUser[], annotation?: Annotation) => {
  if (!id)
    return;

  // Check if this user is already in this annotation
  if (annotation) {
    const collaborator = getCollaborators(annotation).find(u => u.id === id);
    if (collaborator)
      return collaborator;
  }

  // Last resort: check if this user is present
  return presentUsers.find(user => user.id === id);
}

export const resolveBodyChange = (event: BodyChangeEvent, presentUsers: PresentUser[], annotation?: Annotation): AnnotationBody => {
  const b = event.new;

  return {
    id: b.id,
    annotation: b.annotation_id,
    purpose: b.purpose,
    value: b.value,
    creator: findUser(b.created_by, presentUsers, annotation),
    created: new Date(b.created_at),
    updatedBy: findUser(b.updated_by, presentUsers, annotation),
    updated: b.updated_at ? new Date(b.updated_at) : null,
    version: b.version
  }
}

export const resolveTargetChange = (event: TargetChangeEvent, presentUsers: PresentUser[], annotation?: Annotation): AnnotationTarget => {
  const t = event.new;

  return {
    annotation: t.annotation_id,
    selector: JSON.parse(t.value),
    creator: findUser(t.created_by, presentUsers, annotation),
    created: new Date(t.created_at),
    updatedBy: findUser(t.updated_by, presentUsers, annotation),
    updated: t.updated_at ? new Date(t.updated_at) : null,
    version: t.version
  }
}
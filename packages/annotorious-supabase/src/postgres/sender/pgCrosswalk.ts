import type { AnnotationBody, AnnotationTarget, User } from '@annotorious/core';
import type { AnnotationRecord, BodyRecord, ProfileRecord, TargetRecord } from '../Types';

export const parseProfileRecord = (p: ProfileRecord | undefined): User => p ? ({
  id: p.id,
  name: p.nickname,
  email: p.email,
  avatar: p.avatar_url
}) : undefined;

export const parseBodyRecord = (body: BodyRecord): AnnotationBody => ({
  id: body.id,
  annotation: body.annotation_id,
  purpose: body.purpose,
  value: body.value,
  creator: parseProfileRecord(body.created_by),
  created: new Date(body.created_at),
  updatedBy: parseProfileRecord(body.updated_by),
  updated: body.updated_at ? new Date(body.updated_at) : null,
  version: body.version
});

export const parseTargetRecord = (target: TargetRecord): AnnotationTarget => ({
  annotation: target.annotation_id,
  selector: JSON.parse(target.value),
  creator: parseProfileRecord(target.created_by),
  created: new Date(target.created_at),
  updatedBy: parseProfileRecord(target.created_by),
  updated: target.updated_at ? new Date(target.updated_at) : null,
  version: target.version
});

export const parseAnnotationRecord = (record: AnnotationRecord) => {
  // Fatal integrity issue
  if (record.targets.length === 0)
    throw { message: 'Invalid annotation: target missing', record };

  // Integrity error (but not fatal)
  if (record.targets.length > 1)
    console.warn('Invalid annotation: too many targets', record);

  const bodies: AnnotationBody[] = record.bodies.map(parseBodyRecord);

  return {
    id: record.id,
    target: parseTargetRecord(record.targets[0]),
    bodies
  };
}

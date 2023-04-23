import type { Annotation, AnnotationBody, AnnotationTarget, User } from '@annotorious/core';

export interface BroadcastMessage {

  from: User & { presenceKey: string };

  events: BroadcastEvent[];

}

export type BroadcastEvent = 
  CreateAnnotationEvent | 
  DeleteAnnotationEvent |
  CreateBodyEvent |
  DeleteBodyEvent |
  UpdateBodyEvent |
  UpdateTargetEvent;

export enum BroadcastEventType {

  CREATE_ANNOTATION = 'CRTANN',

  DELETE_ANNOTATION = 'DELANN',

  CREATE_BODY = 'CRTBDY',

  DELETE_BODY = 'DELBDY',

  UPDATE_BODY = 'UPTBDY',

  UPDATE_TARGET = 'UPTTGT'

}

export type CreateAnnotationEvent = {

  type: BroadcastEventType.CREATE_ANNOTATION;

  annotation: Annotation;

}

export type DeleteAnnotationEvent = {

  type: BroadcastEventType.DELETE_ANNOTATION;

  id: string;

} 

export type CreateBodyEvent = {

  type: BroadcastEventType.CREATE_BODY;

  body: AnnotationBody;

}

export type DeleteBodyEvent = {

  type: BroadcastEventType.DELETE_BODY;

  id: string;

  annotation: string;

}

export type UpdateBodyEvent = {

  type: BroadcastEventType.UPDATE_BODY;

  body: AnnotationBody;

}

export type UpdateTargetEvent = {

  type: BroadcastEventType.UPDATE_TARGET;

  target: AnnotationTarget;

}
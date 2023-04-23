import type { Annotation, AnnotationBody, AnnotationTarget, User } from '@annotorious/core';

export interface BroadcastChangeMessage {

  from: User & { presenceKey: string };

  events: BroadcastChangeEvent[];

}

export type BroadcastSelectMessage = {

  from: User & { presenceKey: string };

  ids: string[]

}

export type BroadcastChangeEvent = 
  CreateAnnotationEvent | 
  DeleteAnnotationEvent |
  CreateBodyEvent |
  DeleteBodyEvent |
  UpdateBodyEvent |
  UpdateTargetEvent;

export enum BroadcastChangeEventType {

  CREATE_ANNOTATION = 'CRTANN',

  DELETE_ANNOTATION = 'DELANN',

  CREATE_BODY = 'CRTBDY',

  DELETE_BODY = 'DELBDY',

  UPDATE_BODY = 'UPTBDY',

  UPDATE_TARGET = 'UPTTGT'

}

export type CreateAnnotationEvent = {

  type: BroadcastChangeEventType.CREATE_ANNOTATION;

  annotation: Annotation;

}

export type DeleteAnnotationEvent = {

  type: BroadcastChangeEventType.DELETE_ANNOTATION;

  id: string;

} 

export type CreateBodyEvent = {

  type: BroadcastChangeEventType.CREATE_BODY;

  body: AnnotationBody;

}

export type DeleteBodyEvent = {

  type: BroadcastChangeEventType.DELETE_BODY;

  id: string;

  annotation: string;

}

export type UpdateBodyEvent = {

  type: BroadcastChangeEventType.UPDATE_BODY;

  body: AnnotationBody;

}

export type UpdateTargetEvent = {

  type: BroadcastChangeEventType.UPDATE_TARGET;

  target: AnnotationTarget;

}
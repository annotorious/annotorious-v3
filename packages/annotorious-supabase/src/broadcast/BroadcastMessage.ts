import type { Annotation, AnnotationBody, AnnotationTarget } from '@annotorious/core';

export enum BroadcastMessageType {

  CREATE_ANNOTATION = 'CREATE_ANNOTATION',

  DELETE_ANNOTATION = 'DELETE_ANNOTATION',

  CREATE_BODY = 'CREATE_BODY',

  DELETE_BODY = 'DELETE_BODY',

  UPDATE_BODY = 'UPDATE_BODY',

  UPDATE_TARGET = 'UPDATE_TARGET',

  SELECT_ANNOTATION = 'SELECT_ANNOTATION'

}

export type CreateAnnotationMessage = {

  type: BroadcastMessageType.CREATE_ANNOTATION;

  annotation: Annotation;

}

export type DeleteAnnotationMessage = {

  type: BroadcastMessageType.DELETE_ANNOTATION;

  annotation: Annotation;

} 

export type CreateBodyMessage = {

  type: BroadcastMessageType.CREATE_BODY;

  body: AnnotationBody;

}

export type DeleteBodyMessage = {

  type: BroadcastMessageType.DELETE_BODY;

  body: AnnotationBody;

}

export type UpdateBodyMessage = {

  type: BroadcastMessageType.UPDATE_BODY;

  oldValue: AnnotationBody;

  newValue: AnnotationBody;

}

export type UpdateTargetMessage = {

  type: BroadcastMessageType.UPDATE_TARGET;

  oldValue: AnnotationTarget;

  newValue: AnnotationTarget;

}

export type SelectAnnotationMessage = {

  type: BroadcastMessageType.SELECT_ANNOTATION;

  id: string

}

export type BroadcastMessage =
  CreateAnnotationMessage |
  DeleteAnnotationMessage |
  CreateBodyMessage |
  DeleteBodyMessage |
  UpdateBodyMessage |
  UpdateTargetMessage |
  SelectAnnotationMessage;

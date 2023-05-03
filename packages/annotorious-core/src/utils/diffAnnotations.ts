import equal from 'deep-equal';
import type { Annotation, AnnotationBody, AnnotationTarget } from '../model';

export interface AnnotationDiff {

  addedBodies: AnnotationBody[];

  removedBodies: AnnotationBody[];

  changedBodies: AnnotationBody[];

  changedTarget?: AnnotationTarget;

}

const getAddedBodies = (oldValue: Annotation, newValue: Annotation) => {
  const oldBodyIds = new Set(oldValue.bodies.map(b => b.id));
  return newValue.bodies.filter(b => !oldBodyIds.has(b.id));
}

const getRemovedBodies = (oldValue: Annotation, newValue: Annotation) => {
  const newBodyIds = new Set(newValue.bodies.map(b => b.id));
  return oldValue.bodies.filter(b => !newBodyIds.has(b.id));
}

const getChangedBodies = (oldValue: Annotation, newValue: Annotation) => 
  newValue.bodies.filter(newBody => {
    const oldBody = oldValue.bodies.find(b => b.id === newBody.id);
    return oldBody ? !equal(oldBody, newBody) : false;
  });

const hasTargetChanged = (oldValue: Annotation, newValue: Annotation) => 
  !equal(oldValue.target, newValue.target);

export const diffAnnotations = (oldValue: Annotation, newValue: Annotation): AnnotationDiff => ({
  addedBodies: getAddedBodies(oldValue, newValue),
  removedBodies: getRemovedBodies(oldValue, newValue),
  changedBodies: getChangedBodies(oldValue, newValue),
  changedTarget: hasTargetChanged(oldValue, newValue) ? newValue.target : undefined
});
import type { Annotation, User } from '../model';

/**
 * Returns all users listed as creators or updaters in any parts of this
 * annotation.
 */
export const getCollaborators = (annotation: Annotation): User[] => {
  const { creator, updatedBy } = annotation.target;

  const bodyCollaborators = annotation.bodies.reduce((users, body) =>  (
    [...users, body.creator, body.updatedBy]
  ), [] as User[]);

  return [
    creator,
    updatedBy,
    ...bodyCollaborators
  ].filter(u => u); // Remove undefined
}
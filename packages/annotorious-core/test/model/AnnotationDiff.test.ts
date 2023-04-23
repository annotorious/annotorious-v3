import { describe, it, expect } from 'vitest';
import { Annotation, diffAnnotations } from '../../src/model/';

const created = new Date();

const annotation1: Annotation = {
  id: '1',
  target: {
    annotation: '1',
    selector: {},
    creator: { id: 'user1' },
    created
  },
  bodies: [
    { id: 'body-1', annotation: '1', value: 'body-1', creator: { id: 'user1' }, created },
    { id: 'body-2', annotation: '1', value: 'body-2', creator: { id: 'user2' }, created }
  ]
};

const annotation2: Annotation = {
  id: '1',
  target: {
    annotation: '1',
    selector: {},
    creator: { id: 'user1' },
    created: created
  },
  bodies: [
    { id: 'body-1', annotation: '1', value: 'body-1-changed', creator: { id: 'user1' }, created },
    { id: 'body-3', annotation: '1', value: 'body-3', creator: { id: 'user3' }, created }
  ]
};

describe('diffAnnotations', () => {

  it('should compute proper diffs', () => {
    const diff = diffAnnotations(annotation1, annotation2);

    expect(diff.addedBodies.length).toBe(1);
    expect(diff.addedBodies[0].id).toBe('body-3');
    expect(diff.addedBodies[0].value).toBe('body-3');
    expect(diff.removedBodies.length).toBe(1);
    expect(diff.removedBodies[0].id).toBe('body-2');
    expect(diff.removedBodies[0].value).toBe('body-2');
    expect(diff.changedBodies.length).toBe(1);
    expect(diff.changedBodies[0].id).toBe('body-1');
    expect(diff.changedBodies[0].value).toBe('body-1-changed');
    expect(diff.changedTarget).toBe(undefined);
  })

});


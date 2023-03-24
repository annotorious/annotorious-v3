import { describe, it, expect } from 'vitest';
import { createAnonymousGuest, UserType } from '../../src/model';

describe('createAnonymousGuest', () => {

  it('should create a valid Guest user', () => {
    const guest = createAnonymousGuest();

    expect(guest.type).toBe(UserType.GUEST);
    expect(guest.id).toBeDefined();
  });

});
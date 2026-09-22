import { getAccessToken, setAccessToken } from '../token-store';

describe('token-store', () => {
  beforeEach(() => {
    // Reset to initial state
    setAccessToken(null);
  });

  it('should initialize with null access token', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('should store and retrieve access token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    setAccessToken(token);
    expect(getAccessToken()).toBe(token);
  });

  it('should overwrite existing access token', () => {
    setAccessToken('old-token');
    setAccessToken('new-token');
    expect(getAccessToken()).toBe('new-token');
  });

  it('should clear access token when setting to null', () => {
    setAccessToken('some-token');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});

/** @jest-environment jsdom */
import { render } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { OAuthCallbackHandler } from '../OAuthCallbackHandler';
import { queryClient } from '@/lib/query-client';
import { useAppSession } from '@/lib/app-session';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/query-client', () => ({
  queryClient: { clear: jest.fn() },
}));

jest.mock('@/lib/app-session', () => ({
  useAppSession: jest.fn(),
}));

describe('OAuthCallbackHandler', () => {
  let mockSearchParams: URLSearchParams;
  let mockReplaceState: jest.SpyInstance;
  let mockRefetch: jest.Mock;

  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockImplementation(() => mockSearchParams);

    mockRefetch = jest.fn().mockResolvedValue(undefined);
    (useAppSession as jest.Mock).mockReturnValue({ refetch: mockRefetch });

    mockReplaceState = jest
      .spyOn(window.history, 'replaceState')
      .mockImplementation(() => undefined);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('clears cache, refetches session and strips oauth param on success', () => {
    mockSearchParams = new URLSearchParams('oauth=success');

    render(<OAuthCallbackHandler />);

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/');
  });

  it('keeps unrelated query params while removing oauth', () => {
    mockSearchParams = new URLSearchParams('oauth=success&tab=reviews');

    render(<OAuthCallbackHandler />);

    expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/?tab=reviews');
  });

  it('does nothing when the oauth param is absent', () => {
    render(<OAuthCallbackHandler />);

    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(mockRefetch).not.toHaveBeenCalled();
    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  it('does nothing when oauth is not a success value', () => {
    mockSearchParams = new URLSearchParams('oauth=failure');

    render(<OAuthCallbackHandler />);

    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  it('does not clear the cache on repeat renders', () => {
    mockSearchParams = new URLSearchParams('oauth=success');
    const { rerender } = render(<OAuthCallbackHandler />);

    rerender(<OAuthCallbackHandler />);

    expect(queryClient.clear).toHaveBeenCalledTimes(1);
  });
});

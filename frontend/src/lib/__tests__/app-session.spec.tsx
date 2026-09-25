/** @jest-environment jsdom */
import { act, render, screen, waitFor } from '@testing-library/react';
import { AppSessionProvider, useAppSession } from '@/lib/app-session';
import { apiRequest } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiRequest: jest.fn(),
}));

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const CURRENT_USER = {
  id: 'u1',
  email: 'a@b.co',
  role: 'user',
  username: 'u',
};

function SessionProbe() {
  const { user, isLoading, refetch } = useAppSession();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.id : 'anonymous'}</span>
      <button type="button" onClick={() => void refetch()}>
        refetch
      </button>
    </div>
  );
}

describe('AppSessionProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the current user on mount', async () => {
    mockedApiRequest.mockResolvedValue(CURRENT_USER);

    render(
      <AppSessionProvider>
        <SessionProbe />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('u1');
    });
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('requests the me endpoint directly without forcing an auth redirect', async () => {
    mockedApiRequest.mockResolvedValue(CURRENT_USER);

    render(
      <AppSessionProvider>
        <SessionProbe />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('u1');
    });

    expect(mockedApiRequest).toHaveBeenCalledWith({
      url: '/auth/me',
      method: 'GET',
      skipAuthRedirect: true,
    });
  });

  it('falls back to anonymous when the request is rejected', async () => {
    mockedApiRequest.mockRejectedValue(new Error('unauthorized'));

    render(
      <AppSessionProvider>
        <SessionProbe />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });

  it('keeps the user silent after a successful refetch', async () => {
    mockedApiRequest.mockResolvedValue(CURRENT_USER);

    render(
      <AppSessionProvider>
        <SessionProbe />
      </AppSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('u1');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'refetch' }).click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('u1');
    expect(mockedApiRequest).toHaveBeenCalledTimes(2);
  });
});

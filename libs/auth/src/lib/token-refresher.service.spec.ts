import { TestBed } from '@angular/core/testing';
import { MonoTypeOperatorFunction, Observable, first, firstValueFrom, skip } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { TokenRefresher2Service, TokenResponseHelpers } from './token-refresher.service';
import { AuthState } from './auth-state';

class LocalStorageServiceMock {
  setItem = jest.fn();
  getItem = jest.fn();
  removeItem = jest.fn();
}

class RefreshTokenImplMock {
  refresh = jest.fn();
}

describe('TokenRefresherService', () => {
  let service: TokenRefresher2Service;

  beforeEach(() => {

    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        { provide: LocalStorageService, useClass: LocalStorageServiceMock },
        { provide: RefreshTokenImplMock, useClass: RefreshTokenImplMock },
      ],
    });

    service = new TokenRefresher2Service(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TestBed.inject(RefreshTokenImplMock) as any,
      TestBed.inject(LocalStorageService),
      'key'
    );
  });

  afterEach(() => {
    service.dispose();
  });

  it('should not have debug values set', () => {
    expect(TokenRefresher2Service.isInDebug()).toBe(false);
  })

  it('should request not request a token if not expired yet', (done) => {
    jest.useFakeTimers();

    const counters: CallCounter[] = [];

    const httpTestingClient = TestBed.inject(RefreshTokenImplMock);

    const localStorageService = TestBed.inject(LocalStorageService) as LocalStorageServiceMock;

    const v = {
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 6 * 60, // 6 minutes
      captured_at: new Date(),
    };

    service.isRefreshing$
      .pipe(skip(1), first(), shouldBeCalledTimes(0, counters))
      .subscribe(() => {
        // Empty
      });

    service.authState$.pipe(
      shouldBeCalledTimes(1, counters, 'authState')
    ).subscribe(val => {
      try {
        expect(val).toBe('logged_in');
      }
      catch (e) {
        done(e);
      }
    });

    localStorageService.getItem.mockReturnValue(JSON.stringify(v));

    // Load in
    service.load();

    service.accessToken$.pipe(first(), shouldBeCalledTimes(1, counters)).subscribe({
      next: (val) => {
        try {
          expect(val).toBe('token');
        } catch (e) {
          done(e);
        }
      },
      error: (error) => done(error),
    });

    // Check that the expiry is now + 360 seconds
    service.expiresAt$.pipe(first(), shouldBeCalledTimes(1, counters)).subscribe({
      next: (val) => {
        try {
          expect(val).toBe(360);
        } catch (e) {
          done(e);
        }
      },
      error: (error) => done(error),
    });

    expect(httpTestingClient.refresh).not.toHaveBeenCalled();

    expectCounters(counters);

    done();
  });

  it('should auto refresh in the background', (done) => {
    jest.useFakeTimers();

    const counters: CallCounter[] = [];

    service.authState$.pipe(
      shouldBeCalledTimes(1, counters),
    ).subscribe(val => {
      try {
        expect(val).toBe('logged_in');
      } catch (e) {
        done(e);
      }
    });

    const httpTestingClient = TestBed.inject(RefreshTokenImplMock);

    httpTestingClient.refresh.mockReturnValue(Promise.resolve({
      access_token: 'new',
      refresh_token: 'refresh',
      expires_in: 60 * 60
    }));

    const localStorageService = TestBed.inject(LocalStorageService) as LocalStorageServiceMock;

    const v = {
      access_token: 'old',
      refresh_token: 'refresh',
      expires_in: 6 * 60, // 6 minutes
      captured_at: new Date(),
    };
    localStorageService.getItem.mockReturnValue(JSON.stringify(v));

    service.load().then(async () => {
      try {
        expect(await firstValueFrom(service.accessToken$)).toBe('old');

        jest.advanceTimersByTime(5 * 60 * 1000);

        expect(httpTestingClient.refresh).toHaveBeenCalled();

        expect(await firstValueFrom(service.accessToken$)).toBe('new');
        expect(await firstValueFrom(service.expiresAt$)).toBe(60 * 60);

        expectCounters(counters);

        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it.skip('should be invalid if refresh failed', () => {
    // TODO
  });

  it('should show null if logged out', done => {

    jest.useFakeTimers();

    const counters: CallCounter[] = [];

    service.authState$.pipe(
      shouldBeCalledTimes(1, counters)
    ).subscribe(val => {
      try {
        expect(val).toBe(null);
      }
      catch (e) {
        done(e);
      }
    });

    service.loaded$.pipe(shouldBeCalledTimes(2, counters)).subscribe();

    service.accessToken$.pipe(shouldBeCalledTimes(1, counters)).subscribe(val => {
      try {
        expect(val).toBe(null);
      }
      catch (e) {
        done(e);
      }
    });

    service.load().then(() => {

      try {
        expectCounters(counters);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('should be expired if refresh temporarily unavailable, then logged in', done => {
    jest.useFakeTimers();

    // Load in a token that will expire in 2 minutes
    const localStorageService = TestBed.inject(LocalStorageService) as LocalStorageServiceMock;
    const v = {
      access_token: 'token',
      expires_in: 2 * 60,
      captured_at: new Date(),
      refresh_token: 'refresh'
    };
    localStorageService.getItem.mockReturnValue(JSON.stringify(v));

    const callCounter: CallCounter[] = [];

    const authValues: AuthState[] = [];
    service.authState$.pipe(shouldBeCalledTimes(3, callCounter)).subscribe(val => authValues.push(val));

    // Reject the refresh
    const httpTestingClient = TestBed.inject(RefreshTokenImplMock);
    httpTestingClient.refresh.mockRejectedValue(new Error('[JEST] Temporary unavailable'));

    // async local fn
    const fn = async () => {
      try {
        await service.load();

        // Access token should be 'token'
        expect(await firstValueFrom(service.accessToken$)).toBe('token');

        // Auth state should be 'logged_in'
        expect(await firstValueFrom(service.authState$)).toBe('logged_in');

        // Fast forward 2 minutes and 1 second
        jest.advanceTimersByTime(2 * 60 * 1000 + 1000);

        // Auth state should be 'expired'
        expect(await firstValueFrom(service.authState$)).toBe('expired');

        // Check that the auth state emitted twice using the timer
        expect(authValues).toEqual(['logged_in', 'expired']);

        // Now resolve the refresh
        httpTestingClient.refresh.mockResolvedValue({
          access_token: 'new',
          refresh_token: 'refresh',
          expires_in: 60 * 60
        });

        console.log(authValues);

        // Fast forward 5 seconds (to allow the auto refresh to kick in)
        jest.advanceTimersByTime(6 * 1000);
        jest.runAllTicks();

        // Wait for the refreshed tick (internally need to wait for the promise to run)
        await firstValueFrom(service._refreshed$);

        // Auth state should be 'logged_in'
        expect(await firstValueFrom(service.authState$)).toBe('logged_in');

        expectCounters(callCounter);

        expect(authValues).toEqual(['logged_in', 'expired', 'logged_in']);

        done();
      }
      catch (e) {
        done(e);
      }
    };

    fn();
  });

  it('should handle new token set on login', async () => {

    jest.useFakeTimers();

    // Load in a token that will expire in 10 minutes
    const localStorageService = TestBed.inject(LocalStorageService) as LocalStorageServiceMock;
    const v = {
      access_token: 'token',
      expires_in: 10 * 60,
      captured_at: new Date(),
      refresh_token: 'refresh'
    };
    localStorageService.getItem.mockReturnValue(JSON.stringify(v));

    await service.load();

    expect(await firstValueFrom(service.accessToken$)).toBe('token');
    expect(await firstValueFrom(service.authState$)).toBe('logged_in');

    // Clear the tokens
    service.clear();

    expect(await firstValueFrom(service.accessToken$)).toBe(null);
    expect(await firstValueFrom(service.authState$)).toBe(null);

    service.save({
      access_token: 'new',
      refresh_token: 'refresh',
      expires_in: 60 * 60,
      id_token: 'id',
      scope: 'scope'
    });

    expect(await firstValueFrom(service.accessToken$)).toBe('new');
    expect(await firstValueFrom(service.authState$)).toBe('logged_in');
  });

  it('should not return id token if fully expired', (done) => {
    jest.useFakeTimers();

    const counters: CallCounter[] = [];

    service.idToken$.pipe(shouldBeCalledTimes(1, counters)).subscribe(val => {
      expect(val).toBe(null);
    });

    const localStorageService = TestBed.inject(LocalStorageService) as LocalStorageServiceMock;

    const capturedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    const v = {
      access_token: 'token1',
      refresh_token: 'refresh',
      id_token: createIdJwtToken(capturedAt),
      expires_in: 60, // Already expired
      captured_at: capturedAt
    };

    localStorageService.getItem.mockReturnValue(JSON.stringify(v));

    service.load().then(() => {
      try {
        expectCounters(counters);
        done();
      }
      catch (e) {
        done(e);
      }
    }, error => done(error));
  });

  it('should request a token if nearly expired', (done) => {
    jest.useFakeTimers();

    const counters: CallCounter[] = [];

    service.authState$.pipe(shouldBeCalledTimes(1, counters)).subscribe(val => {
      try {
        expect(val).toBe('logged_in');
      } catch (e) {
        done(e);
      }
    });

    const httpTestingClient = TestBed.inject(RefreshTokenImplMock);

    httpTestingClient.refresh.mockReturnValue(Promise.resolve({
      access_token: 'new',
      expires_in: 60 * 60,
      refresh_token: 'refresh',
    }));

    const localStorageService = TestBed.inject(LocalStorageService) as LocalStorageServiceMock;

    const v = {
      access_token: 'token1',
      refresh_token: 'refresh',
      expires_in: 3, // 3 seconds
      captured_at: new Date(),
    };

    localStorageService.getItem.mockReturnValue(JSON.stringify(v));

    service.load().then(() => {
      try {
        // Should have saved the new token
        expect(localStorageService.setItem).toHaveBeenCalledTimes(1);
        localStorageService.setItem.mock.calls.forEach((call) => {
          expect(call[0]).toBe('key');

          const token = JSON.parse(call[1]);
          expect(token.access_token).toBe('new');
          expect(token.expires_in).toBe(60 * 60);
          expect(token.refresh_token).toBe('refresh');
        });

        expectCounters(counters);
        done();
      } catch (e) {
        done(e);
      }
    });

    service.accessToken$.pipe(first(), shouldBeCalledTimes(1, counters, 'accessToken')).subscribe({
      next: (value) => {
        try {
          expect(value).toBe('new');
        } catch (e) {
          done(e);
        }
      },
      error: (error) => {
        done(error);
      },
    });
  });

  describe("expFromToken", () => {
    beforeAll(() => {
      global.atob = jest.fn().mockImplementation((input) => Buffer.from(input, 'base64').toString('binary'));
    });
  
    it('should return a date for valid token', () => {
      const token = `${Buffer.from('header').toString('base64')}.${Buffer.from(JSON.stringify({exp: 1622505600})).toString('base64')}.signature`;
      const result = TokenResponseHelpers.expFromToken(token);
      expect(result).toEqual(new Date(1622505600 * 1000));
    });
  
    it('should return null for token with invalid parts count', () => {
      const token = 'invalid.token';
      const result = TokenResponseHelpers.expFromToken(token);
      expect(result).toBeNull();
    });
  
    it('should return null for token without expiration', () => {
      const token = `${Buffer.from('header').toString('base64')}.${Buffer.from(JSON.stringify({})).toString('base64')}.signature`;
      const result = TokenResponseHelpers.expFromToken(token);
      expect(result).toBeNull();
    });
  
    it('should return null if exp is not a number', () => {
      const token = `${Buffer.from('header').toString('base64')}.${Buffer.from(JSON.stringify({exp: "notANumber"})).toString('base64')}.signature`;
      const result = TokenResponseHelpers.expFromToken(token);
      expect(result).toBeNull();
    });
  
    it('should throw for invalid JSON in payload', () => {
      const token = `${Buffer.from('header').toString('base64')}.${Buffer.from('{invalidJson}').toString('base64')}.signature`;
      const result = TokenResponseHelpers.expFromToken(token);
      expect(result).toBeNull();
    });
  
    it('should return null for empty token', () => {
      const token = '';
      const result = TokenResponseHelpers.expFromToken(token);
      expect(result).toBeNull();
    });
  
    it('should process token with padding in base64', () => {
      const tokenWithPadding = `${Buffer.from('header').toString('base64')}.${Buffer.from(JSON.stringify({exp: 1622505601})).toString('base64')}==.signature`;
      const result = TokenResponseHelpers.expFromToken(tokenWithPadding);
      expect(result).toEqual(new Date(1622505601 * 1000));
    });
  
    it('should return a valid date for max integer expiration', () => {
      const token = `${Buffer.from('header').toString('base64')}.${Buffer.from(JSON.stringify({exp: Number.MAX_SAFE_INTEGER})).toString('base64')}.signature`;
      const result = TokenResponseHelpers.expFromToken(token);
      expect(result?.toString()).toEqual(new Date(Number.MAX_SAFE_INTEGER * 1000).toString());
    });
  
    it('should not throw error for base64 with special characters', () => {
      const payload = Buffer.from(JSON.stringify({exp: 1622505602})).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const token = `${Buffer.from('header').toString('base64')}.${payload}.signature`;
      const result = TokenResponseHelpers.expFromToken(token);
      expect(result).toEqual(new Date(1622505602 * 1000));
    });
  })
});

interface CallCounter {
  expected: number;
  actual: number;
  name?: string;
}

function expectCounters(counters: CallCounter[]) {
  for (let i = 0; i < counters.length; i++) {
    const counter = counters[i];

    try {
      expect(counter.actual).toBe(counter.expected);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const newError = new Error(
        `Counter ${counter.name || i} - expected ${counter.expected} but got ${counter.actual}`
      );

      // If e contains stack
      if ('stack' in e) {
        // newError.stack = e.stack;
      }

      throw newError;
    }
  }
}

function shouldBeCalledTimes<T>(
  times: number,
  counters: CallCounter[],
  name?: string
): MonoTypeOperatorFunction<T> {
  const newCounter: CallCounter = { expected: times, actual: 0, name };

  counters.push(newCounter);

  return (source: Observable<T>) =>
    new Observable<T>((observer) => {
      return source.subscribe({
        next: (val) => {
          newCounter.actual++;
          observer.next(val);
        },
        error: (error) => observer.error(error),
        complete: () => observer.complete(),
      });
    });
}

function createIdJwtToken(expiry: Date) {
  // Create a JWT token where the first and third sections are not important
  // The second section is the payload
  const payload = {
    exp: Math.floor(expiry.getTime() / 1000),
  };

  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

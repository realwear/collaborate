import { TestBed } from "@angular/core/testing";
import { DeviceCodeService } from "./device-code.service";
import { Observable, of } from "rxjs";
import { loginAuthGuard } from "./login.guard";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";

describe('LoginGuard', () => {
    it('should return true if logged in', done => {
        TestBed.overrideProvider(DeviceCodeService, {
            useValue: {
                isLoggedIn$: of(true)
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapshot = {} as any as ActivatedRouteSnapshot;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = {} as any as RouterStateSnapshot;

        const authGuardFn = TestBed.runInInjectionContext(
            () => loginAuthGuard('/login-route')(snapshot, state)) as Observable<boolean>;

        authGuardFn.subscribe(result => {
            try {
                expect(result).toBeTruthy();
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should reroute to login if not logged in', done => {
        TestBed.overrideProvider(DeviceCodeService, {
            useValue: {
                isLoggedIn$: of(false)
            }
        });

        const mockRouter = {
            navigateByUrl: jest.fn(() => Promise.resolve(true))
        }

        TestBed.overrideProvider(Router, {
            useValue: mockRouter
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapshot = {} as any as ActivatedRouteSnapshot;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = {} as any as RouterStateSnapshot;

        const authGuardFn = TestBed.runInInjectionContext(
            () => loginAuthGuard('/login-route')(snapshot, state)) as Observable<boolean>;

        authGuardFn.subscribe(result => {
            try {
                expect(result).toBeFalsy();
                expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login-route', { skipLocationChange: true });
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });
});
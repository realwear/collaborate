import { TestBed } from "@angular/core/testing";
import { DeviceCodeService } from "../device-code.service";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { Subject, Subscription } from "rxjs";
import { LoggedOutBaseComponent } from "./logged-out.base.component";

class DeviceCodeServiceMock {
    pending$ = new Subject<boolean>();
    isLoggedIn$ = new Subject<boolean>();
    start = jest.fn();
}

class RouterMock {
    navigate = jest.fn();
}

class MatDialogMock {
    open = jest.fn(() => ({
        close: jest.fn()
    }));
}

describe('LoggedOutBaseComponent', () => {

    let instance!: LoggedOutBaseComponent;

    let dialogCloseFn!: jest.Mock;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: DeviceCodeService, useClass: DeviceCodeServiceMock },
                { provide: Router, useClass: RouterMock },
                { provide: MatDialog, useClass: MatDialogMock }
            ]
        });

        dialogCloseFn = jest.fn();
        const matDialog = TestBed.inject(MatDialog);
        const openMock = matDialog.open as jest.Mock;
        openMock.mockReturnValue({
            close: dialogCloseFn
        });

        instance = new LoggedOutBaseComponent(TestBed.inject(Router), TestBed.inject(DeviceCodeService), TestBed.inject(MatDialog));
    });

    it('should create an instance', () => {
        expect(instance).toBeTruthy();
    });

    it('should open and close the dialog', () => {
        getDeviceCodeMock().pending$.next(true);

        expect(TestBed.inject(MatDialog).open).toHaveBeenCalled();

        getDeviceCodeMock().pending$.next(false);

        expect(dialogCloseFn).toHaveBeenCalled();
    });

    it('should navigate to root when logged in', () => {
        const router = TestBed.inject(Router);
        const navigateMock = jest.spyOn(router, 'navigate');

        getDeviceCodeMock().isLoggedIn$.next(true);

        expect(navigateMock).toHaveBeenCalledWith(['/']);
    });

    it('should start the device code service', () => {
        const deviceCodeService = getDeviceCodeMock();
        const startMock = jest.spyOn(deviceCodeService, 'start');

        instance.signin(true);

        expect(startMock).toHaveBeenCalled();
    });

    it('should unsubscribe on destroy', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub1: Subscription = (instance as any)._pendingSub;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub2: Subscription = (instance as any)._isLoggedInSub;

        jest.spyOn(sub1, 'unsubscribe');
        jest.spyOn(sub2, 'unsubscribe');

        instance.ngOnDestroy();

        expect(sub1.unsubscribe).toHaveBeenCalled();
        expect(sub2.unsubscribe).toHaveBeenCalled();
    });
});

function getDeviceCodeMock() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return TestBed.inject(DeviceCodeService) as any as DeviceCodeServiceMock;
}
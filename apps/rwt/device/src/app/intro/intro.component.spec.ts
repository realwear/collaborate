import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntroComponent } from './intro.component';
import { DeviceCodeService } from '@rw/auth';
import { BehaviorSubject } from 'rxjs';
import { CodeFetcherMock } from '../code-fetcher.mock';
import { CodeFetcher } from '../code-fetcher';
import { MeetingJoiner } from '../meeting-joiner';
import { Component } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('IntroComponent', () => {

  @Component({ selector: 'nx-connect-code' })
  class ConnectCodeMockComponent { }

  const deviceCodeServiceImpl: Partial<DeviceCodeService> = {
    pending$: new BehaviorSubject<boolean>(false),
    isLoggedIn$: new BehaviorSubject<boolean>(false)
  };

  const meetingJoinerImpl = {
    joinMeeting: jest.fn()
  };

  const codeFetcher = new CodeFetcherMock();

  let component: IntroComponent;
  let fixture: ComponentFixture<IntroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IntroComponent, ConnectCodeMockComponent],
      providers: [
        {
          provide: DeviceCodeService,
          useValue: deviceCodeServiceImpl
        },
        {
          provide: CodeFetcher,
          useValue: codeFetcher
        },
        {
          provide: MeetingJoiner,
          useValue: meetingJoinerImpl
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IntroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();

    component.ngOnInit();

    // Start should be called on ngOnInit
    expect(codeFetcher.start).toHaveBeenCalled();

    component.ngOnDestroy();

    expect(codeFetcher.stop).toHaveBeenCalled();
  });

  it('should handle onResume event', () => {
    // Clear the mocks
    jest.resetAllMocks();

    expect(codeFetcher.start).not.toHaveBeenCalled();

    TestBed.inject(DOCUMENT).dispatchEvent(new Event('onResume'));

    expect(codeFetcher.start).toHaveBeenCalled();
  });

  it('should handle onPause event', () => {
    TestBed.inject(DOCUMENT).dispatchEvent(new Event('onPause'));

    expect(codeFetcher.stop).toHaveBeenCalled();
  });

  it.only('should join a meeting on an incoming call request', async () => {

    codeFetcher.fetchAcsToken.mockResolvedValue({ token: 'sometoken' });

    codeFetcher.incomingCallRequest$.emit({ meetingUrl: 'http://example.com', callerEmail: 'email', callerName: 'name' });

    await new Promise(process.nextTick);

    expect(codeFetcher.generateNewCode).toHaveBeenCalled();
    expect(codeFetcher.fetchAcsToken).toHaveBeenCalled();

    expect(meetingJoinerImpl.joinMeeting).toHaveBeenCalledWith(
      'sometoken',
      'http://example.com',
      'RealWear Navigator',
      'RealWear Meeting'
    );
  });
});

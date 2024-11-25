import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MeetingsComponent } from './meetings.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DeviceCode2Service, UserProfile } from '@rw/auth';
import { of } from 'rxjs';
import { Component, Input } from '@angular/core';

// eslint-disable-next-line @angular-eslint/component-selector
@Component({ selector: 'rw-upcoming-meeting' })
class MockUpcomingMeetingComponent {
  @Input() loading = false;
}

describe('MeetingsComponent', () => {
  let component: MeetingsComponent;
  let fixture: ComponentFixture<MeetingsComponent>;

  const userProfileImpl: Partial<UserProfile> = {
    getProfilePicture: jest.fn().mockReturnValue(of(null)),
    userInfo$: of(null),
  };

  const deviceCodeImpl: Partial<DeviceCode2Service> = {
    userProfile$: userProfileImpl as UserProfile,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MeetingsComponent, MockUpcomingMeetingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: DeviceCode2Service,
          useValue: deviceCodeImpl,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

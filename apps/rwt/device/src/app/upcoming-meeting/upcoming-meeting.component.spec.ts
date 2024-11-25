import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpcomingMeetingComponent } from './upcoming-meeting.component';
import { UxlibModule } from '@nx/uxlib';

describe('UpcomingMeetingComponent', () => {
  let component: UpcomingMeetingComponent;
  let fixture: ComponentFixture<UpcomingMeetingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UxlibModule],
      declarations: [UpcomingMeetingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingMeetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

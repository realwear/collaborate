import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { DeviceCode2Service } from '@rw/auth';
import { Component, Input } from '@angular/core';
import { MeetingsComponent } from './meetings/meetings.component';

@Component({ selector: 'nx-meetings' })
class MockMeetingsComponent implements Partial<MeetingsComponent> {
  @Input() loading = false;
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const deviceCodeImpl: Partial<DeviceCode2Service> = {
    fetchAccessTokenForGraph: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent, MockMeetingsComponent],
      providers: [
        {
          provide: DeviceCode2Service,
          useValue: deviceCodeImpl
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

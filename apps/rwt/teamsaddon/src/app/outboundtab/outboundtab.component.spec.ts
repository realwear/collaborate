import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OutboundTabComponent } from './outboundtab.component';

describe('OutboundtabComponent', () => {
  let component: OutboundTabComponent;
  let fixture: ComponentFixture<OutboundTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutboundTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OutboundTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

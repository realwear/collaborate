import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchIndustryComponent } from './switch-industry.component';

describe('SwitchIndustryComponent', () => {
  let component: SwitchIndustryComponent;
  let fixture: ComponentFixture<SwitchIndustryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchIndustryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchIndustryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

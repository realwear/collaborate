import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChemicalSpillComponent } from './chemical-spill.component';

describe('ChemicalSpillComponent', () => {
  let component: ChemicalSpillComponent;
  let fixture: ComponentFixture<ChemicalSpillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChemicalSpillComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChemicalSpillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HelpDialogComponent } from './dialog.component';
import { CommonModule } from '@angular/common';
import { setTheme } from '@fluentui/web-components';
import { teamsDarkTheme, teamsLightTheme, teamsHighContrastTheme } from '@fluentui/tokens';

// Mock the setTheme method
jest.mock('@fluentui/web-components', () => ({
  setTheme: jest.fn(),
}));

describe('HelpDialogComponent', () => {
  let component: HelpDialogComponent;
  let dialogRef: MatDialogRef<HelpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [HelpDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: jest.fn() } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    const fixture = TestBed.createComponent(HelpDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should close the dialog when closeDialog is called', () => {
    component.closeDialog();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should set the theme to dark', () => {
    component['handleTheme']('dark');
    expect(setTheme).toHaveBeenCalledWith(teamsDarkTheme);
  });

  it('should set the theme to contrast', () => {
    component['handleTheme']('contrast');
    expect(setTheme).toHaveBeenCalledWith(teamsHighContrastTheme);
  });

  it('should set the theme to light by default', () => {
    component['handleTheme']('light');
    expect(setTheme).toHaveBeenCalledWith(teamsLightTheme);
  });

  it('should set the theme to light if an unknown theme is provided', () => {
    component['handleTheme']('unknown');
    expect(setTheme).toHaveBeenCalledWith(teamsLightTheme);
  });
});
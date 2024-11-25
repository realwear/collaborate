/**
 * Copyright (C) 2024 RealWear, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { Component, ElementRef, HostBinding, Input, OnDestroy } from "@angular/core";
import { AvatarColor, AvatarNamedColor } from "@fluentui/web-components";

@Component({
  selector: 'nx-fluent-avatar',
  template: '',
  styles: [`
    :host {
      color: #FFF;
      text-align: center;
      border-radius: 50%;
      aspect-ratio: 1 / 1;
    }
  `]
})
export class FluentAvatarComponent implements OnDestroy {

  private static colors = Object.values(AvatarNamedColor);

  @HostBinding('style.color') _foregroundColor?: string;
  @HostBinding('style.background-color') _backgroundColor?: string;

  private initials?: string;
  private _name?: string;

  @Input() set name(value: string | undefined) {
    this._name = value;

    if (!value) {
      this.initials = undefined;

      this.generateColor('');
      
      return;
    }

    const splitStr = value.split(' ');

    if (splitStr.length < 2) {
      this.initials = value.charAt(0).toUpperCase();
    }
    else {
      this.initials = splitStr[0].charAt(0).toUpperCase() + splitStr[1].charAt(0).toUpperCase();
    }

    this.elementRef.nativeElement.innerHTML = this.initials;

    this.generateColor(value);
  }

  readonly resizeObserver: ResizeObserver;

  constructor(private elementRef: ElementRef<HTMLDivElement>) {

    // Create an event listener for the width or height
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height);
        elementRef.nativeElement.style.font = (size / 2) + 'px Arial';
        elementRef.nativeElement.style.lineHeight = size + 'px';
      }
    });

    // Observe the element
    this.resizeObserver.observe(elementRef.nativeElement);
  }

  ngOnDestroy(): void {
      this.resizeObserver.disconnect();
  }

  private generateColor(name: string) {

    let clr: { color?: string, backgroundColor?: string };

    if (!name) {
      clr = getColorStyles('neutral');
    }
    else {
      const hashCode = this.getHashCode(name);

      const colorIndex = hashCode % FluentAvatarComponent.colors.length;

      clr = getColorStyles(FluentAvatarComponent.colors[colorIndex]);
    }

    if (!clr?.backgroundColor || !clr?.color) {
      clr = getColorStyles('neutral');
    }

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    this._foregroundColor = `var(--${clr.color})`;
    this._backgroundColor = `var(--${clr.backgroundColor})`;
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    console.debug(`Color: ${this._foregroundColor}, Background: ${this._backgroundColor}`);
  }

  private getHashCode = (str: string): number => {
    let hashCode = 0;
    for (let len: number = str.length - 1; len >= 0; len--) {
      const ch = str.charCodeAt(len);
      const shift = len % 8;
      hashCode ^= (ch << shift) + (ch >> (8 - shift)); // eslint-disable-line no-bitwise
    }
  
    return hashCode;
  };
}

function getColorStyles(state: AvatarColor) {
  switch (state) {
    case 'brand':
      return {
        color: 'colorNeutralForegroundStaticInverted',
        backgroundColor: 'colorBrandBackgroundStatic',
      };
    case 'dark-red':
      return {
        color: 'colorPaletteDarkRedForeground2',
        backgroundColor: 'colorPaletteDarkRedBackground2',
      };
    case 'cranberry':
      return {
        color: 'colorPaletteCranberryForeground2',
        backgroundColor: 'colorPaletteCranberryBackground2',
      };
    case 'red':
      return {
        color: 'colorPaletteRedForeground2',
        backgroundColor: 'colorPaletteRedBackground2',
      };
    case 'pumpkin':
      return {
        color: 'colorPalettePumpkinForeground2',
        backgroundColor: 'colorPalettePumpkinBackground2',
      };
    case 'peach':
      return {
        color: 'colorPalettePeachForeground2',
        backgroundColor: 'colorPalettePeachBackground2',
      };
    case 'marigold':
      return {
        color: 'colorPaletteMarigoldForeground2',
        backgroundColor: 'colorPaletteMarigoldBackground2',
      };
    case 'gold':
      return {
        color: 'colorPaletteGoldForeground2',
        backgroundColor: 'colorPaletteGoldBackground2',
      };
    case 'brass':
      return {
        color: 'colorPaletteBrassForeground2',
        backgroundColor: 'colorPaletteBrassBackground2',
      };
    case 'brown':
      return {
        color: 'colorPaletteBrownForeground2',
        backgroundColor: 'colorPaletteBrownBackground2',
      };
    case 'forest':
      return {
        color: 'colorPaletteForestForeground2',
        backgroundColor: 'colorPaletteForestBackground2',
      };
    case 'seafoam':
      return {
        color: 'colorPaletteSeafoamForeground2',
        backgroundColor: 'colorPaletteSeafoamBackground2',
      };
    case 'dark-green':
      return {
        color: 'colorPaletteDarkGreenForeground2',
        backgroundColor: 'colorPaletteDarkGreenBackground2',
      };
    case 'light-teal':
      return {
        color: 'colorPaletteLightTealForeground2',
        backgroundColor: 'colorPaletteLightTealBackground2',
      };
    case 'teal':
      return {
        color: 'colorPaletteTealForeground2',
        backgroundColor: 'colorPaletteTealBackground2',
      };
    case 'steel':
      return {
        color: 'colorPaletteSteelForeground2',
        backgroundColor: 'colorPaletteSteelBackground2',
      };
    case 'blue':
      return {
        color: 'colorPaletteBlueForeground2',
        backgroundColor: 'colorPaletteBlueBackground2',
      };
    case 'royal-blue':
      return {
        color: 'colorPaletteRoyalBlueForeground2',
        backgroundColor: 'colorPaletteRoyalBlueBackground2',
      };
    case 'cornflower':
      return {
        color: 'colorPaletteCornflowerForeground2',
        backgroundColor: 'colorPaletteCornflowerBackground2',
      };
    case 'navy':
      return {
        color: 'colorPaletteNavyForeground2',
        backgroundColor: 'colorPaletteNavyBackground2',
      };
    case 'lavender':
      return {
        color: 'colorPaletteLavenderForeground2',
        backgroundColor: 'colorPaletteLavenderBackground2',
      };
    case 'purple':
      return {
        color: 'colorPalettePurpleForeground2',
        backgroundColor: 'colorPalettePurpleBackground2',
      };
    case 'grape':
      return {
        color: 'colorPaletteGrapeForeground2',
        backgroundColor: 'colorPaletteGrapeBackground2',
      };
    case 'lilac':
      return {
        color: 'colorPaletteLilacForeground2',
        backgroundColor: 'colorPaletteLilacBackground2',
      };
    case 'pink':
      return {
        color: 'colorPalettePinkForeground2',
        backgroundColor: 'colorPalettePinkBackground2',
      };
    case 'magenta':
      return {
        color: 'colorPaletteMagentaForeground2',
        backgroundColor: 'colorPaletteMagentaBackground2',
      };
    case 'plum':
      return {
        color: 'colorPalettePlumForeground2',
        backgroundColor: 'colorPalettePlumBackground2',
      };
    case 'beige':
      return {
        color: 'colorPaletteBeigeForeground2',
        backgroundColor: 'colorPaletteBeigeBackground2',
      };
    case 'mink':
      return {
        color: 'colorPaletteMinkForeground2',
        backgroundColor: 'colorPaletteMinkBackground2',
      };
    case 'platinum':
      return {
        color: 'colorPalettePlatinumForeground2',
        backgroundColor: 'colorPalettePlatinumBackground2',
      };
    case 'anchor':
      return {
        color: 'colorPaletteAnchorForeground2',
        backgroundColor: 'colorPaletteAnchorBackground2',
      };
    default:
      return {};
  }
}
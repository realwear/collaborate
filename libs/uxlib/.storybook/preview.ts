import { Preview } from '@storybook/angular';
import { MINIMAL_VIEWPORTS } from '@storybook/addon-viewport';

const customViewports = {
    realwear: {
      name: 'Nav-500',
      styles: {
        height: '854px',
        width: '480px'
      },
      type: 'tablet'
    }
  };

const preview: Preview = {
    parameters: {
        viewport: {
            viewports: {
                ...MINIMAL_VIEWPORTS,
                ...customViewports
            },
            defaultViewport: 'realwear',
            defaultOrientation: 'landscape'
        }
    }
}

export default preview;
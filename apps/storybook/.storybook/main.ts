import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: [
    '../../../packages/elements/src/**/*.stories.ts',
    '../../../packages/icons/src/**/*.stories.ts',
    '../../../packages/tokens/src/**/*.stories.ts',
  ],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  viteFinal: (config) => {
    if (process.env['STORYBOOK_BASE_PATH']) {
      config.base = process.env['STORYBOOK_BASE_PATH'];
    }
    return config;
  },
};

export default config;

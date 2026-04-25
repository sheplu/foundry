import '@foundry/themes/css/default.css';
import '@foundry/themes/css/dark.css';
import './preview.css';
import type { Preview } from '@storybook/web-components';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Active theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      document.documentElement.dataset['theme'] = context.globals['theme'] as string;
      return story();
    },
  ],
};

export default preview;

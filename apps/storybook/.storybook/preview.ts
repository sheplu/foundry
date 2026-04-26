import '@foundry/themes/css/default.css';
import '@foundry/themes/css/dark.css';
import './preview.css';
import type { Preview } from '@storybook/web-components';
import { setCustomElementsManifest } from '@storybook/web-components';
import elementsManifest from '@foundry/elements/custom-elements.json' with { type: 'json' };
import iconsManifest from '@foundry/icons/custom-elements.json' with { type: 'json' };
import { FoundryIcon, FoundryIconButton, check, chevronDown, close } from '@foundry/icons';

setCustomElementsManifest({
  ...elementsManifest,
  modules: [...elementsManifest.modules, ...iconsManifest.modules],
});

FoundryIcon.register({ check, 'chevron-down': chevronDown, close });
FoundryIcon.define();
FoundryIconButton.define();

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

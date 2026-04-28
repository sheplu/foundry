import { createApp } from 'vue';
import {
  FoundryAlert,
  FoundryBadge,
  FoundryButton,
  FoundryCluster,
  FoundryDivider,
  FoundryHeading,
  FoundryInset,
  FoundryStack,
  FoundryText,
} from '@foundry/elements';
import { FoundryIcon, FoundryIconButton, check, chevronDown, close } from '@foundry/icons';
import '@foundry/themes/css/default.css';
import App from './App.vue';
import './App.css';

// Register icons once at startup (AGENTS.md §5 pattern).
FoundryIcon.register({ check, 'chevron-down': chevronDown, close });

// Register custom elements once. All defines are idempotent.
FoundryAlert.define();
FoundryBadge.define();
FoundryButton.define();
FoundryCluster.define();
FoundryDivider.define();
FoundryHeading.define();
FoundryInset.define();
FoundryStack.define();
FoundryText.define();
FoundryIcon.define();
FoundryIconButton.define();

createApp(App).mount('#app');

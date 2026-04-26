import { createApp } from 'vue';
import { FoundryButton } from '@foundry/elements';
import { FoundryIcon, FoundryIconButton, check, chevronDown, close } from '@foundry/icons';
import '@foundry/themes/css/default.css';
import App from './App.vue';
import './App.css';

// Register icons once at startup (AGENTS.md §5 pattern).
FoundryIcon.register({ check, 'chevron-down': chevronDown, close });

// Register custom elements once. All defines are idempotent.
FoundryButton.define();
FoundryIcon.define();
FoundryIconButton.define();

createApp(App).mount('#app');

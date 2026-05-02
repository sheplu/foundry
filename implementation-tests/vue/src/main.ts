import { createApp } from 'vue';
import {
  FoundryAlert,
  FoundryAvatar,
  FoundryBadge,
  FoundryBreadcrumb,
  FoundryBreadcrumbs,
  FoundryButton,
  FoundryCheckbox,
  FoundryCluster,
  FoundryDivider,
  FoundryHeading,
  FoundryInset,
  FoundryLink,
  FoundryProgress,
  FoundryRadio,
  FoundrySkeleton,
  FoundrySpinner,
  FoundryStack,
  FoundrySwitch,
  FoundryTag,
  FoundryText,
  FoundryTextField,
  FoundryTextarea,
} from '@foundry/elements';
import { FoundryIcon, FoundryIconButton, check, chevronDown, close } from '@foundry/icons';
import '@foundry/themes/css/default.css';
import App from './App.vue';
import './App.css';

// Register icons once at startup (AGENTS.md §5 pattern).
FoundryIcon.register({ check, 'chevron-down': chevronDown, close });

// Register custom elements once. All defines are idempotent.
FoundryAlert.define();
FoundryAvatar.define();
FoundryBadge.define();
FoundryBreadcrumb.define();
FoundryBreadcrumbs.define();
FoundryButton.define();
FoundryCheckbox.define();
FoundryCluster.define();
FoundryDivider.define();
FoundryHeading.define();
FoundryInset.define();
FoundryLink.define();
FoundryProgress.define();
FoundryRadio.define();
FoundrySkeleton.define();
FoundrySpinner.define();
FoundryStack.define();
FoundrySwitch.define();
FoundryTag.define();
FoundryText.define();
FoundryTextField.define();
FoundryTextarea.define();
FoundryIcon.define();
FoundryIconButton.define();

createApp(App).mount('#app');

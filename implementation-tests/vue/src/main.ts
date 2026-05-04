import { createApp } from 'vue';
import {
  FoundryAccordion,
  FoundryAlert,
  FoundryAvatar,
  FoundryBadge,
  FoundryBreadcrumb,
  FoundryBreadcrumbs,
  FoundryButton,
  FoundryCheckbox,
  FoundryCluster,
  FoundryDetails,
  FoundryDivider,
  FoundryHeading,
  FoundryInset,
  FoundryLink,
  FoundryMenu,
  FoundryMenuitem,
  FoundryModal,
  FoundryOption,
  FoundryPanel,
  FoundryPopover,
  FoundryProgress,
  FoundryRadio,
  FoundrySelect,
  FoundrySkeleton,
  FoundrySpinner,
  FoundryStack,
  FoundrySwitch,
  FoundryTab,
  FoundryTabs,
  FoundryTag,
  FoundryText,
  FoundryTextField,
  FoundryTextarea,
  FoundryTooltip,
} from '@foundry/elements';
import { FoundryIcon, FoundryIconButton, check, chevronDown, close } from '@foundry/icons';
import '@foundry/themes/css/default.css';
import App from './App.vue';
import './App.css';

// Register icons once at startup (AGENTS.md §5 pattern).
FoundryIcon.register({ check, 'chevron-down': chevronDown, close });

// Register custom elements once. All defines are idempotent.
FoundryAccordion.define();
FoundryAlert.define();
FoundryAvatar.define();
FoundryBadge.define();
FoundryBreadcrumb.define();
FoundryBreadcrumbs.define();
FoundryButton.define();
FoundryCheckbox.define();
FoundryCluster.define();
FoundryDetails.define();
FoundryDivider.define();
FoundryHeading.define();
FoundryInset.define();
FoundryLink.define();
FoundryMenu.define();
FoundryMenuitem.define();
FoundryModal.define();
FoundryOption.define();
FoundryPanel.define();
FoundryPopover.define();
FoundryProgress.define();
FoundryRadio.define();
FoundrySelect.define();
FoundrySkeleton.define();
FoundrySpinner.define();
FoundryStack.define();
FoundrySwitch.define();
FoundryTab.define();
FoundryTabs.define();
FoundryTag.define();
FoundryText.define();
FoundryTextField.define();
FoundryTextarea.define();
FoundryTooltip.define();
FoundryIcon.define();
FoundryIconButton.define();

createApp(App).mount('#app');

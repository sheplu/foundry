import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FoundryAccordion,
  FoundryAlert,
  FoundryAvatar,
  FoundryBadge,
  FoundryBreadcrumb,
  FoundryBreadcrumbs,
  FoundryButton,
  FoundryCard,
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
  FoundryPagination,
  FoundryPanel,
  FoundryPopover,
  FoundryProgress,
  FoundryRadio,
  FoundrySelect,
  FoundrySkeleton,
  FoundrySlider,
  FoundrySpinner,
  FoundryStack,
  FoundrySwitch,
  FoundryTab,
  FoundryTabs,
  FoundryTag,
  FoundryText,
  FoundryTextField,
  FoundryTextarea,
  FoundryToast,
  FoundryToastRegion,
  FoundryTooltip,
} from '@foundry/elements';
import { FoundryIcon, FoundryIconButton, check, chevronDown, close } from '@foundry/icons';
import '@foundry/themes/css/default.css';
import App from './App.tsx';
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
FoundryCard.define();
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
FoundryPagination.define();
FoundryPanel.define();
FoundryPopover.define();
FoundryProgress.define();
FoundryRadio.define();
FoundrySelect.define();
FoundrySkeleton.define();
FoundrySlider.define();
FoundrySpinner.define();
FoundryStack.define();
FoundrySwitch.define();
FoundryTab.define();
FoundryTabs.define();
FoundryTag.define();
FoundryText.define();
FoundryTextField.define();
FoundryTextarea.define();
FoundryToast.define();
FoundryToastRegion.define();
FoundryTooltip.define();
FoundryIcon.define();
FoundryIconButton.define();

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

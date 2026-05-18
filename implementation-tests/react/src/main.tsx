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
  FoundryButtonGroup,
  FoundryCard,
  FoundryCarousel,
  FoundryCarouselSlide,
  FoundryCheckbox,
  FoundryCluster,
  FoundryDetails,
  FoundryDivider,
  FoundryDrawer,
  FoundryHeading,
  FoundryInset,
  FoundryLink,
  FoundryMenu,
  FoundryMenuitem,
  FoundryModal,
  FoundryNavbar,
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
  FoundryTable,
  FoundryTablePagination,
  FoundryTabs,
  FoundryTag,
  FoundryTbody,
  FoundryTd,
  FoundryText,
  FoundryTextField,
  FoundryTextarea,
  FoundryTh,
  FoundryThead,
  FoundryToast,
  FoundryToastRegion,
  FoundryTooltip,
  FoundryTr,
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
FoundryButtonGroup.define();
FoundryCard.define();
FoundryCarousel.define();
FoundryCarouselSlide.define();
FoundryCheckbox.define();
FoundryCluster.define();
FoundryDetails.define();
FoundryDivider.define();
FoundryDrawer.define();
FoundryHeading.define();
FoundryInset.define();
FoundryLink.define();
FoundryMenu.define();
FoundryMenuitem.define();
FoundryModal.define();
FoundryNavbar.define();
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
FoundryTable.define();
FoundryTablePagination.define();
FoundryTabs.define();
FoundryTag.define();
FoundryTbody.define();
FoundryTd.define();
FoundryText.define();
FoundryTextField.define();
FoundryTextarea.define();
FoundryTh.define();
FoundryThead.define();
FoundryToast.define();
FoundryToastRegion.define();
FoundryTooltip.define();
FoundryTr.define();
FoundryIcon.define();
FoundryIconButton.define();

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

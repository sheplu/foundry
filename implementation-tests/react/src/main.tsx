import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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
  FoundryTextField,
} from '@foundry/elements';
import { FoundryIcon, FoundryIconButton, check, chevronDown, close } from '@foundry/icons';
import '@foundry/themes/css/default.css';
import App from './App.tsx';
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
FoundryTextField.define();
FoundryIcon.define();
FoundryIconButton.define();

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

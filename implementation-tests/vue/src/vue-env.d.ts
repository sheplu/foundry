/// <reference types="vite/client" />

// Generated from @foundry/elements and @foundry/icons custom-elements.json.
// DO NOT EDIT BY HAND — run `npm run generate:types -w @foundry/vue-canary`
// after changing a component's public API. The manifest is the source of truth.

import type { DefineComponent } from 'vue';

declare module '*.vue' {
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module 'vue' {
  interface GlobalComponents {
    'foundry-button': DefineComponent<{
      variant?: 'primary' | 'secondary' | 'danger';
      disabled?: boolean;
      type?: 'button' | 'submit' | 'reset';
    }>;
    'foundry-heading': DefineComponent<{
      level?: 1 | 2 | 3 | 4 | 5 | 6;
      size?: 'sm' | 'md' | 'lg' | 'xl';
    }>;
    'foundry-icon': DefineComponent<{
      name?: string;
      label?: string;
    }>;
    'foundry-icon-button': DefineComponent<{
      name?: string;
      label?: string;
      variant?: 'primary' | 'secondary' | 'danger';
      disabled?: boolean;
      type?: 'button' | 'submit' | 'reset';
    }>;
    'foundry-text': DefineComponent<{
      variant?: 'body' | 'body-sm' | 'caption' | 'emphasis';
    }>;
  }
}

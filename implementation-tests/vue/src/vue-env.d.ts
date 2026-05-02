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
    'foundry-alert': DefineComponent<{
      variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    }>;
    'foundry-avatar': DefineComponent<{
      src?: string;
      name?: string;
      label?: string;
      size?: 'sm' | 'md' | 'lg';
      shape?: 'circle' | 'square';
      status?: 'online' | 'offline' | 'away' | 'busy';
    }>;
    'foundry-badge': DefineComponent<{
      variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    }>;
    'foundry-breadcrumb': DefineComponent<{
      current?: boolean;
    }>;
    'foundry-breadcrumbs': DefineComponent<Record<string, never>>;
    'foundry-button': DefineComponent<{
      variant?: 'primary' | 'secondary' | 'danger';
      disabled?: boolean;
      loading?: boolean;
      type?: 'button' | 'submit' | 'reset';
    }>;
    'foundry-checkbox': DefineComponent<{
      name?: string;
      value?: string;
      checked?: boolean;
      required?: boolean;
      disabled?: boolean;
      invalid?: boolean;
    }>;
    'foundry-cluster': DefineComponent<{
      space?: 'xs' | 'sm' | 'md' | 'lg';
    }>;
    'foundry-divider': DefineComponent<{
      orientation?: 'horizontal' | 'vertical';
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
    'foundry-inset': DefineComponent<{
      space?: 'sm' | 'md' | 'lg';
    }>;
    'foundry-link': DefineComponent<{
      variant?: 'inline' | 'standalone';
      href?: string;
      target?: '_self' | '_blank' | '_parent' | '_top';
      rel?: string;
      download?: string;
      hreflang?: string;
      type?: string;
    }>;
    'foundry-progress': DefineComponent<{
      value?: number;
      max?: number;
      variant?: 'neutral' | 'success' | 'warning' | 'danger';
      label?: string;
    }>;
    'foundry-radio': DefineComponent<{
      name?: string;
      value?: string;
      checked?: boolean;
      required?: boolean;
      disabled?: boolean;
      invalid?: boolean;
    }>;
    'foundry-skeleton': DefineComponent<{
      shape?: 'text' | 'circle' | 'rect';
      label?: string;
    }>;
    'foundry-spinner': DefineComponent<{
      size?: 'sm' | 'md' | 'lg';
      label?: string;
    }>;
    'foundry-stack': DefineComponent<{
      space?: 'xs' | 'sm' | 'md' | 'lg';
    }>;
    'foundry-switch': DefineComponent<{
      name?: string;
      value?: string;
      checked?: boolean;
      required?: boolean;
      disabled?: boolean;
      invalid?: boolean;
    }>;
    'foundry-tag': DefineComponent<{
      variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
      value?: string;
      removable?: boolean;
      disabled?: boolean;
    }>;
    'foundry-text': DefineComponent<{
      variant?: 'body' | 'body-sm' | 'caption' | 'emphasis';
    }>;
    'foundry-text-field': DefineComponent<{
      name?: string;
      value?: string;
      type?: 'text' | 'email' | 'url' | 'tel' | 'password' | 'number' | 'search';
      placeholder?: string;
      required?: boolean;
      disabled?: boolean;
      readonly?: boolean;
      pattern?: string;
      minlength?: number;
      maxlength?: number;
      min?: string;
      max?: string;
      step?: string;
      autocomplete?: string;
      inputmode?: string;
      invalid?: boolean;
    }>;
    'foundry-textarea': DefineComponent<{
      name?: string;
      value?: string;
      placeholder?: string;
      required?: boolean;
      disabled?: boolean;
      readonly?: boolean;
      minlength?: number;
      maxlength?: number;
      autocomplete?: string;
      inputmode?: string;
      rows?: number;
      invalid?: boolean;
    }>;
  }
}

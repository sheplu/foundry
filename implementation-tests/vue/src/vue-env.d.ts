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
    'foundry-accordion': DefineComponent<{
      mode?: 'single' | 'multiple';
    }>;
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
      value?: string;
    }>;
    'foundry-button-group': DefineComponent<{
      mode?: 'single' | 'multiple';
      value?: string;
      orientation?: 'horizontal' | 'vertical';
      disabled?: boolean;
      label?: string;
    }>;
    'foundry-card': DefineComponent<{
      variant?: 'outlined' | 'elevated';
    }>;
    'foundry-carousel': DefineComponent<{
      value?: string;
      transition?: 'slide' | 'fade';
      'auto-advance'?: number;
      loop?: boolean;
      label?: string;
      'prev-label'?: string;
      'next-label'?: string;
      'indicator-label'?: string;
    }>;
    'foundry-carousel-slide': DefineComponent<{
      value?: string;
      selected?: boolean;
      label?: string;
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
    'foundry-details': DefineComponent<{
      value?: string;
      open?: boolean;
      disabled?: boolean;
    }>;
    'foundry-divider': DefineComponent<{
      orientation?: 'horizontal' | 'vertical';
    }>;
    'foundry-drawer': DefineComponent<{
      open?: boolean;
      placement?: 'start' | 'end' | 'top' | 'bottom';
      'dismiss-on-backdrop'?: boolean;
      'hide-close-button'?: boolean;
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
      loading?: boolean;
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
    'foundry-menu': DefineComponent<{
      open?: boolean;
      placement?: 'top' | 'bottom' | 'left' | 'right';
    }>;
    'foundry-menuitem': DefineComponent<{
      value?: string;
      disabled?: boolean;
      active?: boolean;
    }>;
    'foundry-modal': DefineComponent<{
      open?: boolean;
      size?: 'sm' | 'md' | 'lg';
      'dismiss-on-backdrop'?: boolean;
      'hide-close-button'?: boolean;
    }>;
    'foundry-navbar': DefineComponent<{
      variant?: 'flat' | 'outlined' | 'elevated';
      sticky?: boolean;
      label?: string;
    }>;
    'foundry-option': DefineComponent<{
      value?: string;
      disabled?: boolean;
      selected?: boolean;
      active?: boolean;
    }>;
    'foundry-pagination': DefineComponent<{
      page?: number;
      total?: number;
      'sibling-count'?: number;
      'prev-label'?: string;
      'next-label'?: string;
      'page-label'?: string;
      'ellipsis-label'?: string;
    }>;
    'foundry-panel': DefineComponent<{
      selected?: boolean;
    }>;
    'foundry-popover': DefineComponent<{
      placement?: 'top' | 'bottom' | 'left' | 'right';
      open?: boolean;
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
    'foundry-select': DefineComponent<{
      name?: string;
      value?: string;
      placeholder?: string;
      required?: boolean;
      disabled?: boolean;
      invalid?: boolean;
      open?: boolean;
      searchable?: boolean;
      'search-label'?: string;
      'no-results-label'?: string;
    }>;
    'foundry-skeleton': DefineComponent<{
      shape?: 'text' | 'circle' | 'rect';
      label?: string;
    }>;
    'foundry-slider': DefineComponent<{
      name?: string;
      value?: number;
      min?: number;
      max?: number;
      step?: number;
      disabled?: boolean;
      required?: boolean;
      label?: string;
      'value-label'?: string;
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
    'foundry-tab': DefineComponent<{
      value?: string;
      disabled?: boolean;
      selected?: boolean;
    }>;
    'foundry-table': DefineComponent<{
      variant?: 'default' | 'striped';
      bordered?: boolean;
      compact?: boolean;
      label?: string;
    }>;
    'foundry-tabs': DefineComponent<{
      value?: string;
      orientation?: 'horizontal' | 'vertical';
    }>;
    'foundry-tag': DefineComponent<{
      variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
      value?: string;
      removable?: boolean;
      disabled?: boolean;
    }>;
    'foundry-tbody': DefineComponent<Record<string, never>>;
    'foundry-td': DefineComponent<Record<string, never>>;
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
    'foundry-th': DefineComponent<{
      sortable?: boolean;
      direction?: 'asc' | 'desc' | 'none';
      scope?: 'col' | 'row';
    }>;
    'foundry-thead': DefineComponent<Record<string, never>>;
    'foundry-toast': DefineComponent<{
      variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
      duration?: number;
      closeable?: boolean;
      open?: boolean;
    }>;
    'foundry-toast-region': DefineComponent<{
      position?: string;
      max?: number;
    }>;
    'foundry-tooltip': DefineComponent<{
      placement?: 'top' | 'bottom' | 'left' | 'right';
      'delay-show'?: number;
      'delay-hide'?: number;
      open?: boolean;
    }>;
    'foundry-tr': DefineComponent<Record<string, never>>;
  }
}

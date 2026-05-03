/// <reference types="vite/client" />

// Generated from @foundry/elements and @foundry/icons custom-elements.json.
// DO NOT EDIT BY HAND — run `npm run generate:types -w @foundry/react-canary`
// after changing a component's public API. The manifest is the source of truth.

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'foundry-alert': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
      };
      'foundry-avatar': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        name?: string;
        label?: string;
        size?: 'sm' | 'md' | 'lg';
        shape?: 'circle' | 'square';
        status?: 'online' | 'offline' | 'away' | 'busy';
      };
      'foundry-badge': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
      };
      'foundry-breadcrumb': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        current?: boolean;
      };
      'foundry-breadcrumbs': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {};
      'foundry-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
        loading?: boolean;
        type?: 'button' | 'submit' | 'reset';
      };
      'foundry-checkbox': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        value?: string;
        checked?: boolean;
        required?: boolean;
        disabled?: boolean;
        invalid?: boolean;
      };
      'foundry-cluster': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        space?: 'xs' | 'sm' | 'md' | 'lg';
      };
      'foundry-divider': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        orientation?: 'horizontal' | 'vertical';
      };
      'foundry-heading': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        level?: 1 | 2 | 3 | 4 | 5 | 6;
        size?: 'sm' | 'md' | 'lg' | 'xl';
      };
      'foundry-icon': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        label?: string;
      };
      'foundry-icon-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        label?: string;
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
        loading?: boolean;
        type?: 'button' | 'submit' | 'reset';
      };
      'foundry-inset': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        space?: 'sm' | 'md' | 'lg';
      };
      'foundry-link': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'inline' | 'standalone';
        href?: string;
        target?: '_self' | '_blank' | '_parent' | '_top';
        rel?: string;
        download?: string;
        hreflang?: string;
        type?: string;
      };
      'foundry-popover': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        placement?: 'top' | 'bottom' | 'left' | 'right';
        open?: boolean;
      };
      'foundry-progress': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: number;
        max?: number;
        variant?: 'neutral' | 'success' | 'warning' | 'danger';
        label?: string;
      };
      'foundry-radio': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        value?: string;
        checked?: boolean;
        required?: boolean;
        disabled?: boolean;
        invalid?: boolean;
      };
      'foundry-skeleton': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        shape?: 'text' | 'circle' | 'rect';
        label?: string;
      };
      'foundry-spinner': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: 'sm' | 'md' | 'lg';
        label?: string;
      };
      'foundry-stack': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        space?: 'xs' | 'sm' | 'md' | 'lg';
      };
      'foundry-switch': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        value?: string;
        checked?: boolean;
        required?: boolean;
        disabled?: boolean;
        invalid?: boolean;
      };
      'foundry-tag': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
        value?: string;
        removable?: boolean;
        disabled?: boolean;
      };
      'foundry-text': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'body' | 'body-sm' | 'caption' | 'emphasis';
      };
      'foundry-text-field': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
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
      };
      'foundry-textarea': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
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
      };
      'foundry-tooltip': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        placement?: 'top' | 'bottom' | 'left' | 'right';
        'delay-show'?: number;
        'delay-hide'?: number;
        open?: boolean;
      };
    }
  }
}

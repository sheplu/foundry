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
      'foundry-badge': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
      };
      'foundry-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
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
        type?: 'button' | 'submit' | 'reset';
      };
      'foundry-inset': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        space?: 'sm' | 'md' | 'lg';
      };
      'foundry-stack': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        space?: 'xs' | 'sm' | 'md' | 'lg';
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
    }
  }
}

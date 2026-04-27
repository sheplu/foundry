/// <reference types="vite/client" />

// Generated from @foundry/elements and @foundry/icons custom-elements.json.
// DO NOT EDIT BY HAND — run `npm run generate:types -w @foundry/react-canary`
// after changing a component's public API. The manifest is the source of truth.

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'foundry-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
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
      'foundry-stack': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        space?: 'xs' | 'sm' | 'md' | 'lg';
      };
      'foundry-text': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'body' | 'body-sm' | 'caption' | 'emphasis';
      };
    }
  }
}

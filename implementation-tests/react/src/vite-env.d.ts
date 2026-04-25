/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// JSX intrinsics for the foundry custom elements. This is NOT a React wrapper
// around the components (AGENTS.md §9 forbids that). It's purely ambient typing
// so TSX compiles without any-casting every `<foundry-*>` element.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'foundry-button': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: 'primary' | 'secondary' | 'danger';
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
      };
      'foundry-icon': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        name?: string;
        label?: string;
      };
    }
  }
}

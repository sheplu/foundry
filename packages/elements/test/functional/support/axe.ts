import 'axe-core';
import { expect } from '@open-wc/testing';

interface AxeViolation {
  id: string;
  description: string;
  impact?: string | null;
  nodes: unknown[];
}

interface AxeRun {
  run: (
    context: Element | Document,
    options: unknown,
  ) => Promise<{ violations: AxeViolation[] }>;
}

const axe = (globalThis as unknown as { axe: AxeRun }).axe;

const DEFAULT_OPTIONS = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'],
  },
};

export async function expectA11y(
  node: Element,
  options: unknown = DEFAULT_OPTIONS,
): Promise<void> {
  const results = await axe.run(node, options);
  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `  - [${v.impact ?? 'unknown'}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
      .join('\n');
    expect.fail(`axe found ${results.violations.length} violation(s):\n${summary}`);
  }
}

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryTable } from './table.ts';
import { FoundryTh } from '../th/th.ts';

beforeAll(() => {
  FoundryTable.define();
  FoundryTh.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-table-test-${++counter}`;
  class Sub extends FoundryTable {}
  customElements.define(tag, Sub);
  return { tag };
}

function makeTable(opts: {
  variant?: 'default' | 'striped';
  bordered?: boolean;
  compact?: boolean;
  label?: string;
  innerHTML?: string;
} = {}): FoundryTable {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundryTable;
  if (opts.variant) el.setAttribute('variant', opts.variant);
  if (opts.bordered) el.setAttribute('bordered', '');
  if (opts.compact) el.setAttribute('compact', '');
  if (opts.label !== undefined) el.setAttribute('label', opts.label);
  if (opts.innerHTML) el.innerHTML = opts.innerHTML;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTable.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-table')).toBe(FoundryTable);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-table-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryTable.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTable defaults', () => {
  it('defaults variant="default", bordered=false, compact=false', () => {
    const el = makeTable();
    expect(el.getAttribute('variant')).toBe('default');
    expect(el.hasAttribute('bordered')).toBe(false);
    expect(el.hasAttribute('compact')).toBe(false);
  });

  it('defaults label to "Data table" and forwards to inner table aria-label', () => {
    const el = makeTable();
    const inner = el.shadowRoot?.querySelector('table[part="table"]');
    expect(inner?.getAttribute('aria-label')).toBe('Data table');
  });
});

describe('FoundryTable rendering', () => {
  it('renders an inner native <table>', () => {
    const el = makeTable();
    expect(el.shadowRoot?.querySelector('table[part="table"]')).toBeTruthy();
  });

  it('reflects variant onto the host', () => {
    const el = makeTable({ variant: 'striped' });
    expect(el.getAttribute('variant')).toBe('striped');
  });

  it('reflects bordered + compact', () => {
    const el = makeTable({ bordered: true, compact: true });
    expect(el.hasAttribute('bordered')).toBe(true);
    expect(el.hasAttribute('compact')).toBe(true);
  });

  it('updates aria-label when label changes', () => {
    const el = makeTable();
    el.setAttribute('label', 'Users by department');
    expect(
      el.shadowRoot?.querySelector('table[part="table"]')?.getAttribute('aria-label'),
    ).toBe('Users by department');
  });

  it('empty label falls back to "Data table"', () => {
    const el = makeTable();
    (el as unknown as { label: string }).label = '';
    expect(
      el.shadowRoot?.querySelector('table[part="table"]')?.getAttribute('aria-label'),
    ).toBe('Data table');
  });
});

describe('FoundryTable — sort coordination', () => {
  it('sort event from a child <foundry-th> clears direction on sibling sortable headers', () => {
    const el = makeTable({
      innerHTML: `
        <foundry-th sortable direction="asc" data-name>Name</foundry-th>
        <foundry-th sortable direction="none" data-age>Age</foundry-th>
        <foundry-th sortable direction="none" data-city>City</foundry-th>
      `,
    });
    const ageHeader = el.querySelector<FoundryTh>('[data-age]');
    ageHeader?.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]')?.click();
    // Name (which had asc) should be cleared by the table parent. The age
    // header is the originator; consumer would write its new direction.
    expect(el.querySelector<FoundryTh>('[data-name]')?.getAttribute('direction')).toBe('none');
    expect(el.querySelector<FoundryTh>('[data-city]')?.getAttribute('direction')).toBe('none');
  });

  it('does not clear direction on the originator of the sort event', () => {
    const el = makeTable({
      innerHTML: `
        <foundry-th sortable direction="asc" data-name>Name</foundry-th>
      `,
    });
    const name = el.querySelector<FoundryTh>('[data-name]');
    name?.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]')?.click();
    // Originator's direction is the consumer's responsibility — table
    // parent must not touch it.
    expect(name?.getAttribute('direction')).toBe('asc');
  });

  it('non-sortable th children are not modified on sort', () => {
    const el = makeTable({
      innerHTML: `
        <foundry-th data-static>Plain</foundry-th>
        <foundry-th sortable direction="none" data-active>Active</foundry-th>
      `,
    });
    const active = el.querySelector<FoundryTh>('[data-active]');
    active?.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]')?.click();
    // Plain th has no direction attribute; it must not be added.
    expect(el.querySelector<FoundryTh>('[data-static]')?.hasAttribute('direction')).toBe(false);
  });
});

describe('FoundryTable — propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const el = makeTable();
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});

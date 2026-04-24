import { describe, expect, it } from 'vitest';
import { createTemplate } from './template';

describe('createTemplate', () => {
  it('returns an HTMLTemplateElement', () => {
    const t = createTemplate('<p>hi</p>');
    expect(t).toBeInstanceOf(HTMLTemplateElement);
  });

  it('parses markup into the template content', () => {
    const t = createTemplate('<button data-ref="btn">Go</button>');
    const btn = t.content.querySelector('button');

    expect(btn).not.toBeNull();
    expect(btn?.textContent).toBe('Go');
    expect(btn?.dataset['ref']).toBe('btn');
  });

  it('produces an empty template when given an empty string', () => {
    const t = createTemplate('');
    expect(t.content.childNodes).toHaveLength(0);
  });

  it('returns independent instances on each call', () => {
    const a = createTemplate('<span>a</span>');
    const b = createTemplate('<span>b</span>');

    expect(a).not.toBe(b);
    expect(a.content.querySelector('span')?.textContent).toBe('a');
    expect(b.content.querySelector('span')?.textContent).toBe('b');
  });
});

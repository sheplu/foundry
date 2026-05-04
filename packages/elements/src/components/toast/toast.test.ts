import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FoundryToast } from './toast.ts';

beforeAll(() => {
  FoundryToast.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-toast-test-${++counter}`;
  class Sub extends FoundryToast {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

// Helper: jsdom may not fire `transitionend`. Dispatch one so the exit
// animation waitForExit resolves quickly in tests.
function fastExit(el: HTMLElement): void {
  queueMicrotask(() => {
    el.dispatchEvent(new Event('transitionend'));
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryToast.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-toast')).toBe(FoundryToast);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-toast-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryToast.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryToast defaults', () => {
  it('defaults variant=info, duration=5000, closeable=true', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast & {
      variant: string;
      duration: number;
      closeable: boolean;
    };
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('info');
    expect(el.duration).toBe(5000);
    expect(el.closeable).toBe(true);
  });

  it('reflects open=true after connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('renders container, icon, content, title, body, close-button parts', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const root = el.shadowRoot;
    expect(root?.querySelector('[part="container"]')).toBeTruthy();
    expect(root?.querySelector('[part="icon"]')).toBeTruthy();
    expect(root?.querySelector('[part="content"]')).toBeTruthy();
    expect(root?.querySelector('[part="title"]')).toBeTruthy();
    expect(root?.querySelector('[part="body"]')).toBeTruthy();
    expect(root?.querySelector('[part="close-button"]')).toBeTruthy();
    expect(root?.querySelector('svg[part="close-icon"]')).toBeTruthy();
  });
});

describe('FoundryToast variant → role', () => {
  it.each(['info', 'success', 'neutral'])(
    '%s variant → role="status" on the container',
    (variant) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('variant', variant);
      document.body.appendChild(el);
      const container = el.shadowRoot?.querySelector('[part="container"]');
      expect(container?.getAttribute('role')).toBe('status');
    },
  );

  it.each(['warning', 'danger'])(
    '%s variant → role="alert" on the container',
    (variant) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('variant', variant);
      document.body.appendChild(el);
      const container = el.shadowRoot?.querySelector('[part="container"]');
      expect(container?.getAttribute('role')).toBe('alert');
    },
  );

  it('switching variant at runtime updates the role', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast & { variant: string };
    document.body.appendChild(el);
    expect(el.shadowRoot?.querySelector('[part="container"]')?.getAttribute('role')).toBe('status');
    el.variant = 'danger';
    expect(el.shadowRoot?.querySelector('[part="container"]')?.getAttribute('role')).toBe('alert');
  });

  it('container carries aria-atomic=true', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.shadowRoot?.querySelector('[part="container"]')?.getAttribute('aria-atomic')).toBe('true');
  });
});

describe('FoundryToast slot-content reflection', () => {
  it('reflects has-title when title slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="title">Saved</span>Body text';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-title')).toBe(true);
  });

  it('reflects has-icon when icon slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="icon">★</span>Body';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-icon')).toBe(true);
  });

  it('does not reflect has-title / has-icon when slots are empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Body only';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-title')).toBe(false);
    expect(el.hasAttribute('has-icon')).toBe(false);
  });
});

describe('FoundryToast open event', () => {
  it('fires once on connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    let fired = 0;
    el.addEventListener('open', () => {
      fired += 1;
    });
    document.body.appendChild(el);
    expect(fired).toBe(1);
  });

  it('does not re-fire when reconnected after disconnect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    let fired = 0;
    el.addEventListener('open', () => {
      fired += 1;
    });
    document.body.appendChild(el);
    el.remove();
    document.body.appendChild(el);
    expect(fired).toBe(1);
  });
});

describe('FoundryToast auto-dismiss', () => {
  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers();
    try {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('duration', '100');
      document.body.appendChild(el);
      fastExit(el);
      let closed = false;
      el.addEventListener('close', () => {
        closed = true;
      });
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(el.parentNode).toBeNull();
      expect(closed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('duration=0 disables auto-dismiss', async () => {
    vi.useFakeTimers();
    try {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('duration', '0');
      document.body.appendChild(el);
      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();
      expect(el.parentNode).toBe(document.body);
    } finally {
      vi.useRealTimers();
    }
  });

  it('changing duration at runtime reschedules', async () => {
    vi.useFakeTimers();
    try {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundryToast & { duration: number };
      el.setAttribute('duration', '5000');
      document.body.appendChild(el);
      // Advance halfway, then shrink duration. The new schedule should
      // apply from now (restart), not keep the old remainder.
      vi.advanceTimersByTime(2500);
      fastExit(el);
      el.duration = 200;
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();
      expect(el.parentNode).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('FoundryToast hover/focus pause', () => {
  it('pointerenter pauses the timer; pointerleave resumes from remaining', async () => {
    vi.useFakeTimers();
    try {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('duration', '1000');
      document.body.appendChild(el);
      fastExit(el);
      vi.advanceTimersByTime(400);

      // Pause.
      el.dispatchEvent(new PointerEvent('pointerenter'));
      vi.advanceTimersByTime(5000);
      expect(el.parentNode).toBe(document.body);

      // Resume → remaining ≈ 600ms.
      el.dispatchEvent(new PointerEvent('pointerleave'));
      vi.advanceTimersByTime(600);
      await vi.runAllTimersAsync();
      expect(el.parentNode).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('focusin pauses; focusout resumes', async () => {
    vi.useFakeTimers();
    try {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('duration', '500');
      document.body.appendChild(el);
      fastExit(el);

      // focusin fires a FocusEvent. relatedTarget=null is fine.
      el.dispatchEvent(new FocusEvent('focusin'));
      vi.advanceTimersByTime(5000);
      expect(el.parentNode).toBe(document.body);

      el.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }));
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      expect(el.parentNode).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('pointerleave does not resume while focus-within is still true', async () => {
    vi.useFakeTimers();
    try {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('duration', '300');
      document.body.appendChild(el);
      fastExit(el);

      // Pause via both hover + focus.
      el.dispatchEvent(new PointerEvent('pointerenter'));
      el.dispatchEvent(new FocusEvent('focusin'));

      // Mock :focus-within match so pointerleave sees focus still inside.
      const origMatches = el.matches.bind(el);
      el.matches = ((selector: string): boolean => {
        if (selector === ':focus-within') return true;
        return origMatches(selector);
      }) as typeof el.matches;

      el.dispatchEvent(new PointerEvent('pointerleave'));
      vi.advanceTimersByTime(5000);
      expect(el.parentNode).toBe(document.body);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('FoundryToast dismiss lifecycle', () => {
  it('dismiss(reason) fires a cancelable dismiss event with reason detail', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast;
    document.body.appendChild(el);
    let detail: { reason: string } | undefined;
    el.addEventListener('dismiss', (e) => {
      detail = (e as CustomEvent<{ reason: string }>).detail;
    });
    fastExit(el);
    await el.dismiss('manual');
    expect(detail?.reason).toBe('manual');
    expect(el.parentNode).toBeNull();
  });

  it('preventDefault on dismiss keeps the toast alive', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast;
    document.body.appendChild(el);
    el.addEventListener('dismiss', (e) => {
      e.preventDefault();
    });
    await el.dismiss('manual');
    expect(el.parentNode).toBe(document.body);
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('close event fires after removal + closed Promise resolves', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast;
    document.body.appendChild(el);
    let closeFired = false;
    el.addEventListener('close', () => {
      closeFired = true;
    });
    const closedPromise = el.closed;
    fastExit(el);
    await el.dismiss('manual');
    await closedPromise;
    expect(closeFired).toBe(true);
  });

  it('second dismiss call is a no-op while the first is in flight', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast;
    document.body.appendChild(el);
    let count = 0;
    el.addEventListener('dismiss', () => {
      count += 1;
    });
    fastExit(el);
    void el.dismiss('manual');
    await el.dismiss('manual');
    expect(count).toBe(1);
  });
});

describe('FoundryToast close button', () => {
  it('clicking close button dismisses with reason=close-button', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast;
    document.body.appendChild(el);
    let detail: { reason: string } | undefined;
    el.addEventListener('dismiss', (e) => {
      detail = (e as CustomEvent<{ reason: string }>).detail;
    });
    fastExit(el);
    const btn = el.shadowRoot?.querySelector('button[part="close-button"]') as HTMLButtonElement;
    btn.click();
    // Wait for the async dismiss → removal cycle.
    await el.closed;
    expect(detail?.reason).toBe('close-button');
    expect(el.parentNode).toBeNull();
  });

  it('hidden close button when closeable=false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast & { closeable: boolean };
    document.body.appendChild(el);
    el.closeable = false;
    expect(el.hasAttribute('closeable')).toBe(false);
  });
});

describe('FoundryToast Escape key', () => {
  it('Escape on the toast dismisses it', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryToast;
    document.body.appendChild(el);
    let detail: { reason: string } | undefined;
    el.addEventListener('dismiss', (e) => {
      detail = (e as CustomEvent<{ reason: string }>).detail;
    });
    fastExit(el);
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await el.closed;
    expect(detail?.reason).toBe('close-button');
  });
});

describe('FoundryToast disconnect cleanup', () => {
  it('clears timers on disconnect', async () => {
    vi.useFakeTimers();
    try {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('duration', '500');
      document.body.appendChild(el);
      el.remove();
      // Timer must not fire post-disconnect.
      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();
      // Re-connect should not throw.
      expect(() => document.body.appendChild(el)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('FoundryToast propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});

import { useEffect, useRef, useState, type FormEvent, type JSX } from 'react';

type Theme = 'light' | 'dark';

function setDocumentTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme;
}

export default function App(): JSX.Element {
  const [theme, setTheme] = useState<Theme>('light');
  const [clicks, setClicks] = useState(0);
  const [formOutput, setFormOutput] = useState('');
  const [tagRemoveLog, setTagRemoveLog] = useState('');
  const tagRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDocumentTheme(theme);
  }, [theme]);

  useEffect(() => {
    const row = tagRowRef.current;
    if (!row) return;
    const handler = (event: Event): void => {
      const detail = (event as CustomEvent<{ value: string }>).detail;
      setTagRemoveLog(detail.value);
    };
    row.addEventListener('remove', handler);
    return (): void => row.removeEventListener('remove', handler);
  }, []);

  function toggleTheme(): void {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }

  function onButtonClick(): void {
    setClicks((n) => n + 1);
  }

  function onFormSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const record: Record<string, string> = {};
    for (const [key, val] of data.entries()) record[key] = String(val);
    setFormOutput(JSON.stringify(record));
  }

  return (
    <>
      <header className="app-header" data-testid="app-header">
        <h1>foundry canary</h1>
        <button
          type="button"
          data-testid="theme-toggle"
          onClick={toggleTheme}
          aria-pressed={theme === 'dark'}
        >
          Theme: {theme}
        </button>
      </header>

      <nav className="breadcrumbs-row" data-testid="breadcrumbs-row">
        <foundry-breadcrumbs data-testid="breadcrumbs">
          <foundry-breadcrumb data-testid="bc-home">
            <foundry-link href="/">Home</foundry-link>
          </foundry-breadcrumb>
          <foundry-breadcrumb data-testid="bc-docs">
            <foundry-link href="/docs">Docs</foundry-link>
          </foundry-breadcrumb>
          <foundry-breadcrumb current data-testid="bc-current">
            Breadcrumbs
          </foundry-breadcrumb>
        </foundry-breadcrumbs>
      </nav>

      <main>
        <section>
          <h2>Buttons</h2>
          <div className="button-grid" data-testid="button-grid">
            <foundry-button
              variant="primary"
              onClick={onButtonClick}
              data-testid="btn-primary"
            >
              primary
            </foundry-button>
            <foundry-button
              variant="secondary"
              onClick={onButtonClick}
              data-testid="btn-secondary"
            >
              secondary
            </foundry-button>
            <foundry-button
              variant="danger"
              onClick={onButtonClick}
              data-testid="btn-danger"
            >
              danger
            </foundry-button>

            <foundry-button
              variant="primary"
              disabled
              onClick={onButtonClick}
              data-testid="btn-primary-disabled"
            >
              primary
            </foundry-button>
            <foundry-button
              variant="secondary"
              disabled
              onClick={onButtonClick}
              data-testid="btn-secondary-disabled"
            >
              secondary
            </foundry-button>
            <foundry-button
              variant="danger"
              disabled
              onClick={onButtonClick}
              data-testid="btn-danger-disabled"
            >
              danger
            </foundry-button>
            <foundry-button
              variant="primary"
              loading
              onClick={onButtonClick}
              data-testid="btn-primary-loading"
            >
              primary loading
            </foundry-button>
          </div>
          <p>
            Clicks: <strong data-testid="click-count">{clicks}</strong>
          </p>
        </section>

        <section>
          <h2>Icons</h2>
          <ul className="icon-gallery" data-testid="icon-gallery">
            <li>
              <foundry-icon name="check" label="Check" />
              <span>check</span>
            </li>
            <li>
              <foundry-icon name="chevron-down" label="Chevron down" />
              <span>chevron-down</span>
            </li>
            <li>
              <foundry-icon name="close" label="Close" />
              <span>close</span>
            </li>
          </ul>
        </section>

        <section>
          <h2>Icon buttons</h2>
          <div className="icon-button-row" data-testid="icon-button-row">
            <foundry-icon-button
              name="check"
              label="Confirm"
              variant="primary"
              onClick={onButtonClick}
              data-testid="iconbtn-confirm"
            />
            <foundry-icon-button
              name="close"
              label="Close"
              variant="secondary"
              onClick={onButtonClick}
              data-testid="iconbtn-close"
            />
            <foundry-icon-button
              name="close"
              label="Close disabled"
              variant="danger"
              disabled
              onClick={onButtonClick}
              data-testid="iconbtn-close-disabled"
            />
            <foundry-icon-button
              name="check"
              label="Save"
              variant="primary"
              loading
              onClick={onButtonClick}
              data-testid="iconbtn-loading"
            />
          </div>
        </section>

        <section>
          <h2>Tooltips</h2>
          <div
            className="tooltip-row"
            data-testid="tooltip-row"
            style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}
          >
            <foundry-tooltip placement="top" data-testid="tooltip-top">
              <foundry-button data-testid="tooltip-top-trigger">Top</foundry-button>
              <span slot="content">Top tooltip</span>
            </foundry-tooltip>
            <foundry-tooltip placement="bottom" data-testid="tooltip-bottom">
              <foundry-icon-button
                name="close"
                label="Close"
                data-testid="tooltip-bottom-trigger"
              />
              <span slot="content">Close this panel</span>
            </foundry-tooltip>
            <foundry-tooltip placement="right" data-testid="tooltip-right">
              <button data-testid="tooltip-right-trigger">info</button>
              <span slot="content">Info tooltip</span>
            </foundry-tooltip>
          </div>
        </section>

        <section>
          <h2>Popovers</h2>
          <div
            className="popover-row"
            data-testid="popover-row"
            style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}
          >
            <foundry-popover placement="bottom" data-testid="popover-default">
              <foundry-button data-testid="popover-trigger">Open</foundry-button>
              <div
                slot="content"
                data-testid="popover-content"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'sans-serif' }}
              >
                <strong>Edit profile</strong>
                <p style={{ margin: 0 }}>Make changes and confirm to save.</p>
              </div>
            </foundry-popover>
          </div>
        </section>

        <section>
          <h2>Headings</h2>
          <div className="heading-row" data-testid="heading-row">
            <foundry-heading level={1} data-testid="heading-page">
              Page title
            </foundry-heading>
            <foundry-heading level={2} size="lg" data-testid="heading-section">
              Section title
            </foundry-heading>
            <foundry-heading level={3} size="sm" data-testid="heading-sub">
              Subsection title
            </foundry-heading>
          </div>
        </section>

        <section>
          <h2>Text</h2>
          <div className="text-row" data-testid="text-row">
            <foundry-text data-testid="text-body">Body text</foundry-text>
            <foundry-text variant="body-sm" data-testid="text-body-sm">
              Small body text
            </foundry-text>
            <foundry-text variant="caption" data-testid="text-caption">
              Caption
            </foundry-text>
            <foundry-text variant="emphasis" data-testid="text-emphasis">
              Emphasis
            </foundry-text>
          </div>
        </section>

        <section>
          <h2>Links</h2>
          <div className="link-row" data-testid="link-row">
            <foundry-link href="/docs" data-testid="link-inline">
              docs
            </foundry-link>
            <foundry-link variant="standalone" href="/nav" data-testid="link-standalone">
              nav
            </foundry-link>
            <foundry-link href="https://example.com" target="_blank" data-testid="link-external">
              external
            </foundry-link>
          </div>
        </section>

        <section>
          <h2>Stacks</h2>
          <div className="stack-row" data-testid="stack-row">
            <foundry-stack space="xs" data-testid="stack-xs">
              <div>first</div>
              <div>second</div>
            </foundry-stack>
            <foundry-stack space="sm" data-testid="stack-sm">
              <div>first</div>
              <div>second</div>
            </foundry-stack>
            <foundry-stack data-testid="stack-md">
              <div>first</div>
              <div>second</div>
            </foundry-stack>
            <foundry-stack space="lg" data-testid="stack-lg">
              <div>first</div>
              <div>second</div>
            </foundry-stack>
          </div>
        </section>

        <section>
          <h2>Clusters</h2>
          <div className="cluster-row" data-testid="cluster-row">
            <foundry-cluster space="xs" data-testid="cluster-xs">
              <span>one</span>
              <span>two</span>
            </foundry-cluster>
            <foundry-cluster space="sm" data-testid="cluster-sm">
              <span>one</span>
              <span>two</span>
            </foundry-cluster>
            <foundry-cluster data-testid="cluster-md">
              <span>one</span>
              <span>two</span>
            </foundry-cluster>
            <foundry-cluster space="lg" data-testid="cluster-lg">
              <span>one</span>
              <span>two</span>
            </foundry-cluster>
          </div>
        </section>

        <section>
          <h2>Insets</h2>
          <div className="inset-row" data-testid="inset-row">
            <foundry-inset space="sm" data-testid="inset-sm">
              <span>padded</span>
            </foundry-inset>
            <foundry-inset data-testid="inset-md">
              <span>padded</span>
            </foundry-inset>
            <foundry-inset space="lg" data-testid="inset-lg">
              <span>padded</span>
            </foundry-inset>
          </div>
        </section>

        <section>
          <h2>Dividers</h2>
          <div className="divider-row" data-testid="divider-row">
            <foundry-divider data-testid="divider-horizontal"></foundry-divider>
            <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
              <span>before</span>
              <foundry-divider
                orientation="vertical"
                data-testid="divider-vertical"
              ></foundry-divider>
              <span>after</span>
            </div>
          </div>
        </section>

        <section>
          <h2>Badges</h2>
          <div className="badge-row" data-testid="badge-row">
            <foundry-badge data-testid="badge-neutral">neutral</foundry-badge>
            <foundry-badge variant="info" data-testid="badge-info">info</foundry-badge>
            <foundry-badge variant="success" data-testid="badge-success">success</foundry-badge>
            <foundry-badge variant="warning" data-testid="badge-warning">warning</foundry-badge>
            <foundry-badge variant="danger" data-testid="badge-danger">danger</foundry-badge>
          </div>
        </section>

        <section>
          <h2>Tags</h2>
          <div className="tag-row" data-testid="tag-row" ref={tagRowRef}>
            <foundry-tag data-testid="tag-plain">Read</foundry-tag>
            <foundry-tag removable value="design" data-testid="tag-removable">
              design
            </foundry-tag>
            <foundry-tag removable disabled data-testid="tag-disabled">
              locked
            </foundry-tag>
          </div>
          <pre data-testid="tag-remove-log">{tagRemoveLog}</pre>
        </section>

        <section>
          <h2>Avatars</h2>
          <div className="avatar-row" data-testid="avatar-row">
            <foundry-avatar name="Ada Lovelace" data-testid="avatar-initials"></foundry-avatar>
            <foundry-avatar name="Grace Hopper" status="online" data-testid="avatar-status"></foundry-avatar>
            <foundry-avatar data-testid="avatar-decorative"></foundry-avatar>
          </div>
        </section>

        <section>
          <h2>Alerts</h2>
          <div className="alert-row" data-testid="alert-row">
            <foundry-alert variant="info" data-testid="alert-info">
              <span slot="title">Heads up</span>
              Informational alert with a title and body copy.
            </foundry-alert>
            <foundry-alert variant="warning" data-testid="alert-warning">
              Warning alert with only body copy — no title slot.
            </foundry-alert>
            <foundry-alert variant="danger" data-testid="alert-danger">
              <span slot="title">Error</span>
              Something went wrong; this uses role=alert.
            </foundry-alert>
          </div>
        </section>

        <section>
          <h2>Spinners</h2>
          <div className="spinner-row" data-testid="spinner-row">
            <foundry-spinner data-testid="spinner-default"></foundry-spinner>
            <foundry-spinner size="sm" data-testid="spinner-sm"></foundry-spinner>
            <foundry-spinner size="lg" label="Loading" data-testid="spinner-labelled"></foundry-spinner>
          </div>
        </section>

        <section>
          <h2>Skeletons</h2>
          <div className="skeleton-row" data-testid="skeleton-row">
            <foundry-skeleton
              data-testid="skeleton-text"
              style={{ ['--foundry-skeleton-width' as string]: '12rem' }}
            ></foundry-skeleton>
            <foundry-skeleton
              shape="circle"
              data-testid="skeleton-circle"
            ></foundry-skeleton>
            <foundry-skeleton
              shape="rect"
              label="Loading article"
              data-testid="skeleton-labelled"
              style={{ ['--foundry-skeleton-width' as string]: '12rem' }}
            ></foundry-skeleton>
          </div>
        </section>

        <section>
          <h2>Progress</h2>
          <div
            className="progress-row"
            data-testid="progress-row"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '24rem' }}
          >
            <foundry-progress value={40} data-testid="progress-default"></foundry-progress>
            <foundry-progress
              variant="success"
              value={80}
              data-testid="progress-success"
            ></foundry-progress>
            <foundry-progress
              value={3}
              max={10}
              variant="warning"
              label="Checklist"
              data-testid="progress-labelled"
            ></foundry-progress>
          </div>
        </section>

        <section>
          <h2>Form</h2>
          <form data-testid="profile-form" onSubmit={onFormSubmit}>
            <foundry-text-field name="email" type="email" required data-testid="tf-email">
              <span slot="label">Email</span>
              <span slot="hint">We never share your email.</span>
            </foundry-text-field>
            <foundry-text-field name="username" required minlength={3} data-testid="tf-username">
              <span slot="label">Username</span>
              <span slot="error">Username must be at least 3 characters.</span>
            </foundry-text-field>
            <foundry-textarea name="bio" maxlength={500} rows={3} data-testid="tf-bio">
              <span slot="label">Bio</span>
              <span slot="hint">Up to 500 characters.</span>
            </foundry-textarea>
            <foundry-checkbox name="subscribe" value="weekly" data-testid="cb-subscribe">
              <span slot="label">Send me weekly updates</span>
            </foundry-checkbox>
            <foundry-switch name="notifications" value="on" data-testid="sw-notifications">
              <span slot="label">Enable notifications</span>
            </foundry-switch>
            <fieldset>
              <legend>Plan</legend>
              <foundry-radio name="plan" value="free" checked data-testid="rd-plan-free">
                <span slot="label">Free</span>
              </foundry-radio>
              <foundry-radio name="plan" value="pro" data-testid="rd-plan-pro">
                <span slot="label">Pro</span>
              </foundry-radio>
              <foundry-radio name="plan" value="enterprise" data-testid="rd-plan-enterprise">
                <span slot="label">Enterprise</span>
              </foundry-radio>
            </fieldset>
            <button type="submit" data-testid="form-submit">Save</button>
          </form>
          <pre data-testid="form-output">{formOutput}</pre>
        </section>
      </main>
    </>
  );
}

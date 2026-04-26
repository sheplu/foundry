import { useEffect, useState, type JSX } from 'react';

type Theme = 'light' | 'dark';

function setDocumentTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme;
}

export default function App(): JSX.Element {
  const [theme, setTheme] = useState<Theme>('light');
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    setDocumentTheme(theme);
  }, [theme]);

  function toggleTheme(): void {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }

  function onButtonClick(): void {
    setClicks((n) => n + 1);
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
      </main>
    </>
  );
}

<script setup lang="ts">
import { ref, watchEffect } from 'vue';

type Theme = 'light' | 'dark';

const theme = ref<Theme>('light');
const clicks = ref(0);
const formOutput = ref('');

watchEffect(() => {
  document.documentElement.dataset['theme'] = theme.value;
});

function toggleTheme(): void {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}

function onButtonClick(): void {
  clicks.value += 1;
}

function onFormSubmit(event: Event): void {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const record: Record<string, string> = {};
  for (const [key, val] of data.entries()) record[key] = String(val);
  formOutput.value = JSON.stringify(record);
}
</script>

<template>
  <header class="app-header" data-testid="app-header">
    <h1>foundry canary</h1>
    <button
      type="button"
      data-testid="theme-toggle"
      :aria-pressed="theme === 'dark'"
      @click="toggleTheme"
    >
      Theme: {{ theme }}
    </button>
  </header>

  <main>
    <section>
      <h2>Buttons</h2>
      <div class="button-grid" data-testid="button-grid">
        <foundry-button variant="primary" data-testid="btn-primary" @click="onButtonClick">
          primary
        </foundry-button>
        <foundry-button variant="secondary" data-testid="btn-secondary" @click="onButtonClick">
          secondary
        </foundry-button>
        <foundry-button variant="danger" data-testid="btn-danger" @click="onButtonClick">
          danger
        </foundry-button>

        <foundry-button
          variant="primary"
          disabled
          data-testid="btn-primary-disabled"
          @click="onButtonClick"
        >
          primary
        </foundry-button>
        <foundry-button
          variant="secondary"
          disabled
          data-testid="btn-secondary-disabled"
          @click="onButtonClick"
        >
          secondary
        </foundry-button>
        <foundry-button
          variant="danger"
          disabled
          data-testid="btn-danger-disabled"
          @click="onButtonClick"
        >
          danger
        </foundry-button>
      </div>
      <p>Clicks: <strong data-testid="click-count">{{ clicks }}</strong></p>
    </section>

    <section>
      <h2>Icons</h2>
      <ul class="icon-gallery" data-testid="icon-gallery">
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
      <div class="icon-button-row" data-testid="icon-button-row">
        <foundry-icon-button
          name="check"
          label="Confirm"
          variant="primary"
          data-testid="iconbtn-confirm"
          @click="onButtonClick"
        />
        <foundry-icon-button
          name="close"
          label="Close"
          variant="secondary"
          data-testid="iconbtn-close"
          @click="onButtonClick"
        />
        <foundry-icon-button
          name="close"
          label="Close disabled"
          variant="danger"
          disabled
          data-testid="iconbtn-close-disabled"
          @click="onButtonClick"
        />
      </div>
    </section>

    <section>
      <h2>Headings</h2>
      <div class="heading-row" data-testid="heading-row">
        <foundry-heading :level="1" data-testid="heading-page">
          Page title
        </foundry-heading>
        <foundry-heading :level="2" size="lg" data-testid="heading-section">
          Section title
        </foundry-heading>
        <foundry-heading :level="3" size="sm" data-testid="heading-sub">
          Subsection title
        </foundry-heading>
      </div>
    </section>

    <section>
      <h2>Text</h2>
      <div class="text-row" data-testid="text-row">
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
      <h2>Stacks</h2>
      <div class="stack-row" data-testid="stack-row">
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
      <div class="cluster-row" data-testid="cluster-row">
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
      <div class="inset-row" data-testid="inset-row">
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
      <div class="divider-row" data-testid="divider-row">
        <foundry-divider data-testid="divider-horizontal"></foundry-divider>
        <div style="display:inline-flex; gap:0.5rem; align-items:center;">
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
      <div class="badge-row" data-testid="badge-row">
        <foundry-badge data-testid="badge-neutral">neutral</foundry-badge>
        <foundry-badge variant="info" data-testid="badge-info">info</foundry-badge>
        <foundry-badge variant="success" data-testid="badge-success">success</foundry-badge>
        <foundry-badge variant="warning" data-testid="badge-warning">warning</foundry-badge>
        <foundry-badge variant="danger" data-testid="badge-danger">danger</foundry-badge>
      </div>
    </section>

    <section>
      <h2>Alerts</h2>
      <div class="alert-row" data-testid="alert-row">
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
      <h2>Form</h2>
      <form data-testid="profile-form" @submit="onFormSubmit">
        <foundry-text-field name="email" type="email" required data-testid="tf-email">
          <span slot="label">Email</span>
          <span slot="hint">We never share your email.</span>
        </foundry-text-field>
        <foundry-text-field name="username" required :minlength="3" data-testid="tf-username">
          <span slot="label">Username</span>
          <span slot="error">Username must be at least 3 characters.</span>
        </foundry-text-field>
        <button type="submit" data-testid="form-submit">Save</button>
      </form>
      <pre data-testid="form-output">{{ formOutput }}</pre>
    </section>
  </main>
</template>

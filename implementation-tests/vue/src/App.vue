<script setup lang="ts">
import { ref, watchEffect } from 'vue';

type Theme = 'light' | 'dark';

const theme = ref<Theme>('light');
const clicks = ref(0);

watchEffect(() => {
  document.documentElement.dataset['theme'] = theme.value;
});

function toggleTheme(): void {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}

function onButtonClick(): void {
  clicks.value += 1;
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
  </main>
</template>

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryCarousel, type CarouselTransition } from './carousel.ts';
import { FoundryCarouselSlide } from '../carousel-slide/carousel-slide.ts';

FoundryCarousel.define();
FoundryCarouselSlide.define();

interface CarouselArgs {
  transition: CarouselTransition;
  autoAdvance: number;
  loop: boolean;
  label: string;
}

const meta: Meta<CarouselArgs> = {
  title: 'Data/Carousel',
  component: 'foundry-carousel',
  argTypes: {
    transition: {
      control: { type: 'inline-radio' },
      options: ['slide', 'fade'],
    },
    autoAdvance: { control: { type: 'number', min: 0, max: 10000, step: 500 } },
    loop: { control: { type: 'boolean' } },
    label: { control: { type: 'text' } },
  },
  args: {
    transition: 'slide',
    autoAdvance: 0,
    loop: true,
    label: 'Featured items',
  },
};

export default meta;

type Story = StoryObj<CarouselArgs>;

const slideStyle = (color: string) => `
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
  block-size: 100%;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  background: ${color};
`;

const slidesPalette = [
  { value: 'one', text: 'Slide one', color: '#3b82f6' },
  { value: 'two', text: 'Slide two', color: '#10b981' },
  { value: 'three', text: 'Slide three', color: '#f59e0b' },
  { value: 'four', text: 'Slide four', color: '#ef4444' },
];

const renderSlides = () => slidesPalette.map((s) => html`
  <foundry-carousel-slide value=${s.value}>
    <div style=${slideStyle(s.color)}>${s.text}</div>
  </foundry-carousel-slide>
`);

export const Default: Story = {
  render: ({ transition, autoAdvance, loop, label }) => html`
    <div style="max-inline-size:36rem;">
      <foundry-carousel
        transition=${transition}
        auto-advance=${autoAdvance}
        ?loop=${loop}
        label=${label}
      >
        ${renderSlides()}
      </foundry-carousel>
    </div>
  `,
};

export const Fade: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="max-inline-size:36rem;">
      <foundry-carousel transition="fade" label="Fade demo">
        ${renderSlides()}
      </foundry-carousel>
    </div>
  `,
};

export const AutoAdvance: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="max-inline-size:36rem;">
      <foundry-carousel auto-advance="3000" label="Auto-advance every 3s">
        ${renderSlides()}
      </foundry-carousel>
    </div>
  `,
};

export const NoLoop: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="max-inline-size:36rem;">
      <foundry-carousel .loop=${false} label="Linear story">
        ${renderSlides()}
      </foundry-carousel>
    </div>
  `,
};

export const RichContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="max-inline-size:36rem;">
      <foundry-carousel label="Onboarding">
        <foundry-carousel-slide value="welcome">
          <div style="padding:2rem; background:var(--foundry-color-surface); block-size:100%; display:flex; flex-direction:column; justify-content:center; gap:0.5rem;">
            <h2 style="margin:0; font-size:1.5rem;">Welcome to foundry</h2>
            <p style="margin:0; color:var(--foundry-color-text-muted);">A web-component design system.</p>
          </div>
        </foundry-carousel-slide>
        <foundry-carousel-slide value="components">
          <div style="padding:2rem; background:var(--foundry-color-surface); block-size:100%; display:flex; flex-direction:column; justify-content:center; gap:0.5rem;">
            <h2 style="margin:0; font-size:1.5rem;">40+ components</h2>
            <p style="margin:0; color:var(--foundry-color-text-muted);">Including this carousel you're scrolling through.</p>
          </div>
        </foundry-carousel-slide>
        <foundry-carousel-slide value="theming">
          <div style="padding:2rem; background:var(--foundry-color-surface); block-size:100%; display:flex; flex-direction:column; justify-content:center; gap:0.5rem;">
            <h2 style="margin:0; font-size:1.5rem;">Themable end-to-end</h2>
            <p style="margin:0; color:var(--foundry-color-text-muted);">Drop in your tokens; everything follows.</p>
          </div>
        </foundry-carousel-slide>
      </foundry-carousel>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-carousel label="Themed">${renderSlides()}</foundry-carousel>
  </div>
`;

export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
      ${panel('light')}
      ${panel('dark')}
    </div>
  `,
};

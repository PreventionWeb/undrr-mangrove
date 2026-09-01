import React from 'react';
import ScrollContainer from './ScrollContainer.jsx';
import { CtaButton } from '../Buttons/CtaButton/CtaButton';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

const LOCALE_LABELS = {
  spanish: LABELS_ES,
  french: LABELS_FR,
  japanese: LABELS_JA,
  chinese: LABELS_ZH,
  arabic: LABELS_AR,
  russian: LABELS_RU,
};

const withLocaleLabels = (Story, context) => {
  const labels = LOCALE_LABELS[context.globals?.locale];
  if (!labels) return <Story />;
  return <Story {...context} args={{ ...context.args, labels }} />;
};

export default {
  title: 'Components/ScrollContainer',
  component: ScrollContainer,
  decorators: [withLocaleLabels],
  argTypes: {
    height: { control: 'text' },
    maxHeight: { control: 'text' },
    width: { control: 'text' },
    padding: { control: 'text' },
  },
};

const Template = args => (
  <section style={{ maxWidth: '800px', margin: '0 auto' }}>
    <ScrollContainer {...args}>
      {/* Example content to demonstrate horizontal scrolling */}
      {Array(8)
        .fill()
        .map((_, i) => (
          <article
            key={i}
            className="mg-card mg-card__vc"
            style={{
              minWidth: '350px',
              boxSizing: 'border-box',
            }}
          >
            <div className="mg-card__visual">
              <img
                alt="A person looks on"
                className="mg-card__image"
                src="https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg"
              />
            </div>
            <div className="mg-card__content">
              <header className="mg-card__title">
                <a href="https://www.undrr.org">
                  Title in large size with up to two lines of text {i + 1}
                </a>
              </header>
              <p className="mg-card__summary">
                Climate change is a{' '}
                <a className="mg-card__text-link" href="https://www.undrr.org">
                  global health emergency
                </a>
                , with impacts felt most acutely by vulnerable populations and
                communities. This paper explores health risks from climate
                change in a global context, setting out key risks actions
              </p>
              <CtaButton
                Type="Primary"
                Variant="CTA"
                label="Primary action"
                href="https://www.undrr.org"
              />
            </div>
          </article>
        ))}
    </ScrollContainer>
  </section>
);

export const Default = {
  render: Template,
};

export const CustomHeight = {
  render: Template,
  args: {
    height: '100px',
    padding: '1rem',
  },
};

export const WithMinWidth = {
  render: Template,
  args: {
    minWidth: '1500px',
    padding: '1rem',
  },
};

export const WithArrows = {
  render: Template,
  args: {
    showArrows: true,
    itemWidth: '350px',
  },
};

export const WithCustomStepSize = {
  render: Template,
  args: {
    showArrows: true,
    stepSize: 200,
    itemWidth: '350px',
  },
};

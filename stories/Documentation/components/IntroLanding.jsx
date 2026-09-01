import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { CtaButton } from '../../Components/Buttons/CtaButton/CtaButton';
import { IconCard } from '../../Components/Cards/IconCard/IconCard';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import ScrollContainer from '../../Components/ScrollContainer/ScrollContainer';

import heroImage from '../../assets/images/sample_image-lg.jpg';
import authorImage from '../../assets/images/author.png';
import logo from '../../assets/images/undrr-logo-white.svg';
import './intro-landing.css';

const destinations = [
  {
    icon: 'mg-icon mg-icon-graduation-cap',
    title: 'Getting started',
    summaryText:
      'Install Mangrove and choose the integration path that fits your project.',
    kind: 'getting-started-getting-started-guide',
  },
  {
    icon: 'mg-icon mg-icon-lightbulb',
    title: 'Foundations',
    summaryText:
      'Explore the tokens, typography, spacing and themes behind every component.',
    kind: 'design-decisions-colors',
  },
  {
    icon: 'mg-icon mg-icon-cubes',
    title: 'Components',
    summaryText:
      'Browse production-ready patterns for content, forms and navigation.',
    kind: 'brand-component-gallery',
  },
  {
    icon: 'mg-icon mg-icon-globe',
    title: 'Platform services',
    summaryText:
      'Connect shared search, content, analytics and critical messaging services.',
    kind: 'platform-services-search-syndication',
  },
  {
    icon: 'mg-icon mg-icon-life-ring',
    title: 'Accessibility',
    summaryText:
      'Build inclusive experiences with our standards, checks and guidance.',
    kind: 'getting-started-accessibility',
  },
  {
    icon: 'mg-icon mg-icon-code-branch',
    title: 'Contributing',
    summaryText:
      'Learn the component workflow and help improve the shared library.',
    kind: 'contributing-build-a-component-step-by-step',
  },
];

function storyNavigation(kind) {
  return event => {
    event.preventDefault();
    linkTo(kind, 'docs')();
  };
}

const componentExamples = [
  {
    title: 'Anticipatory action protects harvests and livelihoods',
    summaryText:
      'See how a content card combines meaningful imagery, editorial hierarchy and a clear next step.',
    button: 'Read the story',
    link: 'https://www.undrr.org',
    imgalt: 'A person working in a harvested field',
    imgback: heroImage,
  },
  {
    title: 'Financing resilient cities',
    summaryText:
      'Theme-aware components keep their structure while adapting to each product’s visual identity.',
    button: 'Explore the report',
    link: 'https://www.undrr.org',
    imgalt: 'People working together outdoors in Bali',
    imgback:
      'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
  },
  {
    title: 'Local knowledge improves risk planning',
    summaryText:
      'Responsive layouts, accessible interactions and reusable content models work together.',
    button: 'Meet the experts',
    link: 'https://www.undrr.org',
    imgalt: 'Portrait of UNDRR Special Representative Kamal Kishore',
    imgback:
      'https://www.undrr.org/sites/default/files/styles/por/public/2024-05/Kamal-Kishore_UNDRR-SRSG-C-A.Tardy_min.jpg',
  },
  {
    title: 'From evidence to early action',
    summaryText:
      'Shared patterns help teams turn complex disaster risk information into useful, understandable guidance.',
    button: 'Explore the data',
    link: 'https://www.undrr.org',
    imgalt: 'Portrait of a disaster risk reduction leader',
    imgback: authorImage,
  },
];

export function IntroLanding() {
  return (
    <div className="mg-intro">
      <section className="mg-intro__hero" aria-labelledby="mg-intro-title">
        <img
          className="mg-intro__hero-image"
          src={heroImage}
          alt="A person working in a harvested field"
        />
        <div className="mg-intro__hero-overlay" />
        <div className="mg-intro__hero-content">
          <img className="mg-intro__logo" src={logo} alt="UNDRR" />
          <p className="mg-intro__eyebrow">
            Component library and design system
          </p>
          <h1 id="mg-intro-title">
            Build resilient digital experiences together.
          </h1>
          <p className="mg-intro__lede">
            Mangrove gives UNDRR teams accessible, reusable content patterns
            while leaving every product free to express its own brand.
          </p>
          <div className="mg-buttons mg-intro__actions">
            <CtaButton
              label="Get started"
              Variant="CTA"
              onClick={storyNavigation('getting-started-getting-started-guide')}
            />
            <CtaButton
              label="Browse components"
              Type="Secondary"
              Variant="CTA"
              onClick={storyNavigation('brand-component-gallery')}
            />
          </div>
        </div>
      </section>

      <section
        className="mg-intro__statement"
        aria-labelledby="mg-intro-statement"
      >
        <h2 id="mg-intro-statement">
          One shared foundation. Many distinct products.
        </h2>
        <p>
          Cards, heroes, navigation, forms and syndicated content share
          dependable structure. Theme tokens let UNDRR, PreventionWeb, IRP,
          MCR2030 and partner sites keep their own visual identity. Use the
          toolbar above to see that system in action.
        </p>
      </section>

      <section
        className="mg-intro__resources"
        aria-labelledby="mg-intro-resources"
      >
        <div className="mg-intro__section-heading">
          <p className="mg-intro__eyebrow">Explore Mangrove</p>
          <h2 id="mg-intro-resources">What’s inside</h2>
        </div>
        <div className="mg-intro__grid">
          {destinations.map(destination => (
            <IconCard
              data={[
                {
                  ...destination,
                  imageScale: 'small',
                  linkText: 'Explore →',
                  onClick: storyNavigation(destination.kind),
                },
              ]}
              key={destination.title}
            />
          ))}
        </div>
      </section>

      <section
        className="mg-intro__showcase"
        aria-labelledby="mg-intro-showcase"
      >
        <div className="mg-intro__section-heading">
          <p className="mg-intro__eyebrow">Built with Mangrove</p>
          <h2 id="mg-intro-showcase">Components working together</h2>
          <p>
            This page uses the same theme-aware cards, calls to action and
            responsive scroll behavior available to product teams.
          </p>
        </div>
        <ScrollContainer showArrows itemWidth="19rem">
          {componentExamples.map(example => (
            <VerticalCard data={[example]} key={example.title} />
          ))}
        </ScrollContainer>
      </section>

      <section className="mg-intro__project-links" aria-label="Project links">
        <div>
          <p className="mg-intro__eyebrow">Open source</p>
          <h2>Use it. Inspect it. Improve it.</h2>
          <p>Install the package or work with the source on GitHub.</p>
        </div>
        <div className="mg-buttons mg-intro__actions">
          <CtaButton
            className="mg-intro__project-button"
            label="View GitHub"
            href="https://github.com/unisdr/undrr-mangrove"
            target="_blank"
            rel="noopener noreferrer"
          />
          <CtaButton
            className="mg-intro__project-button"
            label="View npm"
            Type="Secondary"
            Outline
            href="https://www.npmjs.com/package/@undrr/undrr-mangrove"
            target="_blank"
            rel="noopener noreferrer"
          />
        </div>
      </section>
    </div>
  );
}

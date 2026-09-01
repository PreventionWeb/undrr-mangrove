import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { IconCard } from '../../Components/Cards/IconCard/IconCard';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import { Hero } from '../../Components/Hero/Hero';
import ScrollContainer from '../../Components/ScrollContainer/ScrollContainer';
import { TextCta } from '../../Components/TextCta/TextCta';

const heroImage = 'https://www.undrr.org/sites/default/files/2021-04/WiA-childyouthengage.jpg';
import figcaptionImage from '../../assets/images/figcaption.jpg';
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
      'Explore the principles, tokens and themes behind every component.',
    kind: 'design-decisions-experience-principles',
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
    title: 'Infrastructure resilience protects essential services',
    summaryText:
      'Risk-informed infrastructure investment keeps transport, water, energy and communications working through disruption.',
    button: 'Explore the principles',
    link: 'https://www.undrr.org',
    imgalt: 'Aerial view of a canal through Almaty, Kazakhstan',
    imgback:
      'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg',
  },
  {
    title: 'From evidence to early action',
    summaryText:
      'Shared patterns help teams turn complex disaster risk information into useful, understandable guidance.',
    button: 'Explore the data',
    link: 'https://www.undrr.org',
    imgalt: 'People walking through terraced rice fields',
    imgback:
      'https://www.undrr.org/sites/default/files/styles/ultrawide_16_6/public/2023-03/Shutterstock_656134321-min.jpg?h=90c64985&itok=ukR7hDqu',
  },
  {
    title: 'Risk knowledge supports stronger decisions',
    summaryText:
      'Shared evidence helps communities understand exposure, prioritize investment and act before hazards become disasters.',
    button: 'Explore risk knowledge',
    link: 'https://www.undrr.org',
    imgalt: 'People collaborating on disaster risk reduction',
    imgback:
      'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
  },
  {
    title: 'Recovery planning starts before disaster strikes',
    summaryText:
      'Prepared institutions recover faster, protect development gains and build back with future risks in mind.',
    button: 'Read the guidance',
    link: 'https://www.undrr.org',
    imgalt: 'A community landscape illustrating recovery and resilience',
    imgback: figcaptionImage,
  },
];

export function IntroLanding() {
  return (
    <div className="mg-intro">
      <Hero
        data={[
          {
            logo: { src: logo, alt: 'UNDRR' },
            label: 'Component library and design system',
            title: 'Build resilient digital experiences together.',
            summaryText:
              'Mangrove gives UNDRR teams accessible, reusable content patterns while leaving every product free to express its own brand.',
            imgback: heroImage,
            buttons: [
              {
                label: 'Get started',
                onClick: storyNavigation(
                  'getting-started-getting-started-guide'
                ),
              },
              {
                label: 'Browse components',
                type: 'Secondary',
                onClick: storyNavigation('brand-component-gallery'),
              },
            ],
          },
        ]}
        contained
        size="immersive"
      />

      <section
        className="mg-intro__statement mg-grid mg-grid__col-2"
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
        className="mg-intro__section"
        aria-labelledby="mg-intro-resources"
      >
        <div className="mg-intro__section-heading">
          <p className="mg-intro__eyebrow">Explore Mangrove</p>
          <h2 id="mg-intro-resources">What’s inside</h2>
        </div>
        <div className="mg-grid mg-grid__col-3">
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
        className="mg-intro__section"
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
        <ScrollContainer showArrows stretchItems itemWidth="19rem">
          {componentExamples.map(example => (
            <VerticalCard data={[example]} key={example.title} />
          ))}
        </ScrollContainer>
      </section>

      <TextCta
        eyebrow="Open source"
        headline="Use it. Inspect it. Improve it."
        text="<p>Install the package or work with the source on GitHub.</p>"
        buttons={[
          {
            label: 'View GitHub',
            url: 'https://github.com/unisdr/undrr-mangrove',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          {
            label: 'View npm',
            url: 'https://www.npmjs.com/package/@undrr/undrr-mangrove',
            type: 'Secondary',
            outline: true,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        ]}
        centered={false}
        layout="inline"
      />
    </div>
  );
}

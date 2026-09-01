import UserFeedback from './UserFeedback';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

const LOCALE_LABELS = {
  arabic: LABELS_AR,
  chinese: LABELS_ZH,
  french: LABELS_FR,
  japanese: LABELS_JA,
  russian: LABELS_RU,
  spanish: LABELS_ES,
};

const withLocaleLabels = (Story, context) => {
  const labels = LOCALE_LABELS[context.globals?.locale];
  if (!labels) return <Story />;
  return <Story {...context} args={{ ...context.args, labels }} />;
};

export default {
  title: 'Components/User feedback',
  component: UserFeedback,
  decorators: [withLocaleLabels],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A compact pre-footer prompt that records a binary page response and offers a route for detailed feedback.',
      },
    },
  },
};

export const Default = {};

export const LongLabels = {
  args: {
    labels: {
      question:
        'Did this page give you the information you needed to complete your task?',
      yes: 'Yes, it answered my question',
      no: 'No, I still need help',
      reportIssue:
        'Tell the website team about inaccurate or outdated information',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Translation-stress example. Labels wrap naturally without overlapping the issue link.',
      },
    },
  },
};

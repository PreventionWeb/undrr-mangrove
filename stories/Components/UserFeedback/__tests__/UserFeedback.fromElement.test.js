import userFeedbackFromElement from '../UserFeedback.fromElement';

describe('userFeedbackFromElement', () => {
  it('extracts the URL and translated labels', () => {
    const container = document.createElement('div');
    container.dataset.feedbackUrl = '/feedback';
    container.dataset.question = 'Utile ?';
    container.dataset.yesLabel = 'Oui';

    expect(userFeedbackFromElement(container)).toEqual({
      feedbackUrl: '/feedback',
      labels: { question: 'Utile ?', yes: 'Oui' },
    });
  });

  it('uses the UNDRR feedback URL and leaves label fallbacks to React', () => {
    const container = document.createElement('div');
    const props = userFeedbackFromElement(container);

    expect(props.feedbackUrl).toBe(
      'https://www.undrr.org/contact/website-feedback'
    );
    expect(props.labels).toEqual({});
  });
});

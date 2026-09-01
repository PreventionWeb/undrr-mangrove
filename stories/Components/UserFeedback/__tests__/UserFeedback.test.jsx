import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import UserFeedback from '../UserFeedback';

describe('UserFeedback', () => {
  it('renders the prompt and detailed-feedback link', () => {
    render(<UserFeedback feedbackUrl="/feedback" />);

    expect(
      screen.getByRole('region', { name: 'Is this page useful?' })
    ).toHaveClass('mg-container', 'mg-grid', 'mg-grid__col-2');
    expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute(
      'data-mg-user-feedback-type',
      'yes'
    );
    expect(
      screen.getByRole('link', { name: 'Report an issue on this page' })
    ).toHaveAttribute('href', '/feedback');
  });

  it.each(['yes', 'no'])(
    'records a %s response and focuses confirmation',
    value => {
      const onResponse = jest.fn();
      render(<UserFeedback feedbackUrl="/feedback" onResponse={onResponse} />);

      fireEvent.click(
        screen.getByRole('button', {
          name: value === 'yes' ? 'Yes' : 'No',
        })
      );

      expect(onResponse).toHaveBeenCalledWith(value);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      const confirmation = screen.getByText(/Thank you for your feedback/);
      expect(confirmation).toHaveFocus();
      expect(
        screen.getByRole('link', { name: 'tell us more' })
      ).toHaveAttribute('target', '_blank');
    }
  );

  it('merges localised labels with English defaults', () => {
    render(<UserFeedback labels={{ question: '¿Es útil?', yes: 'Sí' }} />);

    expect(
      screen.getByRole('region', { name: '¿Es útil?' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sí' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<UserFeedback />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

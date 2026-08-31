import React from 'react';
import PropTypes from 'prop-types';
// import './cta-button.scss';

/**
 * Call-to-action button rendered as a styled anchor link.
 *
 * @param {Object} props
 * @param {string} props.label                 Button text
 * @param {'Primary'|'Secondary'} [props.Type] Visual emphasis variant
 * @param {boolean} [props.Outline] Whether to use the transparent treatment
 * @param {'Default'|'Disabled'} [props.State] Enabled or disabled state
 */
export function CtaButton({
  label,
  Type = 'Primary',
  Outline = false,
  State = 'Default',
  ...props
}) {
  const type = Type === 'Secondary' ? 'secondary' : 'primary';
  const isDisabled = State === 'Disabled';
  const className = [
    'mg-button',
    'mg-button-link',
    `mg-button-${type}`,
    Outline && 'mg-button-outline',
    isDisabled && 'disabled',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <a
      className={className}
      {...(isDisabled ? { 'aria-disabled': 'true' } : { href: '#' })}
      {...props}
    >
      {label}
    </a>
  );
}

CtaButton.propTypes = {
  /** Button text */
  label: PropTypes.string.isRequired,
  /** Visual emphasis variant */
  Type: PropTypes.oneOf(['Primary', 'Secondary']),
  /** Use a transparent outlined treatment */
  Outline: PropTypes.bool,
  /** Enabled or disabled state */
  State: PropTypes.oneOf(['Default', 'Disabled']),
};

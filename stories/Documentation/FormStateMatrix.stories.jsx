/*
 * Form control state matrix.
 *
 * DELTA's design file models every form control across an explicit state set:
 * default, hover, focus active, focus typing, filled, error and disabled.
 * Mangrove ships two form surfaces that are meant to agree with each other:
 * the legacy `.mg-form-*` controls and the React Aria surface styled by
 * `stories/assets/scss/aria/_react-aria.scss`.
 *
 * This story renders both surfaces side by side, one specimen per state, so
 * that a state Mangrove does not express shows up as a cell that looks exactly
 * like its neighbour rather than as a sentence in a document. Verdicts on each
 * cell were measured with `getComputedStyle` in Chromium at the UNDRR theme
 * default, not read off the stylesheet.
 *
 * Nothing here is a fix. The matrix is the deliverable.
 */
import React from 'react';
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  DateField,
  DateInput,
  DateSegment,
  FieldError,
  Group,
  Input,
  Label,
  Link,
  ListBox,
  ListBoxItem,
  NumberField,
  Popover,
  Select,
  SelectValue,
  Text,
  TextArea,
  TextField,
} from 'react-aria-components';
import { TextInput } from '../Components/Forms/TextInput/TextInput';
import { Textarea } from '../Components/Forms/Textarea/Textarea';
import { Select as MgSelect } from '../Components/Forms/Select/Select';

// Hoisted so identity is stable across renders.
const HAZARD_OPTIONS = [
  { value: 'cyclone', label: 'Tropical cyclone' },
  { value: 'flood', label: 'Riverine flood' },
  { value: 'drought', label: 'Drought' },
  { value: 'heatwave', label: 'Heatwave' },
];

const STATE_ORDER = [
  'default',
  'hover',
  'focus active',
  'focus typing',
  'filled',
  'error',
  'disabled',
];

const DEFAULT_TARGET_KEYS = ['a', 'c'];

const HOVER_HINT = 'Hover this control with a pointer.';
const FOCUS_HINT = 'Click it, or Tab to it, and leave it empty.';
const TYPING_HINT = 'Focus it and type a few characters.';

const MATRIX_STYLES = `
.mg-fsm { max-width: 78rem; }
.mg-fsm-lede { max-width: 44rem; }
.mg-fsm-section { margin-block: 3rem 0; }
.mg-fsm-section-title { margin-block-end: 0.25rem; }
.mg-fsm-section-note { margin-block: 0 1.25rem; max-width: 44rem; }
.mg-fsm-surfaces {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
}
.mg-fsm-surface {
  border: 1px solid rgb(var(--mg-color-neutral-300, 204 204 204));
  border-radius: 4px;
  padding: 1rem;
}
.mg-fsm-surface-title {
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  margin-block: 0 1rem;
  text-transform: uppercase;
}
.mg-fsm-cell { border-block-start: 1px dashed rgb(var(--mg-color-neutral-300, 204 204 204)); padding-block: 0.75rem; }
.mg-fsm-cell:first-of-type { border-block-start: 0; padding-block-start: 0; }
.mg-fsm-cell-head { align-items: baseline; display: flex; flex-wrap: wrap; gap: 0.5rem; }
.mg-fsm-cell-state { font-size: 0.875rem; font-weight: 700; }
.mg-fsm-cell-hint { font-size: 0.75rem; font-style: italic; margin: 0; }
.mg-fsm-cell-body { margin-block-start: 0.5rem; }
.mg-fsm-cell-evidence { font-size: 0.75rem; margin-block: 0.4rem 0; }
.mg-fsm-badge {
  border-radius: 2px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.4rem;
  text-transform: uppercase;
  white-space: nowrap;
}
.mg-fsm-badge--yes { background: rgb(var(--mg-color-green-100, 224 242 224)); color: rgb(var(--mg-color-green-900, 20 90 40)); }
.mg-fsm-badge--no { background: rgb(var(--mg-color-red-50, 253 234 236)); color: rgb(var(--mg-color-red-900, 193 9 32)); }
.mg-fsm-badge--partial { background: rgb(var(--mg-color-yellow-100, 255 244 204)); color: rgb(var(--mg-color-neutral-900, 26 26 26)); }
.mg-fsm-badge--none { background: rgb(var(--mg-color-neutral-200, 230 230 230)); color: rgb(var(--mg-color-neutral-700, 77 77 77)); }
.mg-fsm-table { border-collapse: collapse; font-size: 0.8125rem; inline-size: 100%; }
.mg-fsm-table th, .mg-fsm-table td {
  border: 1px solid rgb(var(--mg-color-neutral-300, 204 204 204));
  padding: 0.35rem 0.5rem;
  text-align: start;
  vertical-align: top;
}
.mg-fsm-table th[scope="row"] { white-space: nowrap; }
.mg-fsm-table-scroll { overflow-x: auto; }
.mg-fsm-flag { border-inline-start: 4px solid rgb(var(--mg-color-red-900, 193 9 32)); margin-block: 1rem; padding-inline-start: 0.75rem; }
.mg-fsm-flag-title { font-size: 1rem; margin-block: 0 0.25rem; }
.mg-fsm-flag p { margin-block: 0; max-width: 44rem; }
`;

// Verdicts measured in Chromium, UNDRR theme, LTR, default Storybook viewport.
// status: yes | partial | no | none
const CELL_VERDICTS = {
  'text-input': {
    legacy: {
      default: ['yes', 'Border 128 128 128, background 230 230 230.'],
      hover: ['no', 'Computes identical to default. No :hover rule exists.'],
      'focus active': [
        'yes',
        'Border 0 79 145, background white, 2px white plus 2px blue ring.',
      ],
      'focus typing': [
        'no',
        'Computes identical to focus active. The two are not distinguished.',
      ],
      filled: ['no', 'Once blurred, computes identical to default.'],
      error: ['yes', 'Border 193 9 32, aria-invalid and role="alert" text.'],
      disabled: [
        'partial',
        'Text drops to 128 128 128 and the background goes white, which is lighter than the enabled grey. The border is unchanged.',
      ],
    },
    aria: {
      default: ['yes', 'Border 128 128 128, background 230 230 230.'],
      hover: [
        'no',
        'No .react-aria-Input[data-hovered] rule. React Aria sets the attribute; nothing reads it.',
      ],
      'focus active': [
        'partial',
        'Keyboard focus swaps border and background and adds a 2px outline. A pointer click does not: React Aria withholds data-focus-visible, so a clicked field shows no focus treatment at all.',
      ],
      'focus typing': ['no', 'Not distinguished from focus active.'],
      filled: ['no', 'No filled treatment.'],
      error: [
        'yes',
        '[data-invalid] sets border 193 9 32 plus FieldError text.',
      ],
      disabled: [
        'no',
        'Measured identical to default: no opacity, no colour change, no border change. Only the UA cursor differs.',
      ],
    },
  },
  textarea: {
    legacy: {
      default: ['yes', 'Same base as the text input, height auto.'],
      hover: ['no', 'No :hover rule.'],
      'focus active': ['yes', 'Shared %mg-form-input-base focus ring.'],
      'focus typing': ['no', 'Not distinguished from focus active.'],
      filled: ['no', 'No filled treatment.'],
      error: ['yes', 'Border 193 9 32.'],
      disabled: [
        'partial',
        'Same white-background inversion as the text input.',
      ],
    },
    aria: {
      default: ['yes', 'Border 128 128 128, background 230 230 230.'],
      hover: [
        'yes',
        '[data-hovered] moves the border to the focus border colour. The Input does not do this.',
      ],
      'focus active': [
        'partial',
        'Same as the aria Input: keyboard focus is drawn, a pointer click is not.',
      ],
      'focus typing': ['no', 'Not distinguished from focus active.'],
      filled: ['no', 'No filled treatment.'],
      error: ['yes', '[data-invalid] border 193 9 32.'],
      disabled: [
        'yes',
        'Opacity 0.55 and cursor not-allowed. The Input gets neither.',
      ],
    },
  },
  date: {
    legacy: {
      default: ['yes', 'A native input type="date" wearing .mg-form-input.'],
      hover: ['no', 'No :hover rule.'],
      'focus active': ['yes', 'Shared focus ring on the whole field.'],
      'focus typing': [
        'no',
        'Segment-level focus is drawn by the UA, not by Mangrove, so it varies by browser.',
      ],
      filled: ['no', 'No filled treatment.'],
      error: ['yes', 'Border 193 9 32 via the shared modifier.'],
      disabled: ['partial', 'Same inversion as the text input.'],
    },
    aria: {
      default: ['yes', '.react-aria-DateInput draws the field box.'],
      hover: ['no', 'No [data-hovered] rule on DateInput.'],
      'focus active': [
        'yes',
        '[data-focus-within] changes the field border and background.',
      ],
      'focus typing': [
        'yes',
        'The only place either surface distinguishes it: DateSegment[data-focused] highlights the segment being typed while the field keeps its focus-within treatment.',
      ],
      filled: [
        'partial',
        'DateSegment[data-placeholder] is muted, so an unfilled segment differs from a filled one. This is the inverse of a filled state, not a filled state.',
      ],
      error: [
        'no',
        'No [data-invalid] rule on DateInput. An invalid DateField keeps its default border; only the FieldError text signals the problem.',
      ],
      disabled: ['no', 'No [data-disabled] rule on DateInput or DateSegment.'],
    },
  },
  select: {
    legacy: {
      default: ['yes', 'Border 128 128 128, background 230 230 230, chevron.'],
      hover: ['no', 'No :hover rule.'],
      'focus active': ['yes', 'Same ring as the text input.'],
      'focus typing': [
        'none',
        'A native select has no typing state to express.',
      ],
      filled: [
        'no',
        'A chosen option is indistinguishable from a placeholder.',
      ],
      error: ['yes', 'Border 193 9 32.'],
      disabled: [
        'partial',
        'Measured opacity 0.7 here versus 1 on the disabled input and textarea, so the two legacy disabled treatments do not match each other.',
      ],
    },
    aria: {
      default: ['yes', 'Select > Button is repainted as a field, not a CTA.'],
      hover: ['yes', '[data-hovered] lightens the trigger background.'],
      'focus active': ['yes', 'Button [data-focus-visible] outline.'],
      'focus typing': [
        'none',
        'Type-ahead moves the selection; there is no separate visual state to draw.',
      ],
      filled: [
        'no',
        'No treatment separating a chosen value from a placeholder.',
      ],
      error: [
        'no',
        'No [data-invalid] rule reaches the Select trigger, so an invalid Select looks valid.',
      ],
      disabled: [
        'partial',
        'Inherits the base Button opacity 0.55, which is a CTA treatment applied to a field.',
      ],
    },
  },
  stepper: {
    legacy: {
      default: [
        'partial',
        'A native input type="number". The spinner is the browser default, not a Mangrove stepper.',
      ],
      hover: ['no', 'No :hover rule.'],
      'focus active': ['yes', 'Shared focus ring.'],
      'focus typing': ['no', 'Not distinguished.'],
      filled: ['no', 'No filled treatment.'],
      error: ['yes', 'Shared error modifier.'],
      disabled: ['partial', 'Same inversion as the text input.'],
    },
    aria: {
      default: ['yes', 'Group with an Input and increment/decrement Buttons.'],
      hover: [
        'partial',
        'The stepper buttons hover; the input inside them does not.',
      ],
      'focus active': ['yes', 'Input [data-focus-visible].'],
      'focus typing': ['no', 'Not distinguished.'],
      filled: ['no', 'No filled treatment.'],
      error: ['yes', 'Input [data-invalid] border.'],
      disabled: [
        'partial',
        'The buttons dim; the Input does not, for the same reason the text input does not.',
      ],
    },
  },
};

const MISSING_CONTROLS = [
  {
    name: 'Dropdown breadcrumb',
    legacy:
      'No control. Mangrove has a Breadcrumb component and a Select; nothing composes them.',
    aria: 'No dedicated control either. The nearest analogue is Breadcrumbs plus a Select, hand composed, and none of the seven states are defined for the composition as a whole.',
  },
  {
    name: 'Multiselect',
    legacy:
      'No control. Mangrove offers a checkbox group, which is a different interaction with a different affordance.',
    aria: 'ListBox with selectionMode="multiple" is styled ([data-selected] shares the [data-focused] background, so a focused unselected option and a selected one look the same). There is no multiselect trigger, no token display and no removal affordance.',
  },
];

const DISAGREEMENTS = [
  {
    state: 'hover',
    detail:
      'The aria TextArea hovers; the aria Input does not. Neither legacy control hovers. Three behaviours for one state across two surfaces.',
  },
  {
    state: 'disabled',
    detail:
      'Legacy input and textarea use white background plus grey text at opacity 1. Legacy select uses opacity 0.7. Aria TextArea uses opacity 0.55. Aria Input uses nothing at all and is visually identical to an enabled field.',
  },
  {
    state: 'error',
    detail:
      'Every legacy control turns its border red. On the aria surface, Input and TextArea do, but DateInput and the Select trigger do not, so an invalid date or an invalid select carries no visual signal on the control itself.',
  },
  {
    state: 'focus active, when the focus came from a pointer',
    detail:
      'Legacy styles focus with the CSS :focus-visible pseudo-class, which a browser does apply when a pointer user clicks into a text field. The aria surface styles focus with [data-focus-visible], which React Aria withholds on a pointer click. Measured: clicking the aria text input leaves it with data-focused but no data-focus-visible, so the field keeps its default border, background and 1px user-agent outline while the legacy field in the same situation shows the full ring. Keyboard focus is fine on both. The loser is the sighted pointer user who needs to see where they are.',
  },
  {
    state: 'focus active, indicator shape and theming',
    detail:
      'Legacy draws a 2px white band inside a 2px blue band with box-shadow; aria draws a single 2px outline with an offset. Both settle on 0 79 145. The legacy focus border re-themes per sub-brand (teal on PreventionWeb, purple on MCR2030) while the ring around it stays UNDRR blue in every theme, so a themed border sits inside an unthemed ring.',
  },
  {
    state: 'focus typing',
    detail:
      'Only the aria DateInput distinguishes it, and only because React Aria gives each date segment its own focus. Everywhere else the state collapses into focus active.',
  },
  {
    state: 'filled',
    detail:
      'Neither surface expresses it on any control. The closest thing is DateSegment[data-placeholder], which marks the unfilled case rather than the filled one.',
  },
  {
    state: 'reduced motion and forced colours',
    detail:
      'The aria surface gates every transition behind prefers-reduced-motion: no-preference and repaints focus and selection under forced-colors: active. forced-colors appears nowhere in the legacy stylesheet, and the legacy form controls carry no transitions at all, so a state change on the legacy side is instant and, in Windows High Contrast, unstyled. The two surfaces will not match for a user who has asked their operating system for either.',
  },
];

const BADGE_LABELS = {
  yes: 'expressed',
  partial: 'partial',
  no: 'not expressed',
  none: 'not applicable',
};

function Badge({ status }) {
  return (
    <span className={`mg-fsm-badge mg-fsm-badge--${status}`}>
      {BADGE_LABELS[status]}
    </span>
  );
}

function Cell({ state, verdict, hint, children }) {
  const [status, evidence] = verdict;

  return (
    <div className="mg-fsm-cell">
      <div className="mg-fsm-cell-head">
        <span className="mg-fsm-cell-state">{state}</span>
        <Badge status={status} />
      </div>
      {hint ? <p className="mg-fsm-cell-hint">{hint}</p> : null}
      <div className="mg-fsm-cell-body">{children}</div>
      <p className="mg-fsm-cell-evidence">{evidence}</p>
    </div>
  );
}

function Surface({ title, children }) {
  return (
    <div className="mg-fsm-surface">
      <h4 className="mg-fsm-surface-title">{title}</h4>
      {children}
    </div>
  );
}

function ControlSection({ id, title, note, children }) {
  return (
    <section className="mg-fsm-section" id={id}>
      <h3 className="mg-fsm-section-title">{title}</h3>
      <p className="mg-fsm-section-note">{note}</p>
      <div className="mg-fsm-surfaces">{children}</div>
    </section>
  );
}

function TextInputRow() {
  const v = CELL_VERDICTS['text-input'];

  return (
    <ControlSection
      id="mg-fsm-text-input"
      title="Text input"
      note="Legacy TextInput against a React Aria TextField. The hover and filled cells are the point: they should not look like the default cell, and they do."
    >
      <Surface title="Legacy, the mg-form classes">
        <Cell state="default" verdict={v.legacy.default}>
          <TextInput label="National focal point" placeholder="Full name" />
        </Cell>
        <Cell state="hover" verdict={v.legacy.hover} hint={HOVER_HINT}>
          <TextInput label="National focal point" placeholder="Full name" />
        </Cell>
        <Cell
          state="focus active"
          verdict={v.legacy['focus active']}
          hint={FOCUS_HINT}
        >
          <TextInput label="National focal point" placeholder="Full name" />
        </Cell>
        <Cell
          state="focus typing"
          verdict={v.legacy['focus typing']}
          hint={TYPING_HINT}
        >
          <TextInput label="National focal point" placeholder="Full name" />
        </Cell>
        <Cell state="filled" verdict={v.legacy.filled}>
          <TextInput
            label="National focal point"
            defaultValue="Amina Osei-Bonsu"
          />
        </Cell>
        <Cell state="error" verdict={v.legacy.error}>
          <TextInput
            label="National focal point"
            defaultValue="Amina"
            error
            errorText="Enter the focal point's full name as it appears on the Sendai Framework Monitor record."
          />
        </Cell>
        <Cell state="disabled" verdict={v.legacy.disabled}>
          <TextInput
            label="National focal point"
            defaultValue="Amina Osei-Bonsu"
            disabled
          />
        </Cell>
      </Surface>

      <Surface title="React Aria, the react-aria classes">
        <Cell state="default" verdict={v.aria.default}>
          <TextField>
            <Label>National focal point</Label>
            <Input placeholder="Full name" />
          </TextField>
        </Cell>
        <Cell state="hover" verdict={v.aria.hover} hint={HOVER_HINT}>
          <TextField>
            <Label>National focal point</Label>
            <Input placeholder="Full name" />
          </TextField>
        </Cell>
        <Cell
          state="focus active"
          verdict={v.aria['focus active']}
          hint={FOCUS_HINT}
        >
          <TextField>
            <Label>National focal point</Label>
            <Input placeholder="Full name" />
          </TextField>
        </Cell>
        <Cell
          state="focus typing"
          verdict={v.aria['focus typing']}
          hint={TYPING_HINT}
        >
          <TextField>
            <Label>National focal point</Label>
            <Input placeholder="Full name" />
          </TextField>
        </Cell>
        <Cell state="filled" verdict={v.aria.filled}>
          <TextField defaultValue="Amina Osei-Bonsu">
            <Label>National focal point</Label>
            <Input />
          </TextField>
        </Cell>
        <Cell state="error" verdict={v.aria.error}>
          <TextField defaultValue="Amina" isInvalid>
            <Label>National focal point</Label>
            <Input />
            <FieldError>
              Enter the focal point's full name as it appears on the Sendai
              Framework Monitor record.
            </FieldError>
          </TextField>
        </Cell>
        <Cell state="disabled" verdict={v.aria.disabled}>
          <TextField defaultValue="Amina Osei-Bonsu" isDisabled>
            <Label>National focal point</Label>
            <Input />
          </TextField>
        </Cell>
      </Surface>
    </ControlSection>
  );
}

function TextAreaRow() {
  const v = CELL_VERDICTS.textarea;

  return (
    <ControlSection
      id="mg-fsm-textarea"
      title="Text area"
      note="The clearest disagreement between the two surfaces. The aria TextArea has both a hover and a disabled treatment; the aria Input has neither."
    >
      <Surface title="Legacy, the mg-form classes">
        <Cell state="default" verdict={v.legacy.default}>
          <Textarea label="Description of the hazardous event" rows={3} />
        </Cell>
        <Cell state="hover" verdict={v.legacy.hover} hint={HOVER_HINT}>
          <Textarea label="Description of the hazardous event" rows={3} />
        </Cell>
        <Cell
          state="focus active"
          verdict={v.legacy['focus active']}
          hint={FOCUS_HINT}
        >
          <Textarea label="Description of the hazardous event" rows={3} />
        </Cell>
        <Cell
          state="focus typing"
          verdict={v.legacy['focus typing']}
          hint={TYPING_HINT}
        >
          <Textarea label="Description of the hazardous event" rows={3} />
        </Cell>
        <Cell state="filled" verdict={v.legacy.filled}>
          <Textarea
            label="Description of the hazardous event"
            rows={3}
            defaultValue="Riverine flooding across the lower delta displaced 12,400 households over four days."
          />
        </Cell>
        <Cell state="error" verdict={v.legacy.error}>
          <Textarea
            label="Description of the hazardous event"
            rows={3}
            error
            errorText="A description is required before the record can be submitted for validation."
          />
        </Cell>
        <Cell state="disabled" verdict={v.legacy.disabled}>
          <Textarea
            label="Description of the hazardous event"
            rows={3}
            defaultValue="Riverine flooding across the lower delta displaced 12,400 households over four days."
            disabled
          />
        </Cell>
      </Surface>

      <Surface title="React Aria, the react-aria classes">
        <Cell state="default" verdict={v.aria.default}>
          <TextField>
            <Label>Description of the hazardous event</Label>
            <TextArea rows={3} />
          </TextField>
        </Cell>
        <Cell state="hover" verdict={v.aria.hover} hint={HOVER_HINT}>
          <TextField>
            <Label>Description of the hazardous event</Label>
            <TextArea rows={3} />
          </TextField>
        </Cell>
        <Cell
          state="focus active"
          verdict={v.aria['focus active']}
          hint={FOCUS_HINT}
        >
          <TextField>
            <Label>Description of the hazardous event</Label>
            <TextArea rows={3} />
          </TextField>
        </Cell>
        <Cell
          state="focus typing"
          verdict={v.aria['focus typing']}
          hint={TYPING_HINT}
        >
          <TextField>
            <Label>Description of the hazardous event</Label>
            <TextArea rows={3} />
          </TextField>
        </Cell>
        <Cell state="filled" verdict={v.aria.filled}>
          <TextField defaultValue="Riverine flooding across the lower delta displaced 12,400 households over four days.">
            <Label>Description of the hazardous event</Label>
            <TextArea rows={3} />
          </TextField>
        </Cell>
        <Cell state="error" verdict={v.aria.error}>
          <TextField isInvalid>
            <Label>Description of the hazardous event</Label>
            <TextArea rows={3} />
            <FieldError>
              A description is required before the record can be submitted for
              validation.
            </FieldError>
          </TextField>
        </Cell>
        <Cell state="disabled" verdict={v.aria.disabled}>
          <TextField
            defaultValue="Riverine flooding across the lower delta displaced 12,400 households over four days."
            isDisabled
          >
            <Label>Description of the hazardous event</Label>
            <TextArea rows={3} />
          </TextField>
        </Cell>
      </Surface>
    </ControlSection>
  );
}

function DateRow() {
  const v = CELL_VERDICTS.date;

  return (
    <ControlSection
      id="mg-fsm-date"
      title="Date input"
      note="Legacy delegates the whole interior of the control to the browser. The aria DateField is the one place in Mangrove where focus typing is a real, separate state, and also the place where the error state goes missing."
    >
      <Surface title="Legacy, the mg-form classes">
        <Cell state="default" verdict={v.legacy.default}>
          <TextInput label="Event start date" type="date" />
        </Cell>
        <Cell state="hover" verdict={v.legacy.hover} hint={HOVER_HINT}>
          <TextInput label="Event start date" type="date" />
        </Cell>
        <Cell
          state="focus active"
          verdict={v.legacy['focus active']}
          hint={FOCUS_HINT}
        >
          <TextInput label="Event start date" type="date" />
        </Cell>
        <Cell
          state="focus typing"
          verdict={v.legacy['focus typing']}
          hint={TYPING_HINT}
        >
          <TextInput label="Event start date" type="date" />
        </Cell>
        <Cell state="filled" verdict={v.legacy.filled}>
          <TextInput
            label="Event start date"
            type="date"
            defaultValue="2024-05-26"
          />
        </Cell>
        <Cell state="error" verdict={v.legacy.error}>
          <TextInput
            label="Event start date"
            type="date"
            defaultValue="2031-05-26"
            error
            errorText="The start date cannot be in the future."
          />
        </Cell>
        <Cell state="disabled" verdict={v.legacy.disabled}>
          <TextInput
            label="Event start date"
            type="date"
            defaultValue="2024-05-26"
            disabled
          />
        </Cell>
      </Surface>

      <Surface title="React Aria, the react-aria classes">
        <Cell state="default" verdict={v.aria.default}>
          <DateField>
            <Label>Event start date</Label>
            <DateInput>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
          </DateField>
        </Cell>
        <Cell state="hover" verdict={v.aria.hover} hint={HOVER_HINT}>
          <DateField>
            <Label>Event start date</Label>
            <DateInput>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
          </DateField>
        </Cell>
        <Cell
          state="focus active"
          verdict={v.aria['focus active']}
          hint={FOCUS_HINT}
        >
          <DateField>
            <Label>Event start date</Label>
            <DateInput>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
          </DateField>
        </Cell>
        <Cell
          state="focus typing"
          verdict={v.aria['focus typing']}
          hint="Focus it and type a date. Watch the segment highlight move."
        >
          <DateField>
            <Label>Event start date</Label>
            <DateInput>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
          </DateField>
        </Cell>
        <Cell state="filled" verdict={v.aria.filled}>
          <DateField>
            <Label>Event start date</Label>
            <DateInput>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
            <Text slot="description">
              An unfilled segment is muted; a filled one is not.
            </Text>
          </DateField>
        </Cell>
        <Cell state="error" verdict={v.aria.error}>
          <DateField isInvalid>
            <Label>Event start date</Label>
            <DateInput>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
            <FieldError>The start date cannot be in the future.</FieldError>
          </DateField>
        </Cell>
        <Cell state="disabled" verdict={v.aria.disabled}>
          <DateField isDisabled>
            <Label>Event start date</Label>
            <DateInput>
              {segment => <DateSegment segment={segment} />}
            </DateInput>
          </DateField>
        </Cell>
      </Surface>
    </ControlSection>
  );
}

function SelectRow() {
  const v = CELL_VERDICTS.select;

  return (
    <ControlSection
      id="mg-fsm-select"
      title="Single-select dropdown"
      note="Legacy is a native select; aria is a Button plus a Popover listbox. Neither expresses filled, and the aria trigger drops the error state entirely."
    >
      <Surface title="Legacy, the mg-form classes">
        <Cell state="default" verdict={v.legacy.default}>
          <MgSelect
            label="Hazard type"
            options={HAZARD_OPTIONS}
            placeholder="Choose a hazard"
          />
        </Cell>
        <Cell state="hover" verdict={v.legacy.hover} hint={HOVER_HINT}>
          <MgSelect
            label="Hazard type"
            options={HAZARD_OPTIONS}
            placeholder="Choose a hazard"
          />
        </Cell>
        <Cell
          state="focus active"
          verdict={v.legacy['focus active']}
          hint={FOCUS_HINT}
        >
          <MgSelect
            label="Hazard type"
            options={HAZARD_OPTIONS}
            placeholder="Choose a hazard"
          />
        </Cell>
        <Cell state="focus typing" verdict={v.legacy['focus typing']}>
          <MgSelect
            label="Hazard type"
            options={HAZARD_OPTIONS}
            placeholder="Choose a hazard"
          />
        </Cell>
        <Cell state="filled" verdict={v.legacy.filled}>
          <MgSelect
            label="Hazard type"
            options={HAZARD_OPTIONS}
            defaultValue="flood"
          />
        </Cell>
        <Cell state="error" verdict={v.legacy.error}>
          <MgSelect
            label="Hazard type"
            options={HAZARD_OPTIONS}
            placeholder="Choose a hazard"
            error
            errorText="Select the hazard type recorded in the DesInventar entry."
          />
        </Cell>
        <Cell state="disabled" verdict={v.legacy.disabled}>
          <MgSelect
            label="Hazard type"
            options={HAZARD_OPTIONS}
            defaultValue="flood"
            disabled
          />
        </Cell>
      </Surface>

      <Surface title="React Aria, the react-aria classes">
        <Cell state="default" verdict={v.aria.default}>
          <Select>
            <Label>Hazard type</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <Popover placement="bottom start">
              <ListBox>
                <ListBoxItem id="cyclone">Tropical cyclone</ListBoxItem>
                <ListBoxItem id="flood">Riverine flood</ListBoxItem>
                <ListBoxItem id="drought">Drought</ListBoxItem>
                <ListBoxItem id="heatwave">Heatwave</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
        </Cell>
        <Cell state="hover" verdict={v.aria.hover} hint={HOVER_HINT}>
          <Select>
            <Label>Hazard type</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <Popover placement="bottom start">
              <ListBox>
                <ListBoxItem id="cyclone">Tropical cyclone</ListBoxItem>
                <ListBoxItem id="flood">Riverine flood</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
        </Cell>
        <Cell
          state="focus active"
          verdict={v.aria['focus active']}
          hint={FOCUS_HINT}
        >
          <Select>
            <Label>Hazard type</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <Popover placement="bottom start">
              <ListBox>
                <ListBoxItem id="cyclone">Tropical cyclone</ListBoxItem>
                <ListBoxItem id="flood">Riverine flood</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
        </Cell>
        <Cell state="focus typing" verdict={v.aria['focus typing']}>
          <Select>
            <Label>Hazard type</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <Popover placement="bottom start">
              <ListBox>
                <ListBoxItem id="cyclone">Tropical cyclone</ListBoxItem>
                <ListBoxItem id="flood">Riverine flood</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
        </Cell>
        <Cell state="filled" verdict={v.aria.filled}>
          <Select defaultSelectedKey="flood">
            <Label>Hazard type</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <Popover placement="bottom start">
              <ListBox>
                <ListBoxItem id="cyclone">Tropical cyclone</ListBoxItem>
                <ListBoxItem id="flood">Riverine flood</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
        </Cell>
        <Cell state="error" verdict={v.aria.error}>
          <Select isInvalid>
            <Label>Hazard type</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <FieldError>
              Select the hazard type recorded in the DesInventar entry.
            </FieldError>
            <Popover placement="bottom start">
              <ListBox>
                <ListBoxItem id="cyclone">Tropical cyclone</ListBoxItem>
                <ListBoxItem id="flood">Riverine flood</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
        </Cell>
        <Cell state="disabled" verdict={v.aria.disabled}>
          <Select defaultSelectedKey="flood" isDisabled>
            <Label>Hazard type</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <Popover placement="bottom start">
              <ListBox>
                <ListBoxItem id="flood">Riverine flood</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
        </Cell>
      </Surface>
    </ControlSection>
  );
}

function StepperRow() {
  const v = CELL_VERDICTS.stepper;

  return (
    <ControlSection
      id="mg-fsm-stepper"
      title="Stepper"
      note="Mangrove has no stepper. Legacy offers a native number input and inherits whatever spinner the browser draws. The aria NumberField is a real stepper, but its states are split: the buttons respond, the input does not."
    >
      <Surface title="Legacy, the mg-form classes">
        <Cell state="default" verdict={v.legacy.default}>
          <TextInput label="People affected" type="number" />
        </Cell>
        <Cell state="hover" verdict={v.legacy.hover} hint={HOVER_HINT}>
          <TextInput label="People affected" type="number" />
        </Cell>
        <Cell
          state="focus active"
          verdict={v.legacy['focus active']}
          hint={FOCUS_HINT}
        >
          <TextInput label="People affected" type="number" />
        </Cell>
        <Cell
          state="focus typing"
          verdict={v.legacy['focus typing']}
          hint={TYPING_HINT}
        >
          <TextInput label="People affected" type="number" />
        </Cell>
        <Cell state="filled" verdict={v.legacy.filled}>
          <TextInput
            label="People affected"
            type="number"
            defaultValue="12400"
          />
        </Cell>
        <Cell state="error" verdict={v.legacy.error}>
          <TextInput
            label="People affected"
            type="number"
            defaultValue="-3"
            error
            errorText="The number of people affected cannot be negative."
          />
        </Cell>
        <Cell state="disabled" verdict={v.legacy.disabled}>
          <TextInput
            label="People affected"
            type="number"
            defaultValue="12400"
            disabled
          />
        </Cell>
      </Surface>

      <Surface title="React Aria, the react-aria classes">
        <Cell state="default" verdict={v.aria.default}>
          <NumberField>
            <Label>People affected</Label>
            <Group>
              <Button slot="decrement">-</Button>
              <Input />
              <Button slot="increment">+</Button>
            </Group>
          </NumberField>
        </Cell>
        <Cell state="hover" verdict={v.aria.hover} hint={HOVER_HINT}>
          <NumberField>
            <Label>People affected</Label>
            <Group>
              <Button slot="decrement">-</Button>
              <Input />
              <Button slot="increment">+</Button>
            </Group>
          </NumberField>
        </Cell>
        <Cell
          state="focus active"
          verdict={v.aria['focus active']}
          hint={FOCUS_HINT}
        >
          <NumberField>
            <Label>People affected</Label>
            <Group>
              <Button slot="decrement">-</Button>
              <Input />
              <Button slot="increment">+</Button>
            </Group>
          </NumberField>
        </Cell>
        <Cell
          state="focus typing"
          verdict={v.aria['focus typing']}
          hint={TYPING_HINT}
        >
          <NumberField>
            <Label>People affected</Label>
            <Group>
              <Button slot="decrement">-</Button>
              <Input />
              <Button slot="increment">+</Button>
            </Group>
          </NumberField>
        </Cell>
        <Cell state="filled" verdict={v.aria.filled}>
          <NumberField defaultValue={12400}>
            <Label>People affected</Label>
            <Group>
              <Button slot="decrement">-</Button>
              <Input />
              <Button slot="increment">+</Button>
            </Group>
          </NumberField>
        </Cell>
        <Cell state="error" verdict={v.aria.error}>
          <NumberField defaultValue={-3} isInvalid>
            <Label>People affected</Label>
            <Group>
              <Button slot="decrement">-</Button>
              <Input />
              <Button slot="increment">+</Button>
            </Group>
            <FieldError>
              The number of people affected cannot be negative.
            </FieldError>
          </NumberField>
        </Cell>
        <Cell state="disabled" verdict={v.aria.disabled}>
          <NumberField defaultValue={12400} isDisabled>
            <Label>People affected</Label>
            <Group>
              <Button slot="decrement">-</Button>
              <Input />
              <Button slot="increment">+</Button>
            </Group>
          </NumberField>
        </Cell>
      </Surface>
    </ControlSection>
  );
}

function MissingControls() {
  return (
    <section className="mg-fsm-section" id="mg-fsm-missing">
      <h3 className="mg-fsm-section-title">
        Controls DELTA models that Mangrove does not provide
      </h3>
      <p className="mg-fsm-section-note">
        Two of the seven controls in the design file have no counterpart on
        either surface. The nearest analogues are shown so the distance is
        visible; neither is a state matrix, because there is no control whose
        states could be enumerated.
      </p>

      <div className="mg-fsm-surfaces">
        <Surface title="Dropdown breadcrumb: nearest analogue">
          <Breadcrumbs>
            <Breadcrumb>
              <Link href="#mg-fsm-missing">Africa</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href="#mg-fsm-missing">Ghana</Link>
            </Breadcrumb>
            <Breadcrumb>Greater Accra</Breadcrumb>
          </Breadcrumbs>
          <Select defaultSelectedKey="accra">
            <Label>Change district</Label>
            <Button>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <Popover placement="bottom start">
              <ListBox>
                <ListBoxItem id="accra">Accra Metropolitan</ListBoxItem>
                <ListBoxItem id="tema">Tema Metropolitan</ListBoxItem>
                <ListBoxItem id="ga-east">Ga East Municipal</ListBoxItem>
              </ListBox>
            </Popover>
          </Select>
          <p className="mg-fsm-cell-evidence">
            Two unrelated components stacked by an author. The trigger does not
            show the path, the path does not open a menu, and the composition
            has no states of its own.
          </p>
        </Surface>

        <Surface title="Multiselect: nearest analogue">
          <ListBox
            aria-label="Sendai Framework targets covered by this report"
            selectionMode="multiple"
            defaultSelectedKeys={DEFAULT_TARGET_KEYS}
          >
            <ListBoxItem id="a">Target A: mortality</ListBoxItem>
            <ListBoxItem id="b">Target B: affected people</ListBoxItem>
            <ListBoxItem id="c">Target C: economic loss</ListBoxItem>
            <ListBoxItem id="d">Target D: critical infrastructure</ListBoxItem>
          </ListBox>
          <p className="mg-fsm-cell-evidence">
            An always-open listbox, not a multiselect. There is no trigger, no
            token display and no removal affordance, and because [data-selected]
            and [data-focused] share one background, a focused unselected option
            is indistinguishable from a selected one.
          </p>
        </Surface>
      </div>

      <div className="mg-fsm-table-scroll">
        <table className="mg-fsm-table">
          <caption>Coverage for the two missing controls</caption>
          <thead>
            <tr>
              <th scope="col">Control</th>
              <th scope="col">Legacy, the mg-form classes</th>
              <th scope="col">React Aria surface</th>
            </tr>
          </thead>
          <tbody>
            {MISSING_CONTROLS.map(row => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.legacy}</td>
                <td>{row.aria}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const CONTROL_LABELS = {
  'text-input': 'Text input',
  textarea: 'Text area',
  date: 'Date input',
  select: 'Single-select dropdown',
  stepper: 'Stepper',
};

const CONTROL_KEYS = ['text-input', 'textarea', 'date', 'select', 'stepper'];

function SummaryTable() {
  return (
    <section className="mg-fsm-section" id="mg-fsm-summary">
      <h3 className="mg-fsm-section-title">The matrix</h3>
      <p className="mg-fsm-section-note">
        Control by state by surface. Every verdict was measured in the browser
        against the specimens above, at the UNDRR theme default.
      </p>
      <div className="mg-fsm-table-scroll">
        <table className="mg-fsm-table">
          <caption>
            Form control state coverage, legacy over React Aria in each cell
          </caption>
          <thead>
            <tr>
              <th scope="col">Control</th>
              <th scope="col">Surface</th>
              {STATE_ORDER.map(state => (
                <th key={state} scope="col">
                  {state}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONTROL_KEYS.map(key => (
              <React.Fragment key={key}>
                <tr>
                  <th scope="row" rowSpan={2}>
                    {CONTROL_LABELS[key]}
                  </th>
                  <td>legacy</td>
                  {STATE_ORDER.map(state => (
                    <td key={state}>
                      <Badge status={CELL_VERDICTS[key].legacy[state][0]} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>aria</td>
                  {STATE_ORDER.map(state => (
                    <td key={state}>
                      <Badge status={CELL_VERDICTS[key].aria[state][0]} />
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Method() {
  return (
    <section className="mg-fsm-section" id="mg-fsm-method">
      <h3 className="mg-fsm-section-title">How this was measured</h3>
      <p className="mg-fsm-section-note">
        Every verdict comes from getComputedStyle in headless Chromium against
        the specimens on this page, not from reading the stylesheet. Hover was
        driven with a real pointer, keyboard focus with a real Tab, and pointer
        focus with a real click, because React Aria and the CSS :focus-visible
        pseudo-class disagree about what a click counts as.
      </p>
      <p className="mg-fsm-section-note">
        Checked in all five themes and in both directions. The error red stays
        193 9 32 everywhere. The legacy focus border re-themes per sub-brand
        while the ring around it does not. RTL mirrors the layout and the
        reading order correctly on both surfaces; the legacy select moves its
        chevron and the legacy date input moves its picker button, and the aria
        surface reflows on its own because it is written in logical properties.
      </p>
    </section>
  );
}

function Disagreements() {
  return (
    <section className="mg-fsm-section" id="mg-fsm-disagreements">
      <h3 className="mg-fsm-section-title">Where the two surfaces disagree</h3>
      <p className="mg-fsm-section-note">
        A stated goal of this branch is that the legacy and React Aria surfaces
        should agree. On six counts they do not. These are findings, not fixes.
      </p>
      {DISAGREEMENTS.map(item => (
        <div className="mg-fsm-flag" key={item.state}>
          <h4 className="mg-fsm-flag-title">{item.state}</h4>
          <p>{item.detail}</p>
        </div>
      ))}
    </section>
  );
}

function FormStateMatrix() {
  return (
    <div className="mg-fsm">
      <style>{MATRIX_STYLES}</style>
      <h2>Form control state matrix</h2>
      <p className="mg-fsm-lede">
        DELTA's design file models each form control across seven states:
        default, hover, focus active, focus typing, filled, error and disabled.
        Focus active and focus typing are modelled separately, which is a finer
        distinction than either Mangrove surface currently draws.
      </p>
      <p className="mg-fsm-lede">
        Each cell below is a live control, labelled with the state it is meant
        to demonstrate and with a verdict measured in the browser. Hover and
        focus cannot be rendered statically, so those cells ask you to hover or
        Tab. When a cell that asks you to hover looks the same after you hover
        it, that is the gap.
      </p>
      <SummaryTable />
      <TextInputRow />
      <TextAreaRow />
      <DateRow />
      <SelectRow />
      <StepperRow />
      <MissingControls />
      <Method />
      <Disagreements />
    </div>
  );
}

export default {
  title: 'Spike/Form state matrix',
  component: FormStateMatrix,
  parameters: {
    docs: {
      description: {
        component:
          "An audit specimen sheet comparing Mangrove's legacy .mg-form-* controls against the React Aria surface across the seven form states DELTA's design file models. Read-only: it reports coverage and disagreements and changes no component.",
      },
    },
  },
};

export const StateMatrix = {
  name: 'State matrix',
  render: () => <FormStateMatrix />,
};

/*
 * Focused React Aria integration proof: token-styled form controls and a
 * portalled Select. Complex table behaviour is demonstrated in the CRUD story.
 */
import React, { useState } from 'react';
import {
  Button,
  Checkbox,
  DateField,
  DateInput,
  DateSegment,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text,
  TextField,
} from 'react-aria-components';

const options = ['Preparedness', 'Response', 'Recovery'];

function AriaIntegrationDemo() {
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const isTitleInvalid = title.trim().length === 0;

  return (
    <div
      className="aria-integration-demo"
      style={{
        display: 'grid',
        gap: 'var(--mg-aria-space-4)',
        maxWidth: '64rem',
      }}
    >
      <Button>Save assessment</Button>
      <TextField
        isRequired
        isInvalid={isTitleInvalid}
        onChange={setTitle}
        value={title}
      >
        <Label>Assessment title</Label>
        <Input />
        <Text slot="description">Use a short, recognisable title.</Text>
        <FieldError>A title is required.</FieldError>
      </TextField>
      <Select aria-label="Programme" defaultSelectedKey="preparedness">
        <Label>Programme</Label>
        <Button>
          <SelectValue />
          <span aria-hidden="true">▾</span>
        </Button>
        <Popover>
          <ListBox items={options}>
            {item => <ListBoxItem id={item.toLowerCase()}>{item}</ListBoxItem>}
          </ListBox>
        </Popover>
      </Select>
      <TextField value={search} onChange={setSearch}>
        <Label>Search hazardous events</Label>
        <Input placeholder="Search by hazard name" />
      </TextField>
      <DateField>
        <Label>From</Label>
        <DateInput>{segment => <DateSegment segment={segment} />}</DateInput>
      </DateField>
      <div style={{ display: 'flex', gap: 'var(--mg-aria-space-4)' }}>
        <Checkbox>View my records</Checkbox>
        <Checkbox>Pending my action</Checkbox>
      </div>
    </div>
  );
}

export default {
  title: 'Spike/React Aria integration',
  component: AriaIntegrationDemo,
  parameters: {
    docs: {
      description: {
        component:
          'A minimal token-styling proof for React Aria form controls and portalled Select options. The complete table interaction example lives in React Aria CRUD.',
      },
    },
  },
};

export const AriaSpikeExample = {
  name: 'Integration example',
  render: () => <AriaIntegrationDemo />,
};

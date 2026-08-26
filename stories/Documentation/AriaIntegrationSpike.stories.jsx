import React, {useState} from 'react';
import {
  Button,
  Cell,
  Checkbox,
  Column,
  ColumnResizer,
  DateField,
  DateInput,
  DateSegment,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Row,
  ResizableTableContainer,
  Select,
  SelectValue,
  Table,
  TableBody,
  TableHeader,
  Text,
  TextField,
} from 'react-aria-components';
import '../../aria/tokens/mangrove.css';
import '../../aria/react-aria.css';

const options = ['Preparedness', 'Response', 'Recovery'];
const events = [
  {id: 'cyclone', hazard: 'Tropical Cyclone', status: 'Validated', updated: '02-05-2026'},
  {id: 'cholera', hazard: 'Cholera', status: 'Published', updated: '02-05-2026'},
  {id: 'drought', hazard: 'Drought', status: 'Draft', updated: '02-05-2026'},
  {id: 'heatwave', hazard: 'Heatwave', status: 'Draft', updated: '02-05-2026'},
  {id: 'flood', hazard: 'Riverine Flood', status: 'Waiting for validation', updated: '01-05-2026'},
];

export function AriaSpikeExample() {
  const [allEvents, setAllEvents] = useState(events);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [sortDescriptor, setSortDescriptor] = useState({column: 'hazard', direction: 'ascending'});
  const isTitleInvalid = title.trim().length === 0;
  const sortedEvents = allEvents
    .filter(event => event.hazard.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
    const direction = sortDescriptor.direction === 'ascending' ? 1 : -1;
    return a[sortDescriptor.column].localeCompare(b[sortDescriptor.column]) * direction;
    });
  const pageEvents = sortedEvents.slice((page - 1) * 3, page * 3);
  const pageCount = Math.ceil(sortedEvents.length / 3);
  const toggleSelected = (id, isSelected) => {
    setSelectedEvents(current => {
      const next = new Set(current);
      isSelected ? next.add(id) : next.delete(id);
      return next;
    });
  };

  return (
    <div
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
      <div style={{display: 'flex', gap: 'var(--mg-aria-space-4)'}}>
        <Checkbox>View my records</Checkbox>
        <Checkbox>Pending my action</Checkbox>
      </div>
      <ResizableTableContainer className="aria-spike-table-scroll">
      <Table aria-label="Hazardous events" sortDescriptor={sortDescriptor} onSortChange={descriptor => { setSortDescriptor(descriptor); setPage(1); }}>
        <TableHeader>
          <Column id="selection" width={48} aria-label="Select rows"><Checkbox slot="selection" aria-label="Select all visible events" isSelected={pageEvents.every(event => selectedEvents.has(event.id))} onChange={isSelected => pageEvents.forEach(event => toggleSelected(event.id, isSelected))} /></Column>
          <Column id="hazard" isRowHeader allowsSorting defaultWidth={224}>{({sortDirection}) => <div className="aria-spike-column-header"><span>Hazard type {sortDirection ? (sortDirection === 'ascending' ? '↑' : '↓') : ''}</span><ColumnResizer /></div>}</Column>
          <Column id="status" allowsSorting defaultWidth={192}>{({sortDirection}) => <div className="aria-spike-column-header"><span>Status {sortDirection ? (sortDirection === 'ascending' ? '↑' : '↓') : ''}</span><ColumnResizer /></div>}</Column>
          <Column id="updated" allowsSorting defaultWidth={160}>{({sortDirection}) => <div className="aria-spike-column-header"><span>Updated {sortDirection ? (sortDirection === 'ascending' ? '↑' : '↓') : ''}</span><ColumnResizer /></div>}</Column>
          <Column id="actions" width={64}>Actions</Column>
        </TableHeader>
        <TableBody items={pageEvents}>
          {item => (
            <Row className={selectedEvents.has(item.id) ? 'aria-spike-row-selected' : undefined}>
              <Cell><Checkbox slot="selection" aria-label={`Select ${item.hazard}`} isSelected={selectedEvents.has(item.id)} onChange={isSelected => toggleSelected(item.id, isSelected)} /></Cell>
              <Cell>{item.hazard}</Cell><Cell>{item.status}</Cell><Cell>{item.updated}</Cell>
              <Cell><MenuTrigger><Button aria-label={`Actions for ${item.hazard}`}>•••</Button><Popover><Menu aria-label={`Actions for ${item.hazard}`} onAction={key => { if (key === 'delete') setAllEvents(current => current.filter(event => event.id !== item.id)); }}><MenuItem id="view">View</MenuItem><MenuItem id="edit">Edit…</MenuItem><MenuItem id="delete">Delete…</MenuItem></Menu></Popover></MenuTrigger></Cell>
            </Row>
          )}
        </TableBody>
      </Table>
      </ResizableTableContainer>
      <div style={{display: 'flex', gap: 'var(--mg-aria-space-2)', justifyContent: 'space-between'}}>
        <span>Page {page} of {pageCount}</span>
        <div style={{display: 'flex', gap: 'var(--mg-aria-space-2)'}}>
          <Button isDisabled={page === 1} onPress={() => setPage(page - 1)}>Previous</Button>
          <Button isDisabled={page === pageCount} onPress={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

export default {
  title: 'Spike/React Aria integration',
  component: AriaSpikeExample,
};

export const MangroveTheme = {};

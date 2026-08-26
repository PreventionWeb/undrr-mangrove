import React, { useMemo, useState } from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Cell,
  Checkbox,
  ComboBox,
  Column,
  ColumnResizer,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  DialogTrigger,
  DropZone,
  Group,
  GridList,
  GridListItem,
  Heading,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Modal,
  ModalOverlay,
  Popover,
  Row,
  Select,
  SelectValue,
  SubmenuTrigger,
  Tag,
  TagGroup,
  TagList,
  Table,
  TableBody,
  TableHeader,
  TextField,
  ResizableTableContainer,
  ToggleButton,
} from 'react-aria-components';
import Pager from '../Components/Pager/Pager';

const initialEvents = [
  {
    id: 'cyclone',
    hazard: 'Tropical Cyclone',
    status: 'Validated',
    cycle: 'Rapid onset',
    sunlight: 'High',
    watering: 'Average',
    favorite: false,
    updated: '02-05-2026',
  },
  {
    id: 'cholera',
    hazard: 'Cholera',
    status: 'Published',
    cycle: 'Slow onset',
    sunlight: 'Low',
    watering: 'Minimum',
    favorite: false,
    updated: '02-05-2026',
  },
  {
    id: 'drought',
    hazard: 'Drought',
    status: 'Draft',
    cycle: 'Slow onset',
    sunlight: 'High',
    watering: 'Minimum',
    favorite: false,
    updated: '02-05-2026',
  },
  {
    id: 'heatwave',
    hazard: 'Heatwave',
    status: 'Draft',
    cycle: 'Rapid onset',
    sunlight: 'High',
    watering: 'Average',
    favorite: false,
    updated: '02-05-2026',
  },
  {
    id: 'flood',
    hazard: 'Riverine Flood',
    status: 'Waiting for validation',
    cycle: 'Rapid onset',
    sunlight: 'Medium',
    watering: 'Frequent',
    favorite: false,
    updated: '01-05-2026',
  },
];
const allColumns = [
  { id: 'hazard', label: 'Hazard type', width: 220 },
  { id: 'cycle', label: 'Onset', width: 150 },
  { id: 'sunlight', label: 'Exposure', width: 130 },
  { id: 'watering', label: 'Severity', width: 130 },
  { id: 'status', label: 'Record status', width: 180 },
  { id: 'updated', label: 'Updated', width: 140 },
];

function EventEditor({ item, onClose, onSave }) {
  const [draft, setDraft] = useState(
    item || {
      hazard: '',
      status: 'Draft',
      cycle: 'Rapid onset',
      sunlight: 'High',
      watering: 'Average',
    }
  );
  const set = (key, value) =>
    setDraft(current => ({ ...current, [key]: value }));
  return (
    <ModalOverlay isOpen onOpenChange={open => !open && onClose()}>
      <Modal>
        <Dialog>
          {() => (
            <>
              <Heading slot="title">
                {item ? 'Edit hazardous event' : 'Add hazardous event'}
              </Heading>
              <div className="mg-grid mg-grid__col-2">
                <DropZone
                  aria-label="Attach event evidence"
                  onDrop={() => set('attachment', 'Evidence attached')}
                >
                  <span aria-hidden="true">⇧</span>
                  <span>{draft.attachment || 'Drop evidence here'}</span>
                </DropZone>
                <ComboBox
                  allowsCustomValue
                  inputValue={draft.hazard}
                  onInputChange={value => set('hazard', value)}
                >
                  <Label className="mg-form-label">Hazard type</Label>
                  <Input
                    className="mg-form-input"
                    placeholder="Enter hazard type"
                  />
                  <Button
                    className="mg-button mg-button-secondary"
                    aria-label="Show suggested hazards"
                  >
                    ▾
                  </Button>
                  <Popover>
                    <ListBox items={initialEvents}>
                      {event => (
                        <ListBoxItem id={event.hazard} textValue={event.hazard}>
                          {event.hazard}
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </Popover>
                </ComboBox>
              </div>
              <TextField
                className="mg-form-field"
                isRequired
                value={draft.note || ''}
                onChange={value => set('note', value)}
              >
                <Label className="mg-form-label">Event reference</Label>
                <Input
                  className="mg-form-input"
                  placeholder="Enter reference"
                />
              </TextField>
              <Select
                className="mg-form-field"
                selectedKey={draft.status}
                onSelectionChange={key => set('status', String(key))}
              >
                <Label className="mg-form-label">Record status</Label>
                <Button className="mg-form-select">
                  <SelectValue />
                  <span aria-hidden="true">▾</span>
                </Button>
                <Popover>
                  <ListBox
                    items={[
                      'Draft',
                      'Waiting for validation',
                      'Validated',
                      'Published',
                    ]}
                  >
                    {value => <ListBoxItem id={value}>{value}</ListBoxItem>}
                  </ListBox>
                </Popover>
              </Select>
              <DatePicker
                className="mg-form-field"
                onChange={value =>
                  set('updated', value?.toString() || draft.updated)
                }
              >
                <Label className="mg-form-label">Date recorded</Label>
                <Group>
                  <DateInput className="mg-form-input">
                    {segment => <DateSegment segment={segment} />}
                  </DateInput>
                  <Button
                    className="mg-button mg-button-secondary"
                    aria-label="Choose date"
                  >
                    ▾
                  </Button>
                </Group>
                <Popover>
                  <Dialog>
                    <Calendar aria-label="Date recorded">
                      <header className="aria-calendar-header">
                        <Button
                          slot="previous"
                          className="mg-button mg-button-secondary"
                        >
                          ‹
                        </Button>
                        <Heading />
                        <Button
                          slot="next"
                          className="mg-button mg-button-secondary"
                        >
                          ›
                        </Button>
                      </header>
                      <CalendarGrid>
                        <CalendarGridHeader>
                          {day => (
                            <CalendarHeaderCell>{day}</CalendarHeaderCell>
                          )}
                        </CalendarGridHeader>
                        <CalendarGridBody>
                          {date => <CalendarCell date={date} />}
                        </CalendarGridBody>
                      </CalendarGrid>
                    </Calendar>
                  </Dialog>
                </Popover>
              </DatePicker>
              <Select
                className="mg-form-field"
                selectedKey={draft.cycle}
                onSelectionChange={key => set('cycle', String(key))}
              >
                <Label className="mg-form-label">Onset</Label>
                <Button className="mg-form-select">
                  <SelectValue />
                  <span aria-hidden="true">▾</span>
                </Button>
                <Popover>
                  <ListBox items={['Rapid onset', 'Slow onset']}>
                    {value => <ListBoxItem id={value}>{value}</ListBoxItem>}
                  </ListBox>
                </Popover>
              </Select>
              <Select
                className="mg-form-field"
                selectedKey={draft.sunlight}
                onSelectionChange={key => set('sunlight', String(key))}
              >
                <Label className="mg-form-label">Exposure</Label>
                <Button className="mg-form-select">
                  <SelectValue />
                  <span aria-hidden="true">▾</span>
                </Button>
                <Popover>
                  <ListBox items={['Low', 'Medium', 'High']}>
                    {value => <ListBoxItem id={value}>{value}</ListBoxItem>}
                  </ListBox>
                </Popover>
              </Select>
              <Select
                className="mg-form-field"
                selectedKey={draft.watering}
                onSelectionChange={key => set('watering', String(key))}
              >
                <Label className="mg-form-label">Severity</Label>
                <Button className="mg-form-select">
                  <SelectValue />
                  <span aria-hidden="true">▾</span>
                </Button>
                <Popover>
                  <ListBox items={['Minimum', 'Average', 'Frequent']}>
                    {value => <ListBoxItem id={value}>{value}</ListBoxItem>}
                  </ListBox>
                </Popover>
              </Select>
              <div className="aria-crud-actions">
                <Button
                  className="mg-button mg-button-secondary"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  className="mg-button mg-button-primary"
                  onPress={() => {
                    if (draft.hazard.trim())
                      onSave({
                        ...draft,
                        id: item?.id || crypto.randomUUID(),
                        favorite: item?.favorite || false,
                        updated: draft.updated || '26-08-2026',
                      });
                  }}
                >
                  {' '}
                  {item ? 'Save' : 'Add'}{' '}
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function DeleteDialog({ item, onClose, onDelete }) {
  return (
    <ModalOverlay isOpen onOpenChange={open => !open && onClose()}>
      <Modal>
        <Dialog>
          {() => (
            <>
              <Heading slot="title">Delete event?</Heading>
              <p>
                Delete {item.hazard}? This only changes the in-memory spike
                data.
              </p>
              <div className="aria-crud-actions">
                <Button
                  className="mg-button mg-button-secondary"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  className="mg-button mg-button-primary"
                  onPress={() => onDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function FilterTags({ label, items, selectedKeys, onSelectionChange }) {
  return (
    <TagGroup
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
    >
      <Label className="mg-form-label">{label}</Label>
      <TagList className="mg-tag-container" items={items}>
        {value => (
          <Tag
            id={value}
            className={({ isSelected }) =>
              `mg-tag${isSelected ? '' : ' mg-tag--outline'}`
            }
          >
            {value}
          </Tag>
        )}
      </TagList>
    </TagGroup>
  );
}

export function CrudExample() {
  const [items, setItems] = useState(initialEvents);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [statuses, setStatuses] = useState(new Set());
  const [cycles, setCycles] = useState(new Set());
  const [exposures, setExposures] = useState(new Set());
  const [severities, setSeverities] = useState(new Set());
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(allColumns.map(column => column.id))
  );
  const [selected, setSelected] = useState(new Set());
  const [sort, setSort] = useState({
    column: 'hazard',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const columns = allColumns.filter(column => visibleColumns.has(column.id));
  const filtered = useMemo(
    () =>
      items
        .filter(
          item =>
            item.hazard.toLowerCase().includes(search.toLowerCase()) &&
            (!favoritesOnly || item.favorite) &&
            (!statuses.size || statuses.has(item.status)) &&
            (!cycles.size || cycles.has(item.cycle)) &&
            (!exposures.size || exposures.has(item.sunlight)) &&
            (!severities.size || severities.has(item.watering))
        )
        .sort(
          (a, b) =>
            a[sort.column].localeCompare(b[sort.column]) *
            (sort.direction === 'ascending' ? 1 : -1)
        ),
    [
      items,
      search,
      favoritesOnly,
      statuses,
      cycles,
      exposures,
      severities,
      sort,
    ]
  );
  const pageSize = 3,
    pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const toggleSelection = (id, isSelected) =>
    setSelected(current => {
      const next = new Set(current);
      isSelected ? next.add(id) : next.delete(id);
      return next;
    });
  const save = item => {
    setItems(current => {
      const index = current.findIndex(entry => entry.id === item.id);
      return index < 0
        ? [...current, item]
        : current.map(entry => (entry.id === item.id ? item : entry));
    });
    setEditing(null);
  };
  const deleteItem = id => {
    setItems(current => current.filter(item => item.id !== id));
    setDeleting(null);
  };
  const toggleFavorite = id =>
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
  const filterCount =
    Number(favoritesOnly) +
    statuses.size +
    cycles.size +
    exposures.size +
    severities.size;
  const clearFilters = () => {
    setFavoritesOnly(false);
    setStatuses(new Set());
    setCycles(new Set());
    setExposures(new Set());
    setSeverities(new Set());
    setPage(1);
  };
  return (
    <div className="aria-crud-demo">
      <div className="mg-search__form">
        <TextField
          className="mg-search__input-wrapper"
          value={search}
          onChange={value => {
            setSearch(value);
            setPage(1);
          }}
        >
          <Label className="mg-u-sr-only">Search events</Label>
          <Input
            className="mg-search__input"
            placeholder="Search hazardous events"
          />
        </TextField>
        <DialogTrigger>
          <Button className="mg-button mg-button-secondary">
            Filters{filterCount ? ` (${filterCount})` : ''}
          </Button>
          <Popover>
            <Dialog>
              <Heading slot="title">Filters</Heading>
              {filterCount > 0 && (
                <Button
                  className="mg-button mg-button-secondary"
                  onPress={clearFilters}
                >
                  Clear filters
                </Button>
              )}
              <Checkbox
                isSelected={favoritesOnly}
                onChange={value => {
                  setFavoritesOnly(value);
                  setPage(1);
                }}
              >
                Favorites
              </Checkbox>
              <FilterTags
                label="Record status"
                items={[
                  'Draft',
                  'Waiting for validation',
                  'Validated',
                  'Published',
                ]}
                selectedKeys={statuses}
                onSelectionChange={keys => {
                  setStatuses(new Set(keys));
                  setPage(1);
                }}
              />
              <FilterTags
                label="Onset"
                items={['Rapid onset', 'Slow onset']}
                selectedKeys={cycles}
                onSelectionChange={keys => {
                  setCycles(new Set(keys));
                  setPage(1);
                }}
              />
              <FilterTags
                label="Exposure"
                items={['Low', 'Medium', 'High']}
                selectedKeys={exposures}
                onSelectionChange={keys => {
                  setExposures(new Set(keys));
                  setPage(1);
                }}
              />
              <FilterTags
                label="Severity"
                items={['Minimum', 'Average', 'Frequent']}
                selectedKeys={severities}
                onSelectionChange={keys => {
                  setSeverities(new Set(keys));
                  setPage(1);
                }}
              />
            </Dialog>
          </Popover>
        </DialogTrigger>
        <MenuTrigger>
          <Button
            className="mg-button mg-button-secondary"
            aria-label="Columns"
          >
            Columns
          </Button>
          <Popover>
            <Menu
              aria-label="Visible columns"
              selectionMode="multiple"
              selectedKeys={visibleColumns}
              onSelectionChange={keys => setVisibleColumns(new Set(keys))}
            >
              {allColumns.map(column => (
                <MenuItem key={column.id} id={column.id}>
                  {column.label}
                </MenuItem>
              ))}
            </Menu>
          </Popover>
        </MenuTrigger>
        <Button
          className="mg-button mg-button-primary"
          aria-label="Add event"
          onPress={() => setEditing({})}
        >
          +
        </Button>
      </div>
      <ResizableTableContainer className="aria-spike-table-scroll mg-u-responsive--show-large">
        <Table
          aria-label="Hazardous events"
          sortDescriptor={sort}
          onSortChange={descriptor => {
            setSort(descriptor);
            setPage(1);
          }}
        >
          <TableHeader>
            <Column id="selection" width={48}>
              <Checkbox
                slot="selection"
                aria-label="Select all"
                isSelected={
                  pageItems.length > 0 &&
                  pageItems.every(item => selected.has(item.id))
                }
                onChange={value =>
                  pageItems.forEach(item => toggleSelection(item.id, value))
                }
              />
            </Column>
            <Column id="favorite" width={48} aria-label="Favorite">
              ★
            </Column>
            {columns.map(column => (
              <Column
                key={column.id}
                id={column.id}
                isRowHeader={column.id === 'hazard'}
                allowsSorting
                defaultWidth={column.width}
              >
                {({ sortDirection }) => (
                  <div className="aria-spike-column-header">
                    <span>
                      {column.label}
                      {sortDirection
                        ? sortDirection === 'ascending'
                          ? ' ↑'
                          : ' ↓'
                        : ''}
                    </span>
                    <ColumnResizer />
                  </div>
                )}
              </Column>
            ))}
            <Column id="actions" width={64} aria-label="Actions">
              •••
            </Column>
          </TableHeader>
          <TableBody items={pageItems}>
            {item => (
              <Row
                className={
                  selected.has(item.id) ? 'aria-spike-row-selected' : undefined
                }
              >
                <Cell>
                  <Checkbox
                    slot="selection"
                    aria-label={`Select ${item.hazard}`}
                    isSelected={selected.has(item.id)}
                    onChange={value => toggleSelection(item.id, value)}
                  />
                </Cell>
                <Cell>
                  <ToggleButton
                    aria-label={`Favorite ${item.hazard}`}
                    isSelected={item.favorite}
                    onChange={() => toggleFavorite(item.id)}
                  >
                    {item.favorite ? '★' : '☆'}
                  </ToggleButton>
                </Cell>
                {columns.map(column => (
                  <Cell key={column.id}>{item[column.id]}</Cell>
                ))}
                <Cell>
                  <MenuTrigger>
                    <Button
                      className="mg-button mg-button-secondary"
                      aria-label={`Actions for ${item.hazard}`}
                    >
                      •••
                    </Button>
                    <Popover>
                      <Menu aria-label={`Actions for ${item.hazard}`}>
                        <MenuItem
                          id="favorite"
                          onAction={() => toggleFavorite(item.id)}
                        >
                          {item.favorite ? 'Unfavorite' : 'Favorite'}
                        </MenuItem>
                        <MenuItem id="edit" onAction={() => setEditing(item)}>
                          Edit…
                        </MenuItem>
                        <MenuItem
                          id="delete"
                          onAction={() => setDeleting(item)}
                        >
                          Delete…
                        </MenuItem>
                        <SubmenuTrigger>
                          <MenuItem id="share">Share</MenuItem>
                          <Popover>
                            <Menu aria-label={`Share ${item.hazard}`}>
                              <MenuItem
                                id="copy-link"
                                onAction={() =>
                                  navigator.clipboard?.writeText(item.hazard)
                                }
                              >
                                Copy reference
                              </MenuItem>
                              <MenuItem
                                id="email"
                                href={`mailto:?subject=${encodeURIComponent(item.hazard)}`}
                              >
                                Email
                              </MenuItem>
                            </Menu>
                          </Popover>
                        </SubmenuTrigger>
                      </Menu>
                    </Popover>
                  </MenuTrigger>
                </Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      </ResizableTableContainer>
      <GridList
        className="mg-u-responsive--show-small"
        aria-label="Hazardous events"
        items={pageItems}
      >
        {item => (
          <GridListItem textValue={item.hazard}>
            <div className="mg-grid mg-grid__col-2">
              <div>
                <ToggleButton
                  aria-label={`Favorite ${item.hazard}`}
                  isSelected={item.favorite}
                  onChange={() => toggleFavorite(item.id)}
                >
                  {item.favorite ? '★' : '☆'}
                </ToggleButton>
                <strong>{item.hazard}</strong>
                <div>{item.status}</div>
              </div>
              <div>
                <span className="mg-tag mg-tag--outline">{item.cycle}</span>
                <span className="mg-tag mg-tag--outline">{item.sunlight}</span>
                <MenuTrigger>
                  <Button
                    className="mg-button mg-button-secondary"
                    aria-label={`Actions for ${item.hazard}`}
                  >
                    •••
                  </Button>
                  <Popover>
                    <Menu aria-label={`Actions for ${item.hazard}`}>
                      <MenuItem id="edit" onAction={() => setEditing(item)}>
                        Edit…
                      </MenuItem>
                      <MenuItem id="delete" onAction={() => setDeleting(item)}>
                        Delete…
                      </MenuItem>
                    </Menu>
                  </Popover>
                </MenuTrigger>
              </div>
            </div>
          </GridListItem>
        )}
      </GridList>
      <Pager
        layout="bar"
        page={page}
        totalPages={pageCount}
        onPageChange={setPage}
        range={{
          start: filtered.length ? (page - 1) * pageSize + 1 : 0,
          end: Math.min(page * pageSize, filtered.length),
        }}
      />
      {editing && (
        <EventEditor
          item={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
      {deleting && (
        <DeleteDialog
          item={deleting}
          onClose={() => setDeleting(null)}
          onDelete={deleteItem}
        />
      )}
    </div>
  );
}

export default { title: 'Spike/React Aria CRUD', component: CrudExample };
export const MangroveCrud = {};

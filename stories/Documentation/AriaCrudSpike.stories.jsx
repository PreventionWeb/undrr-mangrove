import React, { useEffect, useMemo, useState } from 'react';
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
  FieldError,
  Form,
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
  SearchField,
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
  Tooltip,
  TooltipTrigger,
  isFileDropItem,
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
    image: 'icons/ocha/cyclone.svg',
    note: 'HIPS-001',
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
    image: 'icons/ocha/epidemic.svg',
    note: 'HIPS-002',
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
    image: 'icons/ocha/drought.svg',
    note: 'HIPS-003',
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
    image: 'icons/ocha/heatwave.svg',
    note: 'HIPS-004',
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
    image: 'icons/ocha/flood.svg',
    note: 'HIPS-005',
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
  const [showValidation, setShowValidation] = useState(false);
  const [droppedImage, setDroppedImage] = useState(item?.image);
  const set = (key, value) =>
    setDraft(current => ({ ...current, [key]: value }));
  const submit = event => {
    event.preventDefault();
    if (!draft.hazard.trim() || !draft.note?.trim()) {
      setShowValidation(true);
      return;
    }
    onSave({
      ...draft,
      image: droppedImage,
      id: item?.id || crypto.randomUUID(),
      favorite: item?.favorite || false,
      updated: draft.updated || '26-08-2026',
    });
  };
  return (
    <ModalOverlay isOpen onOpenChange={open => !open && onClose()}>
      <Modal>
        <Dialog className="aria-crud-editor">
          {() => (
            <Form noValidate onSubmit={submit} className="aria-crud-editor">
              <Heading slot="title" className="aria-crud-editor__title">
                {item ? 'Edit hazardous event' : 'Add hazardous event'}
              </Heading>
              <div className="mg-grid mg-grid__col-2 aria-crud-editor__identity">
                <DropZone
                  aria-label="Attach event evidence"
                  getDropOperation={types =>
                    types.has('image/jpeg') || types.has('image/png')
                      ? 'copy'
                      : 'cancel'
                  }
                  onDrop={async event => {
                    const image = event.items
                      .filter(isFileDropItem)
                      .find(
                        dropItem =>
                          dropItem.type === 'image/jpeg' ||
                          dropItem.type === 'image/png'
                      );
                    if (image) {
                      setDroppedImage(
                        URL.createObjectURL(await image.getFile())
                      );
                    }
                  }}
                >
                  {droppedImage ? (
                    <img alt="" src={droppedImage} />
                  ) : (
                    <>
                      <span aria-hidden="true">⇧</span>
                      <span>Drop or paste an image here</span>
                    </>
                  )}
                </DropZone>
                <ComboBox
                  allowsCustomValue
                  isRequired
                  inputValue={draft.hazard}
                  onInputChange={value => set('hazard', value)}
                  onSelectionChange={key => set('hazard', String(key))}
                  isInvalid={showValidation && !draft.hazard.trim()}
                >
                  <Label className="mg-form-label">Hazard type</Label>
                  <Group>
                    <Input
                      className="mg-form-input"
                      placeholder="Enter hazard type"
                    />
                    <Button
                      className="mg-button mg-button-primary mg-button-outline"
                      aria-label="Show suggested hazards"
                    >
                      ▾
                    </Button>
                  </Group>
                  <Popover>
                    <ListBox items={initialEvents}>
                      {event => (
                        <ListBoxItem id={event.hazard} textValue={event.hazard}>
                          {event.hazard}
                        </ListBoxItem>
                      )}
                    </ListBox>
                  </Popover>
                  <FieldError>A hazard type is required.</FieldError>
                </ComboBox>
              </div>
              <div className="aria-crud-editor__fields">
                <TextField
                  className="mg-form-field"
                  isRequired
                  value={draft.note || ''}
                  onChange={value => set('note', value)}
                  isInvalid={showValidation && !draft.note?.trim()}
                >
                  <Label className="mg-form-label">Event reference</Label>
                  <Input
                    className="mg-form-input"
                    placeholder="Enter reference"
                  />
                  <FieldError>An event reference is required.</FieldError>
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
                      className="mg-button mg-button-primary mg-button-outline"
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
                            className="mg-button mg-button-primary mg-button-outline"
                          >
                            ‹
                          </Button>
                          <Heading />
                          <Button
                            slot="next"
                            className="mg-button mg-button-primary mg-button-outline"
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
              </div>
              <div className="aria-crud-actions">
                <Button
                  className="mg-button mg-button-primary mg-button-outline"
                  onPress={onClose}
                  type="button"
                >
                  Cancel
                </Button>
                <Button className="mg-button mg-button-primary" type="submit">
                  {' '}
                  {item ? 'Save' : 'Add'}{' '}
                </Button>
              </div>
            </Form>
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
                  className="mg-button mg-button-primary mg-button-outline"
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
  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
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
    setSelected(current => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
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
        <SearchField
          className="mg-search__input-wrapper"
          aria-label="Search events"
          value={search}
          onChange={value => {
            setSearch(value);
            setPage(1);
          }}
        >
          <Input
            className="mg-search__input"
            placeholder="Search hazardous events"
          />
          {search && (
            <Button
              slot="clear"
              className="mg-button mg-button-primary mg-button-outline"
              aria-label="Clear search"
            >
              ×
            </Button>
          )}
        </SearchField>
        <DialogTrigger>
          <TooltipTrigger>
            <Button className="mg-button mg-button-primary mg-button-outline">
              Filters{filterCount ? ` (${filterCount})` : ''}
            </Button>
            <Tooltip>Filters</Tooltip>
          </TooltipTrigger>
          <Popover>
            <Dialog>
              <Heading slot="title">Filters</Heading>
              {filterCount > 0 && (
                <Button
                  className="mg-button mg-button-primary mg-button-outline"
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
          <TooltipTrigger>
            <Button
              className="mg-button mg-button-primary mg-button-outline"
              aria-label="Columns"
            >
              Columns
            </Button>
            <Tooltip>Choose visible columns</Tooltip>
          </TooltipTrigger>
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
        <TooltipTrigger>
          <Button
            className="mg-button mg-button-primary"
            aria-label="Add event"
            onPress={() => setEditing({})}
          >
            +
          </Button>
          <Tooltip>Add event</Tooltip>
        </TooltipTrigger>
      </div>
      <ResizableTableContainer className="aria-spike-table-scroll mg-u-responsive--show-large">
        <Table
          aria-label="Hazardous events"
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={keys =>
            setSelected(
              keys === 'all' ? new Set(pageItems.map(item => item.id)) : keys
            )
          }
          sortDescriptor={sort}
          onSortChange={descriptor => {
            setSort(descriptor);
            setPage(1);
          }}
        >
          <TableHeader>
            <Column
              id="selection"
              width={40}
              minWidth={40}
              maxWidth={40}
              className="react-aria-Column aria-crud-selection-column"
            >
              <Checkbox slot="selection" aria-label="Select all" />
            </Column>
            <Column
              id="favorite"
              width={40}
              minWidth={40}
              maxWidth={40}
              aria-label="Favorite"
              className="react-aria-Column aria-crud-favorite-column"
            />
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
            <Column id="actions" width={64} aria-label="Actions" />
          </TableHeader>
          <TableBody
            items={pageItems}
            dependencies={[visibleColumns]}
            renderEmptyState={() => 'No results. Try changing the filters.'}
          >
            {item => (
              <Row
                className={
                  selected.has(item.id) ? 'aria-spike-row-selected' : undefined
                }
              >
                <Cell className="react-aria-Cell aria-crud-selection-cell">
                  <Checkbox
                    slot="selection"
                    aria-label={`Select ${item.hazard}`}
                  />
                </Cell>
                <Cell className="react-aria-Cell aria-crud-favorite-cell">
                  <ToggleButton
                    className="mg-button mg-button-primary mg-button-outline aria-crud-favorite-button"
                    aria-label={`Favorite ${item.hazard}`}
                    isSelected={item.favorite}
                    onChange={() => toggleFavorite(item.id)}
                  >
                    {item.favorite ? '★' : '☆'}
                  </ToggleButton>
                </Cell>
                {columns.map(column => (
                  <Cell key={column.id}>
                    {column.id === 'hazard' ? (
                      <div className="aria-crud-event-identity">
                        {item.image && <img alt="" src={item.image} />}
                        <span>
                          <strong>{item.hazard}</strong>
                          {item.note && <small>{item.note}</small>}
                        </span>
                      </div>
                    ) : (
                      item[column.id]
                    )}
                  </Cell>
                ))}
                <Cell>
                  <MenuTrigger>
                    <Button
                      className="mg-button mg-button-primary mg-button-outline"
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
                  className="mg-button mg-button-primary mg-button-outline aria-crud-favorite-button"
                  aria-label={`Favorite ${item.hazard}`}
                  isSelected={item.favorite}
                  onChange={() => toggleFavorite(item.id)}
                >
                  {item.favorite ? '★' : '☆'}
                </ToggleButton>
                <div className="aria-crud-event-identity">
                  {item.image && <img alt="" src={item.image} />}
                  <span>
                    <strong>{item.hazard}</strong>
                    {item.note && <small>{item.note}</small>}
                    <small>{item.status}</small>
                  </span>
                </div>
              </div>
              <div>
                <span className="mg-tag mg-tag--outline">{item.cycle}</span>
                <span className="mg-tag mg-tag--outline">{item.sunlight}</span>
                <MenuTrigger>
                  <Button
                    className="mg-button mg-button-primary mg-button-outline"
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
                      <MenuItem id="delete" onAction={() => setDeleting(item)}>
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

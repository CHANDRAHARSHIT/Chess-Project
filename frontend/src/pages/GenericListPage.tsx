import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Settings, SlidersHorizontal } from "lucide-react";
import "./GenericListPage.css";

// ══════════════════════════════════════════════════════════════════════════════
// TypeScript Types & Interfaces
// ══════════════════════════════════════════════════════════════════════════════

export interface GenericListColumn<T = unknown> {
  key?: string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  isPrimary?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface GenericListQuickAction1 {
  label: string;
  enabled?: boolean;
}

export interface GenericListQuickAction2 {
  enabled?: boolean;
  active?: boolean;
}

export interface GenericListRow {
  id: string | number;
  columns: (string | number | React.ReactNode)[];
  quickAction1?: GenericListQuickAction1;
  quickAction2?: GenericListQuickAction2;
  [key: string]: unknown;
}

export interface GenericListRowActions {
  editLabel?: string;
  duplicateLabel?: string;
  deleteLabel?: string;
  enableEdit?: boolean;
  enableDuplicate?: boolean;
  enableDelete?: boolean;
}

export interface GenericListPagination {
  currentPage: number;
  totalPages: number;
  startItem?: number;
  endItem?: number;
  totalItems?: number;
  previousText?: string;
  nextText?: string;
}

export interface GenericListHeaderControls {
  searchText?: string;
  genericButton1Text?: string;
  filterPopupText?: string;
  showTitleText?: string;
  hideTitleText?: string;
}

export interface GenericListPageProps<T extends GenericListRow = GenericListRow> {
  pageTitle?: string;
  defaultShowTitle?: boolean;

  // Header Control Flags
  enableAdd?: boolean;
  enableSearch?: boolean;
  enableGenericButton1?: boolean;
  enableFilter?: boolean;
  enableSettings?: boolean;

  headerControls?: GenericListHeaderControls;

  // Column & Row definitions
  columns?: (string | GenericListColumn<T>)[];
  headers?: string[]; // Backwards-compatible shorthand matching prototype
  rows?: T[];

  // Action column labels
  quickAction1Header?: string;
  quickAction2Header?: string;
  rowActions?: GenericListRowActions;

  // Pagination configuration
  pagination?: GenericListPagination;

  // Hover view overlay text
  viewOverlayText?: string;
  enableViewOverlay?: boolean;

  // Callbacks
  onAdd?: () => void;
  onSearchChange?: (query: string) => void;
  onGenericButton1Click?: () => void;
  onFilterClick?: () => void;
  onQuickAction1?: (row: T, index: number) => void;
  onQuickAction2Toggle?: (row: T, active: boolean, index: number) => void;
  onEditRow?: (row: T, index: number) => void;
  onDuplicateRow?: (row: T, index: number) => void;
  onDeleteRow?: (row: T, index: number) => void;
  onRowClick?: (row: T, index: number) => void;
  onPageChange?: (page: number) => void;

  // Custom filter popup content
  filterContent?: React.ReactNode;

  emptyMessage?: string;
  className?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Default Prototype Reference Data ($data)
// ══════════════════════════════════════════════════════════════════════════════

const DEFAULT_PROTOTYPE_DATA = {
  pageTitle: "The Page Title",
  enableAdd: true,
  enableSearch: true,
  enableGenericButton1: true,
  enableFilter: true,
  enableSettings: true,
  headerControls: {
    searchText: "Coming soon",
    genericButton1Text: "Generic Button 1",
    filterPopupText: "Coming soon",
    showTitleText: "Show Title",
    hideTitleText: "Hide Title",
  },
  headers: [
    "COLUMN 1",
    "COLUMN 2",
    "COLUMN 3",
    "COLUMN 4",
    "COLUMN 5",
  ],
  quickAction1Header: "QUICK ACTION 1",
  quickAction2Header: "QUICK ACTION 2",
  rows: [
    {
      id: 1,
      columns: ["Example value 1", "Example value 2", "Example value 3", "Example value 4", "Example value 5"],
      quickAction1: { label: "Action 1", enabled: true },
      quickAction2: { enabled: true, active: false },
    },
    {
      id: 2,
      columns: ["Example value 6", "Example value 7", "Example value 8", "Example value 9", "Example value 10"],
      quickAction1: { label: "Action 1", enabled: true },
      quickAction2: { enabled: true, active: true },
    },
    {
      id: 3,
      columns: ["Example value 11", "Example value 12", "Example value 13", "Example value 14", "Example value 15"],
      quickAction1: { label: "Action 1", enabled: true },
      quickAction2: { enabled: true, active: false },
    },
    {
      id: 4,
      columns: ["Example value 16", "Example value 17", "Example value 18", "Example value 19", "Example value 20"],
      quickAction1: { label: "Action 1", enabled: true },
      quickAction2: { enabled: true, active: true },
    },
    {
      id: 5,
      columns: ["Example value 21", "Example value 22", "Example value 23", "Example value 24", "Example value 25"],
      quickAction1: { label: "Action 1", enabled: true },
      quickAction2: { enabled: true, active: false },
    },
  ],
  rowActions: {
    editLabel: "Edit",
    duplicateLabel: "Duplicate",
    deleteLabel: "Delete",
    enableEdit: true,
    enableDuplicate: true,
    enableDelete: true,
  },
  pagination: {
    currentPage: 1,
    totalPages: 5,
    startItem: 1,
    endItem: 5,
    totalItems: 24,
    previousText: "Previous",
    nextText: "Next",
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// Component Implementation
// ══════════════════════════════════════════════════════════════════════════════

export function GenericListPage<T extends GenericListRow = GenericListRow>({
  pageTitle = DEFAULT_PROTOTYPE_DATA.pageTitle,
  defaultShowTitle = false,
  enableAdd = DEFAULT_PROTOTYPE_DATA.enableAdd,
  enableSearch = DEFAULT_PROTOTYPE_DATA.enableSearch,
  enableGenericButton1 = DEFAULT_PROTOTYPE_DATA.enableGenericButton1,
  enableFilter = DEFAULT_PROTOTYPE_DATA.enableFilter,
  enableSettings = DEFAULT_PROTOTYPE_DATA.enableSettings,
  headerControls = DEFAULT_PROTOTYPE_DATA.headerControls,
  columns,
  headers,
  rows = DEFAULT_PROTOTYPE_DATA.rows as unknown as T[],
  quickAction1Header = DEFAULT_PROTOTYPE_DATA.quickAction1Header,
  quickAction2Header = DEFAULT_PROTOTYPE_DATA.quickAction2Header,
  rowActions = DEFAULT_PROTOTYPE_DATA.rowActions,
  pagination = DEFAULT_PROTOTYPE_DATA.pagination,
  viewOverlayText = "View",
  enableViewOverlay = true,
  onAdd,
  onSearchChange,
  onGenericButton1Click,
  onFilterClick,
  onQuickAction1,
  onQuickAction2Toggle,
  onEditRow,
  onDuplicateRow,
  onDeleteRow,
  onRowClick,
  onPageChange,
  filterContent,
  emptyMessage = "No items found.",
  className = "",
}: GenericListPageProps<T>) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [showTitle, setShowTitle] = useState<boolean>(defaultShowTitle);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // User overrides for QuickAction2 switches
  const [switchOverrides, setSwitchOverrides] = useState<Record<string | number, boolean>>({});

  // Refs for click-outside detection
  const settingsWrapRef = useRef<HTMLDivElement>(null);
  const filterWrapRef = useRef<HTMLDivElement>(null);
  const tablePanelRef = useRef<HTMLDivElement>(null);

  // ── Click Outside & Keyboard Listeners ─────────────────────────────────────
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node;

      // Close settings menu if clicked outside
      if (settingsWrapRef.current && !settingsWrapRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }

      // Close filter popup if clicked outside
      if (filterWrapRef.current && !filterWrapRef.current.contains(target)) {
        setIsFilterOpen(false);
      }

      // Close row action menu if clicked outside
      if (tablePanelRef.current && !tablePanelRef.current.contains(target)) {
        setActiveMenuRowId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsOpen(false);
        setIsFilterOpen(false);
        setActiveMenuRowId(null);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ── Normalized Columns ─────────────────────────────────────────────────────
  const normalizedColumns = useMemo<GenericListColumn<T>[]>(() => {
    const sourceCols = columns || headers || DEFAULT_PROTOTYPE_DATA.headers;
    return sourceCols.map((col, index) => {
      if (typeof col === "string") {
        return {
          header: col,
          isPrimary: index === 0,
        };
      }
      return {
        ...col,
        isPrimary: col.isPrimary ?? index === 0,
      };
    });
  }, [columns, headers]);

  // Determine presence of action columns across rows
  const hasQuickAction1 = useMemo(() => rows.some((r) => r.quickAction1 !== undefined), [rows]);
  const hasQuickAction2 = useMemo(() => rows.some((r) => r.quickAction2 !== undefined), [rows]);
  const hasRowActions = useMemo(
    () =>
      rowActions?.enableEdit !== false ||
      rowActions?.enableDuplicate !== false ||
      rowActions?.enableDelete !== false,
    [rowActions]
  );

  // Computed CSS Grid template
  const gridTemplateColumns = useMemo(() => {
    const colDefinitions = normalizedColumns.map((c, idx) => {
      if (c.width) return c.width;
      return idx === 0 ? "minmax(170px, 1.3fr)" : "minmax(150px, 1fr)";
    });

    if (hasQuickAction1) colDefinitions.push("130px");
    if (hasQuickAction2) colDefinitions.push("130px");
    if (hasRowActions) colDefinitions.push("56px");

    return colDefinitions.join(" ");
  }, [normalizedColumns, hasQuickAction1, hasQuickAction2, hasRowActions]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleToggleTitle = useCallback(() => {
    setShowTitle((prev) => !prev);
  }, []);

  const handleSwitchToggle = useCallback(
    (e: React.MouseEvent, row: T, index: number) => {
      e.stopPropagation();
      const current = switchOverrides[row.id] ?? Boolean(row.quickAction2?.active);
      const next = !current;
      setSwitchOverrides((prev) => ({ ...prev, [row.id]: next }));
      onQuickAction2Toggle?.(row, next, index);
    },
    [switchOverrides, onQuickAction2Toggle]
  );

  const handleRowMenuToggle = useCallback((e: React.MouseEvent, rowId: string | number) => {
    e.stopPropagation();
    setActiveMenuRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  const activeCurrentPage = pagination?.currentPage ?? 1;
  const activeTotalPages = pagination?.totalPages ?? 1;
  const pageNumbers = Array.from({ length: activeTotalPages }, (_, i) => i + 1);

  return (
    <div className={`generic-list-root ${className}`}>
      {/* ── Header Section ─────────────────────────────────────────────────── */}
      <section className="generic-list-header" aria-label="Page controls">
        <h1 className={`generic-list-title ${showTitle ? "show" : ""}`}>
          {pageTitle}
        </h1>

        <div className="generic-list-header-row">
          {/* Left Controls */}
          <div className="generic-list-header-left">
            <button
              type="button"
              className="generic-list-add-btn"
              aria-label="Add new item"
              disabled={!enableAdd}
              onClick={onAdd}
            >
              +
            </button>

            {enableSearch && (
              <div className="generic-list-search-box" aria-label="Search">
                <svg
                  className="generic-list-search-icon shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M16.5 16.5L21 21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {onSearchChange ? (
                  <>
                    <input
                      type="text"
                      value={searchQuery}
                      placeholder={headerControls?.searchText || "Search..."}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        onSearchChange(e.target.value);
                      }}
                      className="w-full bg-transparent border-none outline-none text-sm text-[var(--gl-text)] placeholder:text-[var(--gl-muted)]"
                      aria-label="Search"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          onSearchChange("");
                        }}
                        className="p-1 text-[var(--gl-muted)] hover:text-[var(--gl-text)] rounded-md transition-colors cursor-pointer shrink-0"
                        aria-label="Clear search"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </>
                ) : (
                  <span>{headerControls?.searchText || "Coming soon"}</span>
                )}
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="generic-list-header-right">
            {enableGenericButton1 && (
              <button
                type="button"
                className="generic-list-generic-btn"
                onClick={onGenericButton1Click}
              >
                {headerControls?.genericButton1Text || "Generic Button 1"}
              </button>
            )}

            {enableFilter && (
              <div className="generic-list-wrap" ref={filterWrapRef}>
                <button
                  type="button"
                  className="generic-list-icon-btn"
                  aria-label="Filter"
                  aria-expanded={isFilterOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFilterOpen((prev) => !prev);
                    onFilterClick?.();
                  }}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <div className={`generic-list-filter-popup ${isFilterOpen ? "open" : ""}`}>
                  {filterContent || headerControls?.filterPopupText || "Coming soon"}
                </div>
              </div>
            )}

            {enableSettings && (
              <div className="generic-list-wrap" ref={settingsWrapRef}>
                <button
                  type="button"
                  className="generic-list-icon-btn"
                  aria-label="Page settings"
                  aria-expanded={isSettingsOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSettingsOpen((prev) => !prev);
                  }}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <div className={`generic-list-settings-menu ${isSettingsOpen ? "open" : ""}`}>
                  <button type="button" onClick={handleToggleTitle}>
                    {showTitle
                      ? headerControls?.hideTitleText || "Hide Title"
                      : headerControls?.showTitleText || "Show Title"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Table Panel ─────────────────────────────────────────────────────── */}
      <section
        className="generic-list-panel"
        aria-label="List Table"
        ref={tablePanelRef}
      >
        {/* Table Head */}
        <div
          className="generic-list-table-head"
          style={{ gridTemplateColumns }}
        >
          {normalizedColumns.map((col, idx) => (
            <div
              key={`head-${col.key || idx}`}
              style={{ textAlign: col.align || "left" }}
            >
              {col.header}
            </div>
          ))}
          {hasQuickAction1 && <div>{quickAction1Header}</div>}
          {hasQuickAction2 && <div>{quickAction2Header}</div>}
          {hasRowActions && <div />}
        </div>

        {/* Table Body */}
        <div className="generic-list-table-body">
          {rows.length === 0 ? (
            <div className="generic-list-empty">
              {emptyMessage?.toLowerCase().includes("loading") ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--gl-accent)]/30 border-t-[var(--gl-accent)] animate-spin" />
                  <span className="text-sm font-medium text-[var(--gl-muted)]">Loading records…</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 gap-2 text-center select-none">
                  <div className="w-14 h-14 rounded-2xl bg-brand-surface/80 border border-brand-border flex items-center justify-center text-[var(--gl-accent)] mb-3">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-[var(--gl-text)] tracking-tight">
                    {emptyMessage || "No records found"}
                  </h3>
                  <p className="text-xs text-[var(--gl-muted)] max-w-sm leading-relaxed">
                    There are no documents or entries currently available in this repository.
                  </p>
                </div>
              )}
            </div>
          ) : (
            rows.map((row, rowIndex) => {
              const isMenuOpen = activeMenuRowId === row.id;
              const isSwitchActive =
                switchOverrides[row.id] ?? Boolean(row.quickAction2?.active);

              return (
                <article
                  key={row.id}
                  className="generic-list-table-row"
                  style={{ gridTemplateColumns }}
                  data-view-label={enableViewOverlay ? viewOverlayText : ""}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {/* Dynamic Data Cells */}
                  {normalizedColumns.map((col, colIndex) => {
                    const rawValue =
                      col.key && row[col.key] !== undefined
                        ? row[col.key]
                        : row.columns[colIndex];
                    const content = col.render
                      ? col.render(rawValue, row, rowIndex)
                      : (rawValue as React.ReactNode);

                    return (
                      <div
                        key={`cell-${row.id}-${col.key || colIndex}`}
                        className={`generic-list-cell ${col.isPrimary ? "primary" : ""}`}
                        style={{ textAlign: col.align || "left" }}
                      >
                        {content}
                      </div>
                    );
                  })}

                  {/* Quick Action 1 Button */}
                  {hasQuickAction1 && (
                    <div>
                      {row.quickAction1 ? (
                        <button
                          type="button"
                          className="generic-list-quick-action"
                          disabled={row.quickAction1.enabled === false}
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickAction1?.(row, rowIndex);
                          }}
                        >
                          {row.quickAction1.label}
                        </button>
                      ) : null}
                    </div>
                  )}

                  {/* Quick Action 2 Toggle Switch */}
                  {hasQuickAction2 && (
                    <div>
                      {row.quickAction2 ? (
                        <button
                          type="button"
                          className={`generic-list-switch ${isSwitchActive ? "on" : ""}`}
                          aria-label={`Toggle status for row ${row.id}`}
                          aria-pressed={isSwitchActive}
                          disabled={row.quickAction2.enabled === false}
                          onClick={(e) => handleSwitchToggle(e, row, rowIndex)}
                        />
                      ) : null}
                    </div>
                  )}

                  {/* 3-Dots Row Action Menu */}
                  {hasRowActions && (
                    <div className="generic-list-actions">
                      <button
                        type="button"
                        className="generic-list-more-btn"
                        aria-label="More actions"
                        aria-expanded={isMenuOpen}
                        onClick={(e) => handleRowMenuToggle(e, row.id)}
                      >
                        ⋯
                      </button>

                      <div className={`generic-list-row-menu ${isMenuOpen ? "open" : ""}`}>
                        {rowActions?.enableEdit !== false && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuRowId(null);
                              onEditRow?.(row, rowIndex);
                            }}
                          >
                            <span className="generic-list-menu-icon">✎</span>
                            {rowActions?.editLabel || "Edit"}
                          </button>
                        )}

                        {rowActions?.enableDuplicate !== false && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuRowId(null);
                              onDuplicateRow?.(row, rowIndex);
                            }}
                          >
                            <span className="generic-list-menu-icon">⧉</span>
                            {rowActions?.duplicateLabel || "Duplicate"}
                          </button>
                        )}

                        {rowActions?.enableDelete !== false && (
                          <button
                            type="button"
                            className="delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuRowId(null);
                              onDeleteRow?.(row, rowIndex);
                            }}
                          >
                            <span className="generic-list-menu-icon">⌫</span>
                            {rowActions?.deleteLabel || "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {pagination && (
        <nav className="generic-list-pagination" aria-label="Table pagination">
          <div className="generic-list-pagination-info">
            {pagination.totalItems !== undefined
              ? `Showing ${pagination.startItem ?? 1}–${pagination.endItem ?? rows.length} of ${pagination.totalItems} items`
              : `Page ${activeCurrentPage} of ${activeTotalPages}`}
          </div>

          <div className="generic-list-pagination-controls">
            <button
              type="button"
              className="generic-list-page-btn"
              disabled={activeCurrentPage <= 1}
              onClick={() => onPageChange?.(activeCurrentPage - 1)}
            >
              {pagination.previousText || "Previous"}
            </button>

            {pageNumbers.map((page) => (
              <button
                key={`page-${page}`}
                type="button"
                className={`generic-list-page-btn ${page === activeCurrentPage ? "active" : ""}`}
                aria-current={page === activeCurrentPage ? "page" : undefined}
                onClick={() => onPageChange?.(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="generic-list-page-btn"
              disabled={activeCurrentPage >= activeTotalPages}
              onClick={() => onPageChange?.(activeCurrentPage + 1)}
            >
              {pagination.nextText || "Next"}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default GenericListPage;

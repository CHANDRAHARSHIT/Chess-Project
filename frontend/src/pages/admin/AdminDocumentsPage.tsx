import React, { useEffect, useState } from "react";
import { GenericListPage, type GenericListRow } from "@/pages/GenericListPage";
import { adminApi } from "@/features/admin/adminApi";

type AdminDocument = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
  author: { name: string | null; email: string } | null;
};

type DocumentList = {
  documents: AdminDocument[];
  total: number;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 20;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function renderStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "PUBLISHED" || s === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
        Published
      </span>
    );
  }
  if (s === "DRAFT" || s === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
        Draft
      </span>
    );
  }
  if (s === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
        Archived
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-brand-secondary">
      {status}
    </span>
  );
}

function renderAuthorCell(author: { name: string | null; email: string } | null) {
  if (!author) {
    return <span className="text-brand-secondary text-sm">—</span>;
  }
  const name = author.name || author.email;
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <div className="flex items-center gap-2 max-w-[180px]">
      <div className="w-6 h-6 rounded-full bg-brand-accent/15 border border-brand-accent/30 text-brand-accent text-[11px] font-bold flex items-center justify-center shrink-0">
        {initial}
      </div>
      <span className="truncate text-sm text-brand-text font-medium" title={name}>
        {name}
      </span>
    </div>
  );
}

export const AdminDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Bumped after a delete to re-run the effect for the same page.
  const [reloadToken, setReloadToken] = useState(0);

  // Loading is derived from which request has landed, rather than set at the
  // top of the effect — setting state synchronously in an effect is a lint error
  // and an extra render.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const requestKey = `${page}:${reloadToken}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    adminApi<DocumentList>(`/documents?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`)
      .then((data) => {
        if (cancelled) return;

        // Deleting the last row of a page leaves it empty; step back rather
        // than stranding the admin on a blank page.
        if (data.documents.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }

        setDocuments(data.documents);
        setTotal(data.total);
        setError(null);
        setLoadedKey(`${page}:${reloadToken}`);
      })
      .catch(() => {
        if (cancelled) return;
        setDocuments([]);
        setTotal(0);
        setError("Could not load documents.");
        setLoadedKey(`${page}:${reloadToken}`);
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadToken]);

  const handleDelete = async (row: GenericListRow) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      await adminApi(`/documents/${row.id}`, { method: "DELETE" });
      setReloadToken((token) => token + 1);
    } catch {
      setError("Could not delete the document.");
    }
  };

  const rows: GenericListRow[] = documents.map((document) => ({
    id: document.id,
    columns: [
      <span key="title" className="font-semibold text-brand-text hover:text-brand-accent transition-colors">
        {document.title}
      </span>,
      <span
        key="slug"
        className="font-mono text-xs text-brand-secondary bg-brand-bg/60 border border-brand-border/50 px-2 py-1 rounded-md truncate inline-block max-w-[190px]"
        title={document.slug}
      >
        {document.slug}
      </span>,
      renderStatusBadge(document.status),
      renderAuthorCell(document.author),
      <span key="updated" className="text-xs font-mono text-brand-secondary">
        {formatDate(document.updatedAt)}
      </span>,
    ],
  }));

  return (
    <GenericListPage
      pageTitle="Documentation"
      headers={["TITLE", "SLUG", "STATUS", "AUTHOR", "UPDATED"]}
      rows={rows}
      emptyMessage={isLoading ? "Loading…" : (error ?? "No documents yet.")}
      // No create or edit screens in this scope, and no detail view to open.
      enableAdd={false}
      enableGenericButton1={false}
      enableViewOverlay={false}
      rowActions={{ enableEdit: false, enableDuplicate: false, enableDelete: true }}
      onDeleteRow={handleDelete}
      pagination={{
        currentPage: page,
        // GenericListPage derives its page buttons from totalPages, so an empty
        // result must still report one page.
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        startItem: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
        endItem: (page - 1) * PAGE_SIZE + documents.length,
        totalItems: total,
      }}
      onPageChange={setPage}
    />
  );
};

export default AdminDocumentsPage;

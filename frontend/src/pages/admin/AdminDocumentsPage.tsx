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
      document.title,
      document.slug,
      document.status,
      document.author?.name ?? document.author?.email ?? "—",
      formatDate(document.updatedAt),
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

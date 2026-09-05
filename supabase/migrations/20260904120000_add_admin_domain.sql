-- Migration: add_admin_domain
-- Adds the admin portal domain: admin identity + Auth.js session storage,
-- DB-driven navigation, and soft-deletable documents.
--
-- Isolation: no foreign key in this file references a user-facing table, and no
-- user-facing table is altered. An admin is never a player row. Do not add a
-- foreign key between the two sides.
--
-- Access: these tables are reached only by the backend (service_role / owner
-- connection). RLS is enabled and every table carries an explicit deny-all
-- policy for anon and authenticated, matching the "VerificationToken" precedent.

-- ── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE public."AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VIEWER');
CREATE TYPE public."DocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE public."AdminUser" (
  id            text                           NOT NULL,
  email         text                           NOT NULL,
  name          text,
  "avatarUrl"   text,
  role          public."AdminRole"             DEFAULT 'ADMIN' NOT NULL,
  "isActive"    boolean                        DEFAULT true NOT NULL,
  "lastLoginAt" timestamp(3) without time zone,
  "createdAt"   timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"   timestamp(3) without time zone NOT NULL
);

CREATE TABLE public."AdminAccount" (
  id                  text NOT NULL,
  "adminUserId"       text NOT NULL,
  type                text NOT NULL,
  provider            text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token       text,
  access_token        text,
  expires_at          integer,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text
);

CREATE TABLE public."AdminSession" (
  id             text                           NOT NULL,
  "sessionToken" text                           NOT NULL,
  "adminUserId"  text                           NOT NULL,
  expires        timestamp(3) without time zone NOT NULL
);

CREATE TABLE public."AdminVerificationToken" (
  identifier text                           NOT NULL,
  token      text                           NOT NULL,
  expires    timestamp(3) without time zone NOT NULL
);

-- Self-referencing tree. A NULL "path" is a heading (e.g. "ACS"); a row with a
-- path is a link. "key" is the stable seed identity — never the label.
CREATE TABLE public."AdminNavItem" (
  id            text                           NOT NULL,
  key           text                           NOT NULL,
  label         text                           NOT NULL,
  path          text,
  icon          text,
  "parentId"    text,
  "sortOrder"   integer                        DEFAULT 0 NOT NULL,
  "isDisabled"  boolean                        DEFAULT false NOT NULL,
  "isUniversal" boolean                        DEFAULT false NOT NULL,
  "createdAt"   timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"   timestamp(3) without time zone NOT NULL
);

CREATE TABLE public."AdminUserNavItem" (
  id            text                           NOT NULL,
  "adminUserId" text                           NOT NULL,
  "navItemId"   text                           NOT NULL,
  "createdAt"   timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public."AdminDocument" (
  id            text                           NOT NULL,
  title         text                           NOT NULL,
  slug          text                           NOT NULL,
  description   text,
  content       text,
  status        public."DocumentStatus"        DEFAULT 'DRAFT' NOT NULL,
  "authorId"    text,
  "deletedAt"   timestamp(3) without time zone,
  "deletedById" text,
  "createdAt"   timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"   timestamp(3) without time zone NOT NULL
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public."AdminUser"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminAccount"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminSession"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminNavItem"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminUserNavItem"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminDocument"          ENABLE ROW LEVEL SECURITY;

-- ── Primary Keys ────────────────────────────────────────────────────────────

ALTER TABLE public."AdminUser"
  ADD CONSTRAINT "AdminUser_pkey" PRIMARY KEY (id);

ALTER TABLE public."AdminAccount"
  ADD CONSTRAINT "AdminAccount_pkey" PRIMARY KEY (id);

ALTER TABLE public."AdminSession"
  ADD CONSTRAINT "AdminSession_pkey" PRIMARY KEY (id);

ALTER TABLE public."AdminNavItem"
  ADD CONSTRAINT "AdminNavItem_pkey" PRIMARY KEY (id);

ALTER TABLE public."AdminUserNavItem"
  ADD CONSTRAINT "AdminUserNavItem_pkey" PRIMARY KEY (id);

ALTER TABLE public."AdminDocument"
  ADD CONSTRAINT "AdminDocument_pkey" PRIMARY KEY (id);

-- ── Foreign Keys (all internal to the admin domain) ─────────────────────────

ALTER TABLE public."AdminAccount"
  ADD CONSTRAINT "AdminAccount_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES public."AdminUser"(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."AdminSession"
  ADD CONSTRAINT "AdminSession_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES public."AdminUser"(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."AdminNavItem"
  ADD CONSTRAINT "AdminNavItem_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES public."AdminNavItem"(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."AdminUserNavItem"
  ADD CONSTRAINT "AdminUserNavItem_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES public."AdminUser"(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."AdminUserNavItem"
  ADD CONSTRAINT "AdminUserNavItem_navItemId_fkey"
  FOREIGN KEY ("navItemId") REFERENCES public."AdminNavItem"(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."AdminDocument"
  ADD CONSTRAINT "AdminDocument_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES public."AdminUser"(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "AdminUser_email_key" ON public."AdminUser" (email);

CREATE UNIQUE INDEX "AdminAccount_provider_providerAccountId_key" ON public."AdminAccount" (provider, "providerAccountId");
CREATE INDEX "AdminAccount_adminUserId_idx" ON public."AdminAccount" ("adminUserId");

CREATE UNIQUE INDEX "AdminSession_sessionToken_key" ON public."AdminSession" ("sessionToken");
CREATE INDEX "AdminSession_adminUserId_idx" ON public."AdminSession" ("adminUserId");

CREATE UNIQUE INDEX "AdminVerificationToken_token_key" ON public."AdminVerificationToken" (token);
CREATE UNIQUE INDEX "AdminVerificationToken_identifier_token_key" ON public."AdminVerificationToken" (identifier, token);

CREATE UNIQUE INDEX "AdminNavItem_key_key" ON public."AdminNavItem" (key);
CREATE INDEX "AdminNavItem_parentId_sortOrder_idx" ON public."AdminNavItem" ("parentId", "sortOrder");

CREATE UNIQUE INDEX "AdminUserNavItem_adminUserId_navItemId_key" ON public."AdminUserNavItem" ("adminUserId", "navItemId");
CREATE INDEX "AdminUserNavItem_navItemId_idx" ON public."AdminUserNavItem" ("navItemId");

CREATE INDEX "AdminDocument_deletedAt_createdAt_idx" ON public."AdminDocument" ("deletedAt", "createdAt");
CREATE INDEX "AdminDocument_status_idx" ON public."AdminDocument" (status);
CREATE INDEX "AdminDocument_authorId_idx" ON public."AdminDocument" ("authorId");

-- Slug is unique among live documents only, so soft-deleting a document releases
-- its slug instead of burning it forever. Prisma cannot express a partial unique
-- index, so this constraint exists in SQL alone — schema.prisma must NOT gain a
-- @unique on AdminDocument.slug.
CREATE UNIQUE INDEX "AdminDocument_slug_active_key"
  ON public."AdminDocument" (slug) WHERE "deletedAt" IS NULL;

-- ── Grants ──────────────────────────────────────────────────────────────────

GRANT ALL ON public."AdminUser" TO anon;
GRANT ALL ON public."AdminUser" TO authenticated;
GRANT ALL ON public."AdminUser" TO service_role;

GRANT ALL ON public."AdminAccount" TO anon;
GRANT ALL ON public."AdminAccount" TO authenticated;
GRANT ALL ON public."AdminAccount" TO service_role;

GRANT ALL ON public."AdminSession" TO anon;
GRANT ALL ON public."AdminSession" TO authenticated;
GRANT ALL ON public."AdminSession" TO service_role;

GRANT ALL ON public."AdminVerificationToken" TO anon;
GRANT ALL ON public."AdminVerificationToken" TO authenticated;
GRANT ALL ON public."AdminVerificationToken" TO service_role;

GRANT ALL ON public."AdminNavItem" TO anon;
GRANT ALL ON public."AdminNavItem" TO authenticated;
GRANT ALL ON public."AdminNavItem" TO service_role;

GRANT ALL ON public."AdminUserNavItem" TO anon;
GRANT ALL ON public."AdminUserNavItem" TO authenticated;
GRANT ALL ON public."AdminUserNavItem" TO service_role;

GRANT ALL ON public."AdminDocument" TO anon;
GRANT ALL ON public."AdminDocument" TO authenticated;
GRANT ALL ON public."AdminDocument" TO service_role;

-- ── Deny-all client policies ────────────────────────────────────────────────
-- The admin portal is served by the backend only. No PostgREST client — anon or
-- authenticated — may read or write these tables. RLS is already enabled above;
-- these explicit policies make the intent visible in Studio rather than implied
-- by the absence of a policy.

CREATE POLICY "No client access to admin users" ON public."AdminUser"
  TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "No client access to admin accounts" ON public."AdminAccount"
  TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "No client access to admin sessions" ON public."AdminSession"
  TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "No client access to admin verification tokens" ON public."AdminVerificationToken"
  TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "No client access to admin nav items" ON public."AdminNavItem"
  TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "No client access to admin nav grants" ON public."AdminUserNavItem"
  TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "No client access to admin documents" ON public."AdminDocument"
  TO anon, authenticated USING (false) WITH CHECK (false);

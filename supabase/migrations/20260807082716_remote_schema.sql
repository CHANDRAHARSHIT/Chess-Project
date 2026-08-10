-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TYPE public."PaymentStatus" AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE public."SubscriptionStatus" AS ENUM (
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED'
);

CREATE TABLE public._prisma_migrations (
  id                  character varying(36)    NOT NULL,
  checksum            character varying(64)    NOT NULL,
  finished_at         timestamp with time zone,
  migration_name      character varying(255)   NOT NULL,
  logs                text,
  rolled_back_at      timestamp with time zone,
  started_at          timestamp with time zone DEFAULT now() NOT NULL,
  applied_steps_count integer                  DEFAULT 0 NOT NULL
);

ALTER TABLE public._prisma_migrations
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public._prisma_migrations
  ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);

GRANT ALL ON public._prisma_migrations TO anon;

GRANT ALL ON public._prisma_migrations TO authenticated;

GRANT ALL ON public._prisma_migrations TO service_role;

CREATE POLICY "No client access to prisma migrations" ON public._prisma_migrations
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE TABLE public."Account" (
  id                  text    NOT NULL,
  "userId"            text    NOT NULL,
  type                text    NOT NULL,
  provider            text    NOT NULL,
  "providerAccountId" text    NOT NULL,
  refresh_token       text,
  access_token        text,
  expires_at          integer,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text
);

ALTER TABLE public."Account"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Account"
  ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);

GRANT ALL ON public."Account" TO anon;

GRANT ALL ON public."Account" TO authenticated;

GRANT ALL ON public."Account" TO service_role;

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" (PROVIDER, "providerAccountId");

CREATE POLICY "Users can delete own accounts" ON public."Account"
  FOR DELETE
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE POLICY "Users can insert own accounts" ON public."Account"
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can update own accounts" ON public."Account"
  FOR UPDATE
  TO authenticated
  USING (((auth.uid())::text = "userId"))
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can view own accounts" ON public."Account"
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE TABLE public."BillingProfile" (
  id             text                           NOT NULL,
  "userId"       text                           NOT NULL,
  "billingEmail" text,
  "billingName"  text,
  "addressLine1" text,
  "addressLine2" text,
  city           text,
  state          text,
  "postalCode"   text,
  country        text,
  "vatId"        text,
  "createdAt"    timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"    timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."BillingProfile"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."BillingProfile"
  ADD CONSTRAINT "BillingProfile_pkey" PRIMARY KEY (id);

GRANT ALL ON public."BillingProfile" TO anon;

GRANT ALL ON public."BillingProfile" TO authenticated;

GRANT ALL ON public."BillingProfile" TO service_role;

CREATE UNIQUE INDEX "BillingProfile_userId_key" ON public."BillingProfile" ("userId");

CREATE POLICY "Users can delete own billing profile" ON public."BillingProfile"
  FOR DELETE
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE POLICY "Users can insert own billing profile" ON public."BillingProfile"
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can update own billing profile" ON public."BillingProfile"
  FOR UPDATE
  TO authenticated
  USING (((auth.uid())::text = "userId"))
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can view own billing profile" ON public."BillingProfile"
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE TABLE public."Course" (
  id          text                           NOT NULL,
  slug        text                           NOT NULL,
  title       text                           NOT NULL,
  description text,
  thumbnail   text,
  published   boolean                        DEFAULT false NOT NULL,
  "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Course"
  ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);

GRANT ALL ON public."Course" TO anon;

GRANT ALL ON public."Course" TO authenticated;

GRANT ALL ON public."Course" TO service_role;

CREATE UNIQUE INDEX "Course_slug_key" ON public."Course" (slug);

CREATE TABLE public."CuratedPuzzle" (
  id                text                           NOT NULL,
  fen               text                           NOT NULL,
  moves             text                           NOT NULL,
  rating            integer                        NOT NULL,
  "ratingDeviation" integer                        NOT NULL,
  popularity        integer                        NOT NULL,
  "nbPlays"         integer                        NOT NULL,
  themes            text[]                         DEFAULT ARRAY[]::text[],
  "createdAt"       timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."CuratedPuzzle"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."CuratedPuzzle"
  ADD CONSTRAINT "CuratedPuzzle_pkey" PRIMARY KEY (id);

GRANT ALL ON public."CuratedPuzzle" TO anon;

GRANT ALL ON public."CuratedPuzzle" TO authenticated;

GRANT ALL ON public."CuratedPuzzle" TO service_role;

CREATE INDEX "CuratedPuzzle_rating_idx" ON public."CuratedPuzzle" (rating);

CREATE POLICY "Anyone can view curated puzzles" ON public."CuratedPuzzle"
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create puzzles" ON public."CuratedPuzzle"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update puzzles" ON public."CuratedPuzzle"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "No one can delete puzzles" ON public."CuratedPuzzle"
  FOR DELETE
  TO authenticated
  USING (false);

CREATE TABLE public."CustomLink" (
  id              text                           NOT NULL,
  "userId"        text                           NOT NULL,
  name            text                           NOT NULL,
  url             text                           NOT NULL,
  "isArchived"    boolean                        DEFAULT false NOT NULL,
  "clickCount"    integer                        DEFAULT 0 NOT NULL,
  "lastClickedAt" timestamp(3) without time zone,
  "createdAt"     timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"     timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."CustomLink"
  ADD CONSTRAINT "CustomLink_pkey" PRIMARY KEY (id);

GRANT ALL ON public."CustomLink" TO anon;

GRANT ALL ON public."CustomLink" TO authenticated;

GRANT ALL ON public."CustomLink" TO service_role;

CREATE TABLE public."Lesson" (
  id              text                           NOT NULL,
  "courseId"      text                           NOT NULL,
  slug            text                           NOT NULL,
  title           text                           NOT NULL,
  description     text,
  thumbnail       text,
  difficulty      text,
  "estimatedTime" integer                        DEFAULT 0 NOT NULL,
  category        text,
  published       boolean                        DEFAULT false NOT NULL,
  content         jsonb                          NOT NULL,
  settings        jsonb,
  "createdAt"     timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"     timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Lesson"
  ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Lesson"
  ADD CONSTRAINT "Lesson_pkey" PRIMARY KEY (id);

GRANT ALL ON public."Lesson" TO anon;

GRANT ALL ON public."Lesson" TO authenticated;

GRANT ALL ON public."Lesson" TO service_role;

CREATE UNIQUE INDEX "Lesson_slug_key" ON public."Lesson" (slug);

CREATE TABLE public."LessonProgress" (
  id            text                           NOT NULL,
  "userId"      text                           NOT NULL,
  "lessonId"    text                           NOT NULL,
  "currentStep" integer                        DEFAULT 0 NOT NULL,
  completed     boolean                        DEFAULT false NOT NULL,
  accuracy      double precision,
  mistakes      integer                        DEFAULT 0 NOT NULL,
  xp            integer                        DEFAULT 0 NOT NULL,
  "timeSpent"   integer                        DEFAULT 0 NOT NULL,
  "updatedAt"   timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."LessonProgress"
  ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES public."Lesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."LessonProgress"
  ADD CONSTRAINT "LessonProgress_pkey" PRIMARY KEY (id);

GRANT ALL ON public."LessonProgress" TO anon;

GRANT ALL ON public."LessonProgress" TO authenticated;

GRANT ALL ON public."LessonProgress" TO service_role;

CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON public."LessonProgress" ("userId", "lessonId");

CREATE TABLE public."Opening" (
  id    text NOT NULL,
  eco   text NOT NULL,
  name  text NOT NULL,
  pgn   text NOT NULL,
  moves text NOT NULL
);

ALTER TABLE public."Opening"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Opening"
  ADD CONSTRAINT "Opening_pkey" PRIMARY KEY (id);

GRANT ALL ON public."Opening" TO anon;

GRANT ALL ON public."Opening" TO authenticated;

GRANT ALL ON public."Opening" TO service_role;

CREATE INDEX "Opening_eco_idx" ON public."Opening" (eco);

CREATE INDEX "Opening_name_idx" ON public."Opening" (name);

CREATE POLICY "Anyone can view openings" ON public."Opening"
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create openings" ON public."Opening"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update openings" ON public."Opening"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "No client deletes on openings" ON public."Opening"
  FOR DELETE
  TO authenticated
  USING (false);

CREATE TABLE public."Payment" (
  id                       text                           NOT NULL,
  "userId"                 text                           NOT NULL,
  "subscriptionId"         text,
  amount                   integer                        NOT NULL,
  currency                 text                           DEFAULT 'usd'::text NOT NULL,
  status                   public."PaymentStatus"         NOT NULL,
  "paymentMethod"          text,
  "gatewayPaymentIntentId" text,
  "gatewayInvoiceId"       text,
  "receiptUrl"             text,
  "errorMessage"           text,
  provider                 text                           DEFAULT 'stripe'::text NOT NULL,
  "failureCode"            text,
  "gatewayCustomerId"      text,
  "refundedAmount"         integer                        DEFAULT 0,
  "gatewayMetadata"        jsonb,
  "createdAt"              timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"              timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Payment"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Payment"
  ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);

GRANT ALL ON public."Payment" TO anon;

GRANT ALL ON public."Payment" TO authenticated;

GRANT ALL ON public."Payment" TO service_role;

CREATE UNIQUE INDEX "Payment_gatewayPaymentIntentId_key" ON public."Payment" ("gatewayPaymentIntentId");

CREATE POLICY "No client deletes on payments" ON public."Payment"
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "No client inserts on payments" ON public."Payment"
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on payments" ON public."Payment"
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Users can view own payments" ON public."Payment"
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE TABLE public."Product" (
  id                   text                           NOT NULL,
  identifier           text                           NOT NULL,
  name                 text                           NOT NULL,
  description          text,
  "priceAmount"        integer                        NOT NULL,
  currency             text                           DEFAULT 'usd'::text NOT NULL,
  "billingInterval"    text                           NOT NULL,
  "isActive"           boolean                        DEFAULT true NOT NULL,
  "displayOrder"       integer                        DEFAULT 0 NOT NULL,
  "createdAt"          timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"          timestamp(3) without time zone NOT NULL,
  "gatewayTestPriceId" text,
  "gatewayLivePriceId" text
);

ALTER TABLE public."Product"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Product"
  ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);

GRANT ALL ON public."Product" TO anon;

GRANT ALL ON public."Product" TO authenticated;

GRANT ALL ON public."Product" TO service_role;

CREATE UNIQUE INDEX "Product_gatewayTestPriceId_key" ON public."Product" ("gatewayTestPriceId");

CREATE UNIQUE INDEX "Product_gatewayLivePriceId_key" ON public."Product" ("gatewayLivePriceId");

CREATE UNIQUE INDEX "Product_identifier_key" ON public."Product" (identifier);

CREATE POLICY "Anyone can view active products" ON public."Product"
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create products" ON public."Product"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update products" ON public."Product"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "No client deletes on products" ON public."Product"
  FOR DELETE
  TO authenticated
  USING (false);

CREATE TABLE public."ProductFeature" (
  id             text                           NOT NULL,
  "productId"    text                           NOT NULL,
  "featureKey"   text                           NOT NULL,
  "featureValue" text                           DEFAULT 'true'::text NOT NULL,
  "createdAt"    timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"    timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."ProductFeature"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."ProductFeature"
  ADD CONSTRAINT "ProductFeature_pkey" PRIMARY KEY (id);

ALTER TABLE public."ProductFeature"
  ADD CONSTRAINT "ProductFeature_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;

GRANT ALL ON public."ProductFeature" TO anon;

GRANT ALL ON public."ProductFeature" TO authenticated;

GRANT ALL ON public."ProductFeature" TO service_role;

CREATE UNIQUE INDEX "ProductFeature_productId_featureKey_key" ON public."ProductFeature" ("productId", "featureKey");

CREATE POLICY "Anyone can view product features" ON public."ProductFeature"
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create product features" ON public."ProductFeature"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update product features" ON public."ProductFeature"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "No client deletes on product features" ON public."ProductFeature"
  FOR DELETE
  TO authenticated
  USING (false);

CREATE TABLE public."Session" (
  id             text                           NOT NULL,
  "sessionToken" text                           NOT NULL,
  "userId"       text                           NOT NULL,
  expires        timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Session"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Session"
  ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);

GRANT ALL ON public."Session" TO anon;

GRANT ALL ON public."Session" TO authenticated;

GRANT ALL ON public."Session" TO service_role;

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" ("sessionToken");

CREATE POLICY "Users can delete own sessions" ON public."Session"
  FOR DELETE
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE POLICY "Users can insert own sessions" ON public."Session"
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can update own sessions" ON public."Session"
  FOR UPDATE
  TO authenticated
  USING (((auth.uid())::text = "userId"))
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can view own sessions" ON public."Session"
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE TABLE public."Subscription" (
  id                      text                           NOT NULL,
  "userId"                text                           NOT NULL,
  "productId"             text                           NOT NULL,
  status                  public."SubscriptionStatus"    NOT NULL,
  "gatewaySubscriptionId" text,
  "currentPeriodStart"    timestamp(3) without time zone NOT NULL,
  "currentPeriodEnd"      timestamp(3) without time zone NOT NULL,
  "cancelAtPeriodEnd"     boolean                        DEFAULT false NOT NULL,
  "canceledAt"            timestamp(3) without time zone,
  "endedAt"               timestamp(3) without time zone,
  "trialStart"            timestamp(3) without time zone,
  "trialEnd"              timestamp(3) without time zone,
  "createdAt"             timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"             timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."Subscription"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Subscription"
  ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);

ALTER TABLE public."Payment"
  ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES public."Subscription"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."Subscription"
  ADD CONSTRAINT "Subscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

GRANT ALL ON public."Subscription" TO anon;

GRANT ALL ON public."Subscription" TO authenticated;

GRANT ALL ON public."Subscription" TO service_role;

CREATE UNIQUE INDEX "Subscription_gatewaySubscriptionId_key" ON public."Subscription" ("gatewaySubscriptionId");

CREATE POLICY "No client deletes on subscriptions" ON public."Subscription"
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "Users can insert own subscriptions" ON public."Subscription"
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can update own subscriptions" ON public."Subscription"
  FOR UPDATE
  TO authenticated
  USING (((auth.uid())::text = "userId"))
  WITH CHECK (((auth.uid())::text = "userId"));

CREATE POLICY "Users can view own subscriptions" ON public."Subscription"
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = "userId"));

CREATE TABLE public."User" (
  id                     text                           NOT NULL,
  name                   text,
  email                  text                           NOT NULL,
  "emailVerified"        timestamp(3) without time zone,
  image                  text,
  "createdAt"            timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "stripeTestCustomerId" text,
  "stripeLiveCustomerId" text
);

ALTER TABLE public."User"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."User"
  ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);

ALTER TABLE public."Account"
  ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."BillingProfile"
  ADD CONSTRAINT "BillingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."CustomLink"
  ADD CONSTRAINT "CustomLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."LessonProgress"
  ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Payment"
  ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Session"
  ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public."Subscription"
  ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

GRANT ALL ON public."User" TO anon;

GRANT ALL ON public."User" TO authenticated;

GRANT ALL ON public."User" TO service_role;

CREATE UNIQUE INDEX "User_email_key" ON public."User" (email);

CREATE UNIQUE INDEX "User_stripeTestCustomerId_key" ON public."User" ("stripeTestCustomerId");

CREATE UNIQUE INDEX "User_stripeLiveCustomerId_key" ON public."User" ("stripeLiveCustomerId");

CREATE POLICY "Prevent client deletes on User" ON public."User"
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "Prevent client inserts on User" ON public."User"
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Users can update own profile" ON public."User"
  FOR UPDATE
  TO authenticated
  USING (((auth.uid())::text = id))
  WITH CHECK (((auth.uid())::text = id));

CREATE POLICY "Users can view own profile" ON public."User"
  FOR SELECT
  TO authenticated
  USING (((auth.uid())::text = id));

CREATE TABLE public."VerificationToken" (
  identifier text                           NOT NULL,
  token      text                           NOT NULL,
  expires    timestamp(3) without time zone NOT NULL
);

ALTER TABLE public."VerificationToken"
  ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public."VerificationToken" TO anon;

GRANT ALL ON public."VerificationToken" TO authenticated;

GRANT ALL ON public."VerificationToken" TO service_role;

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" (identifier, token);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" (token);

CREATE POLICY "No client access to verification tokens" ON public."VerificationToken"
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE TABLE public."WebhookEvent" (
  id               text                           NOT NULL,
  "gatewayEventId" text                           NOT NULL,
  provider         text                           NOT NULL,
  "eventType"      text                           NOT NULL,
  processed        boolean                        DEFAULT true NOT NULL,
  payload          jsonb,
  "createdAt"      timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."WebhookEvent"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."WebhookEvent"
  ADD CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY (id);

GRANT ALL ON public."WebhookEvent" TO anon;

GRANT ALL ON public."WebhookEvent" TO authenticated;

GRANT ALL ON public."WebhookEvent" TO service_role;

CREATE UNIQUE INDEX "WebhookEvent_gatewayEventId_key" ON public."WebhookEvent" ("gatewayEventId");

CREATE POLICY "No client access to webhook events" ON public."WebhookEvent"
  TO authenticated
  USING (false)
  WITH CHECK (false);

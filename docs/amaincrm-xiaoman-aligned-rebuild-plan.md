# AMAIN CRM Xiaoman-Aligned Rebuild Plan

Last updated: 2026-04-24

## 1. Purpose

This document resets the AMAIN CRM development direction.

It replaces opportunistic feature growth with a long-term product-led plan.
From this point on, AMAIN CRM is no longer treated as "Trade CRM pages on top of
Twenty". It is treated as a foreign-trade CRM product that uses Twenty as the
starting platform and is allowed to modify Twenty core when the default model
does not fit the business.

This plan has two goals:

1. establish a durable product and architecture constraint for future work
2. create a phased execution plan that can guide short-term development without
   drifting away from the target product

The reference benchmark is Xiaoman CRM / OKKI, using the reviewed materials and
the existing benchmark notes in this repository.

## 2. Product Positioning

AMAIN CRM is a foreign-trade sales operating system.

It is not only a record management tool. It must support:

- inbound lead collection and classification
- rapid first response and follow-up execution
- customer ownership and public-pool operations
- opportunity progression around quotation and deal movement
- cross-channel communication, especially email
- manager review and team execution supervision
- enterprise operations governance, including fields, routing, permissions,
  reports, exports, and channel integration

The product standard is not "can render a page" or "can store a record".
The standard is whether a salesperson or manager can operate daily work from the
system with a clear business path.

## 3. Core Principles

### 3.1 Product benchmark

Xiaoman CRM is the benchmark for:

- module structure
- business operating flow
- action-first work surfaces
- management/configuration exposure
- foreign-trade-specific stage and execution logic

We do not copy Xiaoman pixel-for-pixel.
We do align to its business capability depth and operating structure.

### 3.2 Twenty is modifiable

Twenty core may be changed when necessary.

Allowed change scope includes:

- object metadata model
- object seeds and workspace initialization
- route and default-home behavior
- auth and development-mode access behavior
- GraphQL schema and resolver surface
- enterprise permissions model
- record list/detail assumptions
- workflow and automation assumptions

The constraint is not "avoid changing core".
The constraint is "change core deliberately and keep the resulting platform
coherent".

### 3.3 Action-first surfaces

The product must prioritize:

- what needs action now
- what is overdue
- what is risky
- what is blocked
- what should happen next

Lead, customer, opportunity, and manager pages are operating surfaces first and
reporting surfaces second.

### 3.4 Business-specific semantics

We keep foreign-trade-specific concepts explicit:

- lead source and product category
- first response timeliness
- follow-up aging
- customer public-pool transfer
- quotation follow-up
- stalled opportunities
- sales playbook and independent-station workflows

Avoid collapsing these into generic CRM abstractions if it weakens the business
workflow.

### 3.5 Governance is first-class

Routing rules, field layout, permissions, source convert rules, report
templates, export rules, and independent-station mappings are not side features.
They are part of the operating model and must remain explicit.

## 4. Product Scope

AMAIN CRM should be organized into six business domains.

### 4.1 Sales Workbench

Purpose:

- give frontline sellers a daily action-first start page

Core capabilities:

- today new leads
- first response risk
- follow-up due today
- overdue tasks
- my pipeline needing next action
- quotation sent but no update
- stalled opportunities
- personal queue and manager queue separation

### 4.2 Prospecting

Purpose:

- handle acquisition and pre-customer operations

Core capabilities:

- lead pool
- channel leads
- AI-sourced leads
- communication feed
- assignment routing
- source tree and category tree
- unread / untouched / due follow-up dimensions
- lead qualification and lead-to-customer conversion preparation

### 4.3 Customer Operations

Purpose:

- make customer management an operating center, not a static table

Core capabilities:

- customer list with business filters
- public pool
- dedupe and merge
- customer detail workspace
- customer settings center
- customer import center
- customer timeline and operation history
- enterprise-field-based segmentation

### 4.4 Opportunity Operations

Purpose:

- manage commercial progression after qualification

Core capabilities:

- pipeline board
- my opportunities
- quotation follow-up
- stalled view
- lost analysis
- next action and next action date
- stage-specific execution cues

### 4.5 Communication

Purpose:

- make email and customer communication part of business execution

Core capabilities:

- inbox workspace
- pending mail
- customer-centric communication view
- outbound campaign / development mail
- send queue and analytics
- thread-to-customer linking
- communication activity writeback to customer and opportunity context

### 4.6 Enterprise Operations

Purpose:

- give managers and operators control over the operating system itself

Core capabilities:

- custom fields
- field layout
- field value governance
- customer export
- recycle bin
- report templates
- source convert rules
- independent-station management
- sales playbook management
- enterprise permissions

## 5. Target Product Structure

The target information architecture should be:

1. Workbench
2. Prospecting
3. Customers
4. Opportunities
5. Mail / Communication
6. Collaboration
7. Team Data
8. Settings
9. Enterprise Management

This is close to the current route map, but the meaning changes:

- pages are not placeholders or "future modules"
- each module must own a business workflow
- every page must have a clear role in the seller or manager daily operation

## 6. Capability Standard By Module

This section defines what "business-ready" means for each major domain.

### 6.1 Workbench standard

Business-ready when:

- seller can start the day from this page
- each card routes to a real working queue
- no major block relies on a dead external dependency without graceful fallback
- manager board can distinguish team-level issues from personal work

### 6.2 Prospecting standard

Business-ready when:

- lead object and lead metadata are first-class and stable
- lead list can be filtered by status, source, category, age, and assignment
- first response risk is visible
- routing path is connected to business-owned rules, not hard-coded logic

### 6.3 Customers standard

Business-ready when:

- customer list, public pool, dedupe, config, and detail all open without
  metadata crashes
- public-pool move and claim logic are auditable
- create/import/dedupe/customer-detail actions all write to a consistent
  customer operating history
- customer detail is a real workspace, not a static profile page

### 6.4 Opportunities standard

Business-ready when:

- opportunities have foreign-trade-relevant stages
- every opportunity can carry owner, next action, next action date, quotation
  status, and inactivity risk
- stalled and quotation follow-up views are actionable, not decorative

### 6.5 Mail standard

Business-ready when:

- mail pages do not depend on missing schema types
- thread, customer, and campaign views are all usable
- mail activity can be tied back to customer and opportunity context
- development-mail workflow is operational, not just UI structure

### 6.6 Enterprise standard

Business-ready when:

- pages open in development without authentication blockers preventing QA
- backend permission model is explicit and role-based
- enterprise fields affect list, detail, import, and export behavior
- independent-station and source-convert features are usable operational tools

## 7. Current Major Drift

The current repository has drift in two directions.

### 7.1 Platform drift

- development auth and route behavior prevent direct module inspection
- metadata is incomplete for target modules
- GraphQL schema and frontend query assumptions diverge
- enterprise APIs rely on auth paths that are unsuitable for local product QA
- some workbench capabilities depend on extra services without fallback

### 7.2 Product drift

- some modules exist as route shells without full business workflow closure
- some Twenty-native object assumptions remain stronger than Xiaoman-aligned
  business semantics
- some features were implemented as technical slices rather than end-to-end
  operating capabilities
- module depth is uneven: Customers and Enterprise progressed more than
  Prospecting, Workbench, Opportunities, and Mail consistency

## 8. Target Architecture Direction

The architecture should evolve to:

- Twenty Core = foreign-trade CRM platform base
- Integration Hub = ingestion, orchestration, retry, external workflow layer
- AI = recommendation, summarization, assistant, not autonomous state owner

### 8.1 Twenty core should own

- company/customer/person/opportunity/task primary objects
- metadata and field layout system
- customer config and public-pool operating rules
- customer detail and opportunity detail operating surfaces
- route system and workbench navigation
- enterprise permissions and enterprise configuration pages
- core GraphQL / REST surfaces used by the CRM frontend

### 8.2 Integration hub should own

- external lead ingestion
- channel webhook handling
- outbox and retry
- external synchronization
- monitoring APIs such as lead-monitoring

### 8.3 Shared rule

If a capability is necessary for foreign-trade CRM operation and is currently
blocked by Twenty defaults, the default should be changed rather than working
around it forever.

## 9. Rebuild Strategy

The rebuild is phased.

### Phase P0: Platform baseline

Goal:

- make all major modules open and inspectable in development

Required outcomes:

- dev auth bypass for local product QA
- route integrity for all target module pages
- metadata completeness for target modules
- frontend/backend schema compatibility for current routes
- external service dependencies either started or degraded gracefully

P0 blockers currently known:

- login and route interception
- missing `customerGroup` metadata
- missing `lead` metadata
- missing `connectedAccounts` GraphQL support
- missing `tasks` GraphQL support
- enterprise auth blocking local QA
- lead-monitoring service on `3020` missing

### Phase P1: Product-critical modules

Goal:

- make the main foreign-trade CRM operating chain usable

Priority order:

1. Customers
2. Prospecting
3. Mail
4. Opportunities
5. Enterprise backoffice alignment

### Phase P2: Core refactor

Goal:

- remove Twenty assumptions that continue to distort product behavior

Includes:

- metadata model adjustments
- auth and default-home behavior
- enterprise permission persistence and enforcement
- route and workspace assumptions
- schema cleanup and compatibility strategy

### Phase P3: Operating depth

Goal:

- match Xiaoman-level operating depth, not just module existence

Includes:

- deeper public-pool operations
- complete lead-routing visibility
- mail-to-customer writeback
- quotation risk and stalled opportunity closure
- manager review and team data depth

## 10. Detailed Execution Plan

### 10.1 P0 work package: development access and route integrity

Tasks:

1. remove login blocking for localhost development
2. ensure every target route can open directly
3. stop redirecting enterprise pages back to workbench in dev
4. provide a stable local front/server/worker/redis startup path

Acceptance:

- every target route opens without `/welcome` interception
- screenshots can be captured directly from each route

### 10.2 P0 work package: metadata completeness

Tasks:

1. identify all metadata dependencies used by Trade CRM pages
2. seed or register missing objects and fields
3. ensure workspace initialization produces a minimum foreign-trade CRM dataset

Current priority metadata:

- `customerGroup`
- `lead`

Acceptance:

- Customers and Prospecting pages do not crash because of missing metadata items

### 10.3 P0 work package: schema compatibility

Tasks:

1. inventory all frontend queries used by current modules
2. compare against backend schema actually exposed
3. decide per case:
   - add missing backend support
   - remove invalid frontend dependency
   - replace with new API/query

Current priority schema gaps:

- `connectedAccounts`
- `TaskFilterInput`
- `TaskOrderByInput`
- `tasks` query

Acceptance:

- Mail, Collaboration, and Analytics pages open without schema mismatch errors

### 10.4 P1 work package: Customers as the first complete module

Tasks:

1. stabilize customer list
2. stabilize public pool
3. stabilize dedupe
4. complete customer config
5. complete customer detail writeback
6. align import and merge flows with operating history

Acceptance:

- Customers module is the first truly business-usable module
- list, public, dedupe, config, and detail all open and operate consistently

### 10.5 P1 work package: Prospecting rebuild

Tasks:

1. make lead object and lead metadata first-class
2. align lead list with source/category/status/risk dimensions
3. make routing view business-owned and inspectable
4. connect lead-to-customer conversion to the customer operating chain

Acceptance:

- Prospecting is a real acquisition workspace, not a broken shell

### 10.6 P1 work package: Mail rebuild

Tasks:

1. restore schema compatibility
2. make inbox/customer/campaign scopes operational
3. write communication signals back to customer context
4. align development-mail functionality with campaign operation needs

Acceptance:

- Mail supports inbox handling, customer-centric visibility, and campaign work

### 10.7 P1 work package: Opportunities rebuild

Tasks:

1. align stage model with foreign-trade movement
2. ensure next-action discipline is first-class
3. add quotation follow-up and stalled views as real queues
4. connect opportunity actions back to customer detail and manager views

Acceptance:

- Opportunities become an execution module, not only a pipeline page

### 10.8 P1 work package: Enterprise backoffice alignment

Tasks:

1. keep all enterprise pages directly inspectable in development
2. complete role-based permission persistence and usage
3. ensure enterprise fields affect live CRM behavior
4. align source-convert, independent-station, export, and sales-playbook to
   the target operating model

Acceptance:

- Enterprise supports the CRM as an operator-facing management layer

## 11. Required Core Changes

The following changes are explicitly allowed and expected.

### 11.1 Auth and route behavior

- localhost dev bypass
- route gating refactor
- default home refactor
- enterprise route handling cleanup

### 11.2 Metadata seeding and workspace initialization

- Trade CRM seed completeness
- customer and lead metadata completeness
- default views and workbench item registration

### 11.3 Schema evolution

- add missing query types where they are valid
- remove invalid frontend assumptions where they should not exist
- introduce compatibility wrappers if migration is gradual

### 11.4 Enterprise permissions

- keep `enterprise.*` permissions as first-class
- persist role permissions
- expose them to frontend and backend consistently

## 12. Delivery Discipline

From now on, development must follow these rules.

### 12.1 No feature work without a capability target

Every development task must answer:

- which Xiaoman-like capability is this closing
- which module standard is this moving
- what acceptance proves the module is closer to business-ready

### 12.2 No module work on a broken platform baseline

If route, auth, metadata, or schema prevents module inspection, fix those first.

### 12.3 No "page exists" acceptance

Acceptance must be based on:

- page opens
- key data loads
- key actions work
- state writeback works
- screenshot and smoke regression pass

### 12.4 Every milestone must end with verification

Required verification package:

- route opening check
- screenshot audit
- focused smoke or unit coverage
- updated progress and findings notes

## 13. Milestone Definition

### M1: Development baseline

Definition:

- all major routes open in local development
- login no longer blocks internal inspection
- known metadata and schema crashes for current critical modules are removed

### M2: Customers complete

Definition:

- Customers is business-usable end to end
- import, public pool, dedupe, detail, and config all operate coherently

### M3: Prospecting + Mail usable

Definition:

- lead operating queues work
- mail workspaces work
- customer and communication writeback path is coherent

### M4: Opportunity + manager execution depth

Definition:

- pipeline, stalled, quotation follow-up, and manager review become real
  operating views

### M5: Enterprise support layer complete

Definition:

- enterprise management supports field governance, permissions, export,
  independent station, source convert, and playbook operation in a stable way

## 14. Immediate Next Actions

The next build cycle should execute only these tasks:

1. finish P0 dev access and route integrity
2. fix `customerGroup` metadata gap
3. fix `lead` metadata gap
4. fix current schema mismatches for Mail and Task-dependent pages
5. rerun full module screenshot audit
6. update the execution board based on the new audit

Do not start new module-level feature expansion before these are complete.

## 15. Status Tracking Format

Every future execution update should be reported in this shape:

- objective
- target module
- blocker type: route / auth / metadata / schema / backend / UX / business flow
- current status
- acceptance criteria
- verification result

This is the minimum discipline required to keep the rebuild aligned to the
target product.


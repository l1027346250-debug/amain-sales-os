# AMAIN Mailbox Phase 1 Design

## 1. Goal

Phase 1 turns AMAIN Mail from a CRM mail view into a real enterprise mailbox workbench aligned with Xiaoman/OKKI.

Hard constraints:

- Mailbox accounts are bound by admins, not by end users
- Alibaba Mail is the primary provider for this phase
- Protocol stack is IMAP + SMTP
- Phase 1 includes a complete mailbox workbench:
  - inbox
  - pending
  - unread
  - drafts
  - sent
  - broadcast
  - customer view
  - subordinate view
  - folders and tags
  - CRM and AI side panel

Implementation strategy:

- Reuse Twenty's existing connection and sync substrate where it is already strong
- Build an AMAIN-specific mailbox domain on top so the product surface follows Xiaoman semantics rather than Twenty's personal connected-account model

## 2. Product Scope

### 2.1 Included in Phase 1

- Admin-managed Alibaba mailbox account creation
- IMAP and SMTP connection validation
- Mailbox assignment from admin to CRM users
- Mailbox permission assignment
- Inbox, unread, pending, drafts, sent, and broadcast workbenches
- Folder sync and folder selection
- System tags and custom tags
- Batch actions:
  - mark read/unread
  - move
  - tag
  - delete
  - forward
- Customer conversations view
- Subordinate mailbox view
- CRM relationship linking:
  - company
  - person
  - opportunity
  - task
- AI side panel with summary, customer context, and action suggestions

### 2.2 Explicitly Out of Scope

- POP3 primary support
- Exchange / EWS
- Provider auto-discovery
- Full visual rule engine
- Elastic-powered deep search optimization
- Realtime IMAP IDLE as the primary sync mechanism
- Cross-workspace mailbox sharing

## 3. Architecture

### 3.1 Recommended Approach

Use a layered approach:

1. Bottom layer: reuse existing Twenty infrastructure
2. Middle layer: add AMAIN mailbox domain objects and services
3. Top layer: rebuild the admin and mail workbench experience in AMAIN/Xiaoman semantics

This preserves current sync and channel infrastructure while removing the product constraint of Twenty's personal account model.

### 3.2 Layer Responsibilities

#### Twenty substrate

- connected account persistence
- message channel persistence
- folder sync
- message sync status
- low-level IMAP / SMTP validation
- worker-based import and retry flows

#### AMAIN mailbox domain

- mailbox profile
- mailbox assignment
- mailbox permission
- mailbox rule
- mailbox-to-CRM linking
- subordinate visibility policy
- admin mailbox lifecycle

#### AMAIN workbench surface

- admin mailbox control
- complete mailbox workspace
- customer conversations
- subordinate handling
- AI and CRM side panel

## 4. Information Architecture

### 4.1 Mail module

Primary menu:

- Mail

Mail workbench sections:

- Inbox
- Pending
- Unread
- Drafts
- Sent
- Broadcast
- Customer Conversations
- Subordinate View
- Folders & Tags

### 4.2 Admin module

Add a dedicated mailbox area under Admin:

- Mailbox Accounts
- Mailbox Assignments
- Mailbox Permissions
- Mailbox Rules
- Mailbox Health

Admin pages must use AMAIN naming and workflow rather than exposing raw ConnectedAccount terminology.

## 5. Data Model

### 5.1 Reused Existing Objects

- ConnectedAccount
- MessageChannel
- MessageFolder
- Message
- MessageThread

These remain low-level operational objects.

### 5.2 New AMAIN Objects

#### MailboxProfile

Represents a business mailbox account managed by admins.

Fields:

- id
- workspaceId
- emailAddress
- provider
- protocolMode
- imapHost
- imapPort
- imapSecure
- smtpHost
- smtpPort
- smtpSecure
- loginUsername
- credentialRef
- credentialMode
- status
- validationStatus
- lastValidatedAt
- lastSyncAt
- lastSyncStatus
- connectedAccountId
- messageChannelId

Notes:

- `provider` is `alibaba-mail` in Phase 1
- `credentialMode` supports password or authorization code semantics
- password material must never be stored in plaintext

#### MailboxAssignment

Represents assignment of a mailbox to a CRM user.

Fields:

- id
- mailboxProfileId
- workspaceMemberId
- assignedByWorkspaceMemberId
- assignmentStatus
- isPrimaryMailbox
- canReceive
- canSend
- canViewSubordinates
- canHandleSubordinates
- canManageRules
- createdAt
- updatedAt

#### MailboxPermission

Represents finer-grained permission entries when assignment flags are not enough.

Fields:

- id
- mailboxAssignmentId
- permissionCode
- permissionValue

Permission codes for Phase 1:

- mail.read
- mail.send
- mail.reply
- mail.forward
- mail.move
- mail.tag
- mail.delete
- mail.bulk
- mail.view_subordinate
- mail.handle_subordinate
- mail.manage_rules

#### MailboxRule

Represents mailbox routing or pending classification rules.

Fields:

- id
- mailboxProfileId
- name
- ruleType
- conditionsJson
- actionsJson
- enabled
- priority
- createdByWorkspaceMemberId

Phase 1 only needs rule persistence and execution hooks for pending classification and assignment. A full visual builder is not required.

#### MailThreadCrmLink

Represents explicit mail thread to CRM record bindings.

Fields:

- id
- threadId
- companyId
- personId
- opportunityId
- taskId
- source
- confidence
- linkedByWorkspaceMemberId
- createdAt

This object supersedes reliance on inference-only linking. The current thread-task binding work should be merged into this broader relation model.

## 6. Admin Flows

### 6.1 Create mailbox account

1. Admin opens `Admin > Mailbox Accounts`
2. Admin chooses `Alibaba Mail`
3. Admin enters:
   - mailbox address
   - login username
   - password or authorization code
   - IMAP host / port / secure
   - SMTP host / port / secure
4. Admin runs `Validate connection`
5. System validates IMAP login and SMTP send capability
6. On success, system creates:
   - MailboxProfile
   - ConnectedAccount
   - MessageChannel
7. Admin saves account

### 6.2 Assign mailbox to user

1. Admin opens `Admin > Mailbox Assignments`
2. Admin selects a mailbox
3. Admin selects target CRM user
4. Admin sets permissions
5. Admin saves assignment

### 6.3 Mailbox health and reconnect

Admin can inspect:

- last validation time
- last sync time
- last sync status
- failure reason
- reconnect required

Reconnect must be an admin action for this phase, not an end-user self-service path.

## 7. Protocol and Sync Design

### 7.1 Protocol choice

Primary protocol stack:

- IMAP for receiving, folders, read state, and move semantics
- SMTP for send, reply, reply-all, and forward

POP3 is intentionally excluded from the main design because it weakens folder and state synchronization.

### 7.2 Sync strategy

Phase 1 sync strategy:

- Initial sync: recent N days only
- Incremental sync: worker-based polling
- Manual `Sync now` action in admin and mailbox settings
- Failed channels can be retried by existing message-channel recovery flows

IMAP IDLE can be added later, but polling is the stable default for the first usable release.

### 7.3 Alibaba mailbox specifics

Phase 1 must explicitly support:

- custom IMAP host
- custom SMTP host
- SSL/TLS settings
- username-based login
- password or provider authorization code

Provider handling must not assume Google or Microsoft OAuth semantics.

## 8. Permission Model

### 8.1 Roles

- mailbox-admin
- mailbox-manager
- mailbox-user

### 8.2 Role behavior

#### mailbox-admin

- create and edit mailbox accounts
- validate and reconnect accounts
- assign accounts to users
- manage permission sets
- configure mailbox rules
- inspect mailbox health

#### mailbox-manager

- view subordinate mailboxes when granted
- handle subordinate pending queues when granted
- reassign subordinate mail items
- inspect subordinate queue health

#### mailbox-user

- access assigned mailboxes
- read, send, reply, forward
- manage folders and tags allowed by assignment
- work pending queue

Subordinate access must be permission-driven, not implied by reporting structure alone.

## 9. Mail Workbench Contract

### 9.1 Left rail

- scope switch:
  - mail
  - customer
  - subordinate
- compose button
- system folders:
  - inbox
  - pending
  - unread
  - drafts
  - sent
  - broadcast
- synced folder tree
- system tags
- custom tags

### 9.2 Center pane

- search and advanced search
- batch action bar
- mailbox list
- customer thread list
- subordinate thread list

### 9.3 Right pane

- message detail
- attachments
- customer profile
- contact
- opportunity
- task
- AI suggestions:
  - summary
  - customer analysis
  - reply suggestion
  - next action suggestion

## 10. CRM Linking Strategy

### 10.1 Automatic linking order

Automatic relationship linking should attempt in this order:

1. sender email -> Person
2. Person -> Company
3. Company -> active Opportunity
4. explicit MailThreadCrmLink

### 10.2 Manual linking

From the mail detail side panel the seller must be able to:

- link customer
- link contact
- link opportunity
- create lead
- create task

### 10.3 Pending queue truth model

The long-term truth model for pending mail must be:

- threadId -> taskId
- threadId -> companyId / personId / opportunityId

Inference can remain as a fallback but must not remain the primary operating model.

## 11. Security and Credential Handling

- Credentials must not be stored in plaintext
- Frontend must never receive a decryptable secret back
- Admin views only show connection status, last validation, and masked account identity
- Attachment and message access must always be gated by assignment and permission checks
- Subordinate access must be enforced server-side

If the existing Twenty credential persistence model is insufficient, Phase 1 should extend it rather than leaking mailbox secrets into user-facing records.

## 12. API and Service Additions

### 12.1 Admin APIs

Need AMAIN-level APIs for:

- createMailboxProfile
- updateMailboxProfile
- validateMailboxProfileConnection
- assignMailboxProfileToUser
- updateMailboxAssignment
- updateMailboxPermissions
- listMailboxHealth

### 12.2 Mail workbench APIs

Need AMAIN-level APIs for:

- list mailbox threads by workbench view
- batch move
- batch tag
- batch mark read/unread
- create draft
- send message
- reply
- forward
- link thread to CRM objects

Where possible these should orchestrate existing substrate services rather than bypass them.

## 13. Delivery Plan

### Wave 1

- Admin mailbox account management
- Admin mailbox assignment
- Alibaba IMAP/SMTP validation
- mailbox profile, assignment, permission storage

### Wave 2

- Inbox, unread, drafts, sent, pending
- folder sync
- batch actions
- send / reply / forward

### Wave 3

- customer conversations
- subordinate view
- CRM linking model
- pending queue exact linkage

### Wave 4

- AI side panel enrichment
- rule-backed pending classification
- mailbox health and admin monitoring polish

## 14. Acceptance Criteria

Phase 1 is complete only when all of the following are true:

1. An admin can bind an Alibaba mailbox through IMAP and SMTP settings
2. An admin can assign that mailbox to a CRM user with explicit permissions
3. The assigned user can receive mail, send mail, reply, and forward
4. Inbox, pending, unread, drafts, sent, and broadcast views all function
5. Folder sync and tag operations function
6. Batch actions function
7. Customer conversations view shows customer-grouped threads
8. Subordinate view works for users with subordinate permissions
9. Pending queue actions can create or open real tasks
10. Mail threads can be bound to customer, contact, opportunity, and task records
11. The right-side AI and CRM panel shows customer context and next-step suggestions

## 15. Risks and Mitigations

### 15.1 Alibaba mailbox auth variance

Risk:
- Some tenants require authorization codes rather than mailbox passwords

Mitigation:
- Treat credentials as a typed secret mode in MailboxProfile

### 15.2 Twenty settings bias toward personal accounts

Risk:
- Existing settings flows are designed around personal connected accounts

Mitigation:
- Build an AMAIN admin mailbox control surface and treat raw connected-account pages as substrate only

### 15.3 Permission leakage

Risk:
- Subordinate mailbox access may leak data if enforced only in the UI

Mitigation:
- Enforce assignment and mailbox permission checks at the API layer

### 15.4 Initial sync overload

Risk:
- Full historical imports may cause slow first-use behavior

Mitigation:
- Restrict initial sync to recent N days in Phase 1

## 16. Recommendation

Proceed with implementation using the layered approach in this document.

This is the fastest path that still protects the product direction:

- reuse Twenty where it is already strong
- stop exposing Twenty's personal-account assumptions at the product layer
- build AMAIN Mailbox as an admin-managed, CRM-linked enterprise mailbox workbench

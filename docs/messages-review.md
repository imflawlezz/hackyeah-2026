# Messages and notifications

Closes #26

This adds private conversations with ROPS, experts and partners. It comes with a responsive list and thread view, a composer that works from the keyboard, announcements for incoming messages, a notification bell and a full notification page. Without a session, the feature uses three fictional conversations and two browser-local notifications, synchronized across tabs with BroadcastChannel.

Run supabase/migrations/0005_messages_notifications.sql in the Supabase SQL Editor (project HubMI) before merging.

Shared contracts: ConversationKind, Conversation, Message and Notification in src/types/index.ts; conversationKindSchema, conversationSchema, messageSchema, notificationSchema and startConversationSchema exported through src/lib/validators/index.ts. No changes to src/lib/mocks/index.ts or the current-user contract.

Shared header: header-actions.tsx adds the bell. site-header.tsx already renders HeaderActions in its header-actions slot and is unchanged. The knowledge detail page already links to /messages/new?innovation={id}; ContactButton provides the same reusable link.

No service-role client is used. Security-definer functions use an empty search path and expose only participants' names or expert directory fields. Notifications and messages use the signed-in browser session for Realtime. Partnership threads remain private; the optional public board is omitted.

For a real partnership, the sender supplies the recipient's account UUID. The prototype does not expose a public resident directory.

Validation: format:check, lint, typecheck, Vitest and production build. Tests cover schemas, Polish plurals, relative time, unread state, persistence and two simulated BroadcastChannels, incoming announcements with preserved composer focus, and the bell count.

## Deployment validation

Apply the migration twice to verify idempotency, then use a resident, an admin and an unrelated signed-in account:

1. Start a ROPS conversation as the resident. Confirm the admin receives a notification, opens the thread and replies. Confirm the resident receives the reply live.
2. Confirm the unrelated account gets no conversation or message rows for that ID, cannot insert a message, cannot change notification content or ownership, and cannot change participant membership.
3. Set an idea to submitted, then reviewed. Confirm the admin receives idea_submitted and the author receives idea_reviewed. Repeating the same status should not duplicate notifications.
4. Verify keyboard navigation, mobile reflow at 320 px, A++ and high contrast. Run Lighthouse on /messages and require accessibility >=95.

The SQL migration and two-account Supabase flow have not been executed from this workspace. Browser screenshots, a recording and Lighthouse results are still missing, because no browser was available in that workspace.

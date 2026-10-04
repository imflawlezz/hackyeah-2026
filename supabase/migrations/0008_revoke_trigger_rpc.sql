-- HubMI.pl: trigger functions must not be callable through /rest/v1/rpc.
--
-- notify_message() and notify_idea_status() are SECURITY DEFINER because they
-- insert notifications for other users, which RLS does not allow the acting
-- user to do. 0005 revoked EXECUTE from public and anon only, and Supabase's
-- default privileges grant EXECUTE on new functions to authenticated, so a
-- signed-in user could still call them as RPC. Triggers do not need the
-- privilege: a trigger function runs regardless of who may EXECUTE it.
--
-- Safe to run more than once. Run it in the Supabase SQL Editor after 0007.

revoke execute on function public.notify_idea_status(), public.notify_message()
  from public, anon, authenticated;

-- The other SECURITY DEFINER functions stay callable on purpose. Each one sets
-- an empty search_path and limits what it returns to the caller:
--
--   is_admin()                          anon, authenticated. RLS policies call
--                                       it; it only says whether the caller
--                                       is an admin.
--   innovation_feedback_summary(uuid)   anon, authenticated. Aggregates only;
--   test_slots_taken(uuid)              no row of another user is returned.
--   is_conversation_participant(uuid)   authenticated. Answers for the caller
--                                       (auth.uid()) only; used by RLS.
--   conversation_people(uuid)           authenticated. Returns names only to
--                                       a participant of that conversation.
--   list_experts()                      authenticated. Public profile fields
--                                       of experts, for the message form.
--   start_conversation(...)             authenticated. Creates a conversation
--                                       with the caller as a participant.
--
-- The other trigger functions (handle_new_user, touch_updated_at,
-- guard_test_signup, guard_message_updates) were already revoked from public,
-- anon and authenticated in the migrations that created them.
-- match_innovations, problem_trends and review_idea are SECURITY INVOKER:
-- they run under the caller's RLS.

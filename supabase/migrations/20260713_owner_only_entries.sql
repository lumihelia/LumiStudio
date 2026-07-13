-- Apply in the Supabase SQL editor after the authenticated frontend is deployed.
-- Existing rows remain preserved but inaccessible until explicitly assigned to an owner.

alter table public.entries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.entries alter column user_id set default auth.uid();

alter table public.entries enable row level security;
drop policy if exists "demo open access" on public.entries;

create policy "owners read their entries"
on public.entries for select to authenticated
using (user_id = auth.uid());

create policy "owners create their entries"
on public.entries for insert to authenticated
with check (user_id = auth.uid());

create policy "owners update their entries"
on public.entries for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "owners delete their entries"
on public.entries for delete to authenticated
using (user_id = auth.uid());

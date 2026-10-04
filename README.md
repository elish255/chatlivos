# Chatlivos

Website ya Chatlivos yenye registration, login, account activation na dashboard iliyounganishwa na Supabase.

## 1. Supabase

Fungua Supabase SQL Editor na run:

`supabase/schema.sql`

Schema inatengeneza:
- `profiles` — taarifa za user na `is_active`
- `payment_orders` — kumbukumbu za malipo

RLS imewashwa. Website server hutumia `SUPABASE_SERVICE_ROLE_KEY` kwa operations za backend; usiiweke kwenye `VITE_*`.

## 2. Vercel Environment Variables

Weka hizi kwenye Vercel kwa Production/Preview kulingana na unavyohitaji:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FIMIPAY_SECRET_KEY=...
FIMIPAY_AMOUNT=16000
```

`FIMIPAY_SECRET_KEY` ni server-only. Usiiweke kama `VITE_FIMIPAY_SECRET_KEY`.

## 3. Payment flow

1. User anajisajili.
2. Account inaingia `is_active = false`.
3. User anaelekezwa kwenye `/payment`.
4. Namba ya Tanzania inasafishwa automatically:
   - `0712345678` → `712345678`
   - request ya provider inatumia international form `255712345678`.
5. Button `LIPA SASA` inaanzisha payment request.
6. Website inafuatilia order status.
7. Status ikiwa `SUCCESS`, profile inawekwa `is_active = true`.
8. User anaelekezwa `/dashboard`.
9. User aki-login akiwa hajamaliza activation, anaelekezwa `/payment`.

Provider name/technical payment details hazionyeshwi kwenye payment UI.

## 4. Chat access

`START CHAT` inakagua account:
- hakuna session → `/register`
- account haija-active → `/payment`
- account Active → chat inafunguka

Chat responses zimetengenezwa kuwa varied ili foreigner asirudie ujumbe mmoja kila mara.

## 5. Build

```bash
npm install
npm run build
```

Deploy folder hii kwenye Vercel.

## Chatlivos Admin Panel

Admin panel URL: `/admin`.

1. Create the admin account in Supabase Authentication > Users.
2. Run this in Supabase SQL Editor, replacing the email:

```sql
insert into public.chatlivos_admin_users (user_id, email)
select id, email
from auth.users
where lower(email) = lower('admin@example.com')
on conflict (user_id) do update set email = excluded.email, is_active = true;
```

The admin can view registration count and user details, activate/deactivate users, ban/unban users, and send notifications to everyone or one user.

The SQL file creates/changes only `chatlivos_*` tables. It does not alter tables used by other websites in the same Supabase project.

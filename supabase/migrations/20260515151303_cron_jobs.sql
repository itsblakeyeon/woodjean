-- pg_cron + pg_net으로 Vercel cron 대체.
-- Vercel Hobby plan은 daily(1일 1회) cron만 허용해서, 5분/10분 단위 운영 cron을 Supabase로 이전.
--
-- 사전 준비 (Supabase Dashboard → Database → Vault → New secret):
--   1. name: bot_base_url       value: https://bot.woodjean-pangyo.com
--   2. name: cron_secret        value: <Vercel env CRON_SECRET과 동일한 값>
--
-- 이 migration은 위 secret 2개가 Vault에 등록된 후에만 정상 동작합니다.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- private schema — cron helper 함수 격리용 (PostgREST 노출 금지)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Vault에 저장된 base URL + cron secret을 사용해 backend cron endpoint를 호출하는 헬퍼.
-- security definer로 vault.decrypted_secrets 접근 권한 위임 (일반 role은 vault 접근 X).
create or replace function private.fire_cron(endpoint text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_url text;
  cron_secret text;
begin
  select decrypted_secret into base_url
  from vault.decrypted_secrets
  where name = 'bot_base_url';

  select decrypted_secret into cron_secret
  from vault.decrypted_secrets
  where name = 'cron_secret';

  if base_url is null or cron_secret is null then
    raise exception 'fire_cron: missing vault secrets (bot_base_url, cron_secret)';
  end if;

  perform extensions.http_post(
    url := base_url || endpoint,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

-- cron job 등록 (이름이 같으면 update). 멱등 보장 위해 unschedule → schedule.
do $$
begin
  perform cron.unschedule(jobname) from cron.job where jobname in ('confirm-sms', 'notify-slots', 'no-show-check');
end $$;

select cron.schedule(
  'confirm-sms',
  '*/5 * * * *',
  $$select private.fire_cron('/api/cron/confirm-sms')$$
);

select cron.schedule(
  'notify-slots',
  '*/5 * * * *',
  $$select private.fire_cron('/api/cron/notify-slots')$$
);

select cron.schedule(
  'no-show-check',
  '*/10 * * * *',
  $$select private.fire_cron('/api/cron/no-show-check')$$
);

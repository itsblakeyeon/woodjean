CREATE TABLE cli_events (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ts timestamptz NOT NULL DEFAULT now(),
  event text NOT NULL,
  device_id_hash text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX cli_events_event_ts_idx ON cli_events (event, ts DESC);

ALTER TABLE cli_events ENABLE ROW LEVEL SECURITY;

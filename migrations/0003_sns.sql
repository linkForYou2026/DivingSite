-- =====================================================================
-- SNS自動取り込み 追加テーブル（SQLite / Cloudflare D1）
-- 前提：0001_init.sql（と 0002_seed.sql）を実行済みであること
-- =====================================================================

CREATE TABLE sns_accounts (
  id                    INTEGER PRIMARY KEY,
  platform              TEXT    NOT NULL CHECK (platform IN ('instagram','youtube','facebook','tiktok')),
  display_name          TEXT    NOT NULL,
  external_account_id   TEXT    NOT NULL,
  uploads_playlist_id   TEXT,
  profile_url           TEXT,
  sync_enabled          INTEGER NOT NULL DEFAULT 1  CHECK (sync_enabled IN (0,1)),
  sync_interval_min     INTEGER NOT NULL DEFAULT 60 CHECK (sync_interval_min >= 15),
  import_rule           TEXT    NOT NULL DEFAULT 'all' CHECK (import_rule IN ('all','hashtag')),
  import_hashtag        TEXT,
  auto_publish          INTEGER NOT NULL DEFAULT 0  CHECK (auto_publish IN (0,1)),
  last_synced_at        TEXT,
  last_result           TEXT    CHECK (last_result IS NULL OR last_result IN ('success','failed')),
  consecutive_failures  INTEGER NOT NULL DEFAULT 0  CHECK (consecutive_failures >= 0),
  status                TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','reauth_required')),
  created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by            TEXT,
  UNIQUE (platform, external_account_id),
  CHECK (import_rule = 'all' OR (import_hashtag IS NOT NULL AND length(import_hashtag) > 0))
) STRICT;

CREATE TABLE sns_credentials (
  id                  INTEGER PRIMARY KEY,
  account_id          INTEGER NOT NULL UNIQUE REFERENCES sns_accounts(id) ON DELETE CASCADE,
  access_token_enc    TEXT,
  refresh_token_enc   TEXT,
  access_expires_at   TEXT,
  refresh_expires_at  TEXT,
  last_refreshed_at   TEXT,
  key_version         INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by          TEXT
) STRICT;

CREATE TABLE sns_posts (
  id                  INTEGER PRIMARY KEY,
  account_id          INTEGER NOT NULL REFERENCES sns_accounts(id),
  platform            TEXT    NOT NULL CHECK (platform IN ('instagram','youtube','facebook','tiktok')),
  external_id         TEXT    NOT NULL,
  post_type           TEXT    NOT NULL CHECK (post_type IN ('image','video','reel','short','carousel','text')),
  title               TEXT,
  caption             TEXT,
  hashtags            TEXT    CHECK (hashtags IS NULL OR json_valid(hashtags)),
  permalink           TEXT    NOT NULL,
  embed_url           TEXT,
  thumbnail_url       TEXT,
  thumbnail_media_id  INTEGER REFERENCES media(id),
  duration_sec        INTEGER CHECK (duration_sec IS NULL OR duration_sec >= 0),
  posted_at           TEXT    NOT NULL,
  review_status       TEXT    NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','published','hidden','removed')),
  reviewed_by         TEXT,
  reviewed_at         TEXT,
  first_seen_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  last_seen_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  raw_json            TEXT    CHECK (raw_json IS NULL OR json_valid(raw_json)),
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by          TEXT,
  UNIQUE (platform, external_id)
) STRICT;
CREATE INDEX idx_sns_posts_status_posted ON sns_posts (review_status, posted_at);
CREATE INDEX idx_sns_posts_account       ON sns_posts (account_id, posted_at);

CREATE TABLE sns_post_places (
  id           INTEGER PRIMARY KEY,
  post_id      INTEGER NOT NULL REFERENCES sns_posts(id) ON DELETE CASCADE,
  place_kind   TEXT    NOT NULL CHECK (place_kind IN ('top','spot','creature','event','post','media_page')),
  place_id     INTEGER,
  assigned_by  TEXT    NOT NULL DEFAULT 'rule' CHECK (assigned_by IN ('rule','manual')),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by   TEXT,
  UNIQUE (post_id, place_kind, place_id),
  CHECK ((place_kind IN ('top','media_page')) = (place_id IS NULL))
) STRICT;
CREATE INDEX idx_sns_post_places_place ON sns_post_places (place_kind, place_id);

CREATE TABLE sns_tag_rules (
  id          INTEGER PRIMARY KEY,
  hashtag     TEXT    NOT NULL COLLATE NOCASE,
  place_kind  TEXT    NOT NULL CHECK (place_kind IN ('top','spot','creature','event','post','media_page')),
  place_id    INTEGER,
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by  TEXT,
  UNIQUE (hashtag, place_kind, place_id),
  CHECK ((place_kind IN ('top','media_page')) = (place_id IS NULL))
) STRICT;

CREATE TABLE sns_sync_runs (
  id              INTEGER PRIMARY KEY,
  account_id      INTEGER NOT NULL REFERENCES sns_accounts(id) ON DELETE CASCADE,
  "trigger"       TEXT    NOT NULL CHECK ("trigger" IN ('cron','manual')),
  started_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  finished_at     TEXT,
  result          TEXT    NOT NULL DEFAULT 'running' CHECK (result IN ('running','success','failed')),
  fetched_count   INTEGER NOT NULL DEFAULT 0 CHECK (fetched_count  >= 0),
  inserted_count  INTEGER NOT NULL DEFAULT 0 CHECK (inserted_count >= 0),
  updated_count   INTEGER NOT NULL DEFAULT 0 CHECK (updated_count  >= 0),
  removed_count   INTEGER NOT NULL DEFAULT 0 CHECK (removed_count  >= 0),
  error_message   TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by      TEXT
) STRICT;
CREATE INDEX idx_sns_sync_runs_account ON sns_sync_runs (account_id, started_at);

-- updated_at の自動更新
CREATE TRIGGER trg_sns_accounts_updated_at AFTER UPDATE ON sns_accounts
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sns_accounts SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_sns_credentials_updated_at AFTER UPDATE ON sns_credentials
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sns_credentials SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_sns_posts_updated_at AFTER UPDATE ON sns_posts
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sns_posts SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_sns_post_places_updated_at AFTER UPDATE ON sns_post_places
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sns_post_places SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_sns_tag_rules_updated_at AFTER UPDATE ON sns_tag_rules
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sns_tag_rules SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_sns_sync_runs_updated_at AFTER UPDATE ON sns_sync_runs
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sns_sync_runs SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;

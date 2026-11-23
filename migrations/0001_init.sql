-- =====================================================================
-- ダイビング総合ポータルサイト テーブル定義
-- 方言：SQLite（Cloudflare D1 は SQLite をもとにしたデータベース）
-- 対応資料：docs/データモデル定義書.md v0.1（2026-11-23）
--
-- 実行方法（どちらか）
--   A. Cloudflare ダッシュボード → D1 → diving-db → Console に貼り付けて Execute
--   B. PowerShell：npx wrangler d1 execute diving-db --remote --file=migrations/0001_init.sql
--
-- SQLite 向けの書き方
--   ・すべて STRICT テーブル：列の型（INTEGER／REAL／TEXT）と違う値は保存できない
--     （SQLite は標準では型を厳密に見ないため、STRICT で間違いを防ぐ）
--   ・SQLite には日付型・真偽値型・列挙型がないため、次のように表す
--       日時   TEXT  ISO 8601 の世界標準時（例：2026-11-23T12:00:00Z）
--       日付   TEXT  YYYY-MM-DD（CHECK で形式を確認）
--       真偽値 INTEGER  0 / 1（CHECK で 0 と 1 以外を拒否）
--       列挙値 TEXT  CHECK (列 IN (...)) で決まった値だけ許可
--       JSON   TEXT  CHECK (json_valid(列)) で正しい JSON だけ許可
--   ・主キーは INTEGER PRIMARY KEY（SQLite の行番号を使い、自動で採番される）
--   ・updated_at は、更新時にトリガーで自動的に現在時刻になる
--   ・金額は 円・整数・税込（列名の末尾が _yen）
--   ・削除はせず status = 'archived' にする（論理削除）
-- =====================================================================

-- 外部キー制約は D1 では標準で有効（PRAGMA の指定は不要）

-- ---------------------------------------------------------------------
-- 画像（他のテーブルから参照されるため最初に作る）
-- ---------------------------------------------------------------------
CREATE TABLE media (
  id          INTEGER PRIMARY KEY,
  r2_key      TEXT    NOT NULL UNIQUE,                       -- R2 上のファイル名
  alt         TEXT    NOT NULL CHECK (length(trim(alt)) > 0), -- 代替テキスト（必須）
  width       INTEGER NOT NULL CHECK (width  > 0),
  height      INTEGER NOT NULL CHECK (height > 0),
  bytes       INTEGER NOT NULL CHECK (bytes  > 0),
  credit      TEXT,                                          -- 撮影者・出典
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by  TEXT
) STRICT;

-- =====================================================================
-- 4.1 資格
-- =====================================================================
CREATE TABLE agencies (
  id                    INTEGER PRIMARY KEY,
  code                  TEXT    NOT NULL UNIQUE,     -- padi / ssi / naui / cmas / bsac / jp
  name                  TEXT    NOT NULL,
  full_name             TEXT,
  origin                TEXT,                        -- 1966年・アメリカ
  feature               TEXT,
  official_url          TEXT,
  jp_shop_count         INTEGER CHECK (jp_shop_count IS NULL OR jp_shop_count >= 0),
  jp_shop_count_source  TEXT,
  show_tab              INTEGER NOT NULL DEFAULT 0 CHECK (show_tab IN (0,1)),
  sort_order            INTEGER NOT NULL DEFAULT 0,
  status                TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by            TEXT
) STRICT;

CREATE TABLE licenses (
  id               INTEGER PRIMARY KEY,
  agency_id        INTEGER NOT NULL REFERENCES agencies(id),
  code             TEXT    NOT NULL,                 -- ow / aow / rescue / dm / ai / instructor
  step_order       INTEGER NOT NULL CHECK (step_order >= 1),
  category         TEXT    NOT NULL CHECK (category IN ('leisure','pro')),
  is_optional      INTEGER NOT NULL DEFAULT 0 CHECK (is_optional IN (0,1)),
  name_ja          TEXT    NOT NULL,
  name_en          TEXT,
  abbr             TEXT,
  summary          TEXT    NOT NULL,
  can_do           TEXT    CHECK (can_do       IS NULL OR json_valid(can_do)),       -- JSON配列
  requirements     TEXT    CHECK (requirements IS NULL OR json_valid(requirements)), -- JSON配列
  min_age          INTEGER CHECK (min_age   IS NULL OR min_age   >= 0),
  min_dives        INTEGER CHECK (min_dives IS NULL OR min_dives >= 0),
  next_license_id  INTEGER REFERENCES licenses(id),
  note             TEXT,
  source_url       TEXT,
  checked_on       TEXT    NOT NULL CHECK (checked_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  status           TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by       TEXT,
  UNIQUE (agency_id, code)
) STRICT;
CREATE INDEX idx_licenses_agency_step ON licenses (agency_id, step_order);

CREATE TABLE license_equivalences (
  id           INTEGER PRIMARY KEY,
  level_name   TEXT    NOT NULL,                     -- はじめての資格 など
  level_order  INTEGER NOT NULL,
  agency_id    INTEGER NOT NULL REFERENCES agencies(id),
  license_id   INTEGER REFERENCES licenses(id),      -- 該当なしは NULL
  label        TEXT,                                 -- 資格がない団体用の表記
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by   TEXT,
  UNIQUE (level_order, agency_id)
) STRICT;

-- =====================================================================
-- 4.2 料金
-- =====================================================================
CREATE TABLE services (
  id           INTEGER PRIMARY KEY,
  code         TEXT    NOT NULL UNIQUE,
  kind         TEXT    NOT NULL CHECK (kind IN ('course','trial','fun_dive','refresh','photo','survey','media','tour_plan','other')),
  name         TEXT    NOT NULL,
  description  TEXT,
  license_id   INTEGER REFERENCES licenses(id),
  price_yen    INTEGER CHECK (price_yen IS NULL OR price_yen >= 0),   -- NULL = 要相談
  price_unit   TEXT    NOT NULL CHECK (price_unit IN ('person','time','day','dive','hour','project')),
  price_from   INTEGER NOT NULL DEFAULT 0 CHECK (price_from IN (0,1)), -- 1 = 「〇〇円〜」
  includes     TEXT,
  excludes     TEXT,
  duration     TEXT,
  is_estimate  INTEGER NOT NULL DEFAULT 0 CHECK (is_estimate IN (0,1)),
  checked_on   TEXT    NOT NULL CHECK (checked_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  accepting    INTEGER NOT NULL DEFAULT 1 CHECK (accepting IN (0,1)),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  status       TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by   TEXT
) STRICT;
CREATE INDEX idx_services_kind ON services (kind, sort_order);

CREATE TABLE model_plans (
  id               INTEGER PRIMARY KEY,
  code             TEXT    NOT NULL UNIQUE,          -- trial / ow / okinawa-2d / refresh
  name             TEXT    NOT NULL,
  subtitle         TEXT,
  inquiry_purpose  TEXT    NOT NULL CHECK (inquiry_purpose IN ('course','refresh','event','work','plan','other')),
  memo             TEXT,
  is_estimate      INTEGER NOT NULL DEFAULT 1 CHECK (is_estimate IN (0,1)),
  checked_on       TEXT    NOT NULL CHECK (checked_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by       TEXT
) STRICT;

-- 合計は持たない（内訳の合計で計算する）
CREATE TABLE plan_cost_items (
  id          INTEGER PRIMARY KEY,
  plan_id     INTEGER NOT NULL REFERENCES model_plans(id) ON DELETE CASCADE,
  item        TEXT    NOT NULL CHECK (item IN ('tour','rental','travel','stay','other')),
  amount_yen  INTEGER NOT NULL DEFAULT 0 CHECK (amount_yen >= 0),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by  TEXT,
  UNIQUE (plan_id, item)
) STRICT;

CREATE TABLE area_rates (
  id                  INTEGER PRIMARY KEY,
  code                TEXT    NOT NULL UNIQUE,       -- near / okinawa / asia
  name                TEXT    NOT NULL,
  dive_per_day_yen    INTEGER NOT NULL CHECK (dive_per_day_yen   >= 0),
  rental_per_day_yen  INTEGER NOT NULL CHECK (rental_per_day_yen >= 0),
  travel_yen          INTEGER NOT NULL CHECK (travel_yen         >= 0),
  stay_per_night_yen  INTEGER NOT NULL CHECK (stay_per_night_yen >= 0),
  other_per_day_yen   INTEGER NOT NULL CHECK (other_per_day_yen  >= 0),
  uses_flight         INTEGER NOT NULL DEFAULT 0 CHECK (uses_flight IN (0,1)),
  range_ratio         REAL    NOT NULL DEFAULT 0.15 CHECK (range_ratio >= 0 AND range_ratio < 1),
  is_estimate         INTEGER NOT NULL DEFAULT 1 CHECK (is_estimate IN (0,1)),
  checked_on          TEXT    NOT NULL CHECK (checked_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  sort_order          INTEGER NOT NULL DEFAULT 0,
  status              TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by          TEXT
) STRICT;

-- =====================================================================
-- 4.3 海・生き物
-- =====================================================================
CREATE TABLE purposes (
  id          INTEGER PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,               -- coral / wreck / cave / big / macro / clear
  name        TEXT    NOT NULL,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by  TEXT
) STRICT;

CREATE TABLE spots (
  id              INTEGER PRIMARY KEY,
  slug            TEXT    NOT NULL UNIQUE CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
  name            TEXT    NOT NULL,
  region          TEXT    NOT NULL CHECK (region IN ('domestic','overseas')),
  area_name       TEXT    NOT NULL,
  area_rate_id    INTEGER REFERENCES area_rates(id),
  level_min       TEXT    NOT NULL CHECK (level_min IN ('none','ow','aow','pro')),
  cost_yen        INTEGER CHECK (cost_yen IS NULL OR cost_yen >= 0),
  cost_note       TEXT,
  best_months     TEXT    CHECK (best_months IS NULL OR json_valid(best_months)),  -- [4,5,6]
  summary         TEXT    NOT NULL,
  body_md         TEXT,
  access          TEXT,
  latitude        REAL    CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
  longitude       REAL    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  cover_media_id  INTEGER REFERENCES media(id),
  is_estimate     INTEGER NOT NULL DEFAULT 1 CHECK (is_estimate IN (0,1)),
  checked_on      TEXT    NOT NULL CHECK (checked_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by      TEXT
) STRICT;
CREATE INDEX idx_spots_status_sort ON spots (status, sort_order);
CREATE INDEX idx_spots_region_area ON spots (region, area_name);

CREATE TABLE spot_purposes (
  spot_id     INTEGER NOT NULL REFERENCES spots(id)    ON DELETE CASCADE,
  purpose_id  INTEGER NOT NULL REFERENCES purposes(id) ON DELETE CASCADE,
  PRIMARY KEY (spot_id, purpose_id)
) STRICT;
CREATE INDEX idx_spot_purposes_purpose ON spot_purposes (purpose_id);

CREATE TABLE creatures (
  id              INTEGER PRIMARY KEY,
  slug            TEXT    NOT NULL UNIQUE CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
  name            TEXT    NOT NULL,
  name_kana       TEXT,
  category        TEXT    NOT NULL CHECK (category IN ('fish','turtle','ray_shark','mammal','crustacean','mollusk','coral')),
  size_text       TEXT,
  seasons         TEXT    CHECK (seasons IS NULL OR json_valid(seasons)),
  summary         TEXT,
  photo_tips      TEXT,
  cover_media_id  INTEGER REFERENCES media(id),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by      TEXT
) STRICT;
CREATE INDEX idx_creatures_category ON creatures (category, sort_order);

CREATE TABLE spot_creatures (
  spot_id      INTEGER NOT NULL REFERENCES spots(id)     ON DELETE CASCADE,
  creature_id  INTEGER NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  likelihood   TEXT    CHECK (likelihood IS NULL OR likelihood IN ('high','mid','low')),
  PRIMARY KEY (spot_id, creature_id)
) STRICT;
CREATE INDEX idx_spot_creatures_creature ON spot_creatures (creature_id);

-- =====================================================================
-- 4.4 イベント
-- =====================================================================
CREATE TABLE events (
  id              INTEGER PRIMARY KEY,
  slug            TEXT    NOT NULL UNIQUE CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
  title           TEXT    NOT NULL,
  kind            TEXT    NOT NULL CHECK (kind IN ('tour','course','meetup','cleanup','other')),
  start_at        TEXT    NOT NULL,
  end_at          TEXT    NOT NULL,
  spot_id         INTEGER REFERENCES spots(id),
  place_text      TEXT,
  level_min       TEXT    NOT NULL CHECK (level_min IN ('none','ow','aow','pro')),
  price_yen       INTEGER CHECK (price_yen IS NULL OR price_yen >= 0),
  price_note      TEXT,
  capacity        INTEGER CHECK (capacity IS NULL OR capacity > 0),   -- NULL = 定員なし
  entry_deadline  TEXT    CHECK (entry_deadline IS NULL OR entry_deadline GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  entry_status    TEXT    NOT NULL DEFAULT 'open' CHECK (entry_status IN ('open','closed','full')),
  description_md  TEXT,
  cover_media_id  INTEGER REFERENCES media(id),
  status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by      TEXT,
  CHECK (end_at >= start_at)
) STRICT;
CREATE INDEX idx_events_status_start ON events (status, start_at);

-- =====================================================================
-- 4.5 問い合わせ（個人情報を含む。公開APIからは読ませない）
-- =====================================================================
CREATE TABLE inquiries (
  id               INTEGER PRIMARY KEY,
  purpose          TEXT    NOT NULL CHECK (purpose IN ('course','refresh','event','work','plan','other')),
  service_id       INTEGER REFERENCES services(id),
  event_id         INTEGER REFERENCES events(id),
  name             TEXT,                             -- 保存期間後に消去するため NULL を許可
  email            TEXT,                             -- 同上
  phone            TEXT,
  preferred_date   TEXT,
  people           INTEGER CHECK (people IS NULL OR people > 0),
  experience       TEXT,
  budget           TEXT,
  message          TEXT    NOT NULL,
  source_page      TEXT,
  summary          TEXT,
  consent_at       TEXT    NOT NULL,
  handling_status  TEXT    NOT NULL DEFAULT 'new' CHECK (handling_status IN ('new','in_progress','waiting','done','spam')),
  assignee         TEXT,
  deleted_at       TEXT,                             -- 個人情報を消去した日時
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by       TEXT,
  -- 消去前は名前とメールを必須にする
  CHECK (deleted_at IS NOT NULL OR (name IS NOT NULL AND email IS NOT NULL))
) STRICT;
CREATE INDEX idx_inquiries_status_created ON inquiries (handling_status, created_at);
CREATE INDEX idx_inquiries_created        ON inquiries (created_at);

CREATE TABLE event_entries (
  id            INTEGER PRIMARY KEY,
  event_id      INTEGER NOT NULL REFERENCES events(id),
  inquiry_id    INTEGER NOT NULL REFERENCES inquiries(id),
  people        INTEGER NOT NULL CHECK (people >= 1),
  entry_status  TEXT    NOT NULL DEFAULT 'requested' CHECK (entry_status IN ('requested','confirmed','cancelled')),
  memo          TEXT,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by    TEXT
) STRICT;
CREATE INDEX idx_event_entries_event ON event_entries (event_id, entry_status);

CREATE TABLE inquiry_logs (
  id          INTEGER PRIMARY KEY,
  inquiry_id  INTEGER NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  action      TEXT    NOT NULL CHECK (action IN ('status_change','note','replied')),
  body        TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by  TEXT
) STRICT;
CREATE INDEX idx_inquiry_logs_inquiry ON inquiry_logs (inquiry_id, created_at);

-- =====================================================================
-- 4.6 コンテンツ
-- =====================================================================
CREATE TABLE posts (
  id              INTEGER PRIMARY KEY,
  slug            TEXT    NOT NULL UNIQUE CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
  title           TEXT    NOT NULL,
  category        TEXT    NOT NULL CHECK (category IN ('beginner','spot','creature','photo','gear','career','event_report')),
  excerpt         TEXT,
  body_md         TEXT    NOT NULL,
  cover_media_id  INTEGER REFERENCES media(id),
  has_ads         INTEGER NOT NULL DEFAULT 0 CHECK (has_ads IN (0,1)),   -- 1 = PR表記を出す
  published_at    TEXT,
  status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by      TEXT,
  CHECK (status <> 'published' OR published_at IS NOT NULL)
) STRICT;
CREATE INDEX idx_posts_status_published ON posts (status, published_at);
CREATE INDEX idx_posts_category         ON posts (category, published_at);

CREATE TABLE faqs (
  id          INTEGER PRIMARY KEY,
  category    TEXT    NOT NULL,                      -- はじめて／資格／費用／持ち物／安全・健康／イベント／依頼
  question    TEXT    NOT NULL,
  answer_md   TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by  TEXT
) STRICT;
CREATE INDEX idx_faqs_category ON faqs (category, sort_order);

CREATE TABLE gear_items (
  id                  INTEGER PRIMARY KEY,
  category            TEXT    NOT NULL CHECK (category IN ('camera','housing','light','accessory','smartphone')),
  budget_band         TEXT    NOT NULL CHECK (budget_band IN ('under_30k','under_100k','over_100k')),
  name                TEXT    NOT NULL,
  maker               TEXT,
  ref_price_yen       INTEGER CHECK (ref_price_yen IS NULL OR ref_price_yen >= 0),
  comment             TEXT,
  affiliate_url       TEXT,
  affiliate_provider  TEXT,
  media_id            INTEGER REFERENCES media(id),
  is_estimate         INTEGER NOT NULL DEFAULT 1 CHECK (is_estimate IN (0,1)),
  checked_on          TEXT    NOT NULL CHECK (checked_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  sort_order          INTEGER NOT NULL DEFAULT 0,
  status              TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by          TEXT
) STRICT;
CREATE INDEX idx_gear_items_category ON gear_items (category, budget_band, sort_order);

CREATE TABLE testimonials (
  id             INTEGER PRIMARY KEY,
  display_name   TEXT    NOT NULL,
  body           TEXT    NOT NULL,
  related_kind   TEXT    CHECK (related_kind IS NULL OR related_kind IN ('service','event','spot')),
  related_id     INTEGER,
  permission_on  TEXT    NOT NULL CHECK (permission_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  status         TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by     TEXT,
  CHECK ((related_kind IS NULL) = (related_id IS NULL))
) STRICT;

CREATE TABLE notices (
  id             INTEGER PRIMARY KEY,
  title          TEXT    NOT NULL,
  body_md        TEXT,
  link_url       TEXT,
  publish_from   TEXT    NOT NULL CHECK (publish_from GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  publish_until  TEXT    CHECK (publish_until IS NULL OR publish_until GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  status         TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by     TEXT,
  CHECK (publish_until IS NULL OR publish_until >= publish_from)
) STRICT;
CREATE INDEX idx_notices_period ON notices (status, publish_from, publish_until);

CREATE TABLE community_links (
  id           INTEGER PRIMARY KEY,
  name         TEXT    NOT NULL,
  kind         TEXT    NOT NULL CHECK (kind IN ('line_openchat','discord','facebook_group','instagram','youtube','tiktok','other')),
  url          TEXT    NOT NULL,
  description  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  status       TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by   TEXT
) STRICT;

CREATE TABLE embeds (
  id            INTEGER PRIMARY KEY,
  platform      TEXT    NOT NULL CHECK (platform IN ('youtube','youtube_playlist','instagram','tiktok','facebook')),
  url           TEXT    NOT NULL,
  title         TEXT,
  related_kind  TEXT    CHECK (related_kind IS NULL OR related_kind IN ('top','spot','creature','event','post')),
  related_id    INTEGER,                             -- related_kind が top のときは NULL
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by    TEXT
) STRICT;
CREATE INDEX idx_embeds_related ON embeds (related_kind, related_id, sort_order);

-- =====================================================================
-- 4.7 運用
-- =====================================================================
CREATE TABLE settings (
  id          INTEGER PRIMARY KEY,
  "key"       TEXT    NOT NULL UNIQUE,
  "value"     TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by  TEXT
) STRICT;

CREATE TABLE admin_users (
  id             INTEGER PRIMARY KEY,
  email          TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (email LIKE '%@link-since2026.jp'),
  display_name   TEXT    NOT NULL,
  role           TEXT    NOT NULL DEFAULT 'editor' CHECK (role IN ('owner','editor')),
  active         INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  last_login_at  TEXT,
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by     TEXT
) STRICT;

CREATE TABLE audit_logs (
  id            INTEGER PRIMARY KEY,
  actor_email   TEXT    NOT NULL,
  action        TEXT    NOT NULL CHECK (action IN ('create','update','archive','publish','import','export','login')),
  target_table  TEXT,
  target_id     INTEGER,
  diff_json     TEXT    CHECK (diff_json IS NULL OR json_valid(diff_json)),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by    TEXT
) STRICT;
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_target  ON audit_logs (target_table, target_id);

CREATE TABLE import_jobs (
  id            INTEGER PRIMARY KEY,
  file_name     TEXT    NOT NULL,
  r2_key        TEXT    NOT NULL,
  sheets        TEXT    NOT NULL CHECK (json_valid(sheets)),
  result        TEXT    NOT NULL CHECK (result IN ('previewed','applied','failed','cancelled')),
  summary_json  TEXT    CHECK (summary_json IS NULL OR json_valid(summary_json)),
  errors_json   TEXT    CHECK (errors_json  IS NULL OR json_valid(errors_json)),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_by    TEXT
) STRICT;


-- =====================================================================
-- updated_at の自動更新（更新時に updated_at を変えなかった場合だけ、現在時刻を入れる）
-- =====================================================================
CREATE TRIGGER trg_media_updated_at AFTER UPDATE ON media
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE media SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_agencies_updated_at AFTER UPDATE ON agencies
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE agencies SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_licenses_updated_at AFTER UPDATE ON licenses
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE licenses SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_license_equivalences_updated_at AFTER UPDATE ON license_equivalences
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE license_equivalences SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_services_updated_at AFTER UPDATE ON services
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE services SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_model_plans_updated_at AFTER UPDATE ON model_plans
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE model_plans SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_plan_cost_items_updated_at AFTER UPDATE ON plan_cost_items
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE plan_cost_items SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_area_rates_updated_at AFTER UPDATE ON area_rates
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE area_rates SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_purposes_updated_at AFTER UPDATE ON purposes
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE purposes SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_spots_updated_at AFTER UPDATE ON spots
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE spots SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_creatures_updated_at AFTER UPDATE ON creatures
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE creatures SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_events_updated_at AFTER UPDATE ON events
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE events SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_inquiries_updated_at AFTER UPDATE ON inquiries
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE inquiries SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_event_entries_updated_at AFTER UPDATE ON event_entries
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE event_entries SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_inquiry_logs_updated_at AFTER UPDATE ON inquiry_logs
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE inquiry_logs SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_posts_updated_at AFTER UPDATE ON posts
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE posts SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_faqs_updated_at AFTER UPDATE ON faqs
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE faqs SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_gear_items_updated_at AFTER UPDATE ON gear_items
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE gear_items SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_testimonials_updated_at AFTER UPDATE ON testimonials
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE testimonials SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_notices_updated_at AFTER UPDATE ON notices
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE notices SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_community_links_updated_at AFTER UPDATE ON community_links
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE community_links SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_embeds_updated_at AFTER UPDATE ON embeds
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE embeds SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_settings_updated_at AFTER UPDATE ON settings
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE settings SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_admin_users_updated_at AFTER UPDATE ON admin_users
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE admin_users SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_audit_logs_updated_at AFTER UPDATE ON audit_logs
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE audit_logs SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;
CREATE TRIGGER trg_import_jobs_updated_at AFTER UPDATE ON import_jobs
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE import_jobs SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;

-- =====================================================================
-- 最低限の初期値（マスタと設定）
-- 金額などの業務データはここでは入れない
-- =====================================================================
INSERT INTO purposes (code, name, sort_order) VALUES
  ('coral', 'サンゴ礁',   1),
  ('wreck', '沈船',       2),
  ('cave',  '地形・洞窟', 3),
  ('big',   '大物',       4),
  ('macro', 'マクロ',     5),
  ('clear', '透明度',     6);

INSERT INTO settings ("key", "value") VALUES
  ('site_name',              'ダイビング総合ポータル（仮）'),
  ('catch_copy',             '学ぶ・潜る・撮る・働く・つながる'),
  ('contact_email',          'info@link-since2026.jp'),
  ('contact_hours',          NULL),
  ('reply_days',             '2'),
  ('price_notice',           '表示の金額は税込の目安です。条件によって変わります。'),
  ('inquiry_retention_days', NULL);

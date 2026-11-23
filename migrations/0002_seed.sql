-- =====================================================================
-- 初期データ（0001_init.sql の後に1回だけ実行する）
-- 対応資料：docs/データモデル定義書.md 8章
--
-- 実行方法（どちらか）
--   A. Cloudflare ダッシュボード → D1 → diving-db → Console に貼り付けて Execute
--   B. PowerShell：npx wrangler d1 execute diving-db --remote --file=migrations/0002_seed.sql
--
-- 公開状態の考え方
--   ・資格・指導団体・FAQ は内容を確認済みのため「公開（published）」で入れる
--   ・料金・モデルプラン・エリア単価・スポット・自社メニューは、試作HTMLの「仮の概算」なので
--     すべて「下書き（draft）」・目安（is_estimate = 1）で入れる。
--     管理画面で金額を見直してから「公開」にすると、サイトに表示される
--   ・参加者の声・イベントは仮のものしかないため入れない
-- =====================================================================

-- ---------------------------------------------------------------------
-- 最初の管理者（owner）。★実行前に、ご自身の @link-since2026.jp のメールアドレスと名前に書き換えてください
-- ---------------------------------------------------------------------
INSERT INTO admin_users (email, display_name, role, active, updated_by) VALUES
  ('info@link-since2026.jp', '運営者', 'owner', 1, 'seed');

-- 設定のキーを追加（0001 にないもの）
INSERT OR IGNORE INTO settings ("key", "value") VALUES
  ('sns_instagram', NULL), ('sns_youtube', NULL), ('sns_tiktok', NULL), ('sns_facebook', NULL), ('price_check_days', '180');

-- 目的のアイコン
UPDATE purposes SET icon = CASE code WHEN 'coral' THEN '🪸' WHEN 'wreck' THEN '⚓' WHEN 'cave' THEN '🪨' WHEN 'big' THEN '🦈' WHEN 'macro' THEN '🦐' WHEN 'clear' THEN '💎' END;

-- ---------------------------------------------------------------------
-- 指導団体（6団体）
-- ---------------------------------------------------------------------
INSERT INTO agencies (code, name, full_name, origin, feature, jp_shop_count, jp_shop_count_source, show_tab, sort_order, status, updated_by) VALUES ('padi', 'PADI', 'Professional Association of Diving Instructors', '1966年・アメリカ', '世界最大の指導団体。認定数が多く、海外のショップでも通じやすい。段階的にステップアップする教育システム', 446, '国土交通省資料（令和6年12月現在、各団体HPのショップリストをもとに集計）', 1, 1, 'published', 'seed');
INSERT INTO agencies (code, name, full_name, origin, feature, jp_shop_count, jp_shop_count_source, show_tab, sort_order, status, updated_by) VALUES ('naui', 'NAUI', 'National Association of Underwater Instructors', '1960年・アメリカ', '非営利の指導者団体。教育の質を重視し、プロへ進む前にマスター・スクーバ・ダイバーが必要', 137, '国土交通省資料（令和6年12月現在、各団体HPのショップリストをもとに集計）', 1, 2, 'published', 'seed');
INSERT INTO agencies (code, name, full_name, origin, feature, jp_shop_count, jp_shop_count_source, show_tab, sort_order, status, updated_by) VALUES ('ssi', 'SSI', 'Scuba Schools International', '1970年代・アメリカ', 'ダイビングショップ（販売店・トレーニングセンター）を軸にした団体。オンライン学習と実習を組み合わせる', 80, '国土交通省資料（令和6年12月現在、各団体HPのショップリストをもとに集計）', 1, 3, 'published', 'seed');
INSERT INTO agencies (code, name, full_name, origin, feature, jp_shop_count, jp_shop_count_source, show_tab, sort_order, status, updated_by) VALUES ('cmas', 'CMAS', '世界水中連盟（Confédération Mondiale des Activités Subaquatiques）', 'ヨーロッパ', '各国の連盟が加盟する国際組織。1〜4つ星の「スター制」で資格を表す。ヨーロッパで広く普及', NULL, NULL, 0, 4, 'published', 'seed');
INSERT INTO agencies (code, name, full_name, origin, feature, jp_shop_count, jp_shop_count_source, show_tab, sort_order, status, updated_by) VALUES ('bsac', 'BSAC', 'British Sub-Aqua Club', '1953年・イギリス', 'イギリス最大のダイビングクラブ。日本では BSAC JAPAN が1987年から活動', 90, '国土交通省資料（令和6年12月現在、各団体HPのショップリストをもとに集計）', 0, 5, 'published', 'seed');
INSERT INTO agencies (code, name, full_name, origin, feature, jp_shop_count, jp_shop_count_source, show_tab, sort_order, status, updated_by) VALUES ('jp', '国内団体（JP など）', '各団体', '日本', '日本発祥の指導団体。国内ショップでの講習が中心', 93, '国土交通省資料（令和6年12月現在、各団体HPのショップリストをもとに集計）', 0, 6, 'published', 'seed');

-- ---------------------------------------------------------------------
-- 資格（PADI・SSI・NAUI）
-- ---------------------------------------------------------------------
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'padi'), 'ow', 1, 'leisure', 0, 'オープン・ウォーター・ダイバー', 'Open Water Diver', 'OW', '最初に取る基本の資格。トレーニングと同程度の環境で、資格を持つバディと一緒に潜れるようになります。', '["最大18mを目安に、資格を持つバディと一緒に潜れる","ファンダイブやダイビングツアーに参加できる","タンクの充填や器材レンタルを受けられる"]', '["最低年齢 15歳（10〜14歳はジュニア・オープン・ウォーター）","前提資格なし"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'padi'), 'aow', 2, 'leisure', 0, 'アドバンスド・オープン・ウォーター・ダイバー', 'Advanced Open Water Diver', 'AOW', 'ナビゲーションや中性浮力、ディープなどを体験し、潜れる環境を広げます。', '["最大30mを目安に潜れる（12〜14歳は21m）","ナイトやボートなど、楽しめるポイントが広がる","スペシャルティコースへ進みやすくなる"]', '["オープン・ウォーター・ダイバー取得済み","最低年齢 15歳（12〜14歳はジュニア）"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'padi'), 'rd', 3, 'leisure', 0, 'レスキュー・ダイバー', 'Rescue Diver', 'RD', 'トラブルの予防と対処、仲間の救助を学びます。プロを目指す人の前提資格です。', '["トラブルを予防し、早めに気づける","自分や仲間のトラブルに対処できる","プロコース（ダイブマスター）に進める"]', '["アドバンスド・オープン・ウォーター（またはアドベンチャー・ダイバー＋ナビゲーション）取得済み","24か月以内のEFR（応急手当）講習修了","最低年齢 12歳"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'padi'), 'dm', 4, 'pro', 0, 'ダイブマスター', 'Divemaster', 'DM', 'プロの最初のステップ。ダイビングのガイドや講習のアシストを行います。', '["ファンダイブのガイドができる","インストラクターの講習をアシストできる","一部のプログラム（スキンダイバーなど）を実施できる"]', '["最低年齢 18歳（15〜17歳はジュニア・ダイブマスター）","レスキュー・ダイバー取得済み","24か月以内のEFR講習修了","ログ本数：開始時 40本以上、認定時 60本以上","12か月以内の医師の診断"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'padi'), 'ai', 5, 'pro', 1, 'アシスタント・インストラクター', 'Assistant Instructor', 'AI', 'ダイブマスターとインストラクターの間の任意のステップ。一部のコースを単独で指導できます。', '["一部のコースを単独で指導できる","インストラクターの講習で知識開発などを担当できる","残りのIDCを受ければインストラクターへ進める"]', '["ダイブマスター（または同等のリーダーシップ資格）取得済み","インストラクター開発コース（IDC）のうちAIパートを修了"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'padi'), 'owsi', 6, 'pro', 0, 'オープン・ウォーター・スクーバ・インストラクター', 'Open Water Scuba Instructor', 'OWSI', '基本コースを一通り指導できるインストラクターです。', '["オープン・ウォーターからダイブマスターまでのコースを指導・認定できる","スペシャルティ・インストラクターなど上位資格へ進める"]', '["IDCを修了し、インストラクター試験（IE）に合格","IDC参加には 18歳以上、ダイバー認定から6か月以上などの条件あり"]', NULL, '2026-11-22', 'published', 'seed');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'padi' AND l2.code = 'aow') WHERE code = 'ow' AND agency_id = (SELECT id FROM agencies WHERE code = 'padi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'padi' AND l2.code = 'rd') WHERE code = 'aow' AND agency_id = (SELECT id FROM agencies WHERE code = 'padi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'padi' AND l2.code = 'dm') WHERE code = 'rd' AND agency_id = (SELECT id FROM agencies WHERE code = 'padi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'padi' AND l2.code = 'ai') WHERE code = 'dm' AND agency_id = (SELECT id FROM agencies WHERE code = 'padi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'padi' AND l2.code = 'owsi') WHERE code = 'ai' AND agency_id = (SELECT id FROM agencies WHERE code = 'padi');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'ssi'), 'ow', 1, 'leisure', 0, 'オープン・ウォーター・ダイバー', 'Open Water Diver', 'OWD', '最初に取る基本の資格。オンライン学習と実習を組み合わせて学びます。', '["資格を持つバディと一緒に潜れる","ファンダイブやダイビングツアーに参加できる"]', '["前提資格なし","年齢などの条件は確認中（SSI公式・ショップでご確認ください）"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'ssi'), 'aow', 2, 'leisure', 0, 'アドバンスド・オープン・ウォーター・ダイバー', 'Advanced Open Water Diver', 'AOWD', 'いろいろな環境での経験を積み、潜れる範囲を広げます。', '["潜れる環境・ポイントが広がる","スペシャルティで得意分野を伸ばせる"]', '["オープン・ウォーター・ダイバー取得済み","その他の条件は確認中"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'ssi'), 'rd', 3, 'leisure', 0, 'ダイバー・ストレス＆レスキュー', 'Diver Stress & Rescue', 'S&R', 'ストレス（不安・緊張）への対処と、仲間の救助を学びます。プロへ進む前提になります。', '["トラブルの兆しに気づき、予防できる","自分や仲間のトラブルに対処できる"]', '["前のステップの資格取得済み","その他の条件は確認中"]', 'レスキューに当たる資格名は「ダイバー・ストレス＆レスキュー」です。', '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'ssi'), 'dg', 4, 'pro', 0, 'ダイブガイド', 'Dive Guide', 'DG', 'SSIのプロの入口。認定ダイバーを案内するガイドの資格です。', '["認定ダイバーのファンダイブをガイドできる"]', '["ダイバー・ストレス＆レスキュー取得済み","その他の条件は確認中"]', 'プロの入口として「ダイブガイド」があり、そこからダイブマスターへ進みます。', '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'ssi'), 'dm', 5, 'pro', 0, 'ダイブマスター', 'Divemaster', 'DM', 'ガイドに加え、インストラクターの講習をアシストできるプロの資格です。', '["ファンダイブのガイドができる","インストラクターの講習をアシストできる"]', '["ダイブガイド取得済み","その他の条件は確認中"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'ssi'), 'ai', 6, 'pro', 0, 'アシスタント・インストラクター', 'Assistant Instructor', 'AI', 'インストラクターへの手前の段階。一部の講習を担当できます。', '["一部のプログラムを指導できる"]', '["ダイブマスター取得済み","その他の条件は確認中"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'ssi'), 'owi', 7, 'pro', 0, 'オープン・ウォーター・インストラクター', 'Open Water Instructor', 'OWI', '基本コースを指導できるインストラクターです。', '["オープン・ウォーター・ダイバーなどの基本コースを指導できる"]', '["アシスタント・インストラクター取得済み","その他の条件は確認中"]', NULL, '2026-11-22', 'published', 'seed');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'ssi' AND l2.code = 'aow') WHERE code = 'ow' AND agency_id = (SELECT id FROM agencies WHERE code = 'ssi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'ssi' AND l2.code = 'rd') WHERE code = 'aow' AND agency_id = (SELECT id FROM agencies WHERE code = 'ssi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'ssi' AND l2.code = 'dg') WHERE code = 'rd' AND agency_id = (SELECT id FROM agencies WHERE code = 'ssi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'ssi' AND l2.code = 'dm') WHERE code = 'dg' AND agency_id = (SELECT id FROM agencies WHERE code = 'ssi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'ssi' AND l2.code = 'ai') WHERE code = 'dm' AND agency_id = (SELECT id FROM agencies WHERE code = 'ssi');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'ssi' AND l2.code = 'owi') WHERE code = 'ai' AND agency_id = (SELECT id FROM agencies WHERE code = 'ssi');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'naui'), 'ow', 1, 'leisure', 0, 'オープン・ウォーター・スクーバ・ダイバー', 'Scuba Diver (Open Water)', 'OW', '最初に取る基本の資格です。', '["資格を持つバディと一緒に潜れる","ファンダイブやダイビングツアーに参加できる"]', '["前提資格なし","年齢などの条件は確認中（NAUI公式・ショップでご確認ください）"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'naui'), 'adv', 2, 'leisure', 0, 'アドバンスド・スクーバ・ダイバー', 'Advanced Scuba Diver', 'ADV', 'いろいろな環境での経験を積み、潜れる範囲を広げます。', '["潜れる環境・ポイントが広がる"]', '["オープン・ウォーター・スクーバ・ダイバー取得済み","その他の条件は確認中"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'naui'), 'rd', 3, 'leisure', 0, 'レスキュー・スクーバ・ダイバー', 'Rescue Scuba Diver', 'RSD', 'トラブルの予防と対処、仲間の救助を学びます。', '["トラブルを予防し、早めに気づける","自分や仲間のトラブルに対処できる"]', '["前のステップの資格取得済み","その他の条件は確認中"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'naui'), 'msd', 4, 'leisure', 0, 'マスター・スクーバ・ダイバー', 'Master Scuba Diver', 'MSD', 'レジャーダイバーの最上位。NAUIでプロ（リーダーシップ）コースに進むための前提資格です。', '["高い知識と技術を持つダイバーとして認められる","リーダーシップコースに進める"]', '["前のステップの資格取得済み","その他の条件は確認中"]', 'プロ（リーダーシップ）コースの前に「マスター・スクーバ・ダイバー」が必要です。', '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'naui'), 'ai', 5, 'pro', 0, 'アシスタント・インストラクター', 'Assistant Instructor', 'AI', 'インストラクターの講習を補助するリーダーシップ資格です。', '["インストラクターの講習を補助できる"]', '["マスター・スクーバ・ダイバー取得済み","その他の条件は確認中"]', NULL, '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'naui'), 'dm', 6, 'pro', 0, 'ダイブマスター', 'Divemaster', 'DM', 'NAUIではアシスタント・インストラクターより上位のリーダーシップ資格です。', '["ダイビングのガイドができる","講習のアシストができる"]', '["その他の条件は確認中"]', 'NAUIではダイブマスターがアシスタント・インストラクターより上の位置付けです。どちらからでもインストラクター養成コース（ITC）に進めます。', '2026-11-22', 'published', 'seed');
INSERT INTO licenses (agency_id, code, step_order, category, is_optional, name_ja, name_en, abbr, summary, can_do, requirements, note, checked_on, status, updated_by) VALUES ((SELECT id FROM agencies WHERE code = 'naui'), 'inst', 7, 'pro', 0, 'インストラクター', 'Instructor', 'INST', 'インストラクター養成コース（ITC）を修了して認定されるインストラクターです。', '["基本コースを指導・認定できる"]', '["ITC（インストラクター養成コース）修了","その他の条件は確認中"]', NULL, '2026-11-22', 'published', 'seed');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'naui' AND l2.code = 'adv') WHERE code = 'ow' AND agency_id = (SELECT id FROM agencies WHERE code = 'naui');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'naui' AND l2.code = 'rd') WHERE code = 'adv' AND agency_id = (SELECT id FROM agencies WHERE code = 'naui');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'naui' AND l2.code = 'msd') WHERE code = 'rd' AND agency_id = (SELECT id FROM agencies WHERE code = 'naui');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'naui' AND l2.code = 'ai') WHERE code = 'msd' AND agency_id = (SELECT id FROM agencies WHERE code = 'naui');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'naui' AND l2.code = 'dm') WHERE code = 'ai' AND agency_id = (SELECT id FROM agencies WHERE code = 'naui');
UPDATE licenses SET next_license_id = (SELECT l2.id FROM licenses l2 JOIN agencies g ON g.id = l2.agency_id WHERE g.code = 'naui' AND l2.code = 'inst') WHERE code = 'dm' AND agency_id = (SELECT id FROM agencies WHERE code = 'naui');
UPDATE licenses SET min_age = 15 WHERE code IN ('ow','aow') AND agency_id = (SELECT id FROM agencies WHERE code = 'padi');
UPDATE licenses SET min_age = 12 WHERE code = 'rd' AND agency_id = (SELECT id FROM agencies WHERE code = 'padi');
UPDATE licenses SET min_age = 18, min_dives = 40 WHERE code = 'dm' AND agency_id = (SELECT id FROM agencies WHERE code = 'padi');

-- ---------------------------------------------------------------------
-- 資格名の対応表（目安）
-- ---------------------------------------------------------------------
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('はじめての資格', 1, (SELECT id FROM agencies WHERE code = 'padi'), 'オープン・ウォーター・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('はじめての資格', 1, (SELECT id FROM agencies WHERE code = 'ssi'), 'オープン・ウォーター・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('はじめての資格', 1, (SELECT id FROM agencies WHERE code = 'naui'), 'オープン・ウォーター・スクーバ・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('はじめての資格', 1, (SELECT id FROM agencies WHERE code = 'cmas'), '1スター・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('経験を広げる', 2, (SELECT id FROM agencies WHERE code = 'padi'), 'アドバンスド・オープン・ウォーター・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('経験を広げる', 2, (SELECT id FROM agencies WHERE code = 'ssi'), 'アドバンスド・オープン・ウォーター・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('経験を広げる', 2, (SELECT id FROM agencies WHERE code = 'naui'), 'アドバンスド・スクーバ・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('経験を広げる', 2, (SELECT id FROM agencies WHERE code = 'cmas'), '2スター・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('救助を学ぶ', 3, (SELECT id FROM agencies WHERE code = 'padi'), 'レスキュー・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('救助を学ぶ', 3, (SELECT id FROM agencies WHERE code = 'ssi'), 'ダイバー・ストレス＆レスキュー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('救助を学ぶ', 3, (SELECT id FROM agencies WHERE code = 'naui'), 'レスキュー・スクーバ・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('救助を学ぶ', 3, (SELECT id FROM agencies WHERE code = 'cmas'), '（2〜3スターに含まれる）', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('プロの準備', 4, (SELECT id FROM agencies WHERE code = 'padi'), '－', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('プロの準備', 4, (SELECT id FROM agencies WHERE code = 'ssi'), '－', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('プロの準備', 4, (SELECT id FROM agencies WHERE code = 'naui'), 'マスター・スクーバ・ダイバー（プロコースの前提）', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('プロの準備', 4, (SELECT id FROM agencies WHERE code = 'cmas'), '－', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('ガイド・アシスト', 5, (SELECT id FROM agencies WHERE code = 'padi'), 'ダイブマスター', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('ガイド・アシスト', 5, (SELECT id FROM agencies WHERE code = 'ssi'), 'ダイブガイド → ダイブマスター', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('ガイド・アシスト', 5, (SELECT id FROM agencies WHERE code = 'naui'), 'ダイブマスター ※', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('ガイド・アシスト', 5, (SELECT id FROM agencies WHERE code = 'cmas'), '3スター・ダイバー', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('準インストラクター', 6, (SELECT id FROM agencies WHERE code = 'padi'), 'アシスタント・インストラクター', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('準インストラクター', 6, (SELECT id FROM agencies WHERE code = 'ssi'), 'アシスタント・インストラクター', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('準インストラクター', 6, (SELECT id FROM agencies WHERE code = 'naui'), 'アシスタント・インストラクター ※', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('準インストラクター', 6, (SELECT id FROM agencies WHERE code = 'cmas'), '1スター・インストラクター', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('インストラクター', 7, (SELECT id FROM agencies WHERE code = 'padi'), 'オープン・ウォーター・スクーバ・インストラクター', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('インストラクター', 7, (SELECT id FROM agencies WHERE code = 'ssi'), 'オープン・ウォーター・インストラクター', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('インストラクター', 7, (SELECT id FROM agencies WHERE code = 'naui'), 'インストラクター', 'seed');
INSERT INTO license_equivalences (level_name, level_order, agency_id, label, updated_by) VALUES ('インストラクター', 7, (SELECT id FROM agencies WHERE code = 'cmas'), '2スター・インストラクター', 'seed');

-- ---------------------------------------------------------------------
-- よくある質問
-- ---------------------------------------------------------------------
INSERT INTO faqs (category, question, answer_md, sort_order, status, updated_by) VALUES ('はじめて', '泳げなくても大丈夫ですか？', '体験ダイビングは、泳ぎに自信がなくてもインストラクターがサポートします。資格講習では、一定の距離を泳ぐ・水に浮くといった簡単な水泳の確認があります（団体により内容が異なります）。', 10, 'published', 'seed');
INSERT INTO faqs (category, question, answer_md, sort_order, status, updated_by) VALUES ('資格', '何歳から資格を取れますか？', '団体によって異なりますが、子ども向けのジュニア資格があり、10歳前後から取得できます。詳しくは資格ガイドをご覧ください。', 20, 'published', 'seed');
INSERT INTO faqs (category, question, answer_md, sort_order, status, updated_by) VALUES ('安全・健康', '耳抜きが不安です。', '耳抜きは講習でしっかり練習します。潜る前から少しずつ行うのがコツです。風邪や鼻づまりのときは無理をせずご相談ください。', 30, 'published', 'seed');
INSERT INTO faqs (category, question, answer_md, sort_order, status, updated_by) VALUES ('安全・健康', '持病があっても潜れますか？', '講習の前に健康状態の質問票に答えていただきます。内容によっては医師の確認が必要になるため、事前にご相談ください。', 40, 'published', 'seed');
INSERT INTO faqs (category, question, answer_md, sort_order, status, updated_by) VALUES ('費用', '資格取得に全部でいくらかかりますか？', '講習代のほかに、器材レンタル・交通費・宿泊などがかかります。「費用とモデルプラン」で内訳つきの目安を確認できます。', 50, 'published', 'seed');
INSERT INTO faqs (category, question, answer_md, sort_order, status, updated_by) VALUES ('持ち物', '何を持っていけばいいですか？', '水着、タオル、日焼け止め、着替えがあれば大丈夫です。器材はレンタルできます。', 60, 'published', 'seed');
INSERT INTO faqs (category, question, answer_md, sort_order, status, updated_by) VALUES ('イベント', '1人で参加しても大丈夫ですか？', 'はい、1人参加の方も多いです。バディはこちらでお組みします。', 70, 'published', 'seed');
INSERT INTO faqs (category, question, answer_md, sort_order, status, updated_by) VALUES ('依頼', '撮影の依頼はどこまで対応できますか？', '個人の記念撮影から企業の撮影まで、内容に応じてお見積りします。仕事メニューのページからご相談ください。', 80, 'published', 'seed');

-- ---------------------------------------------------------------------
-- エリア単価（仮の概算・下書き）
-- ---------------------------------------------------------------------
INSERT INTO area_rates (code, name, dive_per_day_yen, rental_per_day_yen, travel_yen, stay_per_night_yen, other_per_day_yen, uses_flight, range_ratio, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('near', '近場（伊豆など）', 15000, 5000, 6000, 9000, 3000, 0, 0.15, 1, '2026-11-22', 10, 'draft', 'seed');
INSERT INTO area_rates (code, name, dive_per_day_yen, rental_per_day_yen, travel_yen, stay_per_night_yen, other_per_day_yen, uses_flight, range_ratio, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('okinawa', '沖縄', 17000, 5000, 45000, 9000, 3000, 1, 0.15, 1, '2026-11-22', 20, 'draft', 'seed');
INSERT INTO area_rates (code, name, dive_per_day_yen, rental_per_day_yen, travel_yen, stay_per_night_yen, other_per_day_yen, uses_flight, range_ratio, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('asia', '海外（アジア近場）', 15000, 4000, 80000, 8000, 3000, 1, 0.15, 1, '2026-11-22', 30, 'draft', 'seed');

-- ---------------------------------------------------------------------
-- モデルプランと内訳（仮の概算・下書き）
-- ---------------------------------------------------------------------
INSERT INTO model_plans (code, name, subtitle, inquiry_purpose, memo, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('trial', '体験ダイビング', '近場で日帰り・資格なしでOK', 'course', '器材レンタル代は講習代に含まれることが多い', 1, '2026-11-22', 10, 'draft', 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'trial'), 'tour', 15000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'trial'), 'rental', 0, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'trial'), 'travel', 5000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'trial'), 'stay', 0, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'trial'), 'other', 2000, 'seed');
INSERT INTO model_plans (code, name, subtitle, inquiry_purpose, memo, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('ow', '資格取得（OW）', '近場で2〜3日・はじめての資格', 'course', 'その他は教材・申請料など', 1, '2026-11-22', 20, 'draft', 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'ow'), 'tour', 70000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'ow'), 'rental', 10000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'ow'), 'travel', 10000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'ow'), 'stay', 10000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'ow'), 'other', 15000, 'seed');
INSERT INTO model_plans (code, name, subtitle, inquiry_purpose, memo, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('okinawa-2d', '1泊2日の国内ツアー', '沖縄で4本・資格を持っている人', 'event', NULL, 1, '2026-11-22', 30, 'draft', 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'okinawa-2d'), 'tour', 30000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'okinawa-2d'), 'rental', 8000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'okinawa-2d'), 'travel', 40000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'okinawa-2d'), 'stay', 10000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'okinawa-2d'), 'other', 5000, 'seed');
INSERT INTO model_plans (code, name, subtitle, inquiry_purpose, memo, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('refresh', 'ブランクからの再開', 'リフレッシュ講習＋1日', 'refresh', NULL, 1, '2026-11-22', 40, 'draft', 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'refresh'), 'tour', 15000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'refresh'), 'rental', 5000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'refresh'), 'travel', 5000, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'refresh'), 'stay', 0, 'seed');
INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES ((SELECT id FROM model_plans WHERE code = 'refresh'), 'other', 2000, 'seed');

-- ---------------------------------------------------------------------
-- スポット（試作の内容・仮の概算・下書き）
-- ---------------------------------------------------------------------
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('kerama', '慶良間諸島', 'domestic', '沖縄', (SELECT id FROM area_rates WHERE code = 'okinawa'), 'none', 60000, '[4,5,6,7,8,9,10]', '那覇から船で行ける、透明度の高い海とサンゴ礁。ウミガメに出会えることも。', 1, '2026-11-22', 10, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'kerama'), (SELECT id FROM purposes WHERE code = 'coral'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'kerama'), (SELECT id FROM purposes WHERE code = 'clear'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('izu-osezaki', '伊豆・大瀬崎', 'domestic', '伊豆・関東', (SELECT id FROM area_rates WHERE code = 'near'), 'none', 25000, '[1,2,3,4,5,6,7,8,9,10,11,12]', '首都圏から日帰りできる定番ポイント。小さな生き物が多く、撮影派に人気。', 1, '2026-11-22', 20, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'izu-osezaki'), (SELECT id FROM purposes WHERE code = 'macro'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('ishigaki', '石垣島', 'domestic', '沖縄', (SELECT id FROM area_rates WHERE code = 'okinawa'), 'ow', 80000, '[5,6,7,8,9,10]', 'マンタが見られるポイントで有名。浅場のサンゴも見ごたえあり。', 1, '2026-11-22', 30, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'ishigaki'), (SELECT id FROM purposes WHERE code = 'big'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'ishigaki'), (SELECT id FROM purposes WHERE code = 'coral'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('miyako', '宮古島', 'domestic', '沖縄', (SELECT id FROM area_rates WHERE code = 'okinawa'), 'ow', 75000, '[4,5,6,7,8,9,10,11]', 'アーチや洞窟など、光が差し込むダイナミックな地形が楽しめる。', 1, '2026-11-22', 40, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'miyako'), (SELECT id FROM purposes WHERE code = 'cave'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'miyako'), (SELECT id FROM purposes WHERE code = 'clear'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('cebu', 'セブ島', 'overseas', '東南アジア', (SELECT id FROM area_rates WHERE code = 'asia'), 'ow', 120000, '[1,2,3,4,5,6,7,8,9,10,11,12]', '日本から近く、費用を抑えやすい。カラフルなサンゴと小さな生き物。', 1, '2026-11-22', 50, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'cebu'), (SELECT id FROM purposes WHERE code = 'coral'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'cebu'), (SELECT id FROM purposes WHERE code = 'macro'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('yonaguni', '与那国島', 'domestic', '沖縄', (SELECT id FROM area_rates WHERE code = 'okinawa'), 'aow', 110000, '[12,1,2,3]', '冬のハンマーヘッドシャークの群れと、迫力ある海底地形。潮が速く中級者向け。', 1, '2026-11-22', 60, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'yonaguni'), (SELECT id FROM purposes WHERE code = 'big'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'yonaguni'), (SELECT id FROM purposes WHERE code = 'cave'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('ogasawara', '小笠原諸島', 'domestic', '伊豆・関東', NULL, 'aow', 180000, '[6,7,8,9,10]', '船で丸一日かけて行く外洋の島。イルカや大物との出会いが魅力。', 1, '2026-11-22', 70, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'ogasawara'), (SELECT id FROM purposes WHERE code = 'big'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'ogasawara'), (SELECT id FROM purposes WHERE code = 'clear'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('palau', 'パラオ', 'overseas', 'ミクロネシア', NULL, 'aow', 300000, '[11,12,1,2,3,4]', 'サメやナポレオンフィッシュが集まる外洋ポイントと、洞窟・沈船まで楽しめる。', 1, '2026-11-22', 80, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'palau'), (SELECT id FROM purposes WHERE code = 'big'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'palau'), (SELECT id FROM purposes WHERE code = 'cave'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'palau'), (SELECT id FROM purposes WHERE code = 'wreck'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('chuuk', 'チューク（トラック諸島）', 'overseas', 'ミクロネシア', NULL, 'aow', 350000, '[1,2,3,4,5,6,7,8,9,10,11,12]', 'ラグーンに多くの沈船が眠る、レックダイビングの聖地。', 1, '2026-11-22', 90, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'chuuk'), (SELECT id FROM purposes WHERE code = 'wreck'));
INSERT INTO spots (slug, name, region, area_name, area_rate_id, level_min, cost_yen, best_months, summary, is_estimate, checked_on, sort_order, status, updated_by) VALUES ('maldives', 'モルディブ', 'overseas', 'インド洋', NULL, 'ow', 380000, '[1,2,3,4,11,12]', 'クルーズ船で巡るスタイルが人気。マンタやジンベエザメとの出会いも。', 1, '2026-11-22', 100, 'draft', 'seed');
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'maldives'), (SELECT id FROM purposes WHERE code = 'big'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'maldives'), (SELECT id FROM purposes WHERE code = 'coral'));
INSERT INTO spot_purposes (spot_id, purpose_id) VALUES ((SELECT id FROM spots WHERE slug = 'maldives'), (SELECT id FROM purposes WHERE code = 'clear'));

-- ---------------------------------------------------------------------
-- 自社メニュー（料金は未定のため空欄＝「要相談」・下書き）
-- ---------------------------------------------------------------------
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('trial', 'trial', '体験ダイビング', NULL, NULL, NULL, 'person', 1, '半日〜1日', 0, '2026-11-22', 1, 10, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('ow-course', 'course', 'オープン・ウォーター・ダイバー講習', NULL, (SELECT l.id FROM licenses l JOIN agencies g ON g.id = l.agency_id WHERE g.code = 'padi' AND l.code = 'ow'), NULL, 'person', 1, '2〜3日', 0, '2026-11-22', 1, 20, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('aow-course', 'course', 'アドバンスド・オープン・ウォーター・ダイバー講習', NULL, (SELECT l.id FROM licenses l JOIN agencies g ON g.id = l.agency_id WHERE g.code = 'padi' AND l.code = 'aow'), NULL, 'person', 1, '2日', 0, '2026-11-22', 1, 30, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('rescue-course', 'course', 'レスキュー・ダイバー講習', NULL, (SELECT l.id FROM licenses l JOIN agencies g ON g.id = l.agency_id WHERE g.code = 'padi' AND l.code = 'rd'), NULL, 'person', 1, '2〜3日', 0, '2026-11-22', 1, 40, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('refresh', 'refresh', 'リフレッシュ講習', NULL, NULL, NULL, 'person', 1, '半日〜1日', 0, '2026-11-22', 1, 50, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('dm-course', 'course', 'ダイブマスター講習', NULL, (SELECT l.id FROM licenses l JOIN agencies g ON g.id = l.agency_id WHERE g.code = 'padi' AND l.code = 'dm'), NULL, 'person', 1, '要相談', 0, '2026-11-22', 1, 60, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('guide', 'fun_dive', 'ダイビングガイド', '指定スポットの案内', NULL, NULL, 'day', 1, NULL, 0, '2026-11-22', 1, 70, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('photo', 'photo', '水中撮影・動画制作', '個人の記念撮影、企業・メディアの撮影', NULL, NULL, 'project', 1, NULL, 0, '2026-11-22', 1, 80, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('survey', 'survey', '水中調査・マップ作り', '海底や生き物の調査、ポイントマップの作成', NULL, NULL, 'project', 1, NULL, 0, '2026-11-22', 1, 90, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('media', 'media', '取材・出演・SNS発信', '記事や動画での紹介、PR', NULL, NULL, 'project', 1, NULL, 0, '2026-11-22', 1, 100, 'draft', 'seed');
INSERT INTO services (code, kind, name, description, license_id, price_yen, price_unit, price_from, duration, is_estimate, checked_on, accepting, sort_order, status, updated_by) VALUES ('tour-plan', 'tour_plan', 'ツアー企画', 'グループ向けのプランづくり', NULL, NULL, 'project', 1, NULL, 0, '2026-11-22', 1, 110, 'draft', 'seed');

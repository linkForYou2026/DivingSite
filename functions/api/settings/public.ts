// GET /api/settings/public  公開してよいサイト設定（受付時間・SNS など）。即時反映（60秒キャッシュ）
import type { Handler } from "../../_lib/types";
import { json } from "../../_lib/http";
import { publicSettings } from "../../_lib/public";

export const onRequestGet: Handler = async ({ env }) => json({ settings: await publicSettings(env.DB) }, { cache: 60 });

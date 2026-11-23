// GET /api/prices  料金（自社メニュー・モデルプラン・エリア単価）。即時反映（60秒キャッシュ）
import type { Handler } from "../_lib/types";
import { json } from "../_lib/http";
import { publicPrices } from "../_lib/public";

export const onRequestGet: Handler = async ({ env }) => json(await publicPrices(env.DB), { cache: 60 });

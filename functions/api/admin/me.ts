// ログイン中の管理者と、できること（画面のメニューの出し分けに使う）
import type { Handler } from "../../_lib/types";
import { json } from "../../_lib/http";
import { can, type Capability } from "../../../shared/permissions";

const CAPS: Capability[] = ["inquiries", "prices", "excel", "content", "licenses", "event_entries", "deploy", "settings", "users", "audit"];

export const onRequestGet: Handler = async ({ data }) => {
  const a = data.admin!;
  return json({ admin: a, caps: CAPS.filter((c) => can(a.role, c)) });
};

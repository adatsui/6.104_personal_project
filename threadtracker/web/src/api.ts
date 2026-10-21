/**
 * The typed client for the backend, and the signed-in user.
 *
 * Every endpoint and its input and output types come from generated/wire.ts, so
 * a misspelled endpoint or a missing field is a type error. The session lives in
 * an HttpOnly cookie that the browser sends on its own; this code never sees it.
 */
import { createHttpClient } from "@mit-sdg/sync-engine-http/client";
import { ref } from "vue";
import type { ThreadTrackerWireHttp } from "../../generated/wire.ts";

export const api = createHttpClient<ThreadTrackerWireHttp>({ baseUrl: "/api" });

/** The signed-in username, or null when signed out. */
export const currentUser = ref<string | null>(null);

/** A message to show on the sign-in page, such as after a session ends. */
export const signInNotice = ref<string | null>(null);

/** Asks the backend who is signed in, from the session cookie. */
export async function loadCurrentUser(): Promise<void> {
  const result = await api.auth.current({});
  currentUser.value = "error" in result ? null : result.username;
}

/** The successful answer of an API call, with every error case removed. */
export type Answer<T> = Exclude<Awaited<T>, { error: unknown }>;

export type ChartView = Answer<ReturnType<typeof api.charts.view>>["view"];
export type ChartRow = ChartView["rows"][number];
export type ChartColumn = ChartView["columns"][number];
export type Idea = ChartView["posts"][number];
export type IdeaComment = Idea["card"]["comments"][number];
export type ChartSummary = Answer<ReturnType<typeof api.charts.list>>["charts"][number];

/** What an idea or comment says. Blank fields count as not given. */
export type Content = { quote: string; citation: string; analysis: string };

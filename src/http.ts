import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

// Where the browser loads the app. Requests from any other origin are refused.
const publicOrigin = process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:8080";

export const policy = httpPolicy({
  publicOrigin,
  basePath: "/api",
  // The browser only ever sees these categories, never the refusal code itself.
  publicErrors: {
    // Authenticating, Sessioning
    INVALID_USERNAME: "INVALID_REQUEST",
    WEAK_PASSWORD: "INVALID_REQUEST",
    USERNAME_TAKEN: "CONFLICT",
    INVALID_CREDENTIALS: "UNAUTHORIZED",
    UNKNOWN_SESSION: "UNAUTHORIZED",
    // Charting
    CHART_NOT_FOUND: "NOT_FOUND",
    DUPLICATE_ROW: "CONFLICT",
    DUPLICATE_COLUMN: "CONFLICT",
    NOT_OWNER: "FORBIDDEN",
    ALREADY_MEMBER: "CONFLICT",
    NOT_MEMBER: "FORBIDDEN",
    NOT_IN_CHART: "NOT_FOUND",
    ALREADY_PLACED: "CONFLICT",
    ITEM_NOT_FOUND: "NOT_FOUND",
    // Posting
    POST_NOT_FOUND: "NOT_FOUND",
    QUOTE_NEEDS_CITATION: "INVALID_REQUEST",
    EMPTY_POST: "INVALID_REQUEST",
    NOT_AUTHOR: "FORBIDDEN",
    // Upvoting
    ALREADY_UPVOTED: "CONFLICT",
    NOT_UPVOTED: "CONFLICT",
    // Progressing
    INVALID_PROGRESS: "INVALID_REQUEST",
    NOT_REACHED: "FORBIDDEN",
    // ThreadTracker composition
    UNKNOWN_USER: "NOT_FOUND",
  },
  // The session lives in an HttpOnly cookie: set on register and sign-in,
  // cleared on sign-out, and filled into `session` on every other endpoint.
  cookies: {
    session: {
      name: "threadtracker-session",
      input: "session",
      issue: [
        { path: "/auth/register", value: "session", expires: "expiresAt" },
        { path: "/auth/sign-in", value: "session", expires: "expiresAt" },
      ],
      clear: ["/auth/sign-out"],
    },
  },
});

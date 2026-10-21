import { httpPolicy } from "@mit-sdg/sync-engine-http/policy";

export const policy = httpPolicy({
  basePath: "/api",
  publicErrors: {
    // Authenticating, Sessioning
    INVALID_USERNAME: "INVALID_REQUEST",
    WEAK_PASSWORD: "INVALID_REQUEST",
    USERNAME_TAKEN: "CONFLICT",
    INVALID_CREDENTIALS: "UNAUTHORIZED",
    UNKNOWN_SESSION: "UNAUTHORIZED",
    // Charting
    CHART_NOT_FOUND: "NOT_FOUND",
    NOT_OWNER: "FORBIDDEN",
    NOT_MEMBER: "FORBIDDEN",
    ALREADY_MEMBER: "CONFLICT",
    DUPLICATE_ROW: "CONFLICT",
    DUPLICATE_COLUMN: "CONFLICT",
    NOT_IN_CHART: "NOT_FOUND",
    ALREADY_PLACED: "CONFLICT",
    ITEM_NOT_FOUND: "NOT_FOUND",
    // Posting
    QUOTE_NEEDS_CITATION: "INVALID_REQUEST",
    EMPTY_POST: "INVALID_REQUEST",
    POST_NOT_FOUND: "NOT_FOUND",
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
});
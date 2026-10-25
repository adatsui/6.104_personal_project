# ThreadTracker

The problem is that between class discussions and individual essay-writing, each literature student must process pages of notes organized by discussion chronology, not book chronology or literary element, losing hours and many of the best ideas and quotes.

In ThreadTracker, each book has a chart with chapters as rows and literary elements as columns. In each cell, students post ideas. Ideas are already organized by their location in the chronology of the book (row) and their literary element (column), not by when they were discussed.

- **Live app:** https://threadtracker.mit-sdg.dev
- [P1: Design](p1.md)
- [P2: Alpha (MVP)](p2.md)
- [P3: Beta](p3.md)

# Running Locally

1. **Install.** Clone the repo, then run `cd threadtracker` and `bun install`.
2. **Set up the database.** Copy `.env.example` to `.env`. It points at the local MongoDB in `compose.yaml`, which needs Podman.
3. **Start.** Start from an empty database: `bun run db:reset`, then `bun run dev`. Open http://127.0.0.1:8080.

# Tests

Each test file gets its own database, so the tests never touch the app's data. MongoDB must be running (`bun run db:up`).

1. **Concept tests.** `bun test` runs the concept test suites in `tests/concepts/`, and nothing else. The saved output is in [test-output.txt](test-output.txt).
2. **Journey script.** `bun run journey` runs the core user journey end to end and checks every outcome. It is a script, not part of `bun test`, and the app's own database is never touched.
3. **Manual tests.** [manual-tests.md](manual-tests.md) covers what the automated tests cannot: that the Vue frontend updates without a page refresh, shows informative error messages, and enforces access in the browser.
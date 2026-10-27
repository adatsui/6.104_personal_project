# ThreadTracker Design Document

ThreadTracker organizes a literature class's discussion by where it belongs in the book: each book is a chart with chapters as rows and literary elements as columns, and students post ideas in the cell they are about. This document summarizes how the final app differs from the concept design in [P1](p1.md) and the visual design in [P3](p3.userjourney.md), and why.

- **Live app:** https://threadtracker.mit-sdg.dev
- **Specifications:** [at P1](https://github.com/adatsui/6.104_personal_project/blob/13740bf/p1.md#concept-design) · [final concepts](design/concepts/) · [final reactions](design/compositions/ThreadTracker.md)

## 1. Changes from the P1 Concept Design

The five concepts from P1 stayed: Charting, Posting, Upvoting, Progressing, and Authenticating. Sessioning was added, so the session lives in a cookie the front end never handles.

**Concepts**
- **Checks are actions, not queries.** In sync-engine, the framework the app is built on, a reaction (a rule that connects concepts) whose condition fails doesn't refuse the request; the request waits until it times out. So P1's `_isMember`, `_rowIndex`, and `_itemIndex` became actions that refuse with a code and a message: `checkMember`, `checkRow`, `checkCell`, `checkItem`, and `checkOwner` in Charting, and `checkReached` in Progressing.
- **Comments are not placed in the chart.** In P1, a comment was placed in its post's cell, so it would have appeared as a separate idea in the chart and the export. Now only top-level posts are placed and upvoted, and comments are one level deep under their post.
- **Progress is set by chapter, not by number.** A member chooses a chapter, and `checkRow` turns it into a position, so progress can't point past the last chapter. Choosing an earlier chapter hides the later ones again.
- **Filtering moved to the front end.** sync-engine signatures can't take lists, so `_filter(chart, rows?, columns?)` became `_items(chart)`. The front end filters data that already excludes unread chapters, so a filter can't reveal one.
- **Members are visible to members.** `_members` lists a chart's members on Chart Settings, with a count on the chart page.

**Reactions and access control**
- **Every request is authenticated first.** Each endpoint turns the session cookie into an account before anything else, so no request can act as someone else.
- **Every check runs before the first change.** My P2 notes found that posting to a literary element outside the chart created the idea and then failed to place it, leaving an idea no one could see. In P4, `checkCell` checks the chapter and the literary element first:

  ```
  current session → checkMember → checkCell → checkReached → Posting.create → Charting.addItem
                    (refuse before any change)                 (changes)
  ```
- **Spoilers are blocked on the server.** The chart view sends only the ideas in chapters the member has read, and unread chapters only by position, since a chapter's title can itself be a spoiler (for example, "The Death of Samuel"). Exporting uses the same view.
- **Cleanup happens in reactions.** P1 left open that deleting a post leaves its upvotes. Now two reactions run on every `Posting.delete`: one clears its upvotes, and one removes it from its cell.
- **Only the owner adds members**, and since P4 a non-owner can't use the add-member errors to find out which usernames are registered. P1 left open who can add literary elements; any member can.

## 2. Changes from the P3 Visual Design

The [P3 study](design/study/) chose the look of a book over the look of a dashboard, and the final app keeps it:
- **Two voices.** Source Serif 4 for the book (headings, chapter labels, book titles, quotes) and Source Sans 3 for the students (analysis, comments, buttons).
- **One accent per area.** Blue for the chart and posting, Penguin orange for responding to classmates (upvotes and comments), and library-lamp green for my own reading (progress, read chapters, and the cell panel). Unread chapters are plain gray.
- **What changed from the study.** The study gave orange to the side panel, but the panel became green, since it names a cell of the chart, and orange was kept for interactions. After comparing mockups, the cream was made slightly cooler and the accents brighter.

## 3. Key Decisions

- **The teacher has no special view.** The owner marks progress like every other member, so the chart works the same for everyone.
- **The interface uses the class's words:** "ideas," "chapters," "literary elements," and "I have read."
- **Error messages give a direction first,** such as "Choose a different username. That username is already taken."
- **Exports open the print dialog,** where the user saves a PDF of the chosen literary elements and chapters, in chapter order.

## 4. Testing

- **Concept tests** (`bun test`) cover each concept's principle, every action, and refusals that check nothing changed.
- **The journey script** (`bun run journey`) runs the whole user journey through the same endpoints as the front end, including the cleanup reactions and the access checks.
- **Manual tests** ([manual-tests.md](manual-tests.md)) were run on the deployed app, covering persistence, access control, and error messages.

## 5. Open Issues

- **Spoilers inside ideas.** An idea in an early chapter can still mention later events. P1 noted this, and the app doesn't prevent it.
- **Live updates.** Other members' ideas appear when the user clicks Refresh.
- **Comments** can't be upvoted or replied to.
- **Members** can't be removed, and charts can't be deleted.
- **One error category covers two cases,** such as `FORBIDDEN` for both not being a member and not having read a chapter.
# Manual Tests

These checks cover what the automated tests cannot: that the Vue frontend updates without a page refresh, shows informative error messages, and enforces access in the browser. The concept test suites (`bun test`) and the journey script (`bun run journey`) cover the rest.

## Setup

1. Start from an empty database: `bun run db:reset`, then `bun run dev`.
2. Open http://127.0.0.1:8080 in three Chrome sessions, so each can be signed in as a different account:
   - **Teacher:** a normal window
   - **Millie:** an Incognito window
   - **Classmate:** a second Chrome profile, or a different browser

"Without a refresh" means the change appears without reloading the page, and the browser's reload button is never used.

## 0. Setting up

| # | Steps | Expected | Result |
|---|---|---|---|
| 0.1 | Open http://127.0.0.1:8080/charts/anything while signed out. | You are sent to the sign-in page. | ✅ |
| 0.2 | Create accounts `teacher`, `millie`, and `classmate` in their sessions. | Each lands on My Charts, which says you are not a member of any chart yet. | ✅ |
| 0.3 | Create account `millie` again in another session. | "Choose a different username. That username is already taken." No account is created. | ✅ |
| 0.4 | Create account `ab` (too short). | "Choose a username of 3 to 32 letters, numbers, underscores, or hyphens, and a password of 8 to 128 characters." | ✅ |
| 0.5 | Sign in as `millie` with the wrong password. | "Check your username and password. They do not match an account." | ✅ |
| 0.6 | As teacher, click New chart. Leave the title blank and click Create chart. | "Add a title. A chart needs a title." | ✅ |
| 0.7 | As teacher, enter two chapters with the same name. | "Rename one of the chapters. Two chapters are named "…"." No chart is created. | ✅ |
| 0.8 | As teacher, enter two literary elements with the same name. | "Rename one of the literary elements. Two literary elements are named "…"." No chart is created. | ✅ |
| 0.9 | As teacher, create *East of Eden* with 5 chapters (use real titles, such as "The Salinas Valley") and the literary elements "free will," "sibling rivalry," and "Cain and Abel." | The chart page opens. All 5 chapters are greyed out as "Chapter 1" to "Chapter 5," with no titles, and the page says "Chapters 1–5 have not been read." | ✅ |
| 0.10 | As teacher, open Chart Settings and add `nobody`. | "Check the username. No one has registered as "nobody"." | ✅ |
| 0.11 | As teacher, add `millie` and `classmate`. | Each shows "… is now a member of this chart." | ✅ |
| 0.12 | As teacher, add `millie` again. | "Choose someone else. millie is already a member of this chart." | ✅ |
| 0.13 | As Millie, reload My Charts. | *East of Eden* is listed, with owner teacher. | ✅ |
| 0.14 | As Millie, open the chart, then open Chart Settings. | There is no add-member form, only "Only the owner of this chart, teacher, can add members." | ✅ |

## 1. Reading and marking progress

| # | Steps | Expected | Result |
|---|---|---|---|
| 1.1 | As Millie, choose Chapter 3 under "I have read." | Without a refresh, chapters 1–3 show their titles, and 4–5 stay greyed out as "Chapter 4" and "Chapter 5." The page says "Chapters 4–5 have not been read." | ✅ |
| 1.2 | As Millie, check the "I have read" menu and the Chapters from/to menus. | Read chapters show their titles. Chapters 4 and 5 appear only as "Chapter 4" and "Chapter 5." | ✅ |
| 1.3 | As the classmate, and then as the teacher, choose Chapter 5 under "I have read." | All 5 chapters show their titles for them. Millie's view still shows only 1–3. | ✅ |

## 2. Posting an idea

| # | Steps | Expected | Result |
|---|---|---|---|
| 2.1 | As Millie, click the cell for Chapter 3 and "sibling rivalry." | A panel opens on the right, titled with the chapter and literary element. It says "No ideas here yet." | ✅ |
| 2.2 | In the panel, enter only a quote and click Post idea. | "Add a citation. A quote needs a citation." Nothing is posted. | ✅ |
| 2.3 | Enter only a citation. | "Add a quote. A citation needs a quote." | ✅ |
| 2.4 | Leave every field empty. | "Add a quote or an analysis. An idea cannot be empty." | ✅ |
| 2.5 | Enter a quote, a citation, and an analysis, then click Post idea. | Without a refresh, the idea appears in the panel with Millie's username, the form clears, and the cell reads "1 idea." | ✅ |
| 2.6 | As Millie, click Edit on her idea, change the analysis, and click Save. | The new text appears without a refresh. | ✅ |
| 2.7 | As the classmate, click Refresh, then open the same cell. | Millie's idea is there, with no Edit or Delete links for the classmate. | ✅ |

## 3. Revisiting earlier events

| # | Steps | Expected | Result |
|---|---|---|---|
| 3.1 | As the classmate, post an idea in Chapter 2 and "Cain and Abel" about Adam's name etymology. | It appears in the classmate's panel. | ✅ |
| 3.2 | As the classmate, post an idea in Chapter 5 and "free will." | It appears for the classmate. | ✅ |
| 3.3 | As Millie, click Refresh. | Chapter 2 and "Cain and Abel" reads "1 idea." Nothing appears in Chapter 5, which is still greyed out with no cell to click. | ✅ |
| 3.4 | As Millie, open the etymology idea and click Upvote. | Without a refresh, the count goes to "1 upvote," and the button becomes "Remove upvote." | ✅ |
| 3.5 | Click Remove upvote. | The count goes back to "0 upvotes," and the button says "Upvote." | ✅ |
| 3.6 | Upvote it again, then write a comment and click Comment. | The comment appears under the idea with Millie's username, without a refresh. | ✅ |
| 3.7 | Click "Add a quote" in the comment form, enter only a quote, and click Comment. | "Add a citation. A quote needs a citation." | ✅ |
| 3.8 | Click Delete next to Millie's comment. | The comment disappears without a refresh, and the idea stays. | ✅ |
| 3.9 | As the classmate, open Chart Settings and add the literary element "names." | ""names" was added to the chart." It appears at the end of the list, and as a new column on the chart. | ✅ |
| 3.10 | As the classmate, add "names" again. | "Choose a different name. This chart already has a literary element called "names"." | ✅ |

## 4. Falling behind

| # | Steps | Expected | Result |
|---|---|---|---|
| 4.1 | As Millie, choose Chapter 2 under "I have read." | Chapter 3 goes back to "Chapter 3," greyed out with no title, and Millie's Chapter 3 idea is hidden. | ✅ |
| 4.2 | As Millie, post an idea in Chapter 2. | The idea appears, since she has read that chapter. | ✅ |
| 4.3 | Choose Chapter 3 again. | Chapter 3 shows its title and her earlier idea again. | ✅ |

## 5. Filtering and exporting

| # | Steps | Expected | Result |
|---|---|---|---|
| 5.1 | As Millie, uncheck "free will" and "names." | Those columns disappear without a refresh. | ✅ |
| 5.2 | Set Chapters from the second chapter's title to the third's. | Only those chapters show. Chapters 4–5 stay greyed out. | ✅ |
| 5.3 | Click Export. | The export page opens and the print dialog appears. Choose "Save as PDF." | ✅ |
| 5.4 | Check the PDF. | It lists the ideas from Chapters 2 and 3 in "sibling rivalry" and "Cain and Abel," in chapter order. Each has its literary element, quote, citation, analysis, and comments. Nothing from Chapters 4–5 appears. | ✅ |
| 5.5 | As the classmate, export with every literary element checked. | The export includes the Chapter 5 idea. | ✅ |

## Access and persistence

| # | Steps | Expected | Result |
|---|---|---|---|
| A.1 | Create account `outsider` and paste the *East of Eden* chart URL. | "Ask the owner of this chart to add you. You are not a member of this chart." No ideas are shown. | ✅ |
| A.2 | As `outsider`, in the browser console (Cmd+Option+J), run `fetch("/api/posts/create", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({chart: "<chart id from the URL>", row: "x", column: "x", analysis: "x"})}).then(r => r.json()).then(console.log)`. | The server answers `{error: "FORBIDDEN"}`, even though the UI never offered this. | ✅ |
| A.3 | As Millie, click Sign out, then paste the chart URL. | You are sent to the sign-in page, and no chart data is shown. | ✅ |
| A.4 | Stop `bun run dev` with Ctrl+C, start it again, and sign in as Millie. | Her account, the chart, her progress, ideas, comments, and upvotes are all still there. | ✅ |

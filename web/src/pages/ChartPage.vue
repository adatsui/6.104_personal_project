<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { api, type ChartColumn, type ChartRow, type ChartView } from "../api.ts";
import CellPanel from "../components/CellPanel.vue";
import { messageFor } from "../errors.ts";

const props = defineProps<{ chart: string }>();
const router = useRouter();

const view = ref<ChartView | null>(null);
const loadError = ref<string | null>(null);
const progressError = ref<string | null>(null);
const refreshing = ref(false);

// The open cell, by row and column id.
const openRow = ref<string | null>(null);
const openColumn = ref<string | null>(null);

// Filters: which literary elements to show, and which read chapters (by index).
const hiddenColumns = ref(new Set<string>());
const fromIndex = ref(1);
const toIndex = ref(0);

async function load() {
  const result = await api.charts.view({ chart: props.chart });
  if ("error" in result) {
    loadError.value = messageFor("openChart", result.error);
    return;
  }
  const previousReached = view.value?.reached ?? 0;
  view.value = result.view;
  // Keep the chapter range showing everything read, unless it was narrowed.
  if (toIndex.value === previousReached || toIndex.value > result.view.reached) toIndex.value = result.view.reached;
  if (fromIndex.value > toIndex.value) fromIndex.value = 1;
}

onMounted(load);
watch(() => props.chart, load);

async function refresh() {
  refreshing.value = true;
  await load();
  refreshing.value = false;
}

/** Every chapter, in book order: read ones with their titles, unread ones by position. */
const allChapters = computed(() => {
  if (view.value === null) return [];
  const read = view.value.rows.map((r) => ({ row: r.row, index: r.index, label: r.label, read: true }));
  const unread = view.value.unreadRows.map((r) => ({
    row: r.row,
    index: r.index,
    label: `Chapter ${r.index}`,
    read: false,
  }));
  return [...read, ...unread].sort((a, b) => a.index - b.index);
});

const progressRow = computed(() => view.value?.rows.find((r) => r.index === view.value?.reached)?.row ?? "");

async function setProgress(event: Event) {
  progressError.value = null;
  const row = (event.target as HTMLSelectElement).value;
  const result = await api.charts.progress({ chart: props.chart, row });
  if ("error" in result) {
    progressError.value = messageFor("progress", result.error);
    return;
  }
  await load();
}

const visibleColumns = computed<ChartColumn[]>(
  () => view.value?.columns.filter((c) => !hiddenColumns.value.has(c.column)) ?? [],
);

const visibleRows = computed<ChartRow[]>(
  () => view.value?.rows.filter((r) => r.index >= fromIndex.value && r.index <= toIndex.value) ?? [],
);

function toggleColumn(column: string) {
  const next = new Set(hiddenColumns.value);
  if (next.has(column)) next.delete(column);
  else next.add(column);
  hiddenColumns.value = next;
}

function countIn(row: string, column: string): number {
  return view.value?.posts.filter((p) => p.row === row && p.column === column).length ?? 0;
}

function ideas(count: number): string {
  return count === 1 ? "1 idea" : `${count} ideas`;
}

/** "Chapters 4–55 have not been read." in book positions. */
const unreadNote = computed(() => {
  const unread = view.value?.unreadRows ?? [];
  if (unread.length === 0) return null;
  const first = unread[0]!.index;
  const last = unread[unread.length - 1]!.index;
  return first === last ? `Chapter ${first} has not been read.` : `Chapters ${first}–${last} have not been read.`;
});

function openCell(row: string, column: string) {
  openRow.value = row;
  openColumn.value = column;
}

const openCellRow = computed(() => view.value?.rows.find((r) => r.row === openRow.value) ?? null);
const openCellColumn = computed(() => view.value?.columns.find((c) => c.column === openColumn.value) ?? null);

function exportChart() {
  void router.push({
    name: "export",
    params: { chart: props.chart },
    query: {
      columns: visibleColumns.value.map((c) => c.column).join(","),
      from: String(fromIndex.value),
      to: String(toIndex.value),
    },
  });
}
</script>

<template>
  <p v-if="loadError" class="error">{{ loadError }}</p>
  <p v-else-if="view === null" class="notice">Loading…</p>
  <div v-else class="page" :class="{ 'with-panel': openCellRow && openCellColumn }">
    <section class="chart">
      <div class="heading">
        <h1>{{ view.title }}</h1>
        <nav>
          <RouterLink :to="{ name: 'myCharts' }">← My Charts</RouterLink>
          <RouterLink :to="{ name: 'chartSettings', params: { chart } }">Chart Settings</RouterLink>
        </nav>
      </div>

      <div class="controls">
        <div class="control">
          <label for="progress">I have read</label>
          <select id="progress" :value="progressRow" @change="setProgress">
            <option v-if="view.reached === 0" value="" disabled>choose</option>
            <option v-for="chapter in allChapters" :key="chapter.row" :value="chapter.row">
              {{ chapter.label }}
            </option>
          </select>
        </div>
        <p v-if="progressError" class="error">{{ progressError }}</p>

        <div class="control">
          <span class="control-label">Literary elements</span>
          <label v-for="column in view.columns" :key="column.column" class="check">
            <input
              type="checkbox"
              :checked="!hiddenColumns.has(column.column)"
              @change="toggleColumn(column.column)"
            />
            {{ column.label }}
          </label>
        </div>

        <div v-if="view.rows.length > 0" class="control">
          <span class="control-label">Chapters</span>
          from
          <select v-model.number="fromIndex" aria-label="From chapter">
            <option v-for="row in view.rows" :key="row.row" :value="row.index" :disabled="row.index > toIndex">
              {{ row.label }}
            </option>
          </select>
          to
          <select v-model.number="toIndex" aria-label="To chapter">
            <option v-for="row in view.rows" :key="row.row" :value="row.index" :disabled="row.index < fromIndex">
              {{ row.label }}
            </option>
          </select>
        </div>

        <div class="buttons">
          <button type="button" :disabled="refreshing" @click="refresh">{{ refreshing ? "Refreshing…" : "Refresh" }}</button>
          <button type="button" class="primary" :disabled="view.rows.length === 0" @click="exportChart">Export</button>
        </div>
      </div>

      <p v-if="view.reached === 0" class="notice">
        Choose the last chapter you have read under "I have read" to open those chapters.
      </p>

      <div class="grid-wrap">
        <table class="grid">
          <thead>
            <tr>
              <th></th>
              <th v-for="column in visibleColumns" :key="column.column">{{ column.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.row">
              <th scope="row">{{ row.label }}</th>
              <td v-for="column in visibleColumns" :key="column.column">
                <button
                  type="button"
                  class="cell"
                  :class="{ open: openRow === row.row && openColumn === column.column, empty: countIn(row.row, column.column) === 0 }"
                  @click="openCell(row.row, column.column)"
                >
                  {{ countIn(row.row, column.column) === 0 ? "·" : ideas(countIn(row.row, column.column)) }}
                </button>
              </td>
            </tr>
            <tr v-for="row in view.unreadRows" :key="row.row" class="unread">
              <th scope="row">Chapter {{ row.index }}</th>
              <td v-for="column in visibleColumns" :key="column.column"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="unreadNote" class="notice">{{ unreadNote }}</p>
    </section>

    <CellPanel
      v-if="openCellRow && openCellColumn"
      :chart="chart"
      :row="openCellRow"
      :column="openCellColumn"
      :ideas="view.posts.filter((p) => p.row === openCellRow!.row && p.column === openCellColumn!.column)"
      @changed="load"
      @close="openRow = null"
    />
  </div>
</template>

<style scoped>
.page { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; align-items: start; }
.page.with-panel { grid-template-columns: minmax(0, 1fr) 26rem; }
.heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 0 1rem; }
.heading nav { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; }
.controls { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.control { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; }
.control > label:first-child, .control-label { font-weight: 600; margin: 0; min-width: 8.5rem; }
.check { display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 400; margin: 0; }
.buttons { display: flex; gap: 0.5rem; }

/* Green = my reading: the "I have read" control. */
label[for="progress"] { color: var(--green-text); }
#progress { border-color: var(--green); box-shadow: inset 3px 0 0 var(--green); }

.grid-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
.grid { border-collapse: collapse; width: 100%; }
.grid th, .grid td { border-bottom: 1px solid var(--line); padding: 0; text-align: left; }
.grid thead th { padding: 0.5rem 0.75rem; background: var(--paper-deep); font-weight: 600; }
/* Chapter labels are the book's voice. Rows I have read get a thin green left edge. */
.grid tbody th {
  padding: 0.5rem 0.75rem; font-family: var(--serif); font-weight: 600; white-space: nowrap;
  box-shadow: inset 3px 0 0 var(--green);
}
.grid tr:last-child th, .grid tr:last-child td { border-bottom: none; }

/* Blue = the chart: idea counts and hover. Orange outline = the cell whose ideas are open. */
.cell {
  width: 100%; border: none; border-radius: 0; text-align: left;
  padding: 0.5rem 0.75rem; background: none; color: var(--blue);
}
.cell.empty { color: var(--muted); }
.cell:hover { background: var(--blue-soft); }
.cell.open { background: var(--blue-soft); font-weight: 600; outline: 2px solid var(--orange); outline-offset: -2px; }

/* Unread chapters: grayed out, with no green edge. */
.grid .unread th, .grid .unread td { background: var(--unread); }
.grid .unread th { color: var(--unread-text); font-style: italic; font-weight: 400; box-shadow: none; }
</style>

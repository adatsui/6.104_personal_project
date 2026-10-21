<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api, type ChartView } from "../api.ts";
import { messageFor } from "../errors.ts";

const props = defineProps<{ chart: string }>();
const route = useRoute();

const view = ref<ChartView | null>(null);
const error = ref<string | null>(null);

// The chart page passes its filter: literary elements, and a chapter range.
const chosen = computed(() => new Set(String(route.query.columns ?? "").split(",").filter((c) => c !== "")));
const from = computed(() => Number(route.query.from ?? 1));
const to = computed(() => Number(route.query.to ?? Infinity));

onMounted(async () => {
  const result = await api.charts.export({ chart: props.chart });
  if ("error" in result) {
    error.value = messageFor("openChart", result.error);
    return;
  }
  view.value = result.view;
  await nextTick();
  printPage();
});

function printPage() {
  window.print();
}

const columnLabel = computed(() => new Map(view.value?.columns.map((c) => [c.column, c.label]) ?? []));

/** Each chapter in range, in book order, with its ideas in the chosen literary elements. */
const chapters = computed(() =>
  (view.value?.rows ?? [])
    .filter((r) => r.index >= from.value && r.index <= to.value)
    .map((r) => ({
      ...r,
      ideas: view.value!.posts.filter((p) => p.row === r.row && chosen.value.has(p.column)),
    }))
    .filter((r) => r.ideas.length > 0),
);

const elementNames = computed(() =>
  (view.value?.columns ?? []).filter((c) => chosen.value.has(c.column)).map((c) => c.label),
);
</script>

<template>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-else-if="view === null" class="notice">Loading…</p>
  <article v-else class="export">
    <p class="no-print">
      <RouterLink :to="{ name: 'chart', params: { chart } }">← Back to the chart</RouterLink>
      ·
      <button type="button" class="link" @click="printPage">Print or save as PDF</button>
    </p>
    <h1>{{ view.title }}</h1>
    <p class="scope">{{ elementNames.join(", ") }}</p>
    <p v-if="chapters.length === 0" class="notice">There are no ideas in these literary elements and chapters yet.</p>
    <section v-for="chapter in chapters" :key="chapter.row">
      <h2>{{ chapter.label }}</h2>
      <div v-for="idea in chapter.ideas" :key="idea.post" class="idea">
        <p class="element">{{ columnLabel.get(idea.column) }}</p>
        <blockquote v-if="idea.card.quote">“{{ idea.card.quote }}” <cite>— {{ idea.card.citation }}</cite></blockquote>
        <p v-if="idea.card.analysis">{{ idea.card.analysis }}</p>
        <ul v-if="idea.card.comments.length > 0" class="comments">
          <li v-for="comment in idea.card.comments" :key="comment.comment">
            <blockquote v-if="comment.quote">“{{ comment.quote }}” <cite>— {{ comment.citation }}</cite></blockquote>
            {{ comment.analysis }}
          </li>
        </ul>
      </div>
    </section>
  </article>
</template>

<style scoped>
.export { font-family: Georgia, "Times New Roman", serif; }
.scope { color: var(--muted); margin-top: -0.5rem; }
h2 { border-bottom: 1px solid var(--line); padding-bottom: 0.25rem; }
.idea { margin: 0 0 1rem; break-inside: avoid; }
.element { font-family: system-ui, sans-serif; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin: 0 0 0.2rem; }
blockquote { margin: 0 0 0.3rem; font-style: italic; }
cite { font-style: normal; color: var(--muted); }
.idea p { margin: 0 0 0.3rem; }
.comments { margin: 0.25rem 0 0; padding-left: 1rem; border-left: 2px solid var(--line); list-style: none; }
@media print {
  .no-print { display: none; }
}
</style>

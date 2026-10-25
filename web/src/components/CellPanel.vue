<script setup lang="ts">
import { api, type ChartColumn, type ChartRow, type Content, type Idea } from "../api.ts";
import { messageFor } from "../errors.ts";
import IdeaCard from "./IdeaCard.vue";
import IdeaForm from "./IdeaForm.vue";

const props = defineProps<{ chart: string; row: ChartRow; column: ChartColumn; ideas: Idea[] }>();
const emit = defineEmits<{ changed: []; close: [] }>();

async function addIdea(content: Content): Promise<string | null> {
  const result = await api.posts.create({
    chart: props.chart,
    row: props.row.row,
    column: props.column.column,
    ...content,
  });
  if ("error" in result) return messageFor("idea", result.error);
  emit("changed");
  return null;
}
</script>

<template>
  <aside class="panel">
    <header>
      <h2>{{ row.label }} · {{ column.label }}</h2>
      <button type="button" class="link" aria-label="Close" @click="emit('close')">✕</button>
    </header>
    <p v-if="ideas.length === 0" class="notice">No ideas here yet.</p>
    <IdeaCard v-for="idea in ideas" :key="idea.post" :chart="chart" :idea="idea" @changed="emit('changed')" />
    <h2>Add an idea</h2>
    <IdeaForm :key="`${row.row}:${column.column}`" kind="idea" submit-label="Post idea" :send="addIdea" />
  </aside>
</template>

<style scoped>
/* The panel holds classmates' ideas, so it carries orange: a top border and a tinted header. */
.panel {
  position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow-y: auto;
  border: 1px solid var(--line); border-top: 3px solid var(--orange); border-radius: 8px;
  padding: 0 1rem 1rem; background: var(--paper);
}
header {
  display: flex; justify-content: space-between; align-items: center;
  position: sticky; top: 0; z-index: 1; background: var(--orange-soft);
  margin: 0 -1rem; padding: 1rem 1rem 0; border-bottom: 1px solid var(--line);
}
header h2 { margin: 0 0 0.75rem; }
</style>

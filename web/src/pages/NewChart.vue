<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api.ts";
import { messageFor } from "../errors.ts";

const router = useRouter();
const title = ref("");
const chapters = ref("");
const elements = ref("");
const error = ref<string | null>(null);
const busy = ref(false);

/** One label per line, with blank lines dropped. */
function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function duplicate(labels: string[]): string | undefined {
  return labels.find((label, i) => labels.indexOf(label) !== i);
}

async function create() {
  error.value = null;
  const rowLabels = lines(chapters.value);
  const columnLabels = lines(elements.value);
  if (title.value.trim() === "") {
    error.value = "Add a title. A chart needs a title.";
    return;
  }
  if (rowLabels.length === 0) {
    error.value = "Add at least one chapter. A chart needs chapters to track.";
    return;
  }
  const sameChapter = duplicate(rowLabels);
  if (sameChapter !== undefined) {
    error.value = `Rename one of the chapters. Two chapters are named "${sameChapter}".`;
    return;
  }
  const sameElement = duplicate(columnLabels);
  if (sameElement !== undefined) {
    error.value = `Rename one of the literary elements. Two literary elements are named "${sameElement}".`;
    return;
  }
  busy.value = true;
  const result = await api.charts.create({ title: title.value.trim(), rowLabels, columnLabels });
  busy.value = false;
  if ("error" in result) {
    error.value = messageFor("newChart", result.error);
    return;
  }
  await router.push({ name: "chart", params: { chart: result.chart } });
}
</script>

<template>
  <RouterLink :to="{ name: 'myCharts' }">← My Charts</RouterLink>
  <h1>New chart</h1>
  <form @submit.prevent="create">
    <label for="title">Title</label>
    <input id="title" v-model="title" type="text" placeholder="East of Eden" />

    <label for="chapters">Chapters <span class="hint">one per line, in book order</span></label>
    <textarea id="chapters" v-model="chapters" rows="8" placeholder="Chapter 1&#10;Chapter 2&#10;Chapter 3"></textarea>

    <label for="elements">Literary elements <span class="hint">one per line</span></label>
    <textarea id="elements" v-model="elements" rows="5" placeholder="free will&#10;sibling rivalry&#10;Cain and Abel"></textarea>

    <p v-if="error" class="error">{{ error }}</p>
    <div class="actions">
      <button type="submit" class="primary" :disabled="busy">Create chart</button>
    </div>
  </form>
</template>

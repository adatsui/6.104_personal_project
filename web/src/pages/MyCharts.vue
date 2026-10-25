<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, type ChartSummary } from "../api.ts";
import { messageFor } from "../errors.ts";

const charts = ref<ChartSummary[] | null>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  const result = await api.charts.list({});
  if ("error" in result) {
    error.value = messageFor("openChart", result.error);
    return;
  }
  charts.value = result.charts;
});
</script>

<template>
  <div class="heading">
    <h1>My Charts</h1>
    <RouterLink :to="{ name: 'newChart' }"><button type="button" class="primary">New chart</button></RouterLink>
  </div>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-else-if="charts === null" class="notice">Loading…</p>
  <p v-else-if="charts.length === 0" class="notice">
    You are not a member of any chart yet. Create a chart, or ask a chart's owner to add you.
  </p>
  <ul v-else class="list">
    <li v-for="chart in charts" :key="chart.chart">
      <div>
        <div>{{ chart.title }}</div>
        <div class="sub">owner: {{ chart.owner }}</div>
      </div>
      <RouterLink :to="{ name: 'chart', params: { chart: chart.chart } }"><button type="button">Open</button></RouterLink>
    </li>
  </ul>
</template>

<style scoped>
.heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.heading h1 { margin: 0; }
/* Book titles are the book's voice. */
.list li > div > div:first-child { font-family: var(--serif); font-weight: 600; font-size: 1.05rem; }
</style>

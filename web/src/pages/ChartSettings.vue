<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, currentUser, type ChartView } from "../api.ts";
import { messageFor } from "../errors.ts";

const props = defineProps<{ chart: string }>();

const view = ref<ChartView | null>(null);
const loadError = ref<string | null>(null);

const username = ref("");
const memberError = ref<string | null>(null);
const memberAdded = ref<string | null>(null);

const label = ref("");
const elementError = ref<string | null>(null);
const elementAdded = ref<string | null>(null);

async function load() {
  const result = await api.charts.view({ chart: props.chart });
  if ("error" in result) {
    loadError.value = messageFor("openChart", result.error);
    return;
  }
  view.value = result.view;
}
onMounted(load);

async function addMember() {
  memberError.value = null;
  memberAdded.value = null;
  const name = username.value.trim();
  if (name === "") {
    memberError.value = "Enter a username. Type the username of the person to add.";
    return;
  }
  const result = await api.charts["add-member"]({ chart: props.chart, username: name });
  if ("error" in result) {
    memberError.value = messageFor("addMember", result.error, name);
    return;
  }
  memberAdded.value = `${name} is now a member of this chart.`;
  username.value = "";
  await load();
}

async function addElement() {
  elementError.value = null;
  elementAdded.value = null;
  const name = label.value.trim();
  if (name === "") {
    elementError.value = "Enter a name. A literary element needs a name.";
    return;
  }
  if (view.value?.columns.some((c) => c.label === name)) {
    elementError.value = messageFor("addElement", "CONFLICT", name);
    return;
  }
  const result = await api.charts["add-column"]({ chart: props.chart, label: name });
  if ("error" in result) {
    elementError.value = messageFor("addElement", result.error, name);
    return;
  }
  elementAdded.value = `"${name}" was added to the chart.`;
  label.value = "";
  await load();
}
</script>

<template>
  <p v-if="loadError" class="error">{{ loadError }}</p>
  <p v-else-if="view === null" class="notice">Loading…</p>
  <template v-else>
    <RouterLink :to="{ name: 'chart', params: { chart } }">← {{ view.title }}</RouterLink>
    <h1>Chart Settings</h1>

    <h2>Members</h2>
    <ul class="list">
      <li v-for="m in view.members" :key="m.member">
        <span>{{ m.member }}<template v-if="m.member === currentUser"> (you)</template></span>
        <span v-if="m.member === view.owner" class="sub">owner</span>
      </li>
    </ul>
    <form v-if="view.owner === currentUser" @submit.prevent="addMember">
      <label for="member">Add a member by username</label>
      <div class="inline">
        <input id="member" v-model="username" type="text" />
        <button type="submit" class="primary">Add member</button>
      </div>
      <p v-if="memberError" class="error">{{ memberError }}</p>
      <p v-if="memberAdded" class="success">{{ memberAdded }}</p>
    </form>
    <p v-else class="notice">Only the owner of this chart, {{ view.owner }}, can add members.</p>

    <h2>Literary elements</h2>
    <ul class="list">
      <li v-for="column in view.columns" :key="column.column">{{ column.label }}</li>
    </ul>
    <form @submit.prevent="addElement">
      <label for="element">Add a literary element</label>
      <div class="inline">
        <input id="element" v-model="label" type="text" />
        <button type="submit" class="primary">Add</button>
      </div>
      <p v-if="elementError" class="error">{{ elementError }}</p>
      <p v-if="elementAdded" class="success">{{ elementAdded }}</p>
    </form>
  </template>
</template>

<style scoped>
.inline { display: flex; gap: 0.5rem; }
</style>

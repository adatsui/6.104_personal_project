<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { api, currentUser } from "./api.ts";

const route = useRoute();
const router = useRouter();

async function signOut() {
  await api.auth["sign-out"]({});
  currentUser.value = null;
  await router.push({ name: "signIn" });
}
</script>

<template>
  <header v-if="currentUser && route.name !== 'export'" class="topbar">
    <RouterLink :to="{ name: 'myCharts' }" class="brand">ThreadTracker</RouterLink>
    <span class="who">
      {{ currentUser }} ·
      <button type="button" class="link" @click="signOut">Sign out</button>
    </span>
  </header>
  <main :class="{ wide: route.name === 'chart' }">
    <RouterView />
  </main>
</template>

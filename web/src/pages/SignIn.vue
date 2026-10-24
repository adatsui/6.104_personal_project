<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api, currentUser, signInNotice } from "../api.ts";
import { messageFor } from "../errors.ts";

const router = useRouter();
const mode = ref<"signIn" | "register">("signIn");
const username = ref("");
const password = ref("");
const error = ref<string | null>(null);
const busy = ref(false);

async function submit() {
  error.value = null;
  busy.value = true;
  const input = { username: username.value.trim(), password: password.value };
  const result =
    mode.value === "signIn" ? await api.auth["sign-in"](input) : await api.auth.register(input);
  busy.value = false;
  if ("error" in result) {
    error.value = messageFor(mode.value === "signIn" ? "signIn" : "register", result.error);
    return;
  }
  currentUser.value = result.account;
  signInNotice.value = null;
  await router.push({ name: "myCharts" });
}

function switchTo(next: "signIn" | "register") {
  mode.value = next;
  error.value = null;
}
</script>

<template>
  <h1>ThreadTracker</h1>
  <p v-if="signInNotice" class="error">{{ signInNotice }}</p>
  <div class="tabs">
    <button type="button" :class="{ active: mode === 'signIn' }" @click="switchTo('signIn')">Sign in</button>
    <button type="button" :class="{ active: mode === 'register' }" @click="switchTo('register')">
      Create account
    </button>
  </div>
  <form @submit.prevent="submit">
    <label for="username">Username</label>
    <input id="username" v-model="username" type="text" autocomplete="username" required />
    <label for="password">Password</label>
    <input
      id="password"
      v-model="password"
      type="password"
      :autocomplete="mode === 'signIn' ? 'current-password' : 'new-password'"
      required
    />
    <p v-if="mode === 'register'" class="hint">
      Usernames are 3 to 32 letters, numbers, underscores, or hyphens. Passwords are 8 to 128 characters.
    </p>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="actions">
      <button type="submit" class="primary" :disabled="busy">
        {{ mode === "signIn" ? "Sign in" : "Create account" }}
      </button>
    </div>
  </form>
</template>

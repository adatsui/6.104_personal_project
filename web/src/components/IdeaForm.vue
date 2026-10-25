<script setup lang="ts">
import { ref } from "vue";
import type { Content } from "../api.ts";
import { contentProblem } from "../errors.ts";

const props = defineProps<{
  kind: "idea" | "comment";
  submitLabel: string;
  initial?: { quote?: string | null; citation?: string | null; analysis?: string | null };
  /** Sends the content; resolves to an error message, or null on success. */
  send: (content: Content) => Promise<string | null>;
  cancellable?: boolean;
}>();
const emit = defineEmits<{ cancel: [] }>();

const quote = ref(props.initial?.quote ?? "");
const citation = ref(props.initial?.citation ?? "");
const analysis = ref(props.initial?.analysis ?? "");
// Comments start with just an analysis field; the quote fields open on request.
const showQuote = ref(props.kind === "idea" || quote.value !== "");
const error = ref<string | null>(null);
const busy = ref(false);

async function submit() {
  const content = { quote: quote.value.trim(), citation: citation.value.trim(), analysis: analysis.value.trim() };
  error.value = contentProblem(props.kind, content);
  if (error.value !== null) return;
  busy.value = true;
  error.value = await props.send(content);
  busy.value = false;
  if (error.value === null && props.initial === undefined) {
    quote.value = "";
    citation.value = "";
    analysis.value = "";
  }
}
</script>

<template>
  <form class="idea-form" @submit.prevent="submit">
    <template v-if="showQuote">
      <div class="quote-row">
        <div class="field">
          <label :for="`${kind}-quote`">Quote</label>
          <textarea :id="`${kind}-quote`" v-model="quote" :rows="kind === 'comment' ? 2 : 3"></textarea>
        </div>
        <div class="field small">
          <label :for="`${kind}-citation`">Citation</label>
          <input :id="`${kind}-citation`" v-model="citation" type="text" placeholder="Ch. 3, p. 32" />
        </div>
      </div>
    </template>
    <label :for="`${kind}-analysis`">{{ kind === "comment" && !showQuote ? "Comment" : "Analysis" }}</label>
    <textarea :id="`${kind}-analysis`" v-model="analysis" :rows="kind === 'comment' ? 2 : 4"></textarea>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="actions">
      <button type="submit" class="primary" :disabled="busy">{{ submitLabel }}</button>
      <button v-if="cancellable" type="button" @click="emit('cancel')">Cancel</button>
      <button v-if="!showQuote" type="button" class="link" @click="showQuote = true">Add a quote</button>
    </div>
  </form>
</template>

<style scoped>
/* Quote on its own full-width line, the citation on a full line underneath. */
.quote-row { display: flex; flex-direction: column; }
.idea-form label { margin-top: 0.5rem; }
</style>

<script setup lang="ts">
import { ref } from "vue";
import { api, currentUser, type Content, type Idea } from "../api.ts";
import { messageFor } from "../errors.ts";
import IdeaForm from "./IdeaForm.vue";

const props = defineProps<{ chart: string; idea: Idea }>();
const emit = defineEmits<{ changed: [] }>();

const editing = ref(false);
const confirmingDelete = ref(false);
const error = ref<string | null>(null);

async function toggleUpvote() {
  error.value = null;
  const input = { chart: props.chart, post: props.idea.post };
  const upvoted = props.idea.card.upvoted;
  const result = upvoted ? await api.posts.unvote(input) : await api.posts.upvote(input);
  if ("error" in result) {
    error.value = messageFor(upvoted ? "unvote" : "upvote", result.error);
    return;
  }
  emit("changed");
}

async function saveEdit(content: Content): Promise<string | null> {
  const result = await api.posts.edit({ chart: props.chart, post: props.idea.post, ...content });
  if ("error" in result) return messageFor("change", result.error);
  editing.value = false;
  emit("changed");
  return null;
}

async function deleteIdea() {
  error.value = null;
  const result = await api.posts.delete({ chart: props.chart, post: props.idea.post });
  if ("error" in result) {
    error.value = messageFor("change", result.error);
    confirmingDelete.value = false;
    return;
  }
  emit("changed");
}

async function addComment(content: Content): Promise<string | null> {
  const result = await api.posts.comment({ chart: props.chart, commentOn: props.idea.post, ...content });
  if ("error" in result) return messageFor("comment", result.error);
  emit("changed");
  return null;
}

async function deleteComment(comment: string) {
  error.value = null;
  const result = await api.posts["delete-comment"]({ chart: props.chart, comment });
  if ("error" in result) {
    error.value = messageFor("change", result.error);
    return;
  }
  emit("changed");
}
</script>

<template>
  <article class="idea">
    <IdeaForm
      v-if="editing"
      kind="idea"
      submit-label="Save"
      :initial="idea.card"
      :send="saveEdit"
      cancellable
      @cancel="editing = false"
    />
    <template v-else>
      <blockquote v-if="idea.card.quote">
        “{{ idea.card.quote }}” <cite>— {{ idea.card.citation }}</cite>
      </blockquote>
      <p v-if="idea.card.analysis" class="analysis">{{ idea.card.analysis }}</p>
      <div class="meta">
        <span class="author">{{ idea.card.author }}</span>
        <span class="right">
          <button type="button" :class="{ upvoted: idea.card.upvoted }" @click="toggleUpvote">
            {{ idea.card.upvoted ? "Remove upvote" : "Upvote" }}
          </button>
          <span class="count">{{ idea.card.upvotes }} {{ idea.card.upvotes === 1 ? "upvote" : "upvotes" }}</span>
        </span>
      </div>
      <div v-if="idea.card.author === currentUser" class="mine">
        <template v-if="confirmingDelete">
          Delete this idea and its comments?
          <button type="button" class="link" @click="deleteIdea">Delete</button>
          <button type="button" class="link" @click="confirmingDelete = false">Keep</button>
        </template>
        <template v-else>
          <button type="button" class="link" @click="editing = true">Edit</button>
          <button type="button" class="link" @click="confirmingDelete = true">Delete</button>
        </template>
      </div>
    </template>
    <p v-if="error" class="error">{{ error }}</p>

    <ul class="comments">
      <li v-for="comment in idea.card.comments" :key="comment.comment">
        <blockquote v-if="comment.quote">
          “{{ comment.quote }}” <cite>— {{ comment.citation }}</cite>
        </blockquote>
        <span class="author">{{ comment.author }}:</span> {{ comment.analysis }}
        <button
          v-if="comment.author === currentUser"
          type="button"
          class="link delete"
          @click="deleteComment(comment.comment)"
        >
          Delete
        </button>
      </li>
    </ul>
    <IdeaForm kind="comment" submit-label="Comment" :send="addComment" />
  </article>
</template>

<style scoped>
.idea { border-bottom: 1px solid var(--line); padding: 1rem 0; }
blockquote { margin: 0 0 0.4rem; font-style: italic; }
cite { font-style: normal; color: var(--muted); white-space: nowrap; }
.analysis { margin: 0 0 0.5rem; white-space: pre-wrap; }
.meta { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.author { font-weight: 500; }
.right { display: flex; align-items: center; gap: 0.5rem; }
.count { color: var(--muted); font-size: 0.9rem; }
button.upvoted { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
.mine { margin-top: 0.35rem; display: flex; gap: 0.75rem; font-size: 0.9rem; color: var(--muted); }
.comments { list-style: none; margin: 0.75rem 0 0; padding: 0 0 0 0.75rem; border-left: 2px solid var(--line); }
.comments li { margin: 0.4rem 0; }
.comments .delete { margin-left: 0.5rem; font-size: 0.85rem; }
</style>

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
        <p v-if="comment.analysis" class="comment-text">{{ comment.analysis }}</p>
        <div class="comment-meta">
          <span class="author">{{ comment.author }}</span>
          <button
            v-if="comment.author === currentUser"
            type="button"
            class="link delete"
            @click="deleteComment(comment.comment)"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>
    <IdeaForm kind="comment" submit-label="Comment" :send="addComment" />
  </article>
</template>

<style scoped>
.idea { border-bottom: 1px solid var(--line); padding: 1rem 0; }
/* A quote is the book's voice: serif italic on a paper block, edged in the chart's blue. */
blockquote {
  margin: 0 0 0.5rem; padding: 0.5rem 0.75rem; font-family: var(--serif); font-style: italic;
  background: var(--paper-deep); border-left: 3px solid var(--blue); color: var(--ink);
}
cite {
  display: block; margin-top: 0.25rem; font-family: var(--sans); font-style: normal;
  font-size: 0.85rem; color: var(--muted);
}
/* Analysis and comments are the students' voice, in pencil. */
.analysis { margin: 0 0 0.5rem; white-space: pre-wrap; color: var(--pencil); }
.meta { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.author { font-weight: 600; }
.right { display: flex; align-items: center; gap: 0.5rem; }
.count { color: var(--muted); font-size: 0.9rem; }
/* Orange = classmates: an upvote is a response to someone else's idea. */
button.upvoted { background: var(--orange-soft); border-color: var(--orange); color: var(--orange-text); }
button.upvoted + .count { color: var(--orange-text); }
.mine { margin-top: 0.35rem; display: flex; gap: 0.75rem; font-size: 0.9rem; color: var(--muted); }
.comments {
  list-style: none; margin: 0.75rem 0 0; padding: 0 0 0 0.75rem;
  border-left: 2px solid var(--orange); color: var(--pencil);
}
.comments li { margin: 0.6rem 0; }
.comment-text { margin: 0 0 0.15rem; white-space: pre-wrap; }
.comment-meta { font-size: 0.9rem; }
.comments .author { color: var(--ink); }
.comments .delete { margin-left: 0.5rem; font-size: 0.85rem; }
/* The comment form under each idea is secondary to the idea, so its button is outlined, not solid. */
.idea > .idea-form:last-child :deep(button.primary) { background: var(--paper); color: var(--blue); border-color: var(--blue); }
</style>

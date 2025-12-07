<template>
  <div class="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
    <div class="flex justify-between items-center mb-3">
      <h2 class="text-sm font-semibold text-slate-100">
        Source: {{ source }}
      </h2>

      <div class="flex items-center gap-2">
        <button
          @click="$emit('close')"
          class="text-xs text-slate-400 hover:text-emerald-400"
        >
          Close
        </button>

        <button
          @click="confirmDeleteSource"
          :disabled="deletingSource"
          class="text-xs px-2 py-1 border border-red-600 text-red-400 rounded hover:bg-red-900/40 disabled:opacity-50"
        >
          <span v-if="!deletingSource">Delete all</span>
          <span v-else>Deleting...</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-xs text-slate-400">
      Loading chunks...
    </div>

    <ul v-else class="space-y-4 max-h-[600px] overflow-auto pr-2">
      <li
        v-for="item in chunks"
        :key="item.id"
        class="p-3 border border-slate-700 rounded-lg bg-slate-800/50 flex flex-col gap-2"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-emerald-400 font-mono mb-1">
              {{ item.title || '(No title)' }}
            </p>
            <p class="text-xs text-slate-400">
              <strong>URI:</strong> {{ item.uri || '—' }}
            </p>
            <p class="text-xs text-slate-400">
              <strong>Tags:</strong> {{ item.tags?.join(', ') || '—' }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="text-xs rounded px-2 py-1 border border-slate-700 hover:border-emerald-500"
              @click="copyContent(item.content)"
              title="Copy content"
            >
              Copy
            </button>

            <button
              class="text-xs rounded px-2 py-1 border border-slate-700 hover:border-emerald-500"
              @click="openEdit(item.id)"
              :disabled="deletingIds.has(String(item.id))"
              title="Edit chunk"
            >
              Edit
            </button>

            <button
              class="text-xs rounded px-2 py-1 border border-red-700 text-red-300 hover:bg-red-900/40 disabled:opacity-50"
              @click="confirmDeleteChunk(item.id)"
              :disabled="deletingIds.has(String(item.id))"
            >
              <span v-if="!deletingIds.has(String(item.id))">Delete</span>
              <span v-else>Deleting...</span>
            </button>
          </div>
        </div>

        <p class="whitespace-pre-wrap text-[13px] mt-2 text-slate-200">
          {{ item.content }}
        </p>
      </li>

      <li v-if="!chunks.length" class="p-3 text-xs text-slate-500">
        No chunks found for this source.
      </li>
    </ul>

    <EditChunk
      :key="editId ?? 'edit-chunk'"
      :id="editId"
      :open="editOpen"
      @close="closeEdit"
      @saved="onSavedChunk"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';
import EditChunk from '@/components/kb/KBChunkEditor.vue';

const props = defineProps<{ source: string }>();
const emit = defineEmits(['close', 'deleted']);

const chunks = ref<any[]>([]);
const loading = ref(false);

const deletingIds = ref(new Set<string>());
const deletingSource = ref(false);

const editOpen = ref(false);
const editId = ref<string | null>(null);

async function fetchChunks() {
  loading.value = true;

  try {
    const r = await fetch(
      `${LLM_GATEWAY_URL}/rag/debug/source?source=${encodeURIComponent(
        props.source,
      )}&limit=200`,
    );

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(txt || `HTTP ${r.status}`);
    }

    const json = await r.json();

    const points = json?.result?.points ?? [];
    chunks.value = points.map((p: any) => ({
      id: p?.id,
      content: p?.payload?.content ?? '',
      source: p?.payload?.source ?? props.source,
      uri: p?.payload?.uri ?? null,
      title: p?.payload?.title ?? null,
      tags: p?.payload?.tags ?? [],
      tokenCount: p?.payload?.tokenCount ?? null,
      createdAt: p?.payload?.createdAt ?? null,
      hash: p?.payload?.hash ?? null,
      docId: p?.payload?.docId ?? null,
    }));
  } catch (err) {
    console.error('[KB] fetch chunks error', err);
    chunks.value = [];
  } finally {
    loading.value = false;
  }
}

async function confirmDeleteChunk(id: string | number) {
  const sid = String(id);
  if (!confirm('Delete this chunk?')) return;
  await deleteChunk(sid);
}

async function deleteChunk(id: string) {
  deletingIds.value.add(id);
  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/rag/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }

    chunks.value = chunks.value.filter((c) => String(c.id) !== id);
  } catch (err: any) {
    console.error('[KB] delete chunk failed', err);
    alert('Delete chunk failed: ' + (err?.message || String(err)));
  } finally {
    deletingIds.value.delete(id);
  }
}

async function confirmDeleteSource() {
  if (!confirm(`Delete ALL documents for source "${props.source}"? This cannot be undone.`)) return;
  await deleteSource();
}

async function deleteSource() {
  deletingSource.value = true;
  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/rag/documents/by-source?source=${encodeURIComponent(props.source)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }

    chunks.value = [];
    emit('deleted');
    alert(`All documents for "${props.source}" deleted.`);
  } catch (err: any) {
    console.error('[KB] delete source failed', err);
    alert('Delete source failed: ' + (err?.message || String(err)));
  } finally {
    deletingSource.value = false;
  }
}

function copyContent(text: string) {
  if (!text) return;
  navigator.clipboard?.writeText(text).then(
    () => {
    },
    (e) => {
      console.error('copy failed', e);
      alert('Copy failed');
    },
  );
}

function openEdit(id: string | number) {
  editId.value = String(id);
  editOpen.value = true;
}

function closeEdit() {
  editOpen.value = false;
  editId.value = null;
}

function onSavedChunk() {
  fetchChunks();
  closeEdit();
}

watch(() => props.source, fetchChunks, { immediate: true });
</script>

<template>
  <div class="rounded-xl border p-4 bg-slate-900/60">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-slate-100">
        Documents for source:
        <span class="text-emerald-400">{{ source }}</span>
      </h3>
      <span v-if="!loading" class="text-[11px] text-slate-500">
        {{ items.length }} / {{ total }} shown
      </span>
    </div>

    <div class="flex items-center gap-2 mb-3 text-[11px]">
      <button
        type="button"
        class="px-2 py-0.5 rounded border border-slate-700 text-slate-300"
        :disabled="loading"
        @click="reload"
      >
        Reload
      </button>
    </div>

    <div v-if="loading" class="text-xs text-slate-400">
      Loading documents...
    </div>

    <ul
      v-else
      class="space-y-2 max-h-[260px] overflow-auto pr-1 text-xs text-slate-200"
    >
      <li
        v-for="doc in items"
        :key="doc.id"
        class="p-2 border border-slate-700 rounded bg-slate-800/60"
      >
        <div class="flex justify-between items-start gap-2 mb-1">
          <div class="min-w-0">
            <p class="font-semibold truncate">
              {{ doc.title || '(No title)' }}
            </p>
            <p class="text-[11px] text-slate-400">
              <span class="font-mono">{{ doc.id }}</span>
            </p>
          </div>
          <div class="text-right text-[11px] text-slate-400">
            <p v-if="doc.createdAt">
              {{ formatDate(doc.createdAt) }}
            </p>
            <p v-if="doc.lang">lang: {{ doc.lang }}</p>
          </div>
        </div>

        <p v-if="doc.tags?.length" class="text-[11px] text-emerald-400 mb-1">
          Tags: {{ doc.tags.join(', ') }}
        </p>

        <p v-if="doc.uri" class="text-[11px] text-slate-400 truncate">
          URI: {{ doc.uri }}
        </p>

        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200"
            @click="$emit('edit-document', doc)"
          >
            Edit
          </button>
          <button
            type="button"
            class="rounded border border-red-700 px-2 py-0.5 text-[11px] text-red-300 hover:bg-red-900/40 disabled:opacity-50"
            :disabled="deletingIds.has(doc.id)"
            @click="confirmDelete(doc)"
          >
            <span v-if="!deletingIds.has(doc.id)">Delete</span>
            <span v-else>Deleting...</span>
          </button>
        </div>
      </li>

      <li v-if="!items.length" class="p-2 text-xs text-slate-500">
        Tidak ada dokumen untuk source ini.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';

interface KBDocument {
  id: string;
  source: string;
  uri: string | null;
  title: string | null;
  lang: string | null;
  tags: string[] | null;
  text?: string;
  hash?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const props = defineProps<{
  source: string;
}>();

const emit = defineEmits<{
  (e: 'reload-sources'): void;
  (e: 'edit-document', doc: KBDocument): void;
}>();

const loading = ref(false);
const items = ref<KBDocument[]>([]);
const total = ref(0);
const deletingIds = ref<Set<string>>(new Set());

async function fetchDocuments() {
  if (!props.source) return;
  loading.value = true;

  try {
    const res = await fetch(
      `${LLM_GATEWAY_URL}/rag/documents?source=${encodeURIComponent(
        props.source,
      )}&limit=50`,
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const json = await res.json();
    const docs = json?.items ?? [];
    items.value = docs;
    total.value = json?.total ?? docs.length;
  } catch (err) {
    console.error('[KB] fetch documents error', err);
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function reload() {
  fetchDocuments();
}

function formatDate(dt: string | undefined) {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

async function confirmDelete(doc: KBDocument) {
  if (!confirm(`Delete document "${doc.title || doc.id}"? Ini akan menghapus dokumen + semua chunks terkait.`)) {
    return;
  }

  deletingIds.value.add(doc.id);
  try {
    const res = await fetch(
      `${LLM_GATEWAY_URL}/rag/kb-documents/${encodeURIComponent(doc.id)}`,
      { method: 'DELETE' },
    );
    if (!res.ok) {
      let txt = await res.text().catch(() => '');
      try {
        const j = JSON.parse(txt);
        txt = (j?.error && typeof j.error === 'string') ? j.error : txt;
      } catch {}
      throw new Error(txt || `HTTP ${res.status}`);
    }

    // remove from list
    items.value = items.value.filter((x) => x.id !== doc.id);
    // optional: refresh sources list di parent
    emit('reload-sources');
  } catch (err: any) {
    console.error('[KB] delete kb-document failed', err);
    alert('Delete document failed: ' + (err?.message || String(err)));
  } finally {
    deletingIds.value.delete(doc.id);
  }
}

watch(
  () => props.source,
  () => {
    fetchDocuments();
  },
  { immediate: true },
);
</script>

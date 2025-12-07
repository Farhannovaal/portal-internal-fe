<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <div class="absolute inset-0 bg-black/60" @click="close"></div>
    <div class="relative z-10 w-full max-w-3xl p-4 bg-slate-900 rounded-lg">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold text-slate-100">
          Edit Document
        </h3>
        <button class="text-sm text-slate-400" @click="close">Close</button>
      </div>

      <div v-if="loading" class="text-sm text-slate-400">Loading...</div>

      <div v-else class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-400 block mb-1">ID</label>
            <p class="text-[11px] font-mono text-slate-300 break-all">
              {{ id }}
            </p>
          </div>
          <div>
            <label class="text-xs text-slate-400 block mb-1">Source</label>
            <input
              v-model="source"
              class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100 text-xs"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-400 block mb-1">Title</label>
            <input
              v-model="title"
              class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100 text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-slate-400 block mb-1">Lang</label>
            <input
              v-model="lang"
              class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100 text-sm"
            />
          </div>
        </div>

        <div>
          <label class="text-xs text-slate-400 block mb-1">Tags (comma separated)</label>
          <input
            v-model="tagsText"
            class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100 text-sm"
          />
        </div>

        <div>
          <label class="text-xs text-slate-400 block mb-1">URI</label>
          <input
            v-model="uri"
            class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100 text-sm"
          />
        </div>

        <div>
          <label class="text-xs text-slate-400 block mb-1">Text (full document)</label>
          <textarea
            v-model="text"
            rows="12"
            class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100 text-sm"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button
            @click="close"
            class="rounded border px-3 py-2 text-xs text-slate-300"
          >
            Cancel
          </button>
          <button
            @click="save"
            :disabled="saving || !canSave"
            class="rounded bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
          >
            <span v-if="!saving">Save & Re-ingest</span>
            <span v-else>Saving...</span>
          </button>
        </div>

        <p v-if="message" class="text-xs text-slate-400">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';

const props = defineProps<{
  id: string | null;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const loading = ref(false);
const saving = ref(false);
const message = ref<string | null>(null);

const source = ref('');
const title = ref('');
const lang = ref('');
const uri = ref('');
const text = ref('');
const tagsText = ref('');

const canSave = computed(
  () => !!text.value && text.value.trim().length > 0,
);

async function loadDocument() {
  if (!props.id) return;
  loading.value = true;
  message.value = null;

  try {
    const res = await fetch(
      `${LLM_GATEWAY_URL}/rag/kb-documents/${encodeURIComponent(props.id)}`,
    );
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(t || `HTTP ${res.status}`);
    }
    const json = await res.json();
    const doc = json?.document ?? json;

    source.value = doc.source ?? '';
    title.value = doc.title ?? '';
    lang.value = doc.lang ?? '';
    uri.value = doc.uri ?? '';
    text.value = doc.text ?? '';
    tagsText.value = (doc.tags ?? []).join(',');
  } catch (err: any) {
    console.error('[KB] load kb-document failed', err);
    message.value =
      'Load failed: ' + (err?.message || String(err));
  } finally {
    loading.value = false;
  }
}

function resetState() {
  loading.value = false;
  saving.value = false;
  message.value = null;
  source.value = '';
  title.value = '';
  lang.value = '';
  uri.value = '';
  text.value = '';
  tagsText.value = '';
}

watch(
  () => [props.open, props.id],
  async ([open]) => {
    if (open && props.id) {
      await loadDocument();
    } else if (!open) {
      resetState();
    }
  },
  { immediate: true },
);

function close() {
  emit('close');
}

async function save() {
  if (!props.id) return;
  saving.value = true;
  message.value = null;

  try {
    const body = {
      source: source.value || undefined,
      uri: uri.value || undefined,
      title: title.value || undefined,
      lang: lang.value || undefined,
      tags: tagsText.value
        ? tagsText.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      text: text.value,
    };

    const res = await fetch(
      `${LLM_GATEWAY_URL}/rag/kb-documents/${encodeURIComponent(props.id)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      let txt = await res.text().catch(() => '');
      try {
        const j = JSON.parse(txt);
        txt = (j?.error && typeof j.error === 'string') ? j.error : txt;
      } catch {}
      throw new Error(txt || `HTTP ${res.status}`);
    }

    message.value = 'Saved & re-ingested.';
    emit('saved');
  } catch (err: any) {
    console.error('[KB] save kb-document failed', err);
    message.value = 'Save failed: ' + (err?.message || String(err));
  } finally {
    saving.value = false;
  }
}
</script>

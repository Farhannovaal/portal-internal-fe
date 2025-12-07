<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60" @click="close"></div>
    <div class="relative z-10 w-full max-w-2xl p-4 bg-slate-900 rounded-lg">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold text-slate-100">Edit Chunk</h3>
        <button class="text-sm text-slate-400" @click="close">Close</button>
      </div>

      <div v-if="loading" class="text-sm text-slate-400">Loading...</div>

      <div v-else class="space-y-3">
        <label class="text-xs text-slate-400">Title</label>
        <input v-model="title" class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100" />

        <label class="text-xs text-slate-400">Tags (comma)</label>
        <input v-model="tagsText" class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100" />

        <label class="text-xs text-slate-400">Content</label>
        <textarea v-model="content" rows="8" class="w-full rounded border px-3 py-2 bg-slate-800 text-slate-100"></textarea>

        <div class="flex justify-end gap-2">
          <button @click="close" class="rounded border px-3 py-2 text-xs text-slate-300">Cancel</button>
          <button @click="save" :disabled="saving || !canSave" class="rounded bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950">
            <span v-if="!saving">Save & Re-embed</span>
            <span v-else>Saving...</span>
          </button>
        </div>
        <p v-if="message" class="text-xs text-slate-400">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';


const props = defineProps<{ id?: string | null; open: boolean }>();
const emit = defineEmits(['close', 'saved']);

const loading = ref(false);
const saving = ref(false);
const message = ref<string | null>(null);

const title = ref('');
const content = ref('');
const tagsText = ref('');

const canSave = computed(() => (content.value && content.value.trim().length > 0) || (title.value && title.value.trim().length > 0));

async function loadChunk() {
  if (!props.id) return;
  loading.value = true;
  message.value = null;
  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/rag/documents/${encodeURIComponent(props.id)}`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    const doc = json?.document ?? json;
    title.value = doc?.title ?? '';
    content.value = doc?.content ?? '';
    tagsText.value = (doc?.tags ?? []).join(',');
  } catch (err: any) {
    console.error('[KB] load chunk failed', err);
    message.value = 'Load failed: ' + (err?.message || String(err));
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.id],
  async ([open]) => {
    if (open && props.id) {
      await loadChunk();
    } else if (!open) {
      loading.value = false;
      saving.value = false;
      message.value = null;
      title.value = '';
      content.value = '';
      tagsText.value = '';
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
      content: content.value,
      title: title.value,
      tags: tagsText.value.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch(`${LLM_GATEWAY_URL}/rag/documents/${encodeURIComponent(props.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let txt = await res.text().catch(() => '');
      try {
        const j = JSON.parse(txt);
        txt = (j?.error && typeof j.error === 'string') ? j.error : txt;
      } catch (_e) {}
      throw new Error(txt || `HTTP ${res.status}`);
    }
    message.value = 'Saved & re-embedded.';
    emit('saved');
  } catch (err: any) {
    console.error('[KB] save chunk failed', err);
    message.value = 'Save failed: ' + (err?.message || String(err));
  } finally {
    saving.value = false;
  }
}
</script>

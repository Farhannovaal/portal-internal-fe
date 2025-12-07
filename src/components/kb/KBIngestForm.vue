<template>
  <div class="rounded-xl border p-4 bg-slate-900/60">
    <h3 class="text-sm font-semibold text-slate-100 mb-2">Ingest Document</h3>

    <form @submit.prevent="submit" class="space-y-3">
      <div>
        <label class="text-xs text-slate-400 block mb-1">File (pdf/docx/txt)</label>
        <input type="file" @change="onFile" accept=".pdf,.docx,.doc,.txt" />
        <p class="text-[11px] text-slate-500 mt-1">Atau paste teks di bawah untuk ingests langsung.</p>
      </div>

      <div>
        <label class="text-xs text-slate-400">Source (identifier)</label>
        <input v-model="source" class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" placeholder="e.g. note, manual, website" />
      </div>

      <div>
        <label class="text-xs text-slate-400">Tags (comma separated)</label>
        <input v-model="tagsText" class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" placeholder="kb-default,rag" />
      </div>

      <div>
        <label class="text-xs text-slate-400">Or paste text</label>
        <textarea v-model="text" rows="6" class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100" placeholder="Paste full document text here..."></textarea>
      </div>

      <div class="flex justify-end gap-2">
        <button type="button" @click="reset" class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">Reset</button>
        <button type="submit" :disabled="uploading" class="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950">
          <span v-if="!uploading">Ingest</span>
          <span v-else>Ingesting...</span>
        </button>
      </div>
      <p v-if="message" class="text-xs text-slate-400 mt-1">{{ message }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';

const emit = defineEmits<{
  (e: 'ingested'): void;
}>();

const file = ref<File | null>(null);
const source = ref('manual');
const text = ref('');
const tagsText = ref('');
const uploading = ref(false);
const message = ref<string | null>(null);

function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  file.value = input.files?.[0] ?? null;
}

function reset() {
  file.value = null;
  source.value = 'manual';
  text.value = '';
  tagsText.value = '';
}

async function submit() {
  message.value = null;
  uploading.value = true;

  try {
    let successMsg: string | null = null;

    if (file.value) {
      const fd = new FormData();
      fd.append('file', file.value);
      fd.append('source', source.value);
      if (tagsText.value) fd.append('tags', tagsText.value);

      const res = await fetch(`${LLM_GATEWAY_URL}/rag/upload`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }

      successMsg = 'File uploaded — extraction + ingest queued/done.';
    } else if (text.value.trim()) {
      const payload = {
        source: source.value,
        text: text.value,
        tags: tagsText.value
          ? tagsText.value.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch(`${LLM_GATEWAY_URL}/rag/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `HTTP ${res.status}`);
      }

      successMsg = 'Text ingested.';
    } else {
      message.value = 'Provide a file or paste text.';
      return; 
    }

    message.value = successMsg;
    window.dispatchEvent(new CustomEvent('kb:ingested'));
    emit('ingested');
    reset();
  } catch (err: any) {
    console.error('[KB] ingest failed', err);
    message.value = 'Ingest failed: ' + (err?.message || String(err));
  } finally {
    uploading.value = false;
  }
}
</script>


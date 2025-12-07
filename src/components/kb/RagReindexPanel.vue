<template>
  <div class="rounded-xl border p-4 bg-slate-900/60">
    <h3 class="text-sm font-semibold text-slate-100 mb-2">Reindex / Re-embed</h3>
    <p class="text-xs text-slate-400 mb-3">Re-embed semua dokumen (atau per source). Gunakan ketika embedding model atau vector dim berubah.</p>

    <div class="flex gap-2 items-center">
      <input v-model="source" placeholder="optional: source" class="rounded border px-3 py-2 bg-slate-800 text-slate-100" />
      <button @click="reindex" :disabled="running" class="rounded bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950">
        <span v-if="!running">Start Reindex</span>
        <span v-else>Running...</span>
      </button>
    </div>

    <div v-if="jobId" class="mt-2 text-xs text-slate-400">
      Job: <span class="font-mono">{{ jobId }}</span>
      <div class="mt-1">
        <button class="text-xs underline" @click="pollStatus">Check status</button>
      </div>
    </div>

    <pre v-if="statusText" class="mt-2 text-xs text-slate-400 max-h-36 overflow-auto">{{ statusText }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';

const source = ref('');
const running = ref(false);
const jobId = ref<string | null>(null);
const statusText = ref<string | null>(null);

async function reindex() {
  if (!confirm('Start reindexing (may take long)?')) return;
  running.value = true;
  statusText.value = null;
  try {
    const url = `${LLM_GATEWAY_URL}/rag/reindex` + (source.value ? `?source=${encodeURIComponent(source.value)}` : '');
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    jobId.value = json.jobId ?? json.id ?? null;
    statusText.value = 'Reindex started. JobId: ' + (jobId.value ?? '(none returned)');
  } catch (err: any) {
    console.error('[KB] reindex failed', err);
    statusText.value = 'Reindex start failed: ' + (err?.message || String(err));
  } finally {
    running.value = false;
  }
}

async function pollStatus() {
  if (!jobId.value) return;
  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/jobs/${encodeURIComponent(jobId.value)}`);
    if (!res.ok) throw new Error(await res.text());
    const j = await res.json();
    statusText.value = JSON.stringify(j, null, 2);
  } catch (err: any) {
    statusText.value = 'Check status failed: ' + (err?.message || String(err));
  }
}
</script>

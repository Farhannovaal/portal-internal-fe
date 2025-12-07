<template>
  <div class="rounded-xl border p-4 bg-slate-900/60 mt-4">
    <h3 class="text-sm font-semibold text-slate-100 mb-2">Fetch from URL</h3>
    <p class="text-xs text-slate-400 mb-3">
      Ambil konten dari halaman web (URL), ekstrak teks utama, lalu ingest ke RAG.
    </p>

    <form @submit.prevent="submit" class="space-y-3">
      <div>
        <label class="text-xs text-slate-400 block mb-1">URL</label>
        <input
          v-model="url"
          type="url"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          placeholder="https://contoh.com/artikel"
          required
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-slate-400 block mb-1">Source (identifier)</label>
          <input
            v-model="source"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            placeholder="website"
          />
        </div>
        <div>
          <label class="text-xs text-slate-400 block mb-1">Tags (comma separated)</label>
          <input
            v-model="tagsText"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            placeholder="web,docs"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input
          id="snapshot"
          type="checkbox"
          v-model="snapshot"
          class="h-3 w-3 rounded border-slate-600 bg-slate-900 text-emerald-500"
        />
        <label for="snapshot" class="text-xs text-slate-400">
          Simpan snapshot HTML (opsional, implementasi di backend)
        </label>
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          @click="reset"
          class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"
        >
          Reset
        </button>
        <button
          type="submit"
          :disabled="loading || !url"
          class="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
        >
          <span v-if="!loading">Fetch & Ingest</span>
          <span v-else>Processing...</span>
        </button>
      </div>

      <p v-if="message" class="text-xs text-slate-400 mt-1">
        {{ message }}
      </p>
    </form>

    <div v-if="jobId" class="mt-3 border-t border-slate-800 pt-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-slate-400">Job ID:</span>
        <span class="text-[11px] font-mono text-emerald-400 break-all">
          {{ jobId }}
        </span>
      </div>

      <div class="flex items-center justify-between mt-1">
        <span class="text-xs text-slate-400">Status:</span>
        <span class="text-xs text-slate-200">
          {{ jobStatus || 'unknown' }}
        </span>
      </div>

      <div class="mt-2 flex justify-end">
        <button
          type="button"
          @click="checkStatus"
          :disabled="checking || !jobId"
          class="text-[11px] underline text-slate-300 disabled:opacity-50"
        >
          <span v-if="!checking">Check status</span>
          <span v-else>Checking...</span>
        </button>
      </div>

      <pre
        v-if="jobDetail"
        class="mt-2 max-h-40 overflow-auto rounded bg-slate-950/70 p-2 text-[10px] text-slate-300"
      >
{{ jobDetail }}
      </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';

const emit = defineEmits(['ingested']);

const url = ref('');
const source = ref('website');
const tagsText = ref('web');
const snapshot = ref(false);

const loading = ref(false);
const message = ref<string | null>(null);

const jobId = ref<string | null>(null);
const jobStatus = ref<string | null>(null);
const jobDetail = ref<string | null>(null);
const checking = ref(false);

function reset() {
  url.value = '';
  source.value = 'website';
  tagsText.value = 'web';
  snapshot.value = false;
  message.value = null;
  jobId.value = null;
  jobStatus.value = null;
  jobDetail.value = null;
}

async function submit() {
  if (!url.value) return;
  loading.value = true;
  message.value = null;
  jobId.value = null;
  jobStatus.value = null;
  jobDetail.value = null;

  try {
    const body = {
      url: url.value,
      source: source.value || 'website',
      tags: tagsText.value
        ? tagsText.value.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      snapshot: snapshot.value,
    };

    const res = await fetch(`${LLM_GATEWAY_URL}/rag/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }

    const json = await res.json();
    jobId.value = json.jobId ?? null;
    jobStatus.value = 'queued';
    message.value = jobId.value
      ? 'Fetch job started. You can check status below.'
      : 'Fetch started (no jobId returned).';

    emit('ingested');
  } catch (err: any) {
    console.error('[KB] fetch url failed', err);
    message.value = 'Fetch failed: ' + (err?.message || String(err));
  } finally {
    loading.value = false;
  }
}

async function checkStatus() {
  if (!jobId.value) return;
  checking.value = true;
  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/rag/jobs/${encodeURIComponent(jobId.value)}`);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const json = await res.json();
    const j = json.job ?? json;

    jobStatus.value = j?.status ?? null;
    jobDetail.value = JSON.stringify(j?.detail ?? j, null, 2);

    if (j?.status === 'done') {
      emit('ingested');
    }
  } catch (err: any) {
    console.error('[KB] check job failed', err);
    jobDetail.value = 'Check status failed: ' + (err?.message || String(err));
  } finally {
    checking.value = false;
  }
}
</script>

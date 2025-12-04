<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-slate-50">
          Chat Analytics
        </h1>
        <p class="text-sm text-slate-400">
          Konsumsi data dari endpoint
          <code class="font-mono text-emerald-400">/analytics/chat/*</code>
          untuk app
          <code class="font-mono text-emerald-300">{{ appCode }}</code>.
        </p>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <button
          type="button"
          class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
          @click="fetchAll"
        >
          Refresh
        </button>
        <span
          v-if="loading"
          class="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-400"
        >
          <span class="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Loading...
        </span>
      </div>
    </header>

    <div
      v-if="error"
      class="rounded-xl border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-200"
    >
      {{ error }}
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
        <p class="text-xs uppercase tracking-wide text-slate-400">
          Total Sessions
        </p>
        <p class="text-2xl font-semibold text-slate-50">
          {{ summary?.totalSessions ?? '–' }}
        </p>
        <p class="text-[11px] text-slate-500">
          {{ summary?.totalTurns ?? 0 }} total turns
        </p>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
        <p class="text-xs uppercase tracking-wide text-slate-400">
          RAG Usage
        </p>
        <p class="text-2xl font-semibold text-emerald-400">
          {{ ragPercent.toFixed(1) }}%
        </p>
        <p class="text-[11px] text-slate-500">
          {{ summary?.totalRagTurns ?? 0 }} RAG turns dari
          {{ summary?.totalTurns ?? 0 }} total turns
        </p>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
        <p class="text-xs uppercase tracking-wide text-slate-400">
          Avg Latency
        </p>
        <p class="text-2xl font-semibold text-slate-50">
          {{ formatMs(summary?.avgLatencyMs) }}
        </p>
        <p class="text-[11px] text-slate-500">
          Rerata dari semua turns yang tercatat
        </p>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
        <p class="text-xs uppercase tracking-wide text-slate-400">
          Range Waktu
        </p>
        <p class="text-sm font-medium text-slate-50">
          30 hari terakhir
        </p>
        <p class="text-[11px] text-slate-500">
          Berdasarkan data di llm-gateway-1
        </p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div class="mb-2 flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-slate-50">
            Top Sources
          </h2>
          <span class="text-[11px] text-slate-500">
            /analytics/chat/sources?limit=5
          </span>
        </div>

        <p v-if="!topSources.length" class="text-xs text-slate-500">
          Belum ada data sumber RAG yang tercatat.
        </p>

        <ul v-else class="space-y-2">
          <li
            v-for="src in topSources"
            :key="src.source"
            class="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2"
          >
            <div class="min-w-0">
              <p class="text-xs font-medium text-slate-50 truncate">
                {{ src.source }}
              </p>
              <p class="text-[11px] text-slate-500">
                {{ src.totalRefs }} refs
              </p>
            </div>
            <p class="text-sm font-semibold text-emerald-400">
              {{ src.totalRefs }}
            </p>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div class="mb-2 flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-slate-50">
            Mode Usage
          </h2>
          <span class="text-[11px] text-slate-500">
            /analytics/chat/modes?days=30
          </span>
        </div>

        <p v-if="!modeStats.length" class="text-xs text-slate-500">
          Belum ada data penggunaan mode.
        </p>

        <ul v-else class="space-y-2">
          <li
            v-for="m in modeStats"
            :key="m.mode"
            class="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2"
          >
            <div class="min-w-0">
              <p class="text-xs font-medium text-slate-50">
                Mode:
                <span class="font-mono text-emerald-300">{{ m.mode }}</span>
              </p>
              <p class="text-[11px] text-slate-500">
                {{ m.totalTurns }} turns • {{ m.turnsUsedRag }} RAG
              </p>
            </div>
            <p class="text-sm font-semibold text-emerald-400">
              {{ formatPercent(m.totalTurns, summary?.totalTurns ?? 0) }}
            </p>
          </li>
        </ul>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div class="mb-2 flex items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-slate-50">
          Aktivitas Harian
        </h2>
        <span class="text-[11px] text-slate-500">
          /analytics/chat/daily?days=7
        </span>
      </div>

      <p v-if="!dailyStats.length" class="text-xs text-slate-500">
        Belum ada data harian yang tercatat.
      </p>

      <div
        v-else
        class="grid gap-2 md:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="d in dailyStats"
          :key="d.day"
          class="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs"
        >
          <p class="text-[11px] font-medium text-slate-200">
            {{ d.day }}
          </p>
          <p class="mt-1 text-slate-300">
            {{ d.totalTurns }} total turns
          </p>
          <p class="text-[11px] text-slate-500">
            RAG: {{ formatDailyRag(d) }}
          </p>
          <p class="text-[11px] text-slate-500">
            Avg latency: {{ formatMs(d.avgLatencyMs) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { APP_CODE, LLM_GATEWAY_URL } from '@/config';

const gatewayUrl = LLM_GATEWAY_URL;
const appCode = APP_CODE;

type ChatSummary = {
  totalSessions: number;
  totalTurns: number;
  totalRagTurns: number;
  pctUsedRag: number;
  avgLatencyMs: number;
  topSources?: SourceStat[];
};

type SourceStat = {
  source: string;
  totalRefs: number;
};

type ModeStat = {
  mode: string;           
  totalTurns: number;
  turnsUsedRag: number;
  avgLatencyMs: number;
};

type DailyStat = {
  day: string;             
  totalTurns: number;
  turnsUsedRag: number;
  pctUsedRag: number;
  avgLatencyMs: number;
};

const loading = ref(false);
const error = ref<string | null>(null);

const summary = ref<ChatSummary | null>(null);
const topSources = ref<SourceStat[]>([]);
const modeStats = ref<ModeStat[]>([]);
const dailyStats = ref<DailyStat[]>([]);

const ragPercent = computed(() => {
  if (!summary.value) return 0;
  if (typeof summary.value.pctUsedRag === 'number') {
    return summary.value.pctUsedRag;
  }
  if (!summary.value.totalTurns) return 0;
  return (summary.value.totalRagTurns / summary.value.totalTurns) * 100;
});

function formatMs(ms?: number) {
  if (!ms || ms <= 0) return '–';
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatPercent(part: number, total: number) {
  if (!total || total <= 0) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}

function formatDailyRag(d: DailyStat): string {
  if (typeof d.pctUsedRag === 'number') {
    return `${d.pctUsedRag.toFixed(2)}%`;
  }
  if (d.totalTurns > 0) {
    const pct = (d.turnsUsedRag / d.totalTurns) * 100;
    return `${pct.toFixed(2)}%`;
  }
  return '0%';
}


async function fetchSummary() {
  const url = `${gatewayUrl}/analytics/chat/summary?days=30&topSources=5`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`summary HTTP ${res.status}`);
  }
  summary.value = (await res.json()) as ChatSummary;
}

async function fetchTopSources() {
  const url = `${gatewayUrl}/analytics/chat/sources?limit=5`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`sources HTTP ${res.status}`);
  }
  const json = (await res.json()) as SourceStat[];
  topSources.value = json ?? [];
}

async function fetchModes() {
  const url = `${gatewayUrl}/analytics/chat/modes?days=30`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`modes HTTP ${res.status}`);
  }
  const json = (await res.json()) as ModeStat[];
  modeStats.value = json ?? [];
}

async function fetchDaily() {
  const url = `${gatewayUrl}/analytics/chat/daily?days=7`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`daily HTTP ${res.status}`);
  }
  const json = (await res.json()) as DailyStat[];
  dailyStats.value = json ?? [];
}

async function fetchAll() {
  loading.value = true;
  error.value = null;

  try {
    await Promise.all([
      fetchSummary(),
      fetchTopSources(),
      fetchModes(),
      fetchDaily(),
    ]);
  } catch (err: any) {
    console.error('Gagal fetch analytics', err);
    error.value =
      'Gagal memuat analytics dari llm-gateway-1: ' +
      (err?.message || String(err));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchAll();
});
</script>

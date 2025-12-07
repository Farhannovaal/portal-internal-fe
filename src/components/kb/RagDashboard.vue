<template>
  <div class="rounded-xl border p-4 bg-slate-900/60">
    <h3 class="text-sm font-semibold text-slate-100 mb-2">RAG Dashboard</h3>

    <div class="grid grid-cols-2 gap-3 mb-3">
      <div class="p-3 rounded border bg-slate-800/50">
        <div class="text-xs text-slate-400">Total chunks</div>
        <div class="text-2xl font-semibold text-slate-100">{{ stats?.totalChunks ?? '–' }}</div>
      </div>

      <div class="p-3 rounded border bg-slate-800/50">
        <div class="text-xs text-slate-400">Vector dim</div>
        <div class="text-2xl font-semibold text-slate-100">{{ stats?.vectorDim ?? '–' }}</div>
      </div>

      <div class="p-3 rounded border bg-slate-800/50">
        <div class="text-xs text-slate-400">Avg tokens</div>
        <div class="text-2xl font-semibold text-slate-100">{{ stats?.avgTokenCount ?? '–' }}</div>
      </div>

      <div class="p-3 rounded border bg-slate-800/50">
        <div class="text-xs text-slate-400">Embedding provider</div>
        <div class="text-2xl font-semibold text-slate-100">{{ stats?.embeddingProvider ?? '–' }}</div>
      </div>
    </div>

    <div>
      <h4 class="text-sm text-slate-200 mb-2">Chunks by source</h4>
      <ul class="space-y-1 text-xs text-slate-400">
        <li v-for="b in stats?.bySource ?? []" :key="b.source" class="flex justify-between">
          <span>{{ b.source }}</span>
          <span class="font-semibold text-slate-100">{{ b.chunks }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';

type RagStats = {
  totalChunks: number;
  bySource: { source: string; chunks: number }[];
  vectorDim: number;
  avgTokenCount: number;
  embeddingProvider: string;
  lastIndexedAt?: string;
};

const stats = ref<RagStats | null>(null);

async function fetchStats() {
  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/rag/stats`);
    if (!res.ok) throw new Error(await res.text());
    stats.value = await res.json();
  } catch (err) {
    console.error('[KB] stats fetch failed', err);
    stats.value = null;
  }
}

onMounted(fetchStats);
</script>

<template>
  <div class="rounded-xl border p-4 bg-slate-900/60">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-semibold text-slate-100">
        Chat Usage for source: <span class="text-emerald-400">{{ source }}</span>
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

      <span class="text-slate-500">
        Limit: {{ limit }}
      </span>
    </div>

    <div v-if="loading" class="text-xs text-slate-400">
      Loading usage...
    </div>

    <ul
      v-else
      class="space-y-3 max-h-[320px] overflow-auto pr-1 text-xs text-slate-200"
    >
      <li
        v-for="turn in items"
        :key="turn.id"
        class="p-3 border border-slate-700 rounded bg-slate-800/60"
      >
        <div class="flex justify-between items-start gap-2 mb-1">
          <div class="min-w-0">
            <p class="text-[11px] text-slate-400">
              {{ formatDate(turn.createdAt) }}
            </p>
            <p class="text-[11px] text-emerald-400" v-if="turn.usedRag">
              usedRag=true (hits: {{ turn.hitsCount ?? 0 }})
            </p>
          </div>
          <div class="text-right text-[11px] text-slate-400">
            <p class="font-mono">{{ turn.mode }}</p>
            <p class="font-mono truncate max-w-[120px]">
              {{ turn.id }}
            </p>
          </div>
        </div>

        <div class="mb-2">
          <p class="font-semibold text-slate-100 mb-1">USER</p>
          <p class="whitespace-pre-line text-[13px]">
            {{ turn.userText }}
          </p>
        </div>

        <div class="mb-2">
          <p class="font-semibold text-slate-100 mb-1">ASSISTANT</p>
          <p class="whitespace-pre-line text-[13px] text-slate-300">
            {{ truncate(turn.assistantText) }}
          </p>
        </div>

        <div v-if="turn.references?.length" class="mt-1 border-t border-slate-700 pt-2">
          <p class="text-[11px] text-slate-400 mb-1">
            References ({{ turn.references.length }}):
          </p>
          <ul class="space-y-1 text-[11px]">
            <li
              v-for="(ref, idx) in turn.references"
              :key="idx"
              class="flex items-center justify-between gap-2"
            >
              <span class="font-mono text-slate-300">
                [{{ ref.idx }}] {{ ref.source }}
              </span>
              <span class="truncate max-w-[180px] text-slate-400" v-if="ref.uri">
                {{ ref.uri }}
              </span>
            </li>
          </ul>
        </div>
      </li>

      <li v-if="!items.length" class="p-2 text-xs text-slate-500">
        Belum ada chat yang menggunakan source ini sebagai referensi.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';

interface ChatRefTurn {
  id: string;
  createdAt?: string;
  userText: string;
  assistantText: string;
  mode: string | null;
  usedRag: boolean;
  hitsCount?: number | null;
  references: Array<{ idx: number; source: string; uri?: string | null }>;
}

const props = defineProps<{
  source: string;
}>();

const loading = ref(false);
const items = ref<ChatRefTurn[]>([]);
const total = ref(0);
const limit = ref(50);
const offset = ref(0);

async function fetchUsage() {
  if (!props.source) return;
  loading.value = true;

  try {
    const res = await fetch(
      `${LLM_GATEWAY_URL}/analytics/chat/refs?source=${encodeURIComponent(
        props.source,
      )}&limit=${limit.value}&offset=${offset.value}`,
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const json = await res.json();
    const rows = json?.items ?? [];
    items.value = rows;
    total.value = json?.total ?? rows.length;
  } catch (err) {
    console.error('[KB] fetch usage by source error', err);
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function reload() {
  fetchUsage();
}

function formatDate(dt?: string) {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function truncate(text: string, max = 600) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

watch(
  () => props.source,
  () => {
    offset.value = 0;
    fetchUsage();
  },
  { immediate: true },
);
</script>

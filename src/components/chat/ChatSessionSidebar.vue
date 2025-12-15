<template>
  <aside class="space-y-3">
    <div
      class="rounded-2xl border border-slate-800 bg-black p-4 space-y-2"
    >
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-slate-50">
          Sessions
        </h2>
        <button
          type="button"
          class="text-[10px] rounded-full border border-slate-700 px-2 py-1 text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
          @click="$emit('refresh')"
        >
          Refresh
        </button>
      </div>

      <p class="text-[11px] text-slate-500">
        Pilih session untuk melanjutkan obrolan sebelumnya.
      </p>

      <div
        v-if="loading"
        class="flex items-center gap-2 text-[11px] text-slate-400 pt-1"
      >
        <span class="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        <span>Memuat sessions...</span>
      </div>

      <div
        v-else-if="!sessions.length"
        class="mt-1 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/60 p-3 text-[11px] text-slate-500"
      >
        Belum ada sesi yang tercatat. Coba kirim chat dulu.
      </div>

      <ul
        v-else
        class="mt-2 space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1"
      >
        <li v-for="s in sessions" :key="s.id">
          <button
            type="button"
            class="w-full rounded-xl border px-3 py-2 text-left transition-colors"
            :class="[
              s.id === selectedSessionId
                ? 'border-emerald-500 bg-slate-900'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/80'
            ]"
            @click="handleSelect(s)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] font-mono text-emerald-300 truncate">
                {{ s.id }}
              </p>
              <span
                class="inline-flex h-1.5 w-1.5 rounded-full"
                :class="s.id === selectedSessionId ? 'bg-emerald-400' : 'bg-slate-500'"
              />
            </div>
            <p class="mt-1 line-clamp-2 text-[11px] text-slate-200">
              {{ s.lastUserText || 'Belum ada pertanyaan' }}
            </p>
            <p class="mt-1 text-[10px] text-slate-500 flex justify-between">
              <span>{{ s.totalTurns }} turns • {{ s.usedRagTurns }} RAG</span>
              <span>{{ formatDate(s.lastActivityAt || s.createdAt) }}</span>
            </p>
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { ChatSession } from '@/types/chat';

defineProps<{
  sessions: ChatSession[];
  selectedSessionId: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'select', session: ChatSession): void;
}>();

function handleSelect(session: ChatSession) {
  emit('select', session);
}

function formatDate(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}
</script>

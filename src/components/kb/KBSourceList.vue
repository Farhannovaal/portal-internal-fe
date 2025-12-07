<template>
  <div class="rounded-xl border p-4 bg-slate-900/60">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold text-slate-100">Sources</h2>
      <span v-if="!loading && sources.length" class="text-[11px] text-slate-500">
        {{ filteredSources.length }} / {{ sources.length }} shown
      </span>
    </div>

    <div class="space-y-2 mb-3">
      <div class="flex items-center gap-2">
        <input
          v-model="search"
          type="text"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100"
          placeholder="Cari source (nama)..."
        />
      </div>

      <div class="flex flex-wrap items-center gap-2 text-[11px]">
        <div class="flex items-center gap-1">
          <span class="text-slate-400">Min refs:</span>
          <input
            v-model.number="minRefs"
            type="number"
            min="0"
            class="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100"
          />
        </div>

        <div class="flex items-center gap-1">
          <span class="text-slate-400">Sort by:</span>
          <select
            v-model="sortBy"
            class="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100"
          >
            <option value="refs">Refs</option>
            <option value="name">Name</option>
          </select>

          <button
            type="button"
            @click="toggleSortDir"
            class="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200"
          >
            {{ sortDir === 'desc' ? '↓' : '↑' }}
          </button>
        </div>

        <button
          type="button"
          @click="resetFilters"
          class="ml-auto rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300"
        >
          Reset
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-xs text-slate-500">
      Loading sources...
    </div>

    <ul v-else class="space-y-1 max-h-[320px] overflow-auto pr-1">
      <li
        v-for="s in filteredSources"
        :key="s.source"
        class="flex items-center justify-between p-2 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
        @click="$emit('select-source', s.source)"
      >
        <div class="flex flex-col">
          <span class="text-xs text-slate-200 truncate max-w-[200px]">
            {{ s.source || '(no source)' }}
          </span>
        </div>
        <span class="text-[11px] text-emerald-400">
          {{ s.totalRefs }} refs
        </span>
      </li>

      <li v-if="!filteredSources.length" class="p-2 text-xs text-slate-500">
        Tidak ada source yang cocok dengan filter.
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface KBSource {
  source: string;
  totalRefs: number;
}

const props = defineProps<{
  sources: KBSource[];
  loading?: boolean;
}>();

const search = ref('');
const minRefs = ref<number>(0);
const sortBy = ref<'name' | 'refs'>('refs');
const sortDir = ref<'asc' | 'desc'>('desc');

const normalizedSources = computed<KBSource[]>(() => {
  return (props.sources || []).map((s) => ({
    source: s.source ?? '',
    totalRefs: Number(s.totalRefs ?? 0),
  }));
});

const filteredSources = computed<KBSource[]>(() => {
  const term = search.value.trim().toLowerCase();
  const min = Number.isFinite(minRefs.value) ? minRefs.value : 0;

  let list = normalizedSources.value;

  if (term) {
    list = list.filter((s) => s.source.toLowerCase().includes(term));
  }

  if (min > 0) {
    list = list.filter((s) => s.totalRefs >= min);
  }

  list = [...list].sort((a, b) => {
    if (sortBy.value === 'refs') {
      const diff = a.totalRefs - b.totalRefs;
      return sortDir.value === 'asc' ? diff : -diff;
    }
    // sort by name
    const na = a.source.toLowerCase();
    const nb = b.source.toLowerCase();
    if (na < nb) return sortDir.value === 'asc' ? -1 : 1;
    if (na > nb) return sortDir.value === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
});

function toggleSortDir() {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
}

function resetFilters() {
  search.value = '';
  minRefs.value = 0;
  sortBy.value = 'refs';
  sortDir.value = 'desc';
}
</script>

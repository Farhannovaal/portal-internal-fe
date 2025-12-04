<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-xl font-semibold">Chat Analytics</h1>
      <p class="text-sm text-slate-400">
        Konsumsi dari endpoint <code>/analytics/chat/*</code>.
      </p>
    </header>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
        <h2 class="text-sm font-medium mb-2">Ringkasan</h2>
        <p class="text-xs text-slate-400">
          Nanti isi dengan total sessions, turns, RAG %, dll.
        </p>
      </div>
      <div class="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
        <h2 class="text-sm font-medium mb-2">Top Sources</h2>
        <p class="text-xs text-slate-400">
          Nanti render data dari <code>topSources</code> (note, manual, dll).
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
</script>

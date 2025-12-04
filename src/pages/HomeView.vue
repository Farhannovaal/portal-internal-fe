<template>
  <div class="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
    <section class="rounded-2xl border border-slate-800 bg-black p-4">
      <h1 class="mb-3 text-base font-semibold text-slate-100">
        Internal Assistant
      </h1>
      <p class="mb-4 text-sm text-slate-400">
        FE ini nanti akan jadi UI untuk ngobrol ke <span class="font-mono text-emerald-400">/chat/chat</span> & <span class="font-mono text-emerald-400">/chat/stream</span> milik llm-gateway-1.
      </p>

      <div class="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-xs text-slate-300">
        <p class="mb-1 font-mono text-[11px] text-emerald-300">
          assistant: "internal-helper"
        </p>
        <p class="text-slate-400">
          Silakan lanjut nanti kita bikin:
        </p>
        <ul class="mt-1 list-disc pl-5 text-slate-400">
          <li>Chat box dengan history per sessionId</li>
          <li>Pilihan mode: <span class="font-mono">chat / ask / auto</span></li>
          <li>Inspector RAG: lihat source & score hasil pencarian</li>
        </ul>
      </div>
    </section>

    <aside class="space-y-3">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        <h2 class="mb-1 text-sm font-semibold text-slate-100">Status</h2>
        <p class="text-xs text-slate-400">
          Backend <span class="font-mono text-emerald-400">llm-gateway-1</span> sudah:
        </p>
        <ul class="mt-1 list-disc pl-4 text-xs text-slate-400">
          <li>RAG ke Qdrant jalan</li>
          <li><span class="font-mono">/chat/chat</span> &amp; <span class="font-mono">/chat/stream</span> OK</li>
          <li>App &amp; assistant validation via <span class="font-mono">ai_app</span> + <span class="font-mono">ai_assistant</span></li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
</script>

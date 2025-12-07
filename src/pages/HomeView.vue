<template>
  <section class="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
    <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">

      <header class="space-y-1">
        <h1 class="text-xl font-semibold text-slate-50">Internal Assistant</h1>
        <p class="text-sm text-slate-400">
          UI ini menjadi antarmuka untuk ngobrol ke
          <code class="font-mono text-emerald-400">/chat/chat</code> &
          <code class="font-mono text-emerald-400">/chat/stream</code>
          milik gateway internal.
        </p>
      </header>

      <div
        class="rounded-xl border border-slate-700/80 bg-slate-900/80 p-4 text-xs space-y-3"
      >
        <div>
          <p class="font-mono text-[11px] text-emerald-300 mb-1">
            assistant: "internal-helper"
          </p>
          <p class="text-slate-300">
            Ke depannya halaman ini akan berkembang menjadi pusat interaksi AI internal.
          </p>
        </div>

        <div>
          <p class="text-slate-400">Roadmap fitur:</p>
          <ul class="mt-1 list-disc pl-5 space-y-1 text-slate-400">
            <li>
              Chat box lengkap dengan <b>history per sessionId</b>
            </li>
            <li>
              Pilihan Mode:
              <code class="font-mono">chat</code>,
              <code class="font-mono">ask</code>,
              <code class="font-mono">auto</code>
            </li>
            <li>
              Inspector RAG — menampilkan <b>source & score hasil pencarian</b>
            </li>
            <li>
              Menyimpan & menampilkan metadata per session
            </li>
            <li>
              Streaming via <code>/chat/stream</code>
            </li>
          </ul>
        </div>
      </div>

      <div class="rounded-xl border border-slate-700 bg-black/40 p-4">
        <h2 class="text-sm font-semibold text-slate-100 mb-2">Integrasi</h2>
        <ul class="text-xs text-slate-400 list-disc pl-4 space-y-1">
          <li>Terhubung dengan <code class="font-mono">ai_app</code> untuk validasi API key</li>
          <li>Assistant default diambil dari <code class="font-mono">ai_assistant</code></li>
          <li>RAG berjalan via Qdrant internal</li>
        </ul>
      </div>
    </div>

    <aside class="space-y-4">
      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 class="text-sm font-semibold text-slate-100 mb-1">Status</h2>
        <p class="text-xs text-slate-400">
          Backend:
          <code class="font-mono text-emerald-400">llm-gateway-1</code>
        </p>

        <ul class="mt-2 list-disc pl-4 text-xs text-slate-400 space-y-1">
          <li>RAG → Qdrant</li>
          <li>
            Endpoint:
            <code class="font-mono">/chat/chat</code>,
            <code class="font-mono">/chat/stream</code>
          </li>
          <li>
            Validasi:
            <code class="font-mono">ai_app</code> + <code class="font-mono">ai_assistant</code>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 class="text-sm font-semibold text-slate-100 mb-2">Link Cepat</h2>
        <ul class="text-xs text-slate-400 space-y-1">
          <li>
            <RouterLink
              to="/chat"
              class="text-emerald-400 hover:underline"
            >
              ➜ Buka Chat Interface
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/analytics"
              class="text-emerald-400 hover:underline"
            >
              ➜ Lihat Analytics Penggunaan AI
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/admin/ai-apps"
              class="text-emerald-400 hover:underline"
            >
              ➜ Kelola Ai Apps
            </RouterLink>
          </li>

          <li>
            <RouterLink
              to="/admin/ai-assistants"
              class="text-emerald-400 hover:underline"
            >
              ➜ Kelola Ai Assistants
            </RouterLink>
          </li>
        </ul>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-black text-slate-100">
    <header class="border-b border-slate-800 bg-black">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"
      >
        <div class="flex items-center gap-2">
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-semibold"
          >
            AI
          </span>
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-semibold">Portal Internal AI</span>
            <span class="text-xs text-slate-400">Internal Gateway</span>
          </div>
        </div>

        <div class="hidden text-xs text-slate-400 md:block">
          Connected to
          <span class="font-mono text-emerald-400">llm-gateway-1</span>
        </div>
      </div>

      <nav
        class="mx-auto flex max-w-6xl items-center gap-2 px-4 pb-3 text-xs text-slate-400"
      >
        <RouterLink
          to="/"
          class="rounded-full px-3 py-1 transition-colors"
          :class="linkClass('/')"
        >
          Overview
        </RouterLink>

        <RouterLink
          to="/chat"
          class="rounded-full px-3 py-1 transition-colors"
          :class="linkClass('/chat')"
        >
          Chat
        </RouterLink>

        <RouterLink
          to="/analytics"
          class="rounded-full px-3 py-1 transition-colors"
          :class="linkClass('/analytics')"
        >
          Analytics
        </RouterLink>

        <div class="ml-auto flex items-center gap-1">
          <span class="text-[10px] uppercase tracking-wide text-slate-500">
            Admin
          </span>
          <RouterLink
            to="/admin/ai-apps"
            class="rounded-full px-3 py-1 transition-colors"
            :class="linkClass('/admin/ai-apps')"
          >
            Ai Apps
          </RouterLink>
          <RouterLink
            to="/admin/ai-assistants"
            class="rounded-full px-3 py-1 transition-colors"
            :class="linkClass('/admin/ai-assistants')"
          >
            Ai Assistants
          </RouterLink>

          <RouterLink
            to="/admin/kb"
            class="rounded-full px-3 py-1 transition-colors"
            :class="linkClass('/admin/kb')"
          >
            KB Manager
          </RouterLink>

        </div>
      </nav>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

function linkClass(target: string) {
  const active =
    route.path === target || route.path.startsWith(target + '/');

  return active
    ? 'bg-slate-800 text-slate-100'
    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60';
}
</script>

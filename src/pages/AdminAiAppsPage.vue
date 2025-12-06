<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Ai Apps</h1>
        <p class="text-sm text-slate-400">
          CRUD ke <code>/admin/ai-apps</code> (name, code, apiKey, allowedModels, dll).
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
          @click="openCreate"
        >
          + Create app
        </button>
        <button
          class="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-300"
          @click="fetchApps"
          :disabled="loading"
        >
          Refresh
        </button>
      </div>
    </header>

    <div v-if="error" class="rounded p-3 bg-red-950/40 text-sm text-red-200">
      {{ error }}
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div v-if="loading" class="text-sm text-slate-400">Loading apps...</div>

      <div v-else>
        <table class="w-full table-auto text-sm">
          <thead>
            <tr class="text-left text-xs text-slate-400">
              <th class="p-2">Name</th>
              <th class="p-2">Code</th>
              <th class="p-2">API Key</th>
              <th class="p-2">Allowed Models</th>
              <th class="p-2">Active</th>
              <th class="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr v-for="app in apps" :key="app.id" class="align-top">
              <td class="p-2 align-top">
                <div class="font-medium text-slate-100">{{ app.name }}</div>
                <div class="text-[11px] text-slate-500">{{ app.id }}</div>
              </td>
              <td class="p-2 align-top">
                <div class="font-mono text-[12px] text-emerald-300">{{ app.code }}</div>
              </td>
              <td class="p-2 align-top">
                <div class="truncate max-w-[300px] text-[12px] text-slate-200 font-mono">
                  {{ app.apiKey }}
                </div>
                <div class="text-[11px] text-slate-500">
                  <button class="underline text-xs" @click="copyKey(app.apiKey)">copy</button>
                </div>
              </td>
              <td class="p-2 align-top">
                <div class="text-[12px] text-slate-200">
                  {{ (app.allowedModels ?? []).join(', ') || '—' }}
                </div>
                <div class="text-[11px] text-slate-500">
                  {{ (app.allowedAssistants ?? []).join(', ') || '—' }}
                </div>
              </td>
              <td class="p-2 align-top">
                <span :class="app.isActive ? 'text-emerald-400' : 'text-slate-500'">
                  {{ app.isActive ? 'Active' : 'Disabled' }}
                </span>
              </td>
              <td class="p-2 align-top text-right space-x-2">
                <button
                  class="text-xs rounded px-2 py-1 border border-slate-700 hover:border-emerald-500"
                  @click="openEdit(app)"
                >
                  Edit
                </button>

                <button
                  class="text-xs rounded px-2 py-1 border border-slate-700 hover:border-emerald-500"
                  @click="confirmRegen(app)"
                >
                  Regen Key
                </button>

                <button
                  class="text-xs rounded px-2 py-1 border border-red-700 text-red-300 hover:bg-red-900/40"
                  @click="confirmDelete(app)"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!apps.length">
              <td colspan="6" class="p-4 text-sm text-slate-500">
                No apps yet. Click "Create app" to add one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="showForm"
        class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/60" @click="closeForm"></div>

        <div class="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <AiAppForm
            :model="editingModel"
            @saved="onSaved"
            @cancel="closeForm"
          />
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AiAppForm from '@/components/AiAppForm.vue';
import { LLM_GATEWAY_URL } from '@/config';

type AiApp = {
  id: string;
  name: string;
  code: string;
  apiKey?: string;
  allowedModels?: string[] | null;
  allowedAssistants?: string[] | null;
  rateLimitPerMin?: number | null;
  isActive?: boolean;
  createdAt?: string;
};

const gateway = LLM_GATEWAY_URL;

const apps = ref<AiApp[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showForm = ref(false);
const editingModel = ref<AiApp | null>(null);

async function fetchApps() {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`${gateway}/admin/ai-apps`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    apps.value = (await res.json()) as AiApp[];
  } catch (err: any) {
    console.error('fetchApps failed', err);
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingModel.value = null;
  showForm.value = true;
}

function openEdit(app: AiApp) {
  editingModel.value = { ...app };
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingModel.value = null;
}

async function onSaved(saved: AiApp) {
  await fetchApps();
  closeForm();
}

async function confirmRegen(app: AiApp) {
  if (!confirm(`Regenerate API key for ${app.name} (${app.code})? This will replace the existing key.`)) return;
  try {
    const res = await fetch(`${gateway}/admin/ai-apps/${encodeURIComponent(app.id)}/regenerate-key`, {
      method: 'POST',
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }
    await fetchApps();
    alert('API key regenerated.');
  } catch (err: any) {
    console.error('regen key failed', err);
    alert('Regenerate key failed: ' + (err?.message || String(err)));
  }
}

async function confirmDelete(app: AiApp) {
  if (!confirm(`Delete app ${app.name} (${app.code})? This action cannot be undone.`)) return;
  try {
    const res = await fetch(`${gateway}/admin/ai-apps/${encodeURIComponent(app.id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }
    await fetchApps();
    alert('App deleted.');
  } catch (err: any) {
    console.error('delete failed', err);
    alert('Delete failed: ' + (err?.message || String(err)));
  }
}

function copyKey(k?: string) {
  if (!k) return;
  navigator.clipboard?.writeText(k).then(
    () => alert('API key copied to clipboard'),
    (e) => alert('Copy failed: ' + String(e)),
  );
}

onMounted(() => {
  fetchApps();
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

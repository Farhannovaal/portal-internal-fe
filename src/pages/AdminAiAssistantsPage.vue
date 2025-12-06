<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Ai Assistants</h1>
        <p class="text-sm text-slate-400">
          CRUD ke <code>/admin/ai-assistants</code>.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm"
          @click="openCreate"
        >
          + Create Assistant
        </button>

        <button
          class="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm"
          @click="fetchAssistants"
        >
          Refresh
        </button>
      </div>
    </header>

    <div v-if="error" class="bg-red-950/40 text-red-200 p-3 rounded">
      {{ error }}
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-xs text-slate-400">
            <th class="p-2">Name</th>
            <th class="p-2">Slug</th>
            <th class="p-2">Default</th>
            <th class="p-2">Active</th>
            <th class="p-2 text-right">Actions</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-800">
          <tr v-for="a in assistants" :key="a.id">
            <td class="p-2">{{ a.name }}</td>
            <td class="p-2 font-mono text-emerald-300">{{ a.slug }}</td>
            <td class="p-2">
              <div class="text-xs text-slate-300">
                Model: <b>{{ a.defaultModel }}</b>
              </div>
              <div class="text-xs text-slate-400">
                Mode: {{ a.defaultMode }}
              </div>
            </td>
            <td class="p-2">
              <span :class="a.isActive ? 'text-emerald-400' : 'text-slate-500'">
                {{ a.isActive ? 'Active' : 'Disabled' }}
              </span>
            </td>
            <td class="p-2 text-right">
              <button
                class="text-xs border border-slate-700 px-2 py-1 rounded"
                @click="openEdit(a)"
              >
                Edit
              </button>

              <button
                class="text-xs border border-red-700 text-red-300 px-2 py-1 rounded ml-2"
                @click="confirmDelete(a)"
              >
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="!assistants.length">
            <td colspan="5" class="p-4 text-center text-slate-500 text-sm">
              No assistants yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <transition name="fade">
      <div
        v-if="showForm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/60" @click="closeForm"></div>

        <div class="relative w-full max-w-2xl border border-slate-800 bg-slate-900 p-6 rounded-2xl">
          <AiAssistantForm
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
import AiAssistantForm from '@/components/AiAssistantForm.vue';
import { LLM_GATEWAY_URL } from '@/config';
import type { AiAssistant } from '@/types/ai-assistant';

const assistants = ref<AiAssistant[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showForm = ref(false);
const editingModel = ref<AiAssistant | null>(null);

async function fetchAssistants() {
  loading.value = true;
  error.value = null;

  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/admin/ai-assistants`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    assistants.value = (await res.json()) as AiAssistant[];
  } catch (err: any) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingModel.value = null;
  showForm.value = true;
}

function openEdit(a: AiAssistant) {
  editingModel.value = { ...a };
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingModel.value = null;
}

async function onSaved() {
  await fetchAssistants();
  closeForm();
}

async function confirmDelete(a: AiAssistant) {
  if (!confirm(`Delete assistant "${a.name}"?`)) return;

  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/admin/ai-assistants/${a.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchAssistants();
  } catch (err: any) {
    alert('Delete failed: ' + (err?.message || String(err)));
  }
}

onMounted(fetchAssistants);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

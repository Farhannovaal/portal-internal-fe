<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-50">
        {{ isEdit ? 'Edit App' : 'Create App' }}
      </h3>
      <button
        type="button"
        class="text-xs underline text-slate-400 hover:text-emerald-400"
        @click="$emit('cancel')"
      >
        Close
      </button>
    </div>

    <div v-if="error" class="rounded p-2 text-sm bg-red-950/60 text-red-200">
      {{ error }}
    </div>

    <form @submit.prevent="submit" class="space-y-3">
      <div>
        <label class="block text-[12px] text-slate-300 mb-1">Name</label>
        <input
          v-model="form.name"
          required
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        />
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">Code (unique)</label>
        <input
          v-model="form.code"
          :disabled="isEdit"
          required
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 disabled:opacity-60"
        />
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">Allowed Models (comma separated)</label>
        <input
          v-model="allowedModelsText"
          placeholder="gpt-4,gpt-4o"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        />
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">Allowed Assistants (comma separated)</label>
        <input
          v-model="allowedAssistantsText"
          placeholder="internal-helper,portal-assistant"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[12px] text-slate-300 mb-1">Rate limit / min</label>
          <input
            v-model.number="form.rateLimitPerMin"
            type="number"
            min="0"
            placeholder="e.g. 60"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
        </div>

        <div>
          <label class="block text-[12px] text-slate-300 mb-1">Active?</label>
          <select v-model="form.isActive" class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-emerald-500"
          @click="$emit('cancel')"
          :disabled="saving"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
          :disabled="saving"
        >
          <span v-if="!saving">{{ isEdit ? 'Save changes' : 'Create' }}</span>
          <span v-else>Saving...</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';
import type { AiApp } from '@/types/ai-app';
import type { AiAppFormPayload } from '@/types/ai-app-form';

const props = defineProps({
  model: { type: Object as PropType<AiAppFormPayload | null>, default: null },
});

const emit = defineEmits<{
  (e: 'saved', payload: AiApp): void;
  (e: 'cancel'): void;
}>();

const saving = ref(false);
const error = ref<string | null>(null);

const form = reactive<AiAppFormPayload>({
  id: undefined,
  name: '',
  code: '',
  allowedModels: null,
  allowedAssistants: null,
  rateLimitPerMin: null,
  isActive: true,
});

watch(
  () => props.model,
  (m) => {
    error.value = null;
    if (m) {
      form.id = m.id;
      form.name = m.name ?? '';
      form.code = m.code ?? '';
      form.allowedModels = m.allowedModels ?? null;
      form.allowedAssistants = m.allowedAssistants ?? null;
      form.rateLimitPerMin = m.rateLimitPerMin ?? null;
      form.isActive = m.isActive ?? true;
    } else {
      form.id = undefined;
      form.name = '';
      form.code = '';
      form.allowedModels = null;
      form.allowedAssistants = null;
      form.rateLimitPerMin = null;
      form.isActive = true;
    }
  },
  { immediate: true },
);

const allowedModelsText = computed<string>({
  get() {
    return (form.allowedModels ?? []).join(',');
  },
  set(v: string) {
    const arr = v.split(',').map((s) => s.trim()).filter(Boolean);
    form.allowedModels = arr.length ? arr : null;
  },
});

const allowedAssistantsText = computed<string>({
  get() {
    return (form.allowedAssistants ?? []).join(',');
  },
  set(v: string) {
    const arr = v.split(',').map((s) => s.trim()).filter(Boolean);
    form.allowedAssistants = arr.length ? arr : null;
  },
});

const isEdit = computed(() => !!form.id);

async function submit() {
  saving.value = true;
  error.value = null;

  try {
    const payload: any = {
      name: form.name,
      allowedModels: form.allowedModels,
      allowedAssistants: form.allowedAssistants,
      rateLimitPerMin: form.rateLimitPerMin ?? null,
      isActive: form.isActive,
    };

    let res: Response;

    if (isEdit.value && form.id) {
      res = await fetch(`${LLM_GATEWAY_URL}/admin/ai-apps/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      payload.code = form.code;
      res = await fetch(`${LLM_GATEWAY_URL}/admin/ai-apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }

    const json = (await res.json()) as AiApp;
    emit('saved', json);
  } catch (err: any) {
    console.error('AiAppForm submit failed', err);
    error.value = err?.message || String(err);
  } finally {
    saving.value = false;
  }
}
</script>

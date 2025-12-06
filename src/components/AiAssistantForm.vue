<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-50">
        {{ isEdit ? 'Edit Assistant' : 'Create Assistant' }}
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
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">Slug (unique)</label>
        <input
          v-model="form.slug"
          :disabled="isEdit"
          required
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm disabled:opacity-60"
        />
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">Description</label>
        <textarea
          v-model="form.description"
          rows="2"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">
          Default Model
        </label>
        <input
          v-model="form.defaultModel"
          placeholder="gpt-4o-mini"
          required
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">Default Mode</label>
        <select
          v-model="form.defaultMode"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="auto">auto</option>
          <option value="rag">rag</option>
          <option value="llm-only">llm-only</option>
        </select>
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">System Prompt</label>
        <textarea
          v-model="form.systemPrompt"
          rows="4"
          required
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">
          KB Tags (comma separated)
        </label>
        <input
          v-model="kbText"
          placeholder="internal,notes,manuals"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[12px] text-slate-300 mb-1">Temperature</label>
          <input
            v-model.number="form.temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="block text-[12px] text-slate-300 mb-1">Max Tokens</label>
          <input
            v-model.number="form.maxTokens"
            type="number"
            min="1"
            placeholder="null"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label class="block text-[12px] text-slate-300 mb-1">Active?</label>
        <select
          v-model="form.isActive"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option :value="true">Yes</option>
          <option :value="false">No</option>
        </select>
      </div>

      <div class="flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-2 text-xs"
          @click="$emit('cancel')"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
        >
          {{ isEdit ? 'Save changes' : 'Create' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import type { PropType } from 'vue';
import { LLM_GATEWAY_URL } from '@/config';
import type { AiAssistant } from '@/types/ai-assistant';
import type { AiAssistantFormPayload } from '@/types/ai-assistant-form';

const props = defineProps({
  model: { type: Object as PropType<AiAssistantFormPayload | null>, default: null },
});

const emit = defineEmits<{
  (e: 'saved', payload: AiAssistant): void;
  (e: 'cancel'): void;
}>();

const error = ref<string | null>(null);

const form = reactive<AiAssistantFormPayload>({
  id: undefined,
  name: '',
  slug: '',
  description: '',
  defaultModel: '',
  defaultMode: 'auto',
  systemPrompt: '',
  kbTags: null,
  temperature: 0.7,
  maxTokens: null,
  isActive: true,
});

watch(
  () => props.model,
  (m) => {
    if (m) Object.assign(form, m);
    else {
      Object.assign(form, {
        id: undefined,
        name: '',
        slug: '',
        description: '',
        defaultModel: '',
        defaultMode: 'auto',
        systemPrompt: '',
        kbTags: null,
        temperature: 0.7,
        maxTokens: null,
        isActive: true,
      });
    }
  },
  { immediate: true },
);

const kbText = computed({
  get: () => (form.kbTags ?? []).join(','),
  set: (v: string) => {
    const arr = v.split(',').map(s => s.trim()).filter(Boolean);
    form.kbTags = arr.length ? arr : null;
  }
});

const isEdit = computed(() => !!form.id);

async function submit() {
  error.value = null;

  try {
    const payload = { ...form };
    let res: Response;

    if (isEdit.value && form.id) {
      res = await fetch(`${LLM_GATEWAY_URL}/admin/ai-assistants/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${LLM_GATEWAY_URL}/admin/ai-assistants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) throw new Error(await res.text());

    const json = await res.json() as AiAssistant;
    emit('saved', json);
  } catch (err: any) {
    error.value = err?.message || String(err);
  }
}
</script>

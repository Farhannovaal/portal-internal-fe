<template>
  <section
    class="grid gap-6 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,2.2fr)_minmax(260px,1fr)]"
  >
    <ChatSessionSidebar
      :sessions="sessions"
      :selected-session-id="sessionId"
      :loading="loadingSessions"
      @refresh="fetchSessions"
      @select="openSession"
    />

    <div
      class="flex flex-col h-[calc(100vh-170px)] rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"
    >
      <header
        class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/80"
      >
        <div>
          <h1 class="text-sm font-semibold text-slate-50">
            Chat Internal
          </h1>
          <p class="text-xs text-slate-400">
            Endpoint:
            <code class="font-mono text-emerald-400">/chat/chat</code>
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-400">Mode</span>
            <select
              v-model="mode"
              class="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="auto">auto</option>
              <option value="rag">rag</option>
              <option value="llm-only">llm-only</option>
            </select>
          </div>

          <div
            class="hidden md:flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-[11px] font-medium text-slate-400"
          >
            <span
              class="inline-flex h-2 w-2 rounded-full"
              :class="sessionId ? 'bg-emerald-400' : 'bg-slate-500'"
            />
            <span class="truncate max-w-[180px]">
              {{ sessionId ? sessionId : 'Session baru' }}
            </span>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div
          v-if="!messages.length"
          class="h-full flex flex-col items-center justify-center text-center text-sm text-slate-500 gap-2"
        >
          <p class="font-medium text-slate-300">
            Mulai ngobrol dengan internal-helper
          </p>
          <p class="max-w-md text-xs text-slate-500">
            Pertanyaanmu akan dikirim ke
            <code class="font-mono text-emerald-400">llm-gateway-1</code>
            dengan mode
            <span class="font-mono text-emerald-400">{{ mode }}</span>
            dan tags
            <code class="font-mono text-emerald-400">
              {{ defaultTags.join(', ') || '-' }}
            </code>.
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="m in messages"
            :key="m.id"
            class="flex"
            :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed"
              :class="m.role === 'user'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-100 border border-slate-700'"
            >
              <p
                class="text-[11px] mb-1 font-medium opacity-70"
                v-if="m.role === 'assistant'"
              >
                internal-helper
              </p>
              <p>{{ m.content }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="loading"
          class="flex items-center gap-2 pt-2 text-[11px] text-slate-400"
        >
          <span
            class="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400"
          />
          <span>Thinking...</span>
        </div>
      </div>

      <form
        class="border-t border-slate-800 bg-slate-900/80 px-4 py-3"
        @submit.prevent="handleSend"
      >
        <div class="flex items-end gap-2">
          <textarea
            v-model="input"
            rows="1"
            placeholder="Tulis pertanyaan untuk RAG internal di sini..."
            class="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            @keydown.enter.exact.prevent="handleSend"
          />
          <button
            type="submit"
            :disabled="!canSend"
            class="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="!loading">Kirim</span>
            <span v-else>Mengirim...</span>
          </button>
        </div>
        <div class="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>
            userId:
            <code class="font-mono text-slate-400">{{ defaultUserId }}</code>
          </span>
          <button
            type="button"
            class="text-[10px] underline underline-offset-2 hover:text-emerald-400"
            @click="resetSession"
          >
            Reset session
          </button>
        </div>
      </form>
    </div>

    <aside class="space-y-4">
      <div
        class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
      >
        <h2 class="text-sm font-semibold text-slate-50">Status</h2>
        <p class="text-xs text-slate-400">
          Connected to
          <span class="font-mono text-emerald-400">
            {{ gatewayUrl }}
          </span>
        </p>
        <ul class="mt-2 space-y-1 text-xs text-slate-400">
          <li>• App code: <code class="font-mono">{{ appCode }}</code></li>
          <li>
            • Assistant:
            <code class="font-mono">{{ defaultAssistant }}</code>
          </li>
          <li>
            • Tags:
            <code class="font-mono">
              {{ defaultTags.join(', ') || '-' }}
            </code>
          </li>
        </ul>
      </div>

      <div
        class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
      >
        <h2 class="text-sm font-semibold text-slate-50">
          Roadmap UI Chat
        </h2>
        <ul class="mt-1 space-y-1 text-xs text-slate-400">
          <li>• Streaming via <code>/chat/stream</code></li>
          <li>• Inspector RAG (lihat hits & skor)</li>
          <li>• Pilih assistant / KB per chat</li>
          <li>• Simpan / rename session</li>
        </ul>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  APP_API_KEY,
  APP_CODE,
  DEFAULT_ASSISTANT,
  DEFAULT_TAGS,
  DEFAULT_USER_ID,
  LLM_GATEWAY_URL,
} from '@/config';
import type { ChatMode } from '@/config';
import ChatSessionSidebar from '@/components/chat/ChatSessionSidebar.vue';
import type {
  ChatMessage,
  ChatSession,
  SessionTurn,
} from '@/types/chat';

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const loading = ref(false);
const mode = ref<ChatMode>('auto');
const sessionId = ref<string | null>(null);

let messageId = 1;

const gatewayUrl = LLM_GATEWAY_URL;
const appCode = APP_CODE;
const defaultAssistant = DEFAULT_ASSISTANT;
const defaultUserId = DEFAULT_USER_ID;
const defaultTags = DEFAULT_TAGS;

const sessions = ref<ChatSession[]>([]);
const loadingSessions = ref(false);

const canSend = computed(
  () => !!input.value.trim() && !loading.value && !!APP_API_KEY,
);

function resetSession() {
  sessionId.value = null;
  messages.value = [];
}

async function fetchSessions() {
  loadingSessions.value = true;
  try {
    const res = await fetch(`${gatewayUrl}/analytics/chat/sessions`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      items: ChatSession[];
      total: number;
      limit: number;
      offset: number;
    };
    sessions.value = json.items ?? [];
  } catch (err) {
    console.error('Gagal fetch sessions', err);
  } finally {
    loadingSessions.value = false;
  }
}

async function openSession(s: ChatSession) {
  // set sessionId dulu, lalu load history
  sessionId.value = s.id;
  messages.value = [];
  loading.value = true;

  try {
    const res = await fetch(
      `${gatewayUrl}/analytics/chat/sessions/${s.id}/turns`,
    );
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const turns = (await res.json()) as SessionTurn[];

    for (const t of turns) {
      if (t.userText) {
        messages.value.push({
          id: messageId++,
          role: 'user',
          content: t.userText,
        });
      }
      if (t.assistantText) {
        messages.value.push({
          id: messageId++,
          role: 'assistant',
          content: t.assistantText,
        });
      }
    }
  } catch (err: any) {
    messages.value.push({
      id: messageId++,
      role: 'assistant',
      content:
        `Gagal load history sesi (${s.id}): ` +
        (err?.message || String(err)),
    });
  } finally {
    loading.value = false;
  }
}

async function handleSend() {
  const text = input.value.trim();
  if (!text || loading.value) return;

  messages.value.push({
    id: messageId++,
    role: 'user',
    content: text,
  });

  input.value = '';
  loading.value = true;

  try {
    const res = await fetch(`${gatewayUrl}/chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        mode: mode.value,
        tags: defaultTags,
        sessionId: sessionId.value,
        userId: defaultUserId,
        appCode,
        apiKey: APP_API_KEY,
        assistant: defaultAssistant,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      messages.value.push({
        id: messageId++,
        role: 'assistant',
        content: `Error dari gateway (${res.status}): ${errText}`,
      });
      return;
    }

    const json = (await res.json()) as { text: string; sessionId?: string };

    if (json.sessionId) {
      sessionId.value = json.sessionId;
    }

    messages.value.push({
      id: messageId++,
      role: 'assistant',
      content: json.text ?? '(tidak ada text)',
    });

    fetchSessions();
  } catch (err: any) {
    messages.value.push({
      id: messageId++,
      role: 'assistant',
      content: `Gagal call /chat/chat: ${err?.message || String(err)}`,
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchSessions();
});
</script>

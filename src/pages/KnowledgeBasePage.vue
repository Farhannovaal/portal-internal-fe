<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-xl font-semibold text-slate-100">Knowledge Base Manager</h1>
      <p class="text-sm text-slate-400">
        Kelola dokumen yang digunakan RAG.
        Tab <span class="font-semibold">Documents</span> buat manage sumber,
        tab <span class="font-semibold">Chunks (Debug)</span> buat inspeksi vector chunks di Qdrant,
        tab <span class="font-semibold">Usage / Chat Refs</span> buat lihat riwayat chat per source.
      </p>
    </header>

    <div class="border-b border-slate-800 flex gap-4 text-sm">
      <button
        type="button"
        class="pb-2 border-b-2"
        :class="tab === 'documents'
          ? 'border-emerald-400 text-emerald-400'
          : 'border-transparent text-slate-400 hover:text-slate-100'"
        @click="handleTabClick('documents')"
      >
        Documents
      </button>

      <button
        type="button"
        class="pb-2 border-b-2"
        :class="tab === 'chunks'
          ? 'border-emerald-400 text-emerald-400'
          : 'border-transparent text-slate-400 hover:text-slate-100'"
        @click="handleTabClick('chunks')"
      >
        Chunks (Debug)
      </button>

      <button
        type="button"
        class="pb-2 border-b-2"
        :class="tab === 'usage'
          ? 'border-emerald-400 text-emerald-400'
          : 'border-transparent text-slate-400 hover:text-slate-100'"
        @click="handleTabClick('usage')"
      >
        Usage / Chat Refs
      </button>
    </div>

    <div v-if="tab === 'documents'" class="grid md:grid-cols-[2fr_1fr] gap-6">
      <div class="space-y-4">
        <KBSourceList
          :sources="kbSources"
          :loading="loadingKbSources"
          @select-source="selectDocSource"
        />

        <KBDocumentList
          v-if="selectedDocSource"
          :key="selectedDocSource + ':' + docListKey"
          :source="selectedDocSource"
          @reload-sources="refreshKbSources"
          @edit-document="openDocumentEditor"
        />
      </div>

      <div class="space-y-4">
        <KBIngestForm @ingested="onIngested" />
        <KBFetchUrlForm @ingested="onIngested" />
      </div>
    </div>

    <div v-else-if="tab === 'chunks'" class="grid md:grid-cols-[2fr_1fr] gap-6">
      <div class="space-y-4">
        <KBSourceList
          :sources="kbSources"
          :loading="loadingKbSources"
          @select-source="selectChunkSource"
        />

        <KBSourceDetail
          v-if="selectedChunkSource"
          :source="selectedChunkSource"
          @close="selectedChunkSource = null"
          @deleted="onChunksDeleted"
        />
      </div>

      <div class="space-y-4 text-xs text-slate-400">
        <div class="rounded-xl border border-slate-800 p-4 bg-slate-900/60">
          <h3 class="text-sm font-semibold text-slate-100 mb-2">
            Apa itu Chunks (Debug)?
          </h3>
          <p class="mb-2">
            Di tab ini kamu melihat <span class="text-emerald-400 font-semibold">potongan teks (chunks)</span> yang
            disimpan di Qdrant dan dipakai RAG saat menjawab.
          </p>
          <ul class="list-disc list-inside space-y-1">
            <li>Setiap chunk punya <span class="font-mono text-slate-200">id</span> (pointId) di Qdrant.</li>
            <li><span class="font-mono text-slate-200">docId</span> menghubungkan chunk ke dokumen utuh di DB.</li>
            <li>Kamu bisa edit chunk untuk memperbaiki isi lalu re-embed.</li>
            <li>Delete di sini hanya untuk operasi teknis/debug.</li>
          </ul>
        </div>

        <div class="rounded-xl border border-slate-800 p-4 bg-slate-900/60">
          <h3 class="text-sm font-semibold text-slate-100 mb-2">
            Alur singkat
          </h3>
          <ol class="list-decimal list-inside space-y-1">
            <li>Ingest dokumen di tab <span class="text-emerald-400">Documents</span>.</li>
            <li>Dokumen disimpan di DB dan dipecah jadi chunks ke Qdrant.</li>
            <li>Di tab <span class="text-emerald-400">Chunks (Debug)</span>, kamu bisa cek hasil chunking.</li>
          </ol>
        </div>
      </div>
    </div>

    <div v-else class="grid md:grid-cols-[2fr_1fr] gap-6">
      <div class="space-y-4">
        <KBSourceList
          :sources="usageSources"
          :loading="loadingUsageSources"
          @select-source="selectUsageSource"
        />

        <KBUsageBySource
          v-if="selectedUsageSource"
          :source="selectedUsageSource"
        />
      </div>

      <div class="space-y-4 text-xs text-slate-400">
        <div class="rounded-xl border border-slate-800 p-4 bg-slate-900/60">
          <h3 class="text-sm font-semibold text-slate-100 mb-2">
            Usage / Chat Refs
          </h3>
          <p class="mb-2">
            Tab ini menunjukkan <span class="text-emerald-400 font-semibold">riwayat chat</span>
            di mana suatu <span class="font-semibold">source</span> dipakai sebagai referensi RAG.
          </p>
          <ul class="list-disc list-inside space-y-1">
            <li>Lihat pertanyaan user dan jawaban asisten per source.</li>
            <li>Mudah buat audit apakah RAG sudah pakai dokumen yang tepat.</li>
            <li>Bagus untuk evaluasi kualitas dan tuning dokumen.</li>
          </ul>
        </div>
      </div>
    </div>

    <KBDocumentEditor
      :open="docEditorOpen"
      :id="selectedDocId"
      @close="closeDocumentEditor"
      @saved="onDocumentSaved"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import KBSourceList from '@/components/kb/KBSourceList.vue';
import KBIngestForm from '@/components/kb/KBIngestForm.vue';
import KBSourceDetail from '@/components/kb/KBSourceDetail.vue';
import KBFetchUrlForm from '@/components/kb/KBFetchUrlForm.vue';
import KBDocumentList from '@/components/kb/KBDocumentList.vue';
import KBDocumentEditor from '@/components/kb/KBDocumentEditor.vue';
import KBUsageBySource from '@/components/kb/KBUsageBySource.vue';
import { LLM_GATEWAY_URL } from '@/config';

const tab = ref<'documents' | 'chunks' | 'usage'>('documents');

const kbSources = ref<any[]>([]);
const loadingKbSources = ref(false);

const usageSources = ref<any[]>([]);
const loadingUsageSources = ref(false);

const selectedDocSource = ref<string | null>(null);
const selectedChunkSource = ref<string | null>(null);
const selectedUsageSource = ref<string | null>(null);

const docListKey = ref(0);
const docEditorOpen = ref(false);
const selectedDocId = ref<string | null>(null);

async function fetchKbSources() {
  loadingKbSources.value = true;
  try {
    const res = await fetch(`${LLM_GATEWAY_URL}/rag/sources`);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const json = await res.json();
    kbSources.value = (json?.sources ?? []).map((s: any) => ({
      source: s.source,
      totalRefs: s.totalDocs ?? 0,
    }));
  } catch (err) {
    console.error('[KB] fetch KB sources error', err);
    kbSources.value = [];
  } finally {
    loadingKbSources.value = false;
  }
}

async function fetchUsageSources() {
  loadingUsageSources.value = true;
  try {
    const res = await fetch(
      `${LLM_GATEWAY_URL}/analytics/chat/sources?limit=500`,
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }
    usageSources.value = await res.json();
  } catch (err) {
    console.error('[KB] fetch usage sources error', err);
    usageSources.value = [];
  } finally {
    loadingUsageSources.value = false;
  }
}

function refreshKbSources() {
  fetchKbSources();
}

function refreshUsageSources() {
  fetchUsageSources();
}

function handleTabClick(nextTab: 'documents' | 'chunks' | 'usage') {
  tab.value = nextTab;

  if (nextTab === 'documents') {
    selectedChunkSource.value = null;
    selectedUsageSource.value = null;
    refreshKbSources();
  } else if (nextTab === 'chunks') {
    selectedDocSource.value = null;
    selectedUsageSource.value = null;
    refreshKbSources();
  } else if (nextTab === 'usage') {
    selectedDocSource.value = null;
    selectedChunkSource.value = null;
    refreshUsageSources();
  }
}

function selectDocSource(src: string) {
  selectedDocSource.value = src;
}

function selectChunkSource(src: string) {
  selectedChunkSource.value = src;
}

function selectUsageSource(src: string) {
  selectedUsageSource.value = src;
}

function onChunksDeleted() {
  refreshKbSources();
  selectedChunkSource.value = null;
}

function onIngested() {
  // setelah ingest dokumen baru, refresh list source & document list
  refreshKbSources();
  docListKey.value++;
}

type KBDocument = {
  id: string;
  source: string;
  uri: string | null;
  title: string | null;
  lang: string | null;
  tags: string[] | null;
  text?: string;
  hash?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function openDocumentEditor(doc: KBDocument) {
  selectedDocId.value = doc.id;
  docEditorOpen.value = true;
}

function closeDocumentEditor() {
  docEditorOpen.value = false;
  selectedDocId.value = null;
}

function onDocumentSaved() {
  refreshKbSources();
  docListKey.value++;
  docEditorOpen.value = false;
  selectedDocId.value = null;
}

onMounted(() => {
  fetchKbSources();
  fetchUsageSources();
});
</script>

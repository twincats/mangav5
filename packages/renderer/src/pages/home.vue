<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { mangaAPI, showContextMenu } from "@app/preload";
import type { LatestMangaResponse  } from "@app/preload";
import { useRouter } from "vue-router";

const latestManga = ref<LatestMangaResponse[]>([]);
const router = useRouter();

/**
 * Mengambil data manga terbaru dari database
 * Fungsi ini dipanggil saat komponen dimount untuk menampilkan
 * daftar manga yang baru saja di-download
 */
const getLatestManga = async () => {
  const result = await mangaAPI.getLatestManga();
  if (result.success) {
    latestManga.value = result.data || [];
  } else {
    console.error("Failed to get latest manga:", result.error);
  }
}

getLatestManga();


/**
 * Memformat tanggal string menjadi format yang mudah dibaca
 * @param dateString - String tanggal dari database (ISO format)
 * @returns String tanggal dalam format DD/MM (contoh: 25/12)
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
  const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);
  return formattedDate;
}

/**
 * Handler untuk klik pada cover manga
 * @param mangaId - ID manga yang diklik
 * Navigasi ke halaman detail manga dengan chapter
 */
const clickManga = (mangaId:number)=>{
  router.push(`/chapters/${mangaId}`);
}

/**
 * Handler untuk klik pada chapter manga
 * @param chapterId - ID chapter yang diklik
 * TODO: Implementasi navigasi ke halaman baca chapter
 */
const clickChapter = (chapterId:number)=>{
 router.push(`/read/${chapterId}`);
}

const dialogAddAlt = ref(false);
const dialogLoading = ref(false);
const dialogAltInput = ref("");
const dialogAltList = ref<string[]>([]);
const dialogMangaId = ref<number | null>(null);
const dialogMangaTitle = ref("");

const openAddAltDialog = async (payload: { mangaId?: number; mangaTitle?: string }) => {
  if (!payload?.mangaId) return;
  dialogMangaId.value = payload.mangaId;
  dialogMangaTitle.value = payload.mangaTitle || "";
  dialogLoading.value = true;
  dialogAltInput.value = "";
  dialogAltList.value = [];
  dialogAddAlt.value = true;
  const res = await mangaAPI.getAlternativeTitles(payload.mangaId);
  if (res.success) {
    dialogAltList.value = res.data || [];
  }
  dialogLoading.value = false;
};

const saveAlternativeTitle = async () => {
  if (!dialogMangaId.value || !dialogAltInput.value.trim()) return;
  dialogLoading.value = true;
  const res = await mangaAPI.addAlternativeTitle(dialogMangaId.value, dialogAltInput.value.trim());
  if (res.success) {
    const refresh = await mangaAPI.getAlternativeTitles(dialogMangaId.value);
    if (refresh.success) dialogAltList.value = refresh.data || [];
    dialogAltInput.value = "";
  }
  dialogLoading.value = false;
};

const onContextMenuAction = (e: Event) => {
  const detail = (e as CustomEvent).detail as { action: string; args: any[] };
  if (detail?.action === 'add-alternative-title') {
    const payload = detail.args?.[0] as { mangaId?: number; mangaTitle?: string };
    openAddAltDialog(payload);
  }
};

onMounted(() => {
  window.addEventListener('context-menu-action', onContextMenuAction as EventListener);
});

onBeforeUnmount(() => {
  window.removeEventListener('context-menu-action', onContextMenuAction as EventListener);
});

const clickContextMenu = (event: Event, manga?: LatestMangaResponse) => {
  const target = event.target as HTMLElement;
  const elementType = target.tagName.toLowerCase(); // e.g., 'img', 'div', etc.
  const selectionText = window.getSelection()?.toString();
  showContextMenu({
    routeName: 'home',
    elementType,
    selectionText,
    mangaId: manga?.id,
    mangaTitle: manga?.mainTitle,
  });
}

const onCardContextMenu = (event: Event, manga: LatestMangaResponse) => {
  clickContextMenu(event, manga);
};
</script>

<template>
  <div class="q-px-md">
    <div class="text-subtitle1">Latest Manga</div>
    <div class="grid grid-cols-6 xl:grid-cols-10 gap-2" >
      <q-card v-for="manga in latestManga" class="my-card no-shadow select-none group" @contextmenu="(e: Event) => onCardContextMenu(e, manga)">
      <q-img @click="clickManga(manga.id)" :src="`manga://${manga.mainTitle}/cover.webp`" class="relative">
        <div class="absolute-top-right text-center" style="padding: 0.5rem !important; border-radius: 0 0 0 0.5rem;">{{ formatDate(manga.downloadTime) }}</div>
        <div  class="absolute-bottom p-1 text-subtitle2 text-center transition-all duration-300 ease-in-out group-hover:h-[40%] h-[4rem]">
         <div class="text-center h-[2.6rem] line-clamp-2 mb-2">{{ manga.mainTitle }}</div>
         <div @click.stop="clickChapter(manga.chapterID)" class="bg-white/50 text-black rounded-sm absolute-bottom transition-all duration-300 ease-in-out group-hover:opacity-100 opacity-0">Chapter {{ manga.chapterNumber }}</div>
        </div>
      </q-img>
    </q-card>
    </div>
    <q-dialog v-model="dialogAddAlt" persistent>
      <q-card style="width: 60vw; max-width: 60vw;">
        <q-card-section class="row items-center q-gutter-sm">
          <div class="text-h6">Add Alternative Title</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-badge color="grey-8" text-color="white">{{ dialogMangaTitle }}</q-badge>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-input v-model="dialogAltInput" label="Alternative title" :disable="dialogLoading" @keyup.enter="saveAlternativeTitle" />
          <div class="q-mt-md text-subtitle2">Existing alternatives</div>
          <q-list bordered class="q-mt-sm" style="max-height: 50vh; overflow:auto;">
            <q-item v-if="dialogLoading">
              <q-item-section>Loading...</q-item-section>
            </q-item>
            <q-item v-for="(alt, idx) in dialogAltList" :key="idx">
              <q-item-section>{{ alt }}</q-item-section>
            </q-item>
            <q-item v-if="!dialogLoading && dialogAltList.length === 0">
              <q-item-section class="text-grey">Belum ada alternative title</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" :disable="dialogLoading" v-close-popup />
          <q-btn unelevated label="Add" color="primary" :loading="dialogLoading" @click="saveAlternativeTitle" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped></style>

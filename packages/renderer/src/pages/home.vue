<script setup lang="ts">
import { ref } from "vue";
import { mangaAPI } from "@app/preload";
import type { LatestMangaResponse  } from "@app/preload";

const latestManga = ref<LatestMangaResponse[]>([]);

const getLatestManga = async () => {
  const result = await mangaAPI.getLatestManga();
  if (result.success) {
    latestManga.value = result.data || [];
  } else {
    console.error("Failed to get latest manga:", result.error);
  }
}
getLatestManga();


function formatDate(dateString: string) {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
  const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(date);
  return formattedDate;
}
</script>

<template>
  <div class="q-px-md">
    <div class="text-subtitle1">Latest Manga</div>
    <div class="grid grid-cols-6 xl:grid-cols-10 gap-2" >
      <q-card v-for="manga in latestManga" class="my-card no-shadow select-none group">
      <q-img :src="`manga://${manga.mainTitle}/cover.webp`" class="relative">
        <div class="absolute-top-right text-center" style="padding: 0.5rem !important; border-radius: 0 0 0 0.5rem;">{{ formatDate(manga.downloadTime) }}</div>
        <div class="absolute-bottom p-1 text-subtitle2 text-center transition-all duration-300 ease-in-out group-hover:h-[40%] h-[4rem]">
         <div class="text-center h-[2.6rem] line-clamp-2 mb-2">{{ manga.mainTitle }}</div>
         <div class="bg-white/50 text-black rounded-sm absolute-bottom transition-all duration-300 ease-in-out group-hover:opacity-100 opacity-0">Chapter {{ manga.chapterNumber }}</div>
        </div>
      </q-img>
    </q-card>
    </div>
  </div>
</template>

<style scoped></style>

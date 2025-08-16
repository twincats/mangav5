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

</script>

<template>
  <div>
    <div>Home</div>
    <div class="row" >
      <q-card v-for="manga in latestManga" class="my-card col-4">
      <q-img :src="`manga://${manga.mainTitle}/cover.webp`">
        <div class="absolute-bottom text-subtitle2 text-center">
          {{ manga.mainTitle }}
        </div>
      </q-img>
    </q-card>
    </div>
    {{ latestManga }}
  </div>
</template>

<style scoped></style>

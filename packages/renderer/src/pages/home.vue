<script setup lang="ts">
import { ref } from "vue";
import { mangaAPI } from "@app/preload";

const latestManga = ref<any[]>([]);

const getLatestManga = async () => {
  const result = await mangaAPI.getLatestManga();
  latestManga.value = result;
}
getLatestManga();

</script>

<template>
  <div>
    <div>Home</div>
    <div class="row" >
      <q-card v-for="manga in latestManga" class="my-card col-4">
      <q-img :src="`manga://${manga.main_title}/cover.webp`">
        <div class="absolute-bottom text-subtitle2 text-center">
          {{ manga.main_title }}
        </div>
      </q-img>
    </q-card>
    </div>
    {{ latestManga }}
  </div>
</template>

<style scoped></style>

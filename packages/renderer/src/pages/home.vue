<script setup lang="ts">
import { ref, onMounted } from "vue";
import { send, getClipboard, mangaAPI } from "@app/preload";

const clipboard = getClipboard();

const text = ref("Hello World!");
const images = ref("");
const generateImages = async () => {
  images.value = await send("generate-blue", "blue solid");
};

const title = ref("empty");
title.value = sessionStorage.getItem("title")
  ? JSON.stringify(sessionStorage.getItem("title"))
  : "";
const urlChapter = ref("");
const scrapLoading = ref(false);
const scrapTitle = async () => {
  if (urlChapter.value != "") {
    scrapLoading.value = true;
    title.value = await send("scraper:title", urlChapter.value);
    sessionStorage.setItem("title", title.value);
    scrapLoading.value = false;
  }
};

const scrapChapter = async () => {
  if (urlChapter.value != "") {
    scrapLoading.value = true;
    title.value = await send("scraper:chapter", urlChapter.value);
    sessionStorage.setItem("title", title.value);
    scrapLoading.value = false;
  }
};

const copyImageUrls = async () => {
  clipboard.copy(JSON.stringify(title.value));
};

const pasteUrls = async () => {
  urlChapter.value = clipboard.paste();
};

const isDbExist = ref(false);
onMounted(async () => {
  isDbExist.value = await mangaAPI.checkDatabaseExist();
});
</script>

<template>
  <div class="q-px-md">
    <div>Home pages</div>
    <div>
      STATUS DB : <span v-if="isDbExist" style="color: green">YES</span
      ><span v-else style="color: red">NO</span>
    </div>
    <div>
      <q-input v-model="text" label="Nama" />
      <q-btn class="bg-primary q-my-md" @click="generateImages">Submit</q-btn>
    </div>
    <div>
      <q-input filled v-model="text" label="URL" dense>
        <template v-slot:append>
          <q-btn round dense flat icon="search" />
        </template>
      </q-input>
    </div>
    <div v-if="images">
      <img :src="images" alt="images solid blue" />
    </div>
    <div class="q-my-md">
      <div class="text-h6">WestManga Chapter URL</div>
      <q-input filled v-model="urlChapter" label="URL Chapter" dense>
        <template v-slot:append>
          <q-btn round dense flat icon="content_paste" @click="pasteUrls" />
        </template>
      </q-input>
      <q-btn
        class="bg-primary q-my-md"
        :loading="scrapLoading"
        @click="scrapTitle"
        label="Scrap"
      >
        <template v-slot:loading>
          <q-spinner-facebook />
        </template>
      </q-btn>
      <q-btn
        class="bg-primary q-my-md q-mx-md"
        :loading="scrapLoading"
        @click="scrapChapter"
        label="Scrap Chapter"
      >
        <template v-slot:loading>
          <q-spinner-facebook />
        </template>
      </q-btn>
      <div>
        <q-card class="my-card" style="overflow: auto">
          <q-card-section>
            <pre>{{ title }}</pre>
          </q-card-section>
          <q-separator />

          <q-card-actions align="right">
            <q-btn flat @click="copyImageUrls">Copy</q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>
    <div>
      <img src="manga://isekai/1/1.webp" alt="image" />
    </div>
  </div>
</template>

<style scoped></style>

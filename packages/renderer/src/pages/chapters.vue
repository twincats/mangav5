<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { mangaAPI } from "@app/preload";
import type { MangaWithChaptersResponse } from "@app/preload";

const route = useRoute();
const router = useRouter();
const mangaId = Number(route.params.mangaId);

const mangaData = ref<MangaWithChaptersResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

/**
 * Mengambil data manga dengan chapter berdasarkan ID
 * @param id - ID manga yang akan diambil
 */
const getMangaWithChapters = async (id: number) => {
  try {
    loading.value = true;
    error.value = null;
    
    const result = await mangaAPI.getMangaWithChapters(id);
    if (result.success && result.data) {
      mangaData.value = result.data;
      console.log(JSON.stringify(mangaData.value.manga.id));
    } else {
      error.value = result.error || 'Failed to fetch manga data';
    }
  } catch (err) {
    error.value = `Error: ${err}`;
    console.error('Error fetching manga:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * Navigasi ke halaman baca chapter
 * @param chapterId - ID chapter yang akan dibaca
 */
const readChapter = (chapterId: number) => {
  router.push(`/read/${chapterId}`);
};

/**
 * Navigasi kembali ke halaman home
 */
const goBack = () => {
  router.push('/');
};

onMounted(() => {
  if (mangaId && !isNaN(mangaId)) {
    getMangaWithChapters(mangaId);
  } else {
    error.value = 'Invalid manga ID';
    loading.value = false;
  }
});
</script>

<template>
  <div class="q-px-md q-py-md">
    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner-gears size="50px" color="primary" />
      <div class="q-mt-md">Loading manga...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-lg">
      <q-banner class="bg-negative text-white">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
      </q-banner>
      <q-btn 
        color="primary" 
        label="Go Back" 
        @click="goBack" 
        class="q-mt-md"
      />
    </div>

    <!-- Manga Content -->
    <div v-else-if="mangaData" class="manga-detail">
      <!-- Header -->
      <div class="row q-mb-lg">
        <div class="col-12">
          <q-btn 
            flat 
            icon="arrow_back" 
            label="Back" 
            @click="goBack"
            class="q-mb-md"
          />
          <div class="grid grid-cols-4 gap-2">
            <q-img
            :src="`manga://${mangaData.manga.mainTitle}/cover.webp`"
            style="max-width: 250px; height: 350px;"
            fit="cover" class="rounded-md"></q-img>
            <div class="text-h4 col-span-3">{{ mangaData.manga.mainTitle }}</div>
          
          </div>
          <div v-if="mangaData.manga.description" class="text-subtitle1 q-mt-sm">
            {{ mangaData.manga.description }}
          </div>
          
          <div class="row q-gutter-md q-mt-md">
            <q-chip 
              v-if="mangaData.manga.year" 
              color="primary" 
              text-color="white"
            >
              {{ mangaData.manga.year }}
            </q-chip>
            <q-chip 
              v-if="mangaData.manga.status?.statusName" 
              color="secondary" 
              text-color="white"
            >
              {{ mangaData.manga.status.statusName }}
            </q-chip>
            <q-chip color="positive" text-color="white">
              {{ mangaData.totalChapters }} Chapters
            </q-chip>
          </div>
        </div>
      </div>

      <!-- Alternative Titles -->
      <div v-if="mangaData.alternativeTitles.length > 0" class="q-mb-lg">
        <div class="text-h6 q-mb-sm">Alternative Titles</div>
        <div class="row q-gutter-sm">
          <q-chip 
            v-for="altTitle in mangaData.alternativeTitles" 
            :key="altTitle.altId"
            outline
            color="grey"
          >
            {{ altTitle.alternativeTitle }}
          </q-chip>
        </div>
      </div>

      <!-- Chapters List -->
      <div class="chapters-section">
        <div class="text-h6 q-mb-md">Chapters</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <q-card 
            v-for="chapter in mangaData.chapters" 
            :key="chapter.id"
            class="chapter-card "
            clickable
            @click="readChapter(chapter.id)"
          >
            <q-card-section class="text-center">
              <div class="text-h6">Chapter {{ chapter.chapterNumber }}</div>
              <div v-if="chapter.chapterTitle" class="text-subtitle2 q-mt-sm">
                {{ chapter.chapterTitle }}
              </div>
              <div v-if="chapter.volume" class="text-caption q-mt-xs">
                Volume {{ chapter.volume }}
              </div>
              <div v-if="chapter.translatorGroup" class="text-caption q-mt-xs">
                {{ chapter.translatorGroup }}
              </div>
              <div class="q-mt-sm">
                <q-chip 
                  :color="chapter.statusRead ? 'positive' : 'grey'"
                  text-color="white"
                  size="sm"
                >
                  {{ chapter.statusRead ? 'Read' : 'Unread' }}
                </q-chip>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manga-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.chapter-card {
  transition: transform 0.2s ease-in-out;
}

.chapter-card:hover {
  transform: translateY(-2px);
}

.chapters-section {
  margin-top: 2rem;
}
</style>
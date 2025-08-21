<script setup lang="ts">
import { ref, onMounted, watch, computed, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mangaAPI } from "@app/preload";

const route = useRoute();
const router = useRouter();
const chapterId = route.params.chapterId;

const chapterImageList = ref<string[]>([]);
const currentChapter = ref<any>(null);
const mangaInfo = ref<any>(null);
const allChapters = ref<any[]>([]);
const currentChapterIndex = ref<number>(-1);
const readingMode = ref<'long-strip' | 'two-page'>('long-strip');
const readingDirection = ref<'ltr' | 'rtl'>('ltr');
const containerWidth = ref<'normal' | 'full'>('normal');

watch(()=>route.params.chapterId, async (newVal)=>{
    await getCurrentChapterInfo(Number(newVal));
    await getChapterImageList(Number(newVal));
    currentChapterIndex.value = allChapters.value.findIndex(
        chapter => chapter.id === Number(newVal)
    );
})

const getChapterImageList = async (chapterId: number) => {
    const result = await mangaAPI.getChapterImageList(chapterId);
    if (result.success) {
        const imageList = result.data || [];
        const sortedImageList = imageList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        chapterImageList.value = sortedImageList;
    } else {
        console.error("Failed to get chapter image list:", result.error);
    }
}

const getCurrentChapterInfo = async (chapterId: number) => {
    const result = await mangaAPI.getChapterById(chapterId);
    if (result.success) {
        currentChapter.value = result.data;
        // Setelah mendapatkan chapter info, ambil manga info
        await getMangaInfo(currentChapter.value.mangaId);
    } else {
        console.error("Failed to get chapter info:", result.error);
    }
}

const getMangaInfo = async (mangaId: number) => {
    const result = await mangaAPI.getMangaWithChapters(mangaId);
    if (result.success) {
        mangaInfo.value = result.data?.manga;
        allChapters.value = result.data?.chapters || [];
        
        // Urutkan chapter berdasarkan chapter number
        allChapters.value.sort((a, b) => a.chapterNumber - b.chapterNumber);
        
        // Temukan index chapter saat ini
        currentChapterIndex.value = allChapters.value.findIndex(
            chapter => chapter.id === Number(chapterId)
        );
    } else {
        console.error("Failed to get manga info:", result.error);
    }
}

const navigateToChapter = (direction: 'prev' | 'next') => {
    let targetIndex: number;
    
    if (direction === 'prev') {
        targetIndex = currentChapterIndex.value - 1;
    } else {
        targetIndex = currentChapterIndex.value + 1;
    }
    // Periksa apakah index valid
    if (targetIndex >= 0 && targetIndex < allChapters.value.length) {
        const targetChapter = allChapters.value[targetIndex];
        router.push(`/read/${targetChapter.id}`);
    }
}

const canNavigatePrev = () => {
    return currentChapterIndex.value > 0;
}

const canNavigateNext = () => {
    return currentChapterIndex.value < allChapters.value.length - 1;
}

const toggleReadingMode = () => {
    readingMode.value = readingMode.value === 'long-strip' ? 'two-page' : 'long-strip';
}

const toggleReadingDirection = () => {
    readingDirection.value = readingDirection.value === 'ltr' ? 'rtl' : 'ltr';
}

const toggleContainerWidth = () => {
    containerWidth.value = containerWidth.value === 'normal' ? 'full' : 'normal';
}

const getReadingModeLabel = computed(() => {
    return readingMode.value === 'long-strip' ? 'Long Strip' : '2 Pages';
})

const getReadingModeIcon = computed(() => {
    return readingMode.value === 'long-strip' ? 'view_column' : 'view_agenda';
})

const getReadingDirectionLabel = computed(() => {
    return readingDirection.value === 'ltr' ? 'LTR' : 'RTL';
})

const getReadingDirectionIcon = computed(() => {
    return readingDirection.value === 'ltr' ? 'format_align_left' : 'format_align_right';
})

const getContainerWidthLabel = computed(() => {
    return containerWidth.value === 'normal' ? 'Normal' : 'Full Width';
})

const getContainerWidthIcon = computed(() => {
    return containerWidth.value === 'normal' ? 'crop_square' : 'fullscreen';
})

onMounted(async () => {
    await getCurrentChapterInfo(Number(chapterId));
    await getChapterImageList(Number(chapterId));
});

const readerContainer = useTemplateRef('readerContainer');
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    readerContainer.value?.requestFullscreen().catch((err: any) => {
      console.error(`Error entering full-screen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}
</script>

<template>
    <div class="reader-container" :class="containerWidth" ref="readerContainer">
        <!-- Header dengan navigasi -->
        <div class="reader-header">
            <div class="manga-info">
                <h4 v-if="mangaInfo">{{ mangaInfo.mainTitle }}</h4>
                <p v-if="currentChapter">
                    Chapter {{ currentChapter.chapterNumber }}
                    <span v-if="currentChapter.chapterTitle">- {{ currentChapter.chapterTitle }}</span> 
                </p>
                <div class="q-pa-md q-gutter-sm">
                    <q-btn color="primary" @click="toggleFullScreen" label="Fullscreen" />
                    <q-btn 
                        :color="readingMode === 'long-strip' ? 'primary' : 'secondary'"
                        :icon="getReadingModeIcon"
                        @click="toggleReadingMode" 
                        :label="getReadingModeLabel" 
                    />
                    <q-btn 
                        v-if="readingMode === 'two-page'"
                        :color="readingDirection === 'ltr' ? 'positive' : 'warning'"
                        :icon="getReadingDirectionIcon"
                        @click="toggleReadingDirection" 
                        :label="getReadingDirectionLabel" 
                    />
                    <q-btn 
                        :color="containerWidth === 'normal' ? 'info' : 'deep-orange'"
                        :icon="getContainerWidthIcon"
                        @click="toggleContainerWidth" 
                        :label="getContainerWidthLabel" 
                    />
                </div>
            </div>
            
            <!-- Tombol navigasi -->
            <div class="navigation-controls">
                <q-btn
                    :disable="!canNavigatePrev()"
                    @click="navigateToChapter('prev')"
                    color="primary"
                    icon="chevron_left"
                    label="Previous Chapter"
                    class="nav-btn"
                />
                
                <q-btn
                    :disable="!canNavigateNext()"
                    @click="navigateToChapter('next')"
                    color="primary"
                    icon="chevron_right"
                    label="Next Chapter"
                    class="nav-btn"
                />
            </div>
        </div>

        <!-- Chapter images -->
        <div class="chapter-images" :class="[readingMode, readingMode === 'two-page' ? readingDirection : '']">
            <!-- Long Strip Mode -->
            <template v-if="readingMode === 'long-strip'">
                <div v-for="(image, index) in chapterImageList" :key="image" class="image-container long-strip">
                    <q-img
                        :src="`manga://${image}`"
                        fit="contain"
                        class="chapter-image"
                    />
                    <div class="image-counter">{{ index + 1 }} / {{ chapterImageList.length }}</div>
                </div>
            </template>
            
            <!-- Two Page Mode (Right to Left) -->
            <template v-else>
                <!-- Group images into pairs for two-page layout -->
                <div v-for="(_, pairIndex) in Math.ceil(chapterImageList.length / 2)" :key="pairIndex" class="page-pair">
                    <!-- LTR Mode: Left page first, then right page -->
                    <template v-if="readingDirection === 'ltr'">
                        <!-- Left page (even index) -->
                        <div v-if="(pairIndex * 2 + 1) < chapterImageList.length" class="image-container two-page left-page">
                            <q-img
                                :src="`manga://${chapterImageList[pairIndex * 2 + 1]}`"
                                fit="contain"
                                class="chapter-image"
                            />
                            <div class="image-counter">{{ (pairIndex * 2 + 2) }} / {{ chapterImageList.length }}</div>
                        </div>
                        
                        <!-- Right page (odd index) -->
                        <div v-if="(pairIndex * 2) < chapterImageList.length" class="image-container two-page right-page">
                            <q-img
                                :src="`manga://${chapterImageList[pairIndex * 2]}`"
                                fit="contain"
                                class="chapter-image"
                            />
                            <div class="image-counter">{{ (pairIndex * 2) + 1 }} / {{ chapterImageList.length }}</div>
                        </div>
                    </template>
                    
                    <!-- RTL Mode: Right page first, then left page -->
                    <template v-else>
                        <!-- Right page (odd index) -->
                        <div v-if="(pairIndex * 2) < chapterImageList.length" class="image-container two-page right-page">
                            <q-img
                                :src="`manga://${chapterImageList[pairIndex * 2]}`"
                                fit="contain"
                                class="chapter-image"
                            />
                            <div class="image-counter">{{ (pairIndex * 2) + 1 }} / {{ chapterImageList.length }}</div>
                        </div>
                        
                        <!-- Left page (even index) -->
                        <div v-if="(pairIndex * 2 + 1) < chapterImageList.length" class="image-container two-page left-page">
                            <q-img
                                :src="`manga://${chapterImageList[pairIndex * 2 + 1]}`"
                                fit="contain"
                                class="chapter-image"
                            />
                            <div class="image-counter">{{ (pairIndex * 2 + 2) }} / {{ chapterImageList.length }}</div>
                        </div>
                    </template>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.reader-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    transition: all 0.3s ease;
    min-height: 100vh;
}

.reader-container.full {
    max-width: 100%;
    padding: 10px;
}

.reader-container.full .chapter-images {
    max-width: 100%;
}

.reader-container.full .image-container.two-page {
    max-width: none;
    width: calc(50% - 5px);
}

/* Fullscreen mode specific styles */
.reader-container:fullscreen {
    height: 100vh;
    overflow-y: auto;
    padding: 10px;
}

.reader-container:fullscreen .chapter-images {
    max-width: 100%;
}

.reader-container:fullscreen .image-container.two-page {
    max-width: none;
    width: calc(50% - 5px);
}

/* Global fullscreen styles - only enable scrolling in fullscreen mode */
:fullscreen {
    overflow-y: auto !important;
}

/* Webkit fullscreen support */
:-webkit-full-screen {
    overflow-y: auto !important;
}

.reader-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
}

.manga-info h4 {
    margin: 0 0 5px 0;
    color: #333;
}

.manga-info p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.navigation-controls {
    display: flex;
    gap: 10px;
}

.nav-btn {
    min-width: 120px;
}

.chapter-images {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.chapter-images.two-page {
    flex-direction: column;
    gap: 20px;
}

.page-pair {
    display: flex;
    justify-content: center;
    gap: 10px;
    width: 100%;
}

.image-container {
    position: relative;
    text-align: center;
}

.image-container.long-strip {
    width: 100%;
}

.image-container.two-page {
    width: calc(50% - 5px);
    max-width: 500px;
}

.chapter-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Two page mode specific styles */
.right-page {
    order: 2; /* Right page second for LTR, first for RTL */
}

.left-page {
    order: 1; /* Left page first for LTR, second for RTL */
}

/* RTL specific ordering */
.chapter-images.two-page.rtl .right-page {
    order: 1; /* Right page first for RTL */
}

.chapter-images.two-page.rtl .left-page {
    order: 2; /* Left page second for RTL */
}

.image-counter {
    margin-top: 10px;
    color: #666;
    font-size: 12px;
}

/* Responsive design */
@media (max-width: 768px) {
    .reader-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
    
    .navigation-controls {
        width: 100%;
        justify-content: center;
    }
    
    .nav-btn {
        min-width: 100px;
    }
    
    /* Mobile: Force long strip mode for better mobile experience */
    .chapter-images.two-page {
        flex-direction: column;
    }
    
    .page-pair {
        flex-direction: column;
        gap: 15px;
    }
    
    .image-container.two-page {
        width: 100%;
        max-width: none;
    }
    
    .right-page,
    .left-page {
        order: 0; /* Reset order on mobile */
    }
    
    /* Mobile: Optimize container width */
    .reader-container.full {
        padding: 5px;
    }
    
    .reader-container.full .chapter-images {
        gap: 15px;
    }
    
    /* Mobile fullscreen scrolling */
    .reader-container:fullscreen {
        height: 100vh;
        overflow-y: auto;
        padding: 5px;
    }
    
    .reader-container:fullscreen .chapter-images {
        gap: 15px;
    }
    
    /* Mobile webkit fullscreen */
    .reader-container:-webkit-full-screen {
        height: 100vh;
        overflow-y: auto;
        padding: 5px;
    }
}
</style>
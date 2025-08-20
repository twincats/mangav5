<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
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

onMounted(async () => {
    await getCurrentChapterInfo(Number(chapterId));
    await getChapterImageList(Number(chapterId));
});
</script>

<template>
    <div class="reader-container">
        <!-- Header dengan navigasi -->
        <div class="reader-header">
            <div class="manga-info">
                <h4 v-if="mangaInfo">{{ mangaInfo.mainTitle }}</h4>
                <p v-if="currentChapter">
                    Chapter {{ currentChapter.chapterNumber }}
                    <span v-if="currentChapter.chapterTitle">- {{ currentChapter.chapterTitle }}</span>
                </p>
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
        <div class="chapter-images">
            <div v-for="(image, index) in chapterImageList" :key="image" class="image-container">
                <q-img
                    :src="`manga://${image}`"
                    fit="contain"
                    class="chapter-image"
                />
                <div class="image-counter">{{ index + 1 }} / {{ chapterImageList.length }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.reader-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
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

.image-container {
    position: relative;
    text-align: center;
}

.chapter-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
}
</style>
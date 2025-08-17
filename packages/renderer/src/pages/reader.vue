<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { mangaAPI } from "@app/preload";

const route = useRoute();
const chapterId = route.params.chapterId;

const chapterImageList = ref<string[]>([]);

const getChapterImageList = async (chapterId:number) => {
    const result = await mangaAPI.getChapterImageList(chapterId);
    if (result.success) {
        const imageList = result.data || [];
        const sortedImageList = imageList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        chapterImageList.value = sortedImageList;
    } else {
        console.error("Failed to get chapter image list:", result.error);
    }
}
getChapterImageList(Number(chapterId));
</script>

<template>
    <div>
        <div>Reader</div>
        <div> Chapter ID: {{ chapterId }}</div>
        <div v-for="image in chapterImageList" :key="image">
            <q-img
        :src="`manga://${image}`"
         fit="cover"
      >
      </q-img>
        </div>
    </div>

</template>

<style scoped></style>
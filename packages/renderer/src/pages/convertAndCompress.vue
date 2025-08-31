<script setup lang="ts">
import { ref, reactive } from 'vue';
import { mangaAPI } from "@app/preload";
import type { MangaResponse  } from "@app/preload";

const quality = ref(60);
const resize = ref(1000);
const deleteOriginal = ref(true);
const pararellConvert = ref(5);
const compress = ref(false);

const convertAndCompress = reactive({
    selectedManga: "",
    searchManga: ""
})


const heavyList = ref<MangaResponse[]>([]);

const getMangaList = async () => {
    const mangaList = await mangaAPI.getAllManga()
    if (mangaList.success) {
        heavyList.value = mangaList.data || [];
  } else {
    console.error("Failed to get latest manga:", mangaList.error);
  }
}

getMangaList();
</script>

<template>
  <div>
    <div id="tool" class="">
        <div class="w-150">
            <div> Quality: &nbsp;&nbsp; <strong style="color: rgb(var(--primary-6))">{{ quality }}</strong></div>
            <div class="px-2">
                <q-slider
                    v-model="quality"
                    :min="50"
                    :max="90"
                    :step="5"
                    markers
                    label
                    />
            </div>
        </div>
        <div class="w-full">
            <div> Resize: &nbsp;&nbsp; <strong style="color: rgb(var(--primary-6))">{{ resize }}</strong></div>
            <div class="px-2">
                <q-slider
                v-model="resize"
                :min="900"
                :max="1400"
                :step="50"
                markers
                label
                />
            </div>
        </div>
        
        <div class="w-150">
            <div> Pararell Convert: &nbsp;&nbsp; <strong style="color: rgb(var(--primary-6))">{{ pararellConvert }}</strong></div>
            <div class="px-2">
                <q-slider
                v-model="pararellConvert"
                :min="1"
                :max="10"
                :step="1"
                markers
                label
                />
            </div>
        </div>
        <div class="w-100">
            <div> Delete: &nbsp;&nbsp; <strong style="color: rgb(var(--primary-6))">{{ deleteOriginal? "Yes" : "No" }}</strong></div>
            <div class="px-2">
                <q-toggle v-model="deleteOriginal" />
            </div>
        </div>
        <div class="w-100">
            <div> Compress: &nbsp;&nbsp; <strong style="color: rgb(var(--primary-6))"></strong>{{ compress? "Yes" : "No" }}</div>
            <div class="px-2">
                <q-toggle v-model="compress" />
            </div>
        </div>
        
    </div>
    <div>
        <q-input dense v-model="convertAndCompress.selectedManga" input-class="text-center" />
        <q-input dense v-model="convertAndCompress.searchManga" input-class="text-center" />
    </div>
    <q-virtual-scroll
        class="h-50 xl:h-100"
        :items="heavyList"
        separator
        v-slot="{ item, index }"
    >
        <q-item
        :key="index"
        clickable
        dense
        >
        <q-item-section>
            <q-item-label>
            #{{ index+1 }} - {{ item.mainTitle }}
            </q-item-label>
        </q-item-section>
        </q-item>
    </q-virtual-scroll>
    <div class="bg-dark-500 h-40 xl:h-55 p-2 my-2">LOG</div>
    <div class="my-2 flex gap-2">
        <div class="w-full">
            <q-linear-progress size="25px" :value="0.5" color="primary">
            <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="primary" :label="'50 %'" />
            </div>
            </q-linear-progress>
        </div>
        <div class="flex gap-2 justify-end w-full pr-2">
            <q-btn label="Convert" color="primary" />
            <q-btn label="Compress" color="cyan-7" />
        </div>
    </div>
  </div>
</template>

<style scoped>
.header {
    background-color: #0e074e;
    padding: 10px;
    border-radius: 5px;
    height: 70px;
}
#tool {
	 border-bottom: 1px solid rgb(59, 59, 59);
	 display: flex;
	 justify-content: space-between;
}
 #tool > div {
	 padding: 0.5rem;
	 font-size: 0.75rem;
	 display: flex;
	 flex-direction: column;
}
 #tool > div:not(:last-child) {
	 border-right: 1px solid rgb(59, 59, 59);
}
 #tool > div > div {
	 height: 100%;
}

/* Pierce into QInput's internal markup when using <style scoped> */
.center-label :deep(.q-field__label) {
  width: 100%;
  left: 0;
  right: 0;
  text-align: center;
  transform-origin: top center; /* keeps it centered when it scales/floats */
}

/* Optional: be explicit for the floated state too */
.center-label :deep(.q-field__label--float) {
  transform-origin: top center;
}
 
</style>
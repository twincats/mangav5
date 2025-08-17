<script setup lang="ts">
import { ref } from "vue";
import { getDialog, mangaAPI } from "@app/preload";

const mangaDirectory = ref<string | null>(null);
const loadingSetupDatabase = ref(false);
const isDbExist = defineModel({ type: Boolean });

// Scan results
const scanResult = ref<any>(null);
const importResult = ref<any>(null);
const scanError = ref<string | null>(null);

const dialog = getDialog();

const selectMangaDirectory = async () => {
  const returnVal = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (returnVal.canceled) {
    return;
  }
  mangaDirectory.value = returnVal.filePaths[0];
};

const setupDatabase = async () => {
  if (!mangaDirectory.value) {
    alert("Please select a manga directory first");
    return;
  }

  try {
    loadingSetupDatabase.value = true;
    scanError.value = null;
    
    // Scan directory and auto-import
    const result = await mangaAPI.scanDirectoryAndImport(mangaDirectory.value);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to scan directory');
    }
    
    scanResult.value = result.data.scanResult;
    importResult.value = result.data.importResult;
    
    // Show success message
    const message = `✅ Database setup complete!\n\n` +
      `📁 Directory: ${mangaDirectory.value}\n` +
      `📚 Manga found: ${result.data.scanResult.totalManga}\n` +
      `📖 Chapters found: ${result.data.scanResult.totalChapters}\n` +
      `💾 Imported: ${result.data.importResult.insertedManga} manga, ${result.data.importResult.insertedChapters} chapters`;
    
    alert(message);
    
    // Update database status
    isDbExist.value = true;
    
  } catch (error) {
    console.error('Setup database error:', error);
    scanError.value = `Error: ${error}`;
    alert(`❌ Setup failed: ${error}`);
  } finally {
    loadingSetupDatabase.value = false;
  }
};

const resetForm = () => {
  mangaDirectory.value = null;
  scanResult.value = null;
  importResult.value = null;
  scanError.value = null;
};
</script>

<template>
  <div
    class="setup-database window-height q-pa-md q-my-md row items-center justify-center"
  >
    <q-card class="setupdb col-8 col-lg-6">
      <q-card-section>
        <div class="text-h6 text-yellow">Manga Setup Configuration</div>
        <div class="text-subtitle2">First Start / No Database Exist</div>
      </q-card-section>

      <q-separator dark inset />
      
      <q-card-section>
        <q-input
          readonly
          v-model="mangaDirectory"
          label="Select Manga Directory Location"
          placeholder="Click folder icon to select directory"
        >
          <template v-slot:after>
            <q-btn
              class="text-yellow"
              dense
              flat
              icon="folder_open"
              @click="selectMangaDirectory"
              :disable="loadingSetupDatabase"
            />
          </template>
        </q-input>
        
        <div class="q-mt-md">
          <q-btn
            color="primary"
            label="Setup Database & Import Manga"
            @click="setupDatabase"
            :loading="loadingSetupDatabase"
            :disable="!mangaDirectory"
            class="full-width"
          />
        </div>
      </q-card-section>

      <!-- Error Display -->
      <q-card-section v-if="scanError" class="q-pt-none">
        <q-banner class="bg-negative text-white">
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ scanError }}
        </q-banner>
      </q-card-section>

      <!-- Scan Results -->
      <q-card-section v-if="scanResult" class="q-pt-none">
        <q-separator class="q-mb-md" />
        <div class="text-h6">Scan Results</div>
        
        <div class="row q-gutter-md q-mt-md">
          <div class="col-6">
            <q-card class="bg-blue-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-blue">{{ scanResult.totalManga }}</div>
                <div class="text-subtitle2">Manga Found</div>
              </q-card-section>
            </q-card>
          </div>
          
          <div class="col-6">
            <q-card class="bg-green-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-green">{{ scanResult.totalChapters }}</div>
                <div class="text-subtitle2">Chapters Found</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Manga List Preview -->
        <div v-if="scanResult.mangaList && scanResult.mangaList.length > 0" class="q-mt-md">
          <div class="text-subtitle1 q-mb-sm">Manga Preview:</div>
          <q-list dense>
            <q-item v-for="manga in scanResult.mangaList.slice(0, 5)" :key="manga.mainTitle">
              <q-item-section>
                <q-item-label>{{ manga.mainTitle }}</q-item-label>
                <q-item-label caption>{{ manga.chapters?.length || 0 }} chapters</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="scanResult.mangaList.length > 5">
              <q-item-section>
                <q-item-label caption>... and {{ scanResult.mangaList.length - 5 }} more</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <!-- Import Results -->
      <q-card-section v-if="importResult" class="q-pt-none">
        <q-separator class="q-mb-md" />
        <div class="text-h6">Import Results</div>
        
        <div class="row q-gutter-md q-mt-md">
          <div class="col-6">
            <q-card class="bg-green-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-green">{{ importResult.insertedManga }}</div>
                <div class="text-subtitle2">Manga Imported</div>
              </q-card-section>
            </q-card>
          </div>
          
          <div class="col-6">
            <q-card class="bg-green-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-green">{{ importResult.insertedChapters }}</div>
                <div class="text-subtitle2">Chapters Imported</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Success Actions -->
        <div class="q-mt-md text-center">
          <q-btn
            color="positive"
            label="Continue to Manga Library"
            @click="isDbExist = true"
            class="q-mr-md"
          />
          <q-btn
            color="secondary"
            label="Reset Form"
            @click="resetForm"
            outline
          />
        </div>
      </q-card-section>
    </q-card>
    
    <!-- Loading Overlay -->
    <q-inner-loading :showing="loadingSetupDatabase">
      <q-spinner-gears size="50px" color="primary" />
      <div class="q-mt-md">Scanning directory and importing manga...</div>
    </q-inner-loading>
  </div>
</template>

<style scoped>
.setupdb {
  width: 75%;
}
</style>

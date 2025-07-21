<script setup lang="ts">
import { ref } from "vue";
import { getDialog } from "@app/preload";

const mangaDirectory = ref<string | null>(null);
const loadingSetupDatabase = ref(false);
const isDbExist = defineModel({ type: Boolean });

const dialog = getDialog();

const selectMangaDirectory = async () => {
  const returnVAl = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (returnVAl.canceled) {
    return;
  }
  loadingSetupDatabase.value = true;
  mangaDirectory.value = returnVAl.filePaths[0];
  setTimeout(() => {
    setupDatabase();
    loadingSetupDatabase.value = false;
  }, 2000);
};

const setupDatabase = () => {
  alert("setup database complete");
  isDbExist.value = false;
};
</script>

<template>
  <div
    class="setup-database window-height q-pa-md 1-my-md row items-center justify-center"
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
        >
          <template v-slot:after>
            <q-btn
              class="text-yellow"
              dense
              flat
              icon="folder_open"
              @click="selectMangaDirectory"
            />
          </template>
        </q-input>
      </q-card-section>
    </q-card>
    <!-- Add your template content here -->
    <q-inner-loading :showing="loadingSetupDatabase">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<style scoped>
.setupdb {
  width: 75%;
}
</style>

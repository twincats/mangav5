<script setup lang="ts">
import { onMounted } from "vue";
import { mangaAPI } from "@app/preload";
onMounted(() => {
  // mangaAPI
  //   .getDatabasePath()
  //   .then((dbPath) => console.log("Database path:", dbPath))
  //   .catch((err) => console.error("Error getting database path:", err));

  mangaAPI.getAllManga().then((mangas) => console.log("All mangas:", mangas));
});
</script>

<template>
  <div>About pages</div>
</template>

<style scoped></style>

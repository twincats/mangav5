<template>
  <div>
    <q-layout v-if="!isDbExist" view="hHh LpR fFf" class="no-shadow">
      <q-header class="bg-primary text-white">
        <q-toolbar class="bg-black text-white" style="height: 30px">
          <q-btn flat round dense icon="home" to="/" />
          <q-btn flat round dense icon="book" @click="alert" />
          <q-btn flat round dense icon="download" to="/manga-example" />
          <q-btn>ds</q-btn>
          <q-btn flat round dense icon="info" to="/about"></q-btn>
        </q-toolbar>
      </q-header>

      <q-drawer
        v-model="leftDrawerOpen"
        side="left"
        behavior="desktop"
        bordered
      >
        <!-- drawer content -->
      </q-drawer>

      <q-page-container>
        <RouterView />
      </q-page-container>

      <q-footer class="bg-black text-white">
        <q-toolbar>
          <q-toolbar-title>
            <div @click="toggleLeftDrawer">Title</div>
          </q-toolbar-title>
        </q-toolbar>
      </q-footer>
    </q-layout>
    <div v-else>
      <SetupDatabase v-model="isDbExist" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterView } from "vue-router";
import { useQuasar } from "quasar";
import { mangaAPI } from "@app/preload";
const $q = useQuasar();

$q.dark.set(true); // or false or "auto"
const leftDrawerOpen = ref(false);
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

function alert() {
  $q.dialog({
    title: "Alert",
    message: "Some message",
  })
    .onOk(() => {
      // console.log('OK')
    })
    .onCancel(() => {
      // console.log('Cancel')
    })
    .onDismiss(() => {
      // console.log('I am triggered on both OK and Cancel')
    });
}

const isDbExist = ref(false);
onMounted(async () => {
  isDbExist.value = await mangaAPI.checkDatabaseExist();
});
</script>

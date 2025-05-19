<template>
  <q-layout view="hHh LpR fFf" class="no-shadow">

    <q-header class="bg-primary text-white">
<!--      <q-bar class="bg-black text-white">-->
<!--        <div class="cursor-pointer">File</div>-->
<!--        <div class="cursor-pointer">Edit</div>-->
<!--        <div class="cursor-pointer gt-xs">View</div>-->
<!--        <div class="cursor-pointer gt-xs">Window</div>-->
<!--        <div class="cursor-pointer">Help</div>-->
<!--        <q-space />-->
<!--        <q-btn dense flat icon="minimize" />-->
<!--        <q-btn dense flat icon="crop_square" />-->
<!--        <q-btn dense flat icon="close" />-->
<!--      </q-bar>-->
      <q-toolbar class="bg-black text-white">
        <q-btn flat round dense icon="home" to="/"/>
        <q-btn flat round dense icon="book" @click="alert"/>
        <q-btn flat round dense icon="download" />
        <q-btn>ds</q-btn>
        <q-btn flat round dense icon="info" to="/about"></q-btn>
      </q-toolbar>

    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" behavior="desktop" bordered>
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { useQuasar } from 'quasar'
const $q = useQuasar()

$q.dark.set(true) // or false or "auto"
const leftDrawerOpen = ref(false)
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function alert () {
  $q.dialog({
    title: 'Alert',
    message: 'Some message'
  }).onOk(() => {
    // console.log('OK')
  }).onCancel(() => {
    // console.log('Cancel')
  }).onDismiss(() => {
    // console.log('I am triggered on both OK and Cancel')
  })
}

</script>

<script setup lang="ts">
import {ref} from 'vue';

const text = ref('Hello World!');
</script>

<template>
  <div class="q-px-md">
    <div>Home pages</div>
    <div>
      <q-input v-model="text" label="Nama" />
      <q-btn class="bg-primary q-my-md">Submit</q-btn>
    </div>
  </div>
</template>

<style scoped>

</style>

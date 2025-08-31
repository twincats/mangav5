<script setup lang="ts">
import { ref } from 'vue';

const downloadURL = ref("");
</script>

<template>
    <div>
        <div class="m-2">
            <q-input filled bottom-slots clearable v-model="downloadURL" input-class="text-center" placeholder="Download URL" dense>



        <template v-slot:after>
          <q-btn round dense flat icon="send" />
        </template>
      </q-input>
        </div>
    </div>
</template>

<style scoped>
</style>
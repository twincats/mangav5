import {fileURLToPath} from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import {quasar, transformAssetUrls} from '@quasar/vite-plugin';
import component from 'unplugin-vue-components/vite';
import {QuasarResolver} from 'unplugin-vue-components/resolvers';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {transformAssetUrls},
    }),
    quasar({
      sassVariables: fileURLToPath(
        new URL('./src/quasar-variables.sass', import.meta.url)
      )
    }),
    component({
      resolvers: [QuasarResolver()],
    }),
  ],
})

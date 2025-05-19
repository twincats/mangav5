import { createApp } from 'vue'
import { Quasar, Dialog, Dark } from 'quasar'
import App from './App.vue'
import Router from './router/route.ts'
// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'
// Import Quasar css
import 'quasar/src/css/index.sass'


const myApp = createApp(App)

myApp.use(Router)
myApp.use(Quasar,{
  plugins:{Dialog,Dark}
})

myApp.mount('#app')

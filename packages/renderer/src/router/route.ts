import { createRouter, createWebHashHistory } from "vue-router";
import { send } from "@app/preload";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../pages/home.vue"),
    },
    {
      path: "/chapters/:mangaId",
      name: "chapters",
      component: () => import("../pages/chapters.vue"),
    },
    {
      path: "/read/:chapterId",
      name: "read",
      component: () => import("../pages/reader.vue"),
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../pages/about.vue"),
    },
    {
      path: "/feature",
      name: "feature",
      component: () => import("../pages/feature.vue"),
    },
    {
      path: "/manga-example",
      name: "manga-example",
      component: () => import("../components/MangaExample.vue"),
    },
  ],
});

export default router;

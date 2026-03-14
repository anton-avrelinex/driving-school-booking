import "./assets/main.css";

import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

const i18n = createI18n({
  messages: {
    en: await import("./locales/en.json"),
  },
  legacy: false,
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const app = createApp(App);

app.use(i18n);
app.use(createPinia());
app.use(router);

app.mount("#app");

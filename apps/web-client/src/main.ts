import "./assets/main.css";

import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { initObservability } from "./observability";

const datetimeFormats = {
  date: { year: "numeric", month: "numeric", day: "numeric" },
  dateShort: { month: "short", day: "numeric" },
  dateLong: { weekday: "long", month: "long", day: "numeric" },
  dateShortYear: { month: "short", day: "numeric", year: "numeric" },
  dayOnly: { day: "numeric" },
  monthShort: { month: "short" },
  weekdayShort: { weekday: "short" },
  time: { hour: "2-digit", minute: "2-digit" },
  timeFull: { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  datetime: {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  datetimeMedium: {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  datetimeShort: {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
} as const;

const i18n = createI18n({
  messages: {
    en: await import("./locales/en.json"),
  },
  datetimeFormats: {
    en: datetimeFormats,
  },
  legacy: false,
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const app = createApp(App);

app.use(i18n);
app.use(createPinia());
app.use(router);

initObservability(router);

app.mount("#app");

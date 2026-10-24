import { createRouter, createWebHistory } from "vue-router";
import { currentUser, loadCurrentUser } from "./api.ts";
import ChartPage from "./pages/ChartPage.vue";
import ChartSettings from "./pages/ChartSettings.vue";
import ExportPage from "./pages/ExportPage.vue";
import MyCharts from "./pages/MyCharts.vue";
import NewChart from "./pages/NewChart.vue";
import SignIn from "./pages/SignIn.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/sign-in", name: "signIn", component: SignIn },
    { path: "/", name: "myCharts", component: MyCharts },
    { path: "/charts/new", name: "newChart", component: NewChart },
    { path: "/charts/:chart", name: "chart", component: ChartPage, props: true },
    { path: "/charts/:chart/settings", name: "chartSettings", component: ChartSettings, props: true },
    { path: "/charts/:chart/export", name: "export", component: ExportPage, props: true },
  ],
});

let checked = false;

// Every page except sign-in needs a signed-in user.
router.beforeEach(async (to) => {
  if (!checked) {
    await loadCurrentUser();
    checked = true;
  }
  if (currentUser.value === null && to.name !== "signIn") return { name: "signIn" };
  if (currentUser.value !== null && to.name === "signIn") return { name: "myCharts" };
  return true;
});

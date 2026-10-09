import { createRouter, createWebHistory } from 'vue-router'
import { authReady, session } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import FirebaseRegisterView from '../views/FirebaseRegisterView.vue'
import FirebaseSigninView from '../views/FirebaseSigninView.vue'
import LogoutView from '../views/LogoutView.vue'
import AddBookView from '../views/AddBookView.vue'
import AccountView from '../views/AccountView.vue'
import GetBookCountView from '../views/GetBookCountView.vue'
import WeatherView from '../views/WeatherView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/FireRegister', component: FirebaseRegisterView },
    { path: '/FireLogin', component: FirebaseSigninView },
    { path: '/logout', component: LogoutView },
    { path: '/account', component: AccountView, meta: { requiresAuth: true } },
    {
      path: '/addbook',
      component: AddBookView,
      meta: { requiresAuth: true, role: 'librarian' },
    },
    { path: '/GetBookCount', name: 'GetBookCount', component: GetBookCountView },
    { path: '/WeatherCheck', name: 'GetWeather', component: WeatherView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  await authReady
  if (to.meta.requiresAuth && !session.user) {
    return { path: '/FireLogin', query: { redirect: to.fullPath } }
  }
  if (to.meta.role && session.role !== to.meta.role) {
    return { path: '/account', query: { denied: '1' } }
  }
})
export default router

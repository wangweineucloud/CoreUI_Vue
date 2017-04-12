// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
import router from './router'
import VueResource from 'vue-resource'
import { VueAuthenticate } from 'vue-authenticate'
import axios from 'axios'
import config from './config'

Vue.use(VueResource)
const vueAuth = new VueAuthenticate(Vue.http, {
  providers: {
    uaa: {
      name: 'uaa',
      clientId: config.clientId,
      authorizationEndpoint: `${config.uaa}/oauth2/authorize`,
      redirectUri: `${window.location.protocol}//${window.location.host}/auth/callback`,
      scope: ['user_info'],
      // state: null,
      responseType: 'token',
      oauthType: '2.0'
    }
  }
})

// axios 配置
// axios.defaults.baseURL = ''

// http request 拦截器
axios.interceptors.request.use(
  config => {
    if (vueAuth.isAuthenticated()) {
      config.headers.Authorization = `Bearer ${vueAuth.getToken()}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  })

// http response 拦截器
axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          vueAuth.authenticate('uaa').then(function () {
            store.dispatch('getUser')
          })
      }
    }
    return Promise.reject(error)
  })

// 将axios挂载到prototype上，在组件中可以直接使用this.axios访问
Vue.prototype.axios = axios

Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    user: {}
  },
  mutations: {
    setUser (state, user) {
      state.user = user
    }
  },
  actions: {
    getUser ({ commit }) {
      axios.get(`${config.uaa}/api/user`)
        .then(response => {
          commit('setUser', response.data)
        })
    }
  }
})

router.beforeEach((to, from, next) => {
  store.dispatch('getUser')
  next()
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})

import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

import axios from 'axios';
import User from '@/utils/api/User';

const state = {
  currentUser: null,
  initialized: false
};

const mutations = {
  setInitialized(state) {
    state.initialized = true;
  },

  setCurrentUser(state, user) {
    state.currentUser = user;
  }
};

const actions = {
  async initializeStore({state, dispatch}) {
    if(state.initialized) {
      return;
    }

    let token = window.localStorage.accessToken;
    if(token == null) {
      return;
    }

    axios.defaults.headers.common['Authentication'] = `JWT ${token}`;
    await dispatch('fetchUser');
  },

  async login({dispatch}, {username, password}) {
    let token = await User.login(username, password);
    axios.defaults.headers.common['Authentication'] = `JWT ${token}`;
    window.localStorage.accessToken = token;
    dispatch('fetchUser');
  },

  async fetchUser({commit}) {
    let user = null;

    try {
      user = await User.fetchCurrent();
    } catch (e) {
      console.log("Error while fetching current user.")

      cleanAuthenticationState();
      commit('setCurrentUser', null);
      return;
    }
    
    commit('setCurrentUser', user);
  },

  logout({commit}) {
    cleanAuthenticationState()
    commit('setCurrentUser', null);
  }
};

function cleanAuthenticationState() {
  delete axios.defaults.headers.common['Authentication'];
  window.localStorage.removeItem('accessToken');
}

const store = new Vuex.Store({
  state,
  mutations,
  actions,
  strict: process.env.NODE_ENV !== 'production'
});

export default store;
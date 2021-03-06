<template>
  <div class="wrapper">
    <b-loading :is-full-page="false" :active="loading"/>
    <validation-observer ref="form">
      <form @submit.prevent="createTimer" v-if="timer">
        <h1 class="title">{{$t('timer.add-edit.timer.title')}}</h1>

        <b-field v-if="event" :label="$t('timer.add-edit.event')" >
          <b-input disabled :value="event.name" />
        </b-field>

        <b-field grouped group-multiline>
          <b-field :label="$t('timer.add-edit.timer.type')" class="timer-type">
            <b-select v-model="timer.timer_type">
              <option v-for="method in timerTypeI18nPath" v-bind:key="method.i18nPath" :value="method.type">
                {{$t(method.i18nPath)}}
              </option>
            </b-select>
          </b-field>

          <b-field  v-if="timer.timer_type === 'COUNT_DOWN' || timer.timer_type === 'RELOAD'" :label="$t('timer.add-edit.timer.duration')">
            <b-numberinput min="0" controls-position="compact" v-model="initial_duration_seconds" class="numberinput-custom"/>
          </b-field>

          <b-field v-if="timer.timer_type === 'RELOAD'" :label="$t('timer.add-edit.timer.reload-increment')">
            <b-numberinput min="0" controls-position="compact" v-model="reload_increment_seconds" class="numberinput-custom"/>
          </b-field>
        </b-field>

        <b-field :label="$t('add-edit-game.board-game.label')">
          <b-autocomplete
            v-model="searchString"
            :data="filteredBoardGames"
            field="name"
            icon="search"
            @select="selectBoardGame"
            name="boardGame"
          >
            <template slot-scope="props">
              <div class="media">
                <div class="media-left">
                  <img :src="props.option.thumbnail" width="50">
                </div>
                <div class="media-content">
                  {{props.option.name}}
                </div>
              </div>
            </template>
            <template slot="empty">{{$t('add-edit-game.board-game.no-result')}}</template>
          </b-autocomplete>
        </b-field>

        <h2 class="subtitle">{{$t('add-edit-game.players.title')}}</h2>

        <table class="table is-fullwidth">
          <thead>
          <tr>
            <th>{{$t('add-edit-game.players.user')}}</th>
            <th>{{$t('global.color')}}</th>
            <th class="has-text-white">.</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="({id}, idx) in players" :key="id">
            <td>
              <validation-provider
                rules="required"
                v-slot="{ errors }"
                :name="$t('add-edit-game.players.user')"
              >
                <b-field
                  :type="{'is-danger': errors[0]}"
                  :message="errors"
                >
                  <user-autocomplete
                    size="is-small"
                    v-model="players[idx].user"
                    :users="users"
                    :excludedIds="selectedUsersIds"
                    :name="`user-${id}`"
                  />
                </b-field>
              </validation-provider>
            </td>
            <td>
              <verte
                menuPosition="center"
                v-model="players[idx].color"
                picker="square"
                model="hex"
                :enableAlpha="false"></verte>
            </td>
            <td>
              <button type="button" class="delete" @click="removePlayer(idx)"></button>
            </td>
          </tr>
          <tr>
            <td colspan="3" class="has-text-centered">
              <button class="button is-small" type="button" @click="addPlayer()">
                {{$t('button.add-player')}}
              </button>
            </td>
          </tr>
          </tbody>
        </table>

        <div class="buttons is-right">
          <button class="button" type="button" @click="$router.go(-1)">{{$t('button.cancel')}}</button>
          <button class="button is-primary">{{$t('button.save')}}</button>
        </div>
      </form>
    </validation-observer>
  </div>
</template>

<script>
import Timer, { TimerTypes } from '@/utils/api/Timer';
import UserAutocomplete from '@/components/form/UserAutocomplete';
import Event from '@/utils/api/Event';
import BoardGame from '@/utils/api/BoardGame';
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import Verte from 'verte';
import 'verte/dist/verte.css';

/**
 * emits: close, created:timer
 */
export default {
  components: {
    UserAutocomplete,
    Verte,
    ValidationObserver,
    ValidationProvider
  },

  props: {
    event: {
      type: Event,
      required: false,
      default: null
    },
    users: { // list of selectable users
      type: Array,
      required: true
    }
  },

  data() {
    return {
      loading: false,
      players: [],
      idPlayer: 1,
      timer: null,
      boardGames: null,
      searchString: '',
      initial_duration_seconds: 20,
      reload_increment_seconds: 2
    };
  },

  computed: {
    currentUser() {
      return this.$store.state.currentUser;
    },

    selectedUsersIds() {
      return this.players.map(({user}) => user ? user.id : 0);
    },

    filteredBoardGames() {
      if (!this.searchString) {
        return this.boardGames;
      }

      let str = this.searchString.toLowerCase();
      return this.boardGames.filter(bg => bg.name.toLowerCase().indexOf(str) >= 0);
    },

    timerTypeI18nPath() {
      return [
        {type: TimerTypes.COUNT_UP, i18nPath: 'timer.type.count_up'},
        {type: TimerTypes.COUNT_DOWN, i18nPath: 'timer.type.count_down'},
        {type: TimerTypes.RELOAD, i18nPath: 'timer.type.reload'}
      ];
    }
  },

  watch: {
    initial_duration_seconds: function(val) {
      this.timer.initial_duration = val * 1000;
    },
    reload_increment_seconds: function(val) {
      this.timer.reload_increment = val * 1000;
    },
  },

  methods: {
    selectBoardGame(option) {
      this.timer.id_board_game = option ? option.id : null;
    },

    addPlayer() {
      this.players.push({user: null, color: this.generateRandomColor(), id: this.idPlayer++});
    },

    generateRandomColor() {
      return '#' + (~~(Math.random() * (1 << 24))).toString(16);
    },

    removePlayer(idx) {
      if(this.players.length === 1) {
        this.$buefy.toast.open({
          message: this.$t('add-edit-game.must-have-at-least-one-player'),
          type: 'is-danger',
          position: 'is-bottom'
        });
        return;
      }
      this.players.splice(idx, 1);
    },

    async createTimer() {
      let result = await this.$refs.form.validate();
      if (!result) {
        this.$buefy.toast.open({
          message: this.$t('global.invalid-form'),
          type: 'is-danger',
          position: 'is-bottom'
        });
        return;
      }

      this.timer.player_timers = this.players.map(({user, color}) => {
        return typeof user === 'string' ? {name: user, color} : {id_user: user.id, color};
      });

      try {
        await this.timer.save();
        this.$router.go(-1);
      }
      catch (e) {
        console.log(e);
      }
    },
  },

  async created() {
    this.loading = true;
    this.boardGames = await BoardGame.fetchAll();

    if (this.$route.params.id) {
      this.timer = await Timer.fetch(this.$route.params.id);

      // initialize for models
      this.initial_duration_seconds = Math.floor(this.timer.initial_duration / 1000);
      this.reload_increment_seconds = this.timer.reload_increment ? Math.floor(this.timer.initial_duration / 1000) : 0;

      for (let key in this.timer.player_timers) {
        let player = this.timer.player_timers[key];
        this.players.push({user: player.user || player.name, color: player.color});
      }

      if (this.timer.id_board_game != null) {
        this.searchString = this.boardGames.find(element => {
          return element.id === this.timer.id_board_game;
        }).name;
      }
    }
    else {
      this.timer = new Timer();
      this.timer.timer_type = TimerTypes.COUNT_UP;
      this.timer.initial_duration = this.initial_duration_seconds * 1000;
      this.timer.reload_increment = this.reload_increment_seconds * 1000;
      this.players.push({user: this.currentUser, color: this.generateRandomColor()});
    }

    if (this.event) {
      this.timer.id_event = this.event.id;
    }

    this.loading = false;

  },
};
</script>

<style scoped>
.wrapper {
  max-width: 600px;
  min-height: 20vh;
  margin: auto;
  position: relative;
  padding-left: 5pt;
  padding-right: 5pt;
}

h2 {
  margin-bottom: 0.5em !important;
  text-align: center;
}

.timer-type {
  margin-bottom: 0.75rem;
}

.numberinput-custom {
  width: 11em;
}
</style>

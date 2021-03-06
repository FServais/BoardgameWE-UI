<template>
  <div class="wrapper">
    <h1 class="title" v-if="event">
        {{$t(idGame ? 'edit-game.title' : 'add-game.title')}}
    </h1>

    <b-loading :active="loading" :is-full-page="false" />
    <validation-observer ref="form">
      <form v-if="!loading" @submit.prevent="save">

        <b-field v-if="event" :label="$t('timer.add-edit.event')" >
          <b-input disabled :value="event.name" />
        </b-field>

        <b-field
          v-else-if="events"
          :label="$t('timer.add-edit.event')"
          :type="{'is-danger': eventError}"
          :message="eventError"
        >
          <event-autocomplete
            v-model="selectedEvent"
            :inputData="events"
          />
        </b-field>

        <b-field
          :label="$t('add-edit-game.board-game.label')"
          :type="{'is-danger': boardgameError }"
          :message="boardgameError"
        >
          <b-autocomplete
            v-model="searchString"
            :data="filteredBoardGames"
            field="name"
            icon="search"
            @select="selectBoardGame"
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

        <b-field :label="$t('add-edit-game.expansions.label')">
          <multi-select
            v-model="selectedExpansions"
            :options="expansionsList"
            :placeholder="$t('add-edit-game.expansions.empty')"
            label="name"
            track-by="id"
            :searchable="true"
            :multiple="true"
            :close-on-select="false">
          </multi-select>
        </b-field>

        <div class="columns">
          <div class="column">
            <b-field :label="$t('add-edit-game.ranking-method.label')">
              <b-select v-model="game.ranking_method" expanded>
                <option v-for="method in allowedRankingMethods" :value="method" :key="method">
                  {{$t('global.ranking-method.' + method)}}
                </option>
              </b-select>
            </b-field>
          </div>
          <div class="column is-narrow">
            <b-field :label="$t('add-edit-game.game-duration.label')">
              <b-timepicker v-model="time" size="is-small" :min-time="minTime" :increment-minutes="15" inline />
            </b-field>
          </div>
        </div>

        <validation-provider
          rules="required"
          v-slot="{ errors }"
          :name="$t('add-edit-game.start-date.label')"
        >
          <b-field
            :label="$t('add-edit-game.start-date.label')"
            :type="{'is-danger': errors[0]}"
            :message="errors"
          >
            <p class="start-date-field">
              <date-time-picker
                v-model="startDate"
                name="startDate"
              />
              <span class="hint" v-if="suggestedStartDate">
                <b-icon icon="magic" />
                <i18n path="add-edit-game.start-date.hint">
                  <template #suggestedStartDate>
                    <a @click="startDate = suggestedStartDate">
                      <i18n
                        :path="`add-edit-game.start-date.hint-${
                          now.isSame(suggestedStartDate, 'day') ? 'today' :
                          yesterday.isSame(suggestedStartDate, 'day') ? 'yesterday' :
                          'before-yesterday'
                        }`"
                      >
                        <template #time>{{suggestedStartDate | moment('H:mm')}}</template>
                        <template #date>{{suggestedStartDate | moment('LL')}}</template>
                      </i18n>
                    </a>
                  </template>
                </i18n>
              </span>
            </p>
          </b-field>
        </validation-provider>

        <b-field :label="$t('add-edit-game.comment.label')">
          <b-input :placeholder="$t('add-edit-game.comment.placeholder')" v-model="game.comment" />
        </b-field>

        <h2 class="subtitle">{{$t('add-edit-game.players.title')}}</h2>

        <table class="table is-fullwidth">
          <thead>
            <tr>
              <th>{{$t('add-edit-game.players.user')}}</th>
              <th v-if="!game.isRanked">{{$t('add-edit-game.players.winner')}}</th>
              <th v-else-if="!game.hasScores">{{$t('add-edit-game.players.rank')}}</th>
              <th v-else>{{$t('add-edit-game.players.score')}}</th>
              <th class="has-text-white">.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="({id}, idx) in players" :key="id">
              <td>
                <validation-provider
                  rules="required"
                  :name="$t('add-edit-game.players.user')"
                  v-slot="{ errors }"
                >
                  <b-field
                    :type="{'is-danger' : errors[0]}"
                    :message="errors"
                  >
                    <user-autocomplete
                      size="is-small"
                      v-model="players[idx].user"
                      :users="users"
                      :name="`user-${id}`"
                      :excludedIds="selectedUsersIds"
                      @input="playerUpdate"
                    />
                  </b-field>
                </validation-provider>
              </td>
              <td>
                <InputWithValidation v-if="game.isRanked"
                  :name="game.hasScores ? $t('add-edit-game.players.score') : $t('add-edit-game.players.rank')"
                  :rules="scoreValidationRule"
                  v-model="players[idx].score"
                  size="is-small"
                />
                <b-checkbox v-else
                  v-model="players[idx].score"
                  size="is-small"
                />
              </td>
              <td>
                <button type="button" class="delete" @click="removePlayer(idx)"></button>
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <p v-if="suggestedPlayers && suggestedPlayers.length" class="hint">
                  <b-icon icon="magic" /> {{$t('add-edit-game.players.hint')}}
                  <span v-for="(user, idx) in suggestedPlayers" :key="user.id">
                    <a @click="addPlayer(user)">
                      {{user.name}}
                      {{user.surname.slice(0, 1)}}.</a><template v-if="idx < suggestedPlayers.length - 1">,</template>
                  </span>
                </p>
                <p class="has-text-centered">
                  <button class="button is-small" type="button" @click="addPlayer()">
                    {{$t('button.add-player')}}
                  </button>
                </p>
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
import Game, {GameRankingMethods} from '@/utils/api/Game';
import BoardGame from '@/utils/api/BoardGame';
import Timer from '@/utils/api/Timer';
import Event from '@/utils/api/Event';
import UserAutocomplete from '@/components/form/UserAutocomplete';
import EventAutocomplete from '@/components/form/EventAutocomplete';
import DateTimePicker from '@/components/form/DateTimePicker';
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import InputWithValidation from '@/components/form/InputWithValidation';
import MultiSelect from 'vue-multiselect';
import {dateToISO8601, ISO8601ToDate} from '@/utils/helper';
import moment from 'moment';

export default {
  components: {
    UserAutocomplete,
    EventAutocomplete,
    MultiSelect,
    DateTimePicker,
    ValidationObserver,
    InputWithValidation,
    ValidationProvider
  },
  props: {
    users: { // list of selectable users
      type: Array,
      required: true
    },
    boardgames: {
      type: Array,
      required: true
    },
    event: {
      type: Event,
      required: false,
      default: null
    },
    events: {
      type: Array,
      required: false,
      default: null
    }
  },
  data() {
    return {
      now: moment().startOf('minute'),
      yesterday: moment().subtract(1, 'day'),
      loading: true,
      game: null,
      searchString: '',
      selectedEvent: null,
      eventError: null,
      boardgameError: null,
      time: null,
      minTime: null,
      players: [],
      idPlayer: 1,
      expansions: {},
      selectedExpansions: [],
      availableBoardGames: [],
      startDate: null,
      suggestedPlayers: null,
      suggestionExclusions: new Set([])
    };
  },

  computed: {
    currentUser() {
      return this.$store.state.currentUser;
    },
    idGame() {
      return this.$route.params.idGame;
    },
    idTimer() {
      return this.$route.query.idTimer;
    },
    filteredBoardGames() {
      if(!this.searchString) {
        return this.availableBoardGames;
      }

      let str = this.searchString.toLowerCase();
      return this.availableBoardGames.filter(bg => bg.name.toLowerCase().indexOf(str) >= 0);
    },
    allowedRankingMethods() {
      return Object.keys(GameRankingMethods).map(key => GameRankingMethods[key]);
    },
    selectedUsersIds() {
      return this.players.map(({user}) => user ? user.id : 0);
    },
    expansionsList() {
      return Object.keys(this.expansions).map(key => this.expansions[key]);
    },
    suggestedStartDate() {
      if(this.idGame || this.startDate) {
        return null;  // do not suggest start game if editing an existing game or if user selected a date
      }
      if(this.time != null) {
        return moment(this.now).subtract(this.getDurationFromTime(this.time), 'minutes').toDate();
      }
      return null;
    },
    scoreValidationRule() {
      return this.game.hasScores ? 'required' : `between:1,${this.players.length}|integer|required`;
    }
  },

  watch: {
    'game.ranking_method'(_, old) {
      if(!old) {
        return;
      }
      this.players.forEach(player => player.score = null); // reinitialize scores
    },
    time() {
      if(this.time < this.minTime) {
        this.time = this.minTime;
      }
    },
    async selectedEvent(event) {
      if(event != null) {
        this.availableBoardGames = await event.fetchProvidedBoardGames();
      }
      else {
        this.availableBoardGames = this.boardgames;
      }
      // if selected board game no longer part of available board games, reset
      if(!this.availableBoardGames.map(bg => bg.id).includes(this.game.id_board_game)) {
        this.searchString = '';
        await this.selectBoardGame(null);
      }
    }
  },

  methods: {
    setTimeFromDuration(duration) { // arg duration to be provided in minutes
      duration = Math.round(duration / 15) * 15; // get multiple of 15 minutes
      let time = new Date();
      time.setHours(Math.floor(duration / 60));
      time.setMinutes(duration % 60);
      this.time = time;
    },
    getDurationFromTime(time) {
      return time.getHours() * 60 + time.getMinutes();
    },

    async selectBoardGame(option) {
      let idBoardGame = option ? option.id : null;
      this.game.id_board_game = idBoardGame;
      await this.setExpansions(this.game.id_board_game);
    },

    async fetchSuggestedPlayers() {
      if(this.idGame) {
        return; // do not suggest players when editing a game
      }

      let params = {excluded_players: Array.from(this.suggestionExclusions)};
      if(this.event) {
        params.id_event = this.event.id;
      }
      this.suggestedPlayers = await Game.fetchSuggestedPlayers(params);
    },

    addPlayer(user = null) {
      this.players.push({user, score: null, id: this.idPlayer++});
    },
    playerUpdate(user) {
      if(user.id && !this.suggestionExclusions.has(user.id)) {
        // add exclusion, fetch new suggestions
        this.suggestionExclusions.add(user.id);
        this.fetchSuggestedPlayers();
      }
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

    async save() {
      this.eventError = null;
      this.boardgameError = null;
      await this.$refs.form.validate().then(async result => {
        if (!this.game.id_board_game) {
          this.boardgameError = this.$t('add-edit-game.validation-error.board-game');
          result = false;
        }

        if (this.game.id_event && this.selectedEvent && this.selectedEvent.id != this.game.id_event) {
          this.eventError = this.$t('add-edit-game.validation-error.modified-event');
          result = false;
        }

        if (!result) {
          this.$buefy.toast.open({
            message: this.$t('global.invalid-form'),
            type: 'is-danger',
            position: 'is-bottom'
          });
          return;
        }

        if (this.selectedEvent != null) {
          this.game.id_event = this.selectedEvent.id;
        }
        else {
          this.game.id_event = null;
        }

        this.game.duration = this.getDurationFromTime(this.time);
        this.game.players = this.players.map(({user, score}) => {
          score = Number(score);
          return typeof user === 'string' ? {name: user, score} : {id_user: user.id, score};
        });
        this.game.expansions = this.selectedExpansions.map(exp => exp.id);

        this.game.started_at = dateToISO8601(this.startDate);

        try {
          await this.game.save();
          this.$buefy.toast.open({
            message: this.$t('add-edit-game.save-success'),
            type: 'is-success',
            position: 'is-bottom'
          });
          this.$router.go(-1);
        }
        catch(error) {
          this.$buefy.toast.open({
            message: this.$t('add-edit-game.save-error'),
            type: 'is-danger',
            position: 'is-bottom'
          });
        }
      });
    },

    async setExpansions(id) {
      if(id != null) {
        this.expansions = (await BoardGame.fetchExpansions(id)).expansions;
      }
      else {
        this.expansions = [];
      }
      this.selectedExpansions = [];
    }
  },

  async created() {
    this.availableBoardGames = this.boardgames;

    let minTime = new Date();
    minTime.setHours(0);
    minTime.setMinutes(15);
    this.minTime = minTime;

    if (this.idGame) {
      this.game = await Game.fetch(this.idGame);

      this.searchString = this.game.board_game.name;

      if (this.game.id_event) {
        if(this.events) {
          this.selectedEvent = this.events.find(event => event.id == this.game.id_event);
        }
        else {
          this.selectedEvent = this.event;
        }
      }

      await this.setExpansions(this.game.board_game.id);
      this.game.expansions.forEach(played_expansion => {
        this.selectedExpansions.push(this.expansions[played_expansion.id]);
      });

      this.game.players.forEach(player => {
        let score = this.game.isRanked ? player.score : Boolean(player.score);
        this.players.push({user: player.user || player.name, score, id: this.idPlayer++});
      });

      this.setTimeFromDuration(this.game.duration);
      if(this.game.started_at) {
        this.startDate = ISO8601ToDate(this.game.started_at);
      }
    }
    else {
      this.game = new Game({ranking_method: GameRankingMethods.POINTS_HIGHER_BETTER});

      if (this.event) {
        this.game.id_event = this.event.id;
        this.selectedEvent = this.event;
      }

      if (this.idTimer) {
        this.game.id_timer = this.idTimer;

        const timer = await Timer.fetch(this.idTimer);
        this.setTimeFromDuration(timer.getTotalElapsed() / 1000 / 60);

        if(timer.board_game) {
          this.game.id_board_game = timer.id_board_game;
          this.searchString = timer.board_game.name;
        }

        timer.player_timers.forEach(player => {
          this.players.push({ user: player.user || player.name, score: null, id: this.idPlayer++ });
        });
      }
      else {
        this.setTimeFromDuration(30); // default duration: 30 minutes
        this.players.push({user: this.currentUser, score: null});
      }
    }

    this.loading = false;
  }
};
</script>

<style lang="scss" scoped>
.wrapper {
  max-width: 600px;
  min-height: 20vh;
  margin: auto;
  position: relative;
  padding-left: 5pt;
  padding-right: 5pt;
  margin-bottom: 1em;
}

.columns {
  margin-bottom: 0;
}

h2 {
  margin-bottom: 0.5em !important;
  text-align: center;
}

/deep/ .timepicker .dropdown-content {
  padding-top: 0 !important;
  padding-bottom: 0 !important;

  select {
    font-weight: normal !important;
  }
}

/deep/ label {
  font-weight: normal;
  text-transform: uppercase;
  font-size: 0.7em;

  /deep/ .b-tooltip {
    font-size: 0.9rem;
    text-transform: initial;
  }

  /deep/ .icon {
    font-size: 0.8rem;
    margin-left: 0.25em;
  }
}

th:nth-child(2), td:nth-child(2) {
  text-align: center;

  /deep/ .control {
    max-width: 10em;
    margin: auto;
  }
}

.start-date-field {

  /deep/ .field {
    margin-bottom: 0.25em;
  }

  .button {
    margin-left: 0.75em;
    font-size: 0.75em;
  }
}

.hint {
  font-size: 0.8em;
  color: grey;

  /deep/ .icon {
    font-size: 0.8em;
  }

  a {
    font-weight: 450;
  }
}
</style>

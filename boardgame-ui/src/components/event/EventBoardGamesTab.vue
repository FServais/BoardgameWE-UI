<template>
  <div>
    <b-loading :is-full-page="false" :active="loading"></b-loading>
    <template v-if="!loading">
      <b-message v-if="boardGames.length === 0" type="is-info" has-icon icon-size="is-small">
        {{ $t('event.boardgames.info-message')}}
      </b-message>

      <board-game-list
        :boardGames="boardGames"
        :wishedBoardGames="wishedBoardGames"
        :addFromLibrary="true"
        :canAdd="event.current.can_write"
        @add="addBoardGame"
        @delete="deleteBoardGame"
      />
    </template>
  </div>
</template>

<script>
import BoardGameList from '@/components/board_games/BoardGameList';
import Library from '@/utils/api/Library';

export default {
  props: {
    event: Object
  },
  components: {BoardGameList},
  data() {
    return {
      loading: true,
      boardGamesLinks: [],
      wishedBoardGames: []
    };
  },
  computed: {
    currentUser() {
      return this.$store.state.currentUser;
    },
    boardGames() { // remove duplicate board games and check whether or not one of the copies belongs to current user
      let mapping = {};
      let boardGames = [];
      for(let link of this.boardGamesLinks) {
        let belongsToUser = link.id_user === this.currentUser.id;
        let id = link.id_board_game;
        if(id in mapping) {
          let bg = boardGames[mapping[id]];
          bg.count++;
          if(belongsToUser) {
            bg.belongsToUser = true;
          }
        }
        else {
          boardGames.push({belongsToUser, count: 1, ...link.provided_board_game});
          mapping[id] = boardGames.length - 1;
        }
      }
      return boardGames;
    }
  },
  methods: {
    async addBoardGame({bggId, inLibrary}) {
      try {
        this.boardGamesLinks = await this.event.addBoardGameFromBgg(bggId);

        if(!inLibrary) {
          this.$buefy.snackbar.open({
            message: this.$t('event-board-games.snackbar.game-not-in-library'),
            position: 'is-bottom',
            actionText: this.$t('event-board-games.snackbar.add-game-to-library'),
            onAction: () => this.addBoardGameToLibrary(bggId)
          });
        }
        else {
          this.$buefy.toast.open({
            message: this.$t('event-board-games.toast.add-success'),
            type: 'is-success',
            position: 'is-bottom'
          });
        }
      }
      catch(error) {
        console.log(error);
        this.$buefy.toast.open({
          message: this.$t('event-board-games.toast.add-error'),
          type: 'is-danger',
          position: 'is-bottom'
        });
      }
    },

    async addBoardGameToLibrary(bggId) {
      try {
        await new Library().addGameFromBgg(bggId);
        this.$buefy.toast.open({
          message: this.$t('event-board-games.toast.add-library-success'),
          type: 'is-success',
          position: 'is-bottom'
        });
      }
      catch(error) {
        console.log(error);
        this.$buefy.toast.open({
          message: this.$t('event-board-games.toast.add-library-error'),
          type: 'is-danger',
          position: 'is-bottom'
        });
      }
    },

    async deleteBoardGame(id) {
      try {
        await this.event.removeBoardGames([id]);
        this.boardGamesLinks = await this.event.fetchBoardGames();
        this.$buefy.toast.open({
          message: this.$t('event-board-games.toast.delete-success'),
          type: 'is-success',
          position: 'is-bottom'
        });
      }
      catch(error) {
        console.log(error);
        this.$buefy.toast.open({
          message: this.$t('event-board-games.toast.delete-error'),
          type: 'is-danger',
          position: 'is-bottom'
        });
      }
    }
  },
  async created() {
    this.boardGamesLinks = await this.event.fetchBoardGames();
    this.wishedBoardGames = await this.event.fetchWishedBoardGames();
    this.loading = false;
  }
};
</script>

<template>
  <div>
    <b-loading :is-full-page="false" :active="loading" />

    <template v-if="!loading">
      <b-message v-if="boardGames.length === 0 && isCurrentUserProfile" type="is-info" has-icon icon-size="is-small">
        {{$t('profile.library.explanation')}}
      </b-message>

      <board-game-list
        :boardGames="boardGames"
        :allBelongToUser="isCurrentUserProfile"
        :canAdd="isCurrentUserProfile"
        @add="addBoardGame"
        @delete="deleteBoardGame"
      />
    </template>
  </div>
</template>

<script>
import BoardGameList from '@/components/board_games/BoardGameList';
import Library from '@/utils/api/Library';
import User from '@/utils/api/User';

export default {
  props: {
    user: User, // if null, library of current user
    isCurrentUserProfile: Boolean
  },
  components: {
    BoardGameList
  },
  data() {
    return {
      loading: true,
      library: null,
      libraryBoardGames: null
    };
  },
  computed: {
    boardGames() {
      return this.libraryBoardGames.map(item => item.board_game);
    }
  },
  methods: {
    async addBoardGame({bggId}) {
      try {
        this.libraryBoardGames = await this.library.addGameFromBgg(bggId);
        this.$buefy.toast.open({
          message: this.$t('library.toast.add-success'),
          type: 'is-success',
          position: 'is-bottom'
        });
      }
      catch(error) {
        console.log(error);
        this.$buefy.toast.open({
          message: this.$t('library.toast.add-error'),
          type: 'is-danger',
          position: 'is-bottom'
        });
      }
    },
    async deleteBoardGame(id) {
      try {
        this.libraryBoardGames = await this.library.removeGames([id]);
        this.$buefy.toast.open({
          message: this.$t('library.toast.delete-success'),
          type: 'is-success',
          position: 'is-bottom'
        });
      }
      catch(error) {
        console.log(error);
        this.$buefy.toast.open({
          message: this.$t('library.toast.delete-error'),
          type: 'is-danger',
          position: 'is-bottom'
        });
      }
    }
  },
  async created() {
    this.library = new Library(!this.isCurrentUserProfile ? this.user.id : null);
    this.libraryBoardGames = await this.library.fetchGames();
    this.loading = false;
  }
};
</script>


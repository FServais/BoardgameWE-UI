<template>
  <div class="board-game-list-wrapper">
    <div class="columns">
      <div class="column is-narrow">
        <b-field>
          <b-input :placeholder="$t('placeholder.search')" type="search" icon="search" v-model="searchString"></b-input>
        </b-field>
      </div>
      <div class="column is-narrow">
        <b-field>
          <b-select v-model="selectedSortOption">
              <option v-for="option in sortOptions" :value="option" :key="option.label">
                  {{ option.label }}
              </option>
          </b-select>
        </b-field>
      </div>
      <div class="column is-narrow">
        <b-field class="narrow">
          <b-input v-model="nbPlayers" icon="users"></b-input>
        </b-field>
      </div>
      <div class="column has-text-right">
        <button class="button is-primary" @click="activeModal = true">
          {{$t("board-games-list.add")}}
        </button>
      </div>
    </div>

    <div class="columns is-multiline">
      <div class="column is-2" v-for="boardGame in filteredBoardGames" :key="boardGame.id">
        <board-game-preview :boardGame="boardGame" :deleteButton="allBelongToUser || boardGame.belongsToUser"
          @delete="$emit('delete', boardGame.id)">
        </board-game-preview>
      </div>
    </div>

    <add-board-game-modal :active.sync="activeModal" :excludedIds="bggIdsUserGames" :addFromLibrary="addFromLibrary"
      @add="$emit('add', $event)">
    </add-board-game-modal>
  </div>
</template>

<script>
import BoardGamePreview from './BoardGamePreview';
import AddBoardGameModal from './AddBoardGameModal';

export default {
  props: [
    'boardGames',
    'allBelongToUser', // if true, delete button available for all board game, if false, only available for boardGames in which belongsToUser is true
    'addFromLibrary'
  ],
  components: {
    BoardGamePreview,
    AddBoardGameModal
  },
  data() {
    return {
      searchString: '',
      sortOptions: [
        {label: this.$t('sort.name.a-z'), prop: 'name', asc: true},
        {label: this.$t('sort.name.z-a'), prop: 'name', asc: false},
        {label: this.$t('sort.year.increasing'), prop: 'year_published', asc: true},
        {label: this.$t('sort.year.decreasing'), prop: 'year_published', asc: false},
        {label: this.$t('sort.score.increasing'), prop: 'bgg_score', asc: true},
        {label: this.$t('sort.score.decreasing'), prop: 'bgg_score', asc: false},
      ],
      selectedSortOption: null,
      nbPlayers: null,
      activeModal: false
    };
  },
  computed: {
    bggIdsUserGames() {
      let userBoardGames = this.allBelongToUser ? this.boardGames : this.boardGames.filter(bg => bg.belongsToUser);
      return userBoardGames.map(boardGame => boardGame.bgg_id);
    },
    filteredBoardGames() {
      let str = this.searchString.toLowerCase();
      let nbPlayers = Number(this.nbPlayers);
      let {asc, prop: sortProp} = this.selectedSortOption;

      return this.boardGames.filter(boardGame => {
        return boardGame.name.toLowerCase().indexOf(str) >= 0
          && (!nbPlayers || (boardGame.min_players <= nbPlayers && boardGame.max_players >= nbPlayers));
      }).sort((a, b) => a[sortProp] < b[sortProp] ? (asc ? -1 : 1) : (asc ? 1 : -1));
    }
  },
  created() {
    this.selectedSortOption = this.sortOptions[0];
  }
};
</script>

<style lang="scss">
.board-game-list-wrapper .narrow.field {
  max-width: 7em;

  &:not(:last-child) {
    margin-right: 1em;
  }
}
</style>
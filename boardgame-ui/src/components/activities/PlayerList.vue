<template>
  <span v-if="nbPlayers <= maxDisplayed">
    <span v-for="(player, index) in players" :key="player.id">
      <strong><player-display :player="player" /></strong>
      <span v-if="index < nbPlayers - 2">,&nbsp;</span>
      <span v-else-if="index === nbPlayers - 2">&nbsp;{{$t('and')}}&nbsp;</span>
    </span>
  </span>
  <span v-else>
    <span v-for="player in players.slice(0, maxDisplayed - 2)" :key="player.id">
      <strong><player-display :player="player" /></strong>,&nbsp;
    </span>
    <strong><player-display :player="players[maxDisplayed - 2]" /></strong>
    {{$tc('global.and-count-others', nbPlayers - maxDisplayed + 1)}}
  </span>
</template>

<script>
import PlayerDisplay from '@/components/user/PlayerDisplay';

export default {
  name: 'ActivityBoxLeftMedia',
  props: {
    'players': Array
  },
  components: {
    PlayerDisplay
  },
  computed: {
    maxDisplayed: () => 5,
    nbPlayers() {
      return this.players.length;
    }
  }
};
</script>

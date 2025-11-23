<template>
  <div id="app" class="game-container">
    <h1>Chińczyk</h1>
    <div class="game-board">
      <Board />
      <div class="sidebar">
        <Dice @rolled="onDiceRolled" />
        <div class="players-info">
          <PlayerInfo
            v-for="player in players"
            :key="player.color"
            :player="player"
          />
        </div>

        <!-- live chat -->
        <Chat />
      </div>
    </div>
  </div>
</template>

<script>
import Board from '../compontents/chinczyk/chinczyk_board.vue'
import Dice from '../compontents/chinczyk/chinczyk_dice.vue'
import PlayerInfo from '../compontents/chinczyk/chinczyk_playerInfo.vue'
import Chat from '../compontents/chinczyk/chinczyk_chat.vue'

export default {
  components: { Board, Dice, PlayerInfo, Chat },
  data() {
    return {
      players: [
        { name: 'Gracz 1', color: 'red' },
        { name: 'Gracz 2', color: 'blue' },
        { name: 'Gracz 3', color: 'green' },
        { name: 'Gracz 4', color: 'yellow' }
      ]
    };
  },
  methods: {
    onDiceRolled(dice) {
      console.log('Wyrzucono:', dice);
    }
  }
};
</script>

<style>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Arial, sans-serif;
}
.game-board {
  display: flex;
  margin-top: 20px;
}
.sidebar {
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 320px;
}
.players-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
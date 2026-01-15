
class ChinczykLocalGame {
  constructor() {
    this.colors = ['red', 'blue', 'green', 'yellow']
    
    this.mainPath = [
      { r: 4, c: 0 },
      { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 },
      { r: 3, c: 4 }, { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 0, c: 4 },
      { r: 0, c: 5 }, { r: 0, c: 6 },
      { r: 1, c: 6 }, { r: 2, c: 6 }, { r: 3, c: 6 }, { r: 4, c: 6 },
      { r: 4, c: 7 }, { r: 4, c: 8 }, { r: 4, c: 9 }, { r: 4, c: 10 },
      { r: 5, c: 10 }, { r: 6, c: 10 },
      { r: 6, c: 9 }, { r: 6, c: 8 }, { r: 6, c: 7 }, { r: 6, c: 6 },
      { r: 7, c: 6 }, { r: 8, c: 6 }, { r: 9, c: 6 }, { r: 10, c: 6 },
      { r: 10, c: 5 }, { r: 10, c: 4 },
      { r: 9, c: 4 }, { r: 8, c: 4 }, { r: 7, c: 4 }, { r: 6, c: 4 },
      { r: 6, c: 3 }, { r: 6, c: 2 }, { r: 6, c: 1 }, { r: 6, c: 0 },
      { r: 5, c: 0 }
    ]

    this.goalPaths = {
      red: [{ r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 4 }],
      blue: [{ r: 1, c: 5 }, { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }],
      yellow: [{ r: 5, c: 9 }, { r: 5, c: 8 }, { r: 5, c: 7 }, { r: 5, c: 6 }],
      green: [{ r: 9, c: 5 }, { r: 8, c: 5 }, { r: 7, c: 5 }, { r: 6, c: 5 }]
    }

    this.startPositions = {
      red: 0,
      blue: 10,
      yellow: 20,
      green: 30
    }

    this.homePositions = {
      red: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
      blue: [{ r: 0, c: 9 }, { r: 0, c: 10 }, { r: 1, c: 9 }, { r: 1, c: 10 }],
      green: [{ r: 9, c: 0 }, { r: 9, c: 1 }, { r: 10, c: 0 }, { r: 10, c: 1 }],
      yellow: [{ r: 9, c: 9 }, { r: 9, c: 10 }, { r: 10, c: 9 }, { r: 10, c: 10 }]
    }

    this.gameState = null
  }

  createGame(playerNames) {
    const players = playerNames.map((name, idx) => ({
      id: `player-${idx}`,
      name,
      color: this.colors[idx]
    }))

    const pawns = {}
    players.forEach((player, idx) => {
      const color = this.colors[idx]
      const homes = this.homePositions[color]
      
      pawns[color] = homes.map((pos, i) => ({
        id: `${color}-${i}`,
        color,
        position: pos,
        inHome: true,
        inGoal: false,
        pathPosition: -1,
        goalPosition: -1
      }))
    })

    this.gameState = {
      pawns,
      currentTurn: 0,
      currentDice: null,
      players,
      winner: null
    }

    return this.gameState
  }

  rollDice() {
    if (!this.gameState || this.gameState.winner !== null) {
      return { success: false, error: 'Gra nie jest aktywna' }
    }

    if (this.gameState.currentDice !== null) {
      return { success: false, error: 'Najpierw wykonaj ruch' }
    }

    const value = Math.floor(Math.random() * 6) + 1
    this.gameState.currentDice = value

    const movablePawns = this.getMovablePawns(this.gameState.currentTurn, value)

    if (movablePawns.length === 0 && value !== 6) {
      this.gameState.currentDice = null
      this.nextTurn()
      return { success: true, value, movablePawns: [], turnChanged: true }
    }

    return { success: true, value, movablePawns, turnChanged: false }
  }

  getMovablePawns(turnIndex, diceValue) {
    const color = this.colors[turnIndex]
    const pawns = this.gameState.pawns[color]
    const movable = []

    for (const pawn of pawns) {
      if (pawn.inGoal) continue

      if (pawn.inHome && diceValue === 6) {
        movable.push(pawn)
        continue
      }

      if (!pawn.inHome && !pawn.inGoal) {
        if (this.canMovePawn(pawn, diceValue, color)) {
          movable.push(pawn)
        }
      }
    }

    return movable
  }

  canMovePawn(pawn, diceValue, color) {
    if (pawn.pathPosition >= 0 && pawn.pathPosition < 40) {
      const pathToGoalEntry = this.startPositions[color] - 1
      const normalizedEntry = pathToGoalEntry < 0 ? pathToGoalEntry + 40 : pathToGoalEntry
      
      const absolutePosition = (this.startPositions[color] + pawn.pathPosition) % 40
      
      let stepsToGoalEntry
      if (absolutePosition <= normalizedEntry) {
        stepsToGoalEntry = normalizedEntry - absolutePosition
      } else {
        stepsToGoalEntry = (40 - absolutePosition) + normalizedEntry
      }

      if (diceValue > stepsToGoalEntry && diceValue <= stepsToGoalEntry + 4) {
        const goalPos = diceValue - stepsToGoalEntry - 1
        return goalPos < 4
      }

      return (pawn.pathPosition + diceValue) < 40
    }

    if (pawn.goalPosition >= 0) {
      return (pawn.goalPosition + diceValue) < 4
    }

    return true
  }

  movePawn(pawnId) {
    if (!this.gameState || this.gameState.currentDice === null) {
      return { success: false, error: 'Najpierw rzuć kostką' }
    }

    const color = this.colors[this.gameState.currentTurn]
    const pawn = this.gameState.pawns[color].find(p => p.id === pawnId)

    if (!pawn) {
      return { success: false, error: 'Nieprawidłowy pionek' }
    }

    const movablePawns = this.getMovablePawns(this.gameState.currentTurn, this.gameState.currentDice)
    if (!movablePawns.find(p => p.id === pawnId)) {
      return { success: false, error: 'Nie możesz ruszyć tego pionka' }
    }

    const diceValue = this.gameState.currentDice
    let captured = false

    if (pawn.inHome && diceValue === 6) {
      const startPos = this.startPositions[color]
      pawn.position = this.mainPath[startPos]
      pawn.pathPosition = 0
      pawn.inHome = false
      captured = this.checkCapture(pawn, color)
    } else if (pawn.pathPosition >= 0) {
      const absolutePosition = (this.startPositions[color] + pawn.pathPosition) % 40
      const pathToGoalEntry = this.startPositions[color] - 1
      const normalizedEntry = pathToGoalEntry < 0 ? pathToGoalEntry + 40 : pathToGoalEntry
      
      let stepsToGoalEntry
      if (absolutePosition <= normalizedEntry) {
        stepsToGoalEntry = normalizedEntry - absolutePosition
      } else {
        stepsToGoalEntry = (40 - absolutePosition) + normalizedEntry
      }

      if (diceValue > stepsToGoalEntry && diceValue <= stepsToGoalEntry + 4) {
        const goalPos = diceValue - stepsToGoalEntry - 1
        if (goalPos < 4) {
          pawn.goalPosition = goalPos
          pawn.position = this.goalPaths[color][goalPos]
          pawn.pathPosition = -1
          
          if (goalPos === 3) {
            pawn.inGoal = true
          }
        }
      } else {
        pawn.pathPosition = (pawn.pathPosition + diceValue) % 40
        const newAbsPos = (this.startPositions[color] + pawn.pathPosition) % 40
        pawn.position = this.mainPath[newAbsPos]
        captured = this.checkCapture(pawn, color)
      }
    } else if (pawn.goalPosition >= 0) {
      const newGoalPos = pawn.goalPosition + diceValue
      if (newGoalPos < 4) {
        pawn.goalPosition = newGoalPos
        pawn.position = this.goalPaths[color][newGoalPos]
        
        if (newGoalPos === 3) {
          pawn.inGoal = true
        }
      }
    }

    const rolledSix = this.gameState.currentDice === 6
    this.gameState.currentDice = null

    const winner = this.checkWinner()
    if (winner !== null) {
      this.gameState.winner = winner
      return { success: true, gameState: this.gameState, captured, winner, turnChanged: false }
    }

    let turnChanged = false
    if (!rolledSix) {
      this.nextTurn()
      turnChanged = true
    }

    return { success: true, gameState: this.gameState, captured, turnChanged }
  }

  checkCapture(movedPawn, currentColor) {
    const pos = movedPawn.position
    
    for (const color in this.gameState.pawns) {
      if (color === currentColor) continue
      
      for (const pawn of this.gameState.pawns[color]) {
        if (pawn.inHome || pawn.inGoal) continue
        
        if (pawn.position.r === pos.r && pawn.position.c === pos.c) {
          const homes = this.homePositions[color]
          const homeIdx = parseInt(pawn.id.split('-')[1])
          pawn.position = homes[homeIdx]
          pawn.inHome = true
          pawn.pathPosition = -1
          pawn.goalPosition = -1
          return true
        }
      }
    }
    
    return false
  }

  checkWinner() {
    for (let i = 0; i < this.gameState.players.length; i++) {
      const color = this.colors[i]
      const pawns = this.gameState.pawns[color]
      
      if (pawns.every(p => p.inGoal)) {
        return i
      }
    }
    
    return null
  }

  nextTurn() {
    this.gameState.currentTurn = (this.gameState.currentTurn + 1) % this.gameState.players.length
  }

  getGameState() {
    return this.gameState
  }
}

export default new ChinczykLocalGame()

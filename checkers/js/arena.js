class Arena {
  constructor(board, playerWhite, playerBlack, whiteStarts = false) {
    this.playerWhite = playerWhite
    this.playerBlack = playerBlack

    this.board = board

    this.currentPlayer = whiteStarts ? playerWhite : playerBlack
    ui.highlightPlayer(whiteStarts)

    this.moveWasPlayed = false
    this.animationDelay = 500
    this.lastAnimation = 0

    this.jumpSequence = []
    this.jumpSequenceCompleted = true

    this.stopped = false
  }

  async play() {
    if(!this.stopped) {
      this.currentPlayer.play()

      if(!this.jumpSequenceCompleted) {
        if(this.lastAnimation + this.animationDelay <= Date.now()) {
          const nextJump = this.jumpSequence.shift()
          this.board.applyJump(nextJump)
          this.lastAnimation = Date.now()

          if(this.jumpSequence.length <= 0) {
            this.jumpSequenceCompleted = true
          }
        }
      }

      if(this.currentPlayer instanceof EnginePlayer && !this.moveWasPlayed) {
        if(this.enginePromise) {
          if(this.enginePromise.isResolved()) {
            this.enginePromise.then(result => {
              if(result) {
                this.jumpSequence.push(...result.bestMove.jumps)
                this.board.addMoveHistory(result.bestMove)

                this.jumpSequenceCompleted = false
                this.moveWasPlayed = true
                this.enginePromise = null
              }
            })
          }
        } else {
          this.enginePromise = MakeQueryablePromise(this.currentPlayer.getMoveSequence())
        }
      }

      if(this.currentPlayer instanceof RealPlayer && !this.moveWasPlayed) {
        if(this.currentPlayer.done()) {
          this.moveWasPlayed = true
          this.jumpSequenceCompleted = true
        }
      }

      if(this.moveWasPlayed && this.jumpSequenceCompleted) {
        this.takeTurns()
      }
    }
  }

  takeTurns() {
    // check win/draw first
    if(checkDraw(this.board.history)) {
      game.callDraw()
      this.stopped = true
      return
    }

    const currentNode = this.board.generator.updateState(this.currentPlayer.side^1n).state

    if(checkWhiteWin(currentNode, this.currentPlayer.side^1n)) {
      game.callWin(1n)
      this.stopped = true
      return
    } else if(checkBlackWin(currentNode, this.currentPlayer.side^1n)) {
      game.callWin(0n)
      this.stopped = true
      return
    }

    this.moveWasPlayed = false
    this.currentPlayer.myTurn = false
    if(this.currentPlayer == this.playerBlack) {
      // console.log('Its whites turn')
      this.currentPlayer = this.playerWhite
      ui.highlightPlayer(1)
    } else {
      // console.log('Its blacks turn')
      this.currentPlayer = this.playerBlack
      ui.highlightPlayer(0)
    }

    if(this.currentPlayer instanceof RealPlayer) {
      this.currentPlayer.playedMove = false
    }
  }

  gameOver() {
  }

  clickedTile(tile) {
    if(this.currentPlayer instanceof RealPlayer) {
      this.currentPlayer.clickedTile(tile)
    }
  }

  forceEngineMove() {
    if(this.playerBlack instanceof EnginePlayer) {
      this.playerBlack.makeMove()
    }

    if(this.playerWhite instanceof EnginePlayer) {
      this.playerWhite.makeMove()
    }
  }

  reassign(playerWhite, playerBlack) {
    this.playerWhite = playerWhite
    this.playerBlack = playerBlack
  }
}

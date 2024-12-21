class Game {
  constructor(options = GAME_OPTIONS) {
    this.restart(options)
  }

  run() {
    this.arena.play()
    this.show()
  }

  show() {
    this.board.show()

    if(this.draw) {
      textSize(75)
      fill(0)
      stroke(250)
      strokeWeight(2)
      // textFont('Rockwell')
      text("DRAW!", width / 2, height / 2)
    } else if(this.whiteWins) {
      textSize(75)
      fill(0)
      stroke(250)
      strokeWeight(2)
      // textFont('Rockwell')
      text("WHITE WINS!", width / 2, height / 2)
    } else if(this.blackWins) {
      textSize(75)
      fill(0)
      stroke(250)
      strokeWeight(2)
      // textFont('Rockwell')
      text("BLACK WINS!", width / 2, height / 2)
    }
  }

  callDraw() {
    console.log('Its a draw!')
    this.draw = true
  }

  callWin(side) {
    if(side) {
      console.log('White wins!');
      this.whiteWins = true
    } else {
      console.log('Black wins!');
      this.blackWins = true
    }
  }

  restart(options = GAME_OPTIONS) {
    this.board = new Chessboard()

    let playerWhite = null
    if(options.playerWhiteEngine) {
      playerWhite = new EnginePlayer(this.board, 1n, options.playerWhiteStrength)
    } else {
      playerWhite = new RealPlayer(this.board, 1n)
    }

    let playerBlack = null
    if(options.playerBlackEngine) {
      playerBlack = new EnginePlayer(this.board, 0n, options.playerBlackStrength)
    } else {
      playerBlack = new RealPlayer(this.board, 0n)
    }

    this.arena = new Arena(
      this.board,
      playerWhite,
      playerBlack,
      options.whiteBegins,
    )

    this.draw = false
    this.whiteWins = false
    this.blackWins = false
  }
}

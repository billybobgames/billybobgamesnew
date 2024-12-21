class RealPlayer {
  constructor(b, side) {
    this.board = b
    this.myTurn = false
    this.side = side

    this.tileFrom = null
    this.tileTarget = null

    this.multipleCapturesLeft = false
    this.playedMove = false

    this.legalMovers = []
    this.legalTargets = []
  }

  play() {
    this.myTurn = true

    if(!this.tileFrom) {
      const tiles = this.board.highlightLegalMovers(this.side)
      this.legalMovers = tiles
    } else {
      const {targets} = this.board.highlightLegalTargets(this.tileFrom, this.side)
      this.legalTargets = targets
    }
  }

  done() {
    return (this.playedMove & !this.multipleCapturesLeft)
  }

  async clickedTile(tile) {
    const { board, white, myTurn } = this
    if(tile) {
      // Check whether from tile is already selected
      if(this.tileFrom) {
        // Set tile as target tile
        this.tileTarget = tile

        let selectTileAfter = false

        // Check whether move from tileFrom to tileTarget is legal
        if(this.legalTargets.includes(tile)) {
          // Figure out which move it was
          const moves = this.board.getMovesByTiles(this.tileFrom, this.tileTarget, this.side)


          const jump = moves[0].jumps[0]
          this.board.applyJump(jump)

          if(moves.length > 1 || moves.some(m => m.jumps.length > 1)) {
            // There are still a few options
            selectTileAfter = true
            this.multipleCapturesLeft = true
          } else {
            const finalMove = moves[0]
            if(this.board.history.hash != finalMove.hash) {
              this.board.addMoveHistory(finalMove)
            }
            this.multipleCapturesLeft = false
            this.playedMove = true
          }
        }

        // Unselect all tiles
        this.tileFrom.unselect()
        this.tileFrom = null
        this.tileTarget = null

        if(selectTileAfter) {
          this.tileFrom = tile
          this.tileFrom.select()
        }
      } else {
        // Pick tile from
        if(this.legalMovers.includes(tile)) {
          this.tileFrom = tile
          this.tileFrom.select()
        }
      }
    }
  }
}

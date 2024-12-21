class Chessboard {
  constructor() {
    this.tiles = this.createTiles()
    this.initStartingPieces()

    this.initGenerator()

    this.history = []
  }

  initGenerator() {
    this.generator = new MoveGenerator(this)
  }

  show() {
    for(let tile of this.tiles) {
      tile.show()
      tile.legalMover = false
      tile.legalTarget = false
    }

    // Show file and rank names
    const files = 'abcdefgh'
    const ranks = '12345678'
    fill(50)
    noStroke()
    textSize(12)
    textAlign(CENTER, CENTER)
    
    for(let i = 0; i < 8; i++) {
      if(FLIPPED_BOARD) {
        const x = (i + 0.5) * TILE_SIZE
        text(files[7 - i], x, 8)
      } else {
        const x = (i + 0.5) * TILE_SIZE
        text(files[i], x, height - 8)
      }
    }

    for(let i = 0; i < 8; i++) {
      if(FLIPPED_BOARD) {
        const y = (i + 0.5) * TILE_SIZE
        text(ranks[i], width - 8, y)
      } else {
        const y = (i + 0.5) * TILE_SIZE
        text(ranks[7 - i], 8, y)
      }
    }
  }

  getMovesByTiles(from, to, side) {
    const legalMoves = []
    this.generator.updateState(side)
    const moves = this.generator.getMoves(this.generator.state, this.generator.hash, side)

    for(let m of moves) {
      const fromIdx = bitToIndex(Number(Jump.from(m.jumps[0])))
      const targetIdx = bitToIndex(Number(Jump.target(m.jumps[0])))
      const tileFrom = this.tiles[fromIdx]
      const tileTarget = this.tiles[targetIdx]

      if(from == tileFrom && to == tileTarget) {
        legalMoves.push(m)
      }
    }

    return legalMoves
  }

  getJumpByTiles(from, to, side) {
    if(from) {
      if(from.piece) {
        this.generator.updateState(side)
        const idx = BigInt(indexToBit(from.i * 4 + from.j))
        let moves
        if(side) {
          const mask = this.generator.state.W & addHighBitAtIdx(0n, idx)
          moves = this.generator.getWhiteMoves({...this.generator.state, W: mask}, this.generator.hash)
        } else {
          const mask = this.generator.state.B & addHighBitAtIdx(0n, idx)
          moves = this.generator.getBlackMoves({...this.generator.state, B: mask}, this.generator.hash)
        }

        console.log(moves)

        for(let m of moves) {
          const j = m.jumps[0]
          const tileIdx = bitToIndex(Number(Jump.target(j)))
          const tTile = this.tiles[tileIdx]
          if(tTile == to) {
            return j
          }
        }
      }
    }
    return false
  }

  addMoveHistory(move) {
    if(this.history.length >= 1 && move.hash == this.history[this.history.length - 1].hash) {
      // console.log('Move already in hist', move, this.history[this.history.length-1]);
    } else {
      this.history.push(move)
    }

  }



  getTileAtCoordinates(x, y) {
    const { i, j } = indecesFromCoordinates(x, y)

    const idx = i * 4 + j
    const t = this.tiles[idx]
    if(t) {
      return t
    }

    return false
  }

  applyMove(m) {
    for(let j of m.jumps) {
      this.applyJump(j)
    }
    this.addMoveHistory(m)
  }

  applyJump(j) {
    const from = Jump.from(j)
    const to = Jump.target(j)

    const moved = this.movePieceByBit(from, to)
    if(moved) {
      if(Jump.promotion(j)) {
        const t1 = this.tiles[bitToIndex(Number(Jump.promotion(j)))]
        t1.piece.promoted = true
      }
      if(Jump.capture(j)) {
        const t1 = this.tiles[bitToIndex(Number(Jump.capture(j)))]
        if(t1) {
          t1.removePiece()
        }
      }

      this.highlightJump(j)

      return true
    }
    return false
  }

  movePieceByBit(from, to) {
    return this.movePieceByIdx(bitToIndex(Number(from)), bitToIndex(Number(to)))
  }

  movePieceByIdx(from, to) {
    const t1 = this.tiles[from]
    if(t1) {
      if(t1.piece) {
        const t2 = this.tiles[to]
        if(t2) {
          t2.addPiece(t1.piece)
          t1.removePiece()
          return true
        }
      }
    }
    return false
  }


  resetHighlights() {
    for(let tile of this.tiles) {
      tile.highlighted = false
    }
  }

  highlightLegalMovers(side) {
    const tiles = []

    this.generator.updateState(side)
    const moves = this.generator.getMoves(this.generator.state, this.generator.hash, side)

    for(let m of moves) {
      const fromIdx = bitToIndex(Number(Jump.from(m.jumps[0])))
      const tile = this.tiles[fromIdx]
      tiles.push(tile)
    }

    for(let t of tiles) {
      t.legalMover = true
    }

    return tiles
  }

  highlightLegalTargets(from, side) {
    const endTargets = []
    const stepper = []

    this.generator.updateState(side)
    const moves = this.generator.getMoves(this.generator.state, this.generator.hash, side)

    for(let m of moves) {
      const fromIdx = bitToIndex(Number(Jump.from(m.jumps[0])))
      const tileFrom = this.tiles[fromIdx]

      // Filter not allowed moves
      if(tileFrom == from) {
        const jumpList = m.jumps
        const endTarget = bitToIndex(Number(Jump.target(jumpList[0])))
        const endTargetTile = this.tiles[endTarget]
        endTargets.push(endTargetTile)
      }
    }

    for(let t of endTargets) {
      t.legalTarget = true
    }

    return {targets: endTargets, stepper}
  }

  highlightJump(j) {
    this.highlightBitboard( addHighBitAtIdx(0n, Jump.from(j)) | addHighBitAtIdx(0n, Jump.target(j)) )
  }

  highlightBitboard(b) {
    const tiles = this.getTilesFromBitboard(b)
    this.highlightTiles(tiles)
  }

  highlightTiles(tiles) {
    this.resetHighlights()
    for(let tile of tiles) {
      tile.highlighted = true
    }
  }

  getTilesFromBitboard(b) {
    const tiles = []
    let list = b

    while(list) {
      const bitIdx = BINT.lsb(list)
      const tile = this.tiles[bitToIndex(Number(bitIdx))]
      tiles.push(tile)

      list ^= addHighBitAtIdx(0n, bitIdx)
    }

    return tiles
  }

  createTiles() {
    const tiles = []

    for(let i = 0; i < 8; i++) {
      for(let j = 0; j < 4; j++) {
        tiles.push(new Tile(i, j))
      }
    }

    return tiles
  }

  initStartingPieces() {
    for(let i = 0; i < 8; i++) {
      for(let j = 0; j < 4; j++) {
        const idx = i * 4 + j

        if(i < 3) {
          // Place white piece
          this.tiles[idx].addPiece(new Piece(true))
        } else if(i > 4) {
          // Place black piece
          this.tiles[idx].addPiece(new Piece(false))
        }
      }
    }
  }
}

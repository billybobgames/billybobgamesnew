class Tile {
  constructor(i, j) {
    this.i = i
    this.j = j

    const { x, y } = coordinatesFromIndeces(i, j)
    this.x = x
    this.y = y

    this.name = squareName(i*4+j)

    this.piece = null

    this.highlighted = false
    this.selected = false
    this.legalMover = false
    this.legalTarget = false
    this.lastJump = false
  }

  show() {
    const { piece, highlighted, selected, legalMover, legalTarget, lastJump } = this
    const { x, y } = this.coords

    let col = selected ? COLORS.selected : (highlighted ? COLORS.highlighted : COLORS.blackSquare)
    fill(col)
    noStroke()
    rect(x, y, TILE_SIZE, TILE_SIZE)

    if(legalMover & !selected) {
      noFill()
      stroke(COLORS.legalMover)
      strokeWeight(6)
      rect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6)
    } else if(legalTarget & !selected) {
      noFill()
      stroke(COLORS.legalTarget)
      strokeWeight(6)
      rect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6)
    } else if(lastJump & !selected) {
      noFill()
      stroke(COLORS.lastJump)
      strokeWeight(6)
      rect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6)
    }

    if(piece) {
      piece.show(x + TILE_SIZE / 2, y + TILE_SIZE / 2)
    }
  }

  get coords() {
    if(FLIPPED_BOARD) {
      const alternatingRow = (this.i%2 == 0) ? 1 : 0
      const x = width - (this.j*2 + alternatingRow + 1) * TILE_SIZE
      const y = (7 - this.i) * TILE_SIZE

      return { x, y }
    } else {
      const alternatingRow = (this.i%2 == 0) ? 1 : 0
      const x = (this.j*2 + alternatingRow) * TILE_SIZE
      const y = this.i * TILE_SIZE

      return { x, y }
    }
  }

  addPiece(p) {
    this.piece = p
  }

  removePiece() {
    this.piece = null
  }

  select() {
    this.selected = true
  }

  unselect() {
    this.selected = false
  }
}

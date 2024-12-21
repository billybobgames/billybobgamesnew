class EnginePlayer {
  constructor(b, side, strength = 500) {
    this.board = b
    this.engine = new Engine(b, side, strength)
    this.myTurn = false
    this.side = side
  }

  play() {}

  async getMoveSequence() {
    const s = this.engine.startLoop()
    return s
  }
}

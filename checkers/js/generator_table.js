class GeneratorTable extends TranspositionTable {
  constructor() {
    super()
    this.size = 100000n
  }

  update(hash, moves) {
    this.table[hash % this.size] = {
      moves, key: hash
    }
  }
}

class TranspositionTable {
  constructor() {
    this.size = 1000000n
    this.table = []
    this.table_soft = []
    this.soft_update_index = []
  }

  fetch(hash) {
    const entry = this.table[hash % this.size]
    if(entry) {
      if(entry.key == hash) {
        return entry
      }
    }

    return false
  }

  updateTable() {
    for(let i = 0; i <= this.soft_update_index.length; i++) {
      this.table[this.soft_update_index[i]] = this.table_soft[this.soft_update_index[i]]
    }

    this.soft_update_index = []
  }

  updateTableOld() {
    // this.table = [...this.table_soft]

    for(let i = this.table_soft.length - 1; i >= 0; i--) {
      this.table[i] = this.table_soft[i]
    }
  }

  update(hash, depth, score, bestMove) {
    this.table[hash % this.size] = {
      depth, score, bestMove, key: hash
    }
  }

  updateSoft(hash, depth, score, bestMove) {
    this.table_soft[hash % this.size] = {
      depth, score, bestMove, key: hash
    }

    this.soft_update_index.push(hash % this.size)
  }

  printPvLine(hash) {
    let pvs = []
    let key = hash

    for(let i = 0; i < 12; i++) {
      const nextPv = this.fetch(key)
      if(nextPv) {
        pvs.push(nextPv)
        key = nextPv.bestMove.hash
      } else {
        break
      }
    }

    let pvline = ''
    for(let p of pvs) {
      pvline += Move.toString(p.bestMove) + ' - '
    }

    return pvline.substring(0, pvline.length - 3)
  }

}

class Zobrist {
  constructor() {
    this.initializeKeys()
  }

  hashNode(node, side) {
    let key = 0n

    let white = node.W
    while(white) {
      const lsb = BINT.lsb(white)
      const current = addHighBitAtIdx(0n, lsb)

      const randNum = this.whiteKeys[lsb]
      key ^= randNum

      white ^= current
    }

    let black = node.B
    while(black) {
      const lsb = BINT.lsb(black)
      const current = addHighBitAtIdx(0n, lsb)

      const randNum = this.blackKeys[lsb]
      key ^= randNum

      black ^= current
    }

    let kings = node.K
    while(kings) {
      const lsb = BINT.lsb(kings)
      const current = addHighBitAtIdx(0n, lsb)

      const randNum = this.kingKeys[lsb]
      key ^= randNum

      kings ^= current
    }

    if(side) {
      key ^= this.sideKey
    }

    return key
  }

  hashJump(hash, jump, sideSwitched = 0n) {
    let key = hash

    if(sideSwitched) {
      key ^= this.sideKey
    }

    const from = Jump.from(jump)
    const target = Jump.target(jump)
    const capture = Jump.capture(jump)
    const prom = Jump.promotion(jump)
    const kingMoved = Jump.king(jump)

    if(Jump.side(jump)) {
      key ^= this.whiteKeys[from]
      key ^= this.whiteKeys[target]

      if(capture) {
        key ^= this.blackKeys[capture]
      }
    } else {
      key ^= this.blackKeys[from]
      key ^= this.blackKeys[target]

      if(capture) {
        key ^= this.whiteKeys[capture]
      }
    }

    if(capture && Jump.king_capture(jump)) {
      key ^= this.kingKeys[capture]
    }


    if(prom) {
      key ^= this.kingKeys[prom]
    } else if(kingMoved) {
      key ^= this.kingKeys[from]
      key ^= this.kingKeys[target]
    }

    return key
  }

  initializeKeys() {
    const whites = [], blacks = [], kings = []

    for(let i = 0; i < 37; i++) {
      whites.push(this.random())
      blacks.push(this.random())
      kings.push(this.random())
    }

    const sideKey = this.random()

    this.whiteKeys = whites
    this.blackKeys = blacks
    this.kingKeys = kings
    this.sideKey = sideKey
  }

  random() {
    return this.random32()
  }

  random32() {
    let b = BigInt.asUintN(32, 0n)
    for(let i = 0; i < 32; i++) {
      b <<= 1n
      if(Math.random() > 0.5) {
        b += 1n
      }
    }

    return b
  }

  random64() {
    let b = BigInt.asUintN(64, 0n)
    for(let i = 0; i < 64; i++) {
      b <<= 1n
      if(Math.random() > 0.5) {
        b += 1n
      }
    }

    return b
  }
}

const zobrist = new Zobrist()

const Jump = {
  apply: (node, j) => {
    const from = Jump.from(j)
    const target = Jump.target(j)
    const capture = Jump.capture(j)
    const prom = Jump.promotion(j)
    const kingMoved = Jump.king(j)
    const kingCap = Jump.king_capture(j)

    let nK = prom ? (node.K | 1n << prom) : (kingMoved ? (node.K ^ (1n << from) ^ (1n << target)) : node.K)
    nK = kingCap ? (nK ^ (1n << capture)) : nK //removeBitAtIdx(nK, capture) //& ALL_SQUARES

    if(Jump.side(j)) {
      // White Jumps
      return {
        W: (node.W ^ (1n << from) ^ (1n << target)), // removeBitAtIdx(addHighBitAtIdx(node.W, target), from),
        B: (node.B ^ (1n << capture)) & ALL_SQUARES,//removeBitAtIdx(node.B, capture),
        K: nK & ALL_SQUARES,
      }
    } else {
      // Black Jumps
      return {
        W: (node.W ^ (1n << capture)) & ALL_SQUARES, //removeBitAtIdx(node.W, capture),
        B: (node.B ^ (1n << from) ^ (1n << target)), //removeBitAtIdx(addHighBitAtIdx(node.B, target), from),
        K: nK & ALL_SQUARES,
      }
    }
  },
  create: (side, from, to, promotion = 0n, capture = 0n, king_move = 0n, king_cap = 0n) => {
    return (side << 26n | from | to << 6n | promotion << 12n | capture << 18n | king_move << 24n | king_cap << 25n)
  },
  from: (j) => {
    return j & 0x3Fn
  },
  target: (j) => {
    return (j >> 6n) & 0x3Fn
  },
  promotion: (j) => {
    return (j >> 12n) & 0x3Fn
  },

  capture: (j) => {
    return (j >> 18n) & 0x3Fn
  },
  side: (j) => {
    return (j >> 26n) & 0x1n
  },
  king: (j) => {
    return (j >> 24n) & 0x1n
  },
  king_capture: (j) => {
    return (j >> 25n) & 0x1n
  },
  readable: (j) => {
    return {
      short: Jump.toString(j),
      side: Jump.side(j) ? 'white' : 'black',
      from: Jump.from(j),
      // fromSq: squareName(bitToIndex(Number(Jump.from(j)))),
      target: Jump.target(j),
      // toSq: squareName(bitToIndex(Number(Jump.target(j)))),
      promotion: Jump.promotion(j),
      // promotionSq: squareName(bitToIndex(Number(Jump.promotion(j)))),
      capture: Jump.capture(j),
      // captureSq: squareName(bitToIndex(Number(Jump.capture(j)))),
      king: Jump.king(j) ? true: false,
      king_capture: Jump.king_capture(j) ? true : false,
      bin: j.toString(2),
      hex: j.toString(16),
    }
  },
  toString: (j) => {
    let str = ''
    str += squareName(bitToIndex(Number(Jump.from(j))))
    if(Jump.capture(j)) {
      str += 'x'
    }
    str += squareName(bitToIndex(Number(Jump.target(j))))
    if(Jump.promotion(j)) {
      str += '+'
    }
    return str
  }
}


const Move = {
  toString: (m) => {
    let str = ''
    let firstJump = m.jumps[0]
    str += Jump.toString(firstJump) //squareName(bitToIndex(Number(Jump.from(firstJump))))
    for(let i = 1; i < m.jumps.length; i++) {
      let j = m.jumps[i]
      if(Jump.capture(j)) {
        str += 'x'
      }
      str += squareName(bitToIndex(Number(Jump.target(j))))
      if(Jump.promotion(j)) {
        str += '+'
      }
    }

    return str
  }
}

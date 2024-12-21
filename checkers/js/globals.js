const BORDER = 0b111_1111_1111_1111_1111_1111_1111_1_0000_0000_1_0000_0000_1_0000_0000_1_0000_0000_1n

const strongCenter = 0b00000000_0_00000111_0_11100000_0_00000000_0n
const otherCenter = 0b00000000_0_11100111_0_11100111_0_00000000_0n
const spreadCenter = 1999281600n
const blackDefense = 0b11100000_0_00000000_0_00000000_0_00000000_0n
const whiteDefense = 0b00000000_0_00000000_0_00000000_0_00000111_0n
const whiteWeakCorner = 0b00000000_0_00000000_0_00000000_0_00010001_0n
const blackWeakCorner = 0b10001000_0_00000000_0_00000000_0_00000000_0n
const whiteAdvanced = 0b00000111_0_11100000_0_00000000_0_00000000_0n
const blackAdvanced = 0b00000000_0_00000000_0_00000111_0_11100000_0n

const RANK_1 = 0b11110000_0_00000000_0_00000000_0_00000000_0n
const RANK_8 = 0b00000000_0_00000000_0_00000000_0_00001111_0n

const FILE_A = 0b00010000_0_00010000_0_00010000_0_00010000_0n
const FILE_H = 0b00001000_0_00001000_0_00001000_0_00001000_0n

const borders = FILE_A | FILE_H | RANK_1 | RANK_8
// const notBorders = negate(borders) & ALL_SQUARES


const getTrappedKings = (mine, others, kings) => {
  if(!kings) return 0n

  let my_kings = mine & kings
  let other_kings = others & kings
  // const occ = (mine | others)
  let trapped = 0n

  if(my_kings && other_kings) {
    let kings1 = my_kings & RANK_1
    let kings8 = my_kings & RANK_8
    let kingsa = my_kings & FILE_A
    let kingsh = my_kings & FILE_H


    while(kings1) {
      const kingLSB = BINT.lsb(kings1)
      const k = addHighBitAtIdx(0n, kingLSB)


      if((k >> 9n) & other_kings) {
        trapped ^= k
      }

      kings1 ^= k
    }


    while(kings8) {
      const kingLSB = BINT.lsb(kings8)
      const k = addHighBitAtIdx(0n, kingLSB)

      if((k << 9n) & other_kings) {
        trapped ^= k
      }

      kings8 ^= k
    }


    while(kingsa) {
      const kingLSB = BINT.lsb(kingsa)
      const k = addHighBitAtIdx(0n, kingLSB)

      if((k << 1n) & other_kings) {
        trapped ^= k
      }

      kingsa ^= k
    }


    while(kingsh) {
      const kingLSB = BINT.lsb(kingsh)
      const k = addHighBitAtIdx(0n, kingLSB)

      if((k >> 1n) & other_kings) {
        trapped ^= k
      }

      kingsh ^= k
    }
  }

  return trapped
}




const checkDraw = (history) => {
  if(history.length <= 0) return false
  let repetitionCount = 0
  let count = 0
  const lastHash = history[history.length - 1].hash
  for(let i = history.length - 1; i >= 0; i--) {
    const m = history[i]

    if(Jump.capture(m.jumps[0]) || !Jump.king(m.jumps[0]) || m.jumps.length > 1) {
      break
    }

    if(m.hash == lastHash) {
      repetitionCount++
      if(repetitionCount > 2 && DRAW_BY_REPETITION) return true
    }
    count++
    if(count > 50 && DRAW_BY_50_MOVES) return true
  }
  return false
}

const checkWhiteWin = (node, sideToMove) => {
  return checkWhiteWinFast(node, sideToMove)

  // if(!node.B) return true
  // if(sideToMove) {
  //   return false //game.board.generator.getWhiteMoves(node).length > 0
  // } else {
  //   return game.board.generator.getBlackMoves(node).length <= 0
  // }
}


const checkBlackWin = (node, sideToMove) => {
  return checkBlackWinFast(node, sideToMove)

  // if(!node.W) return true
  // if(!sideToMove) {
  //   return false
  // } else {
  //   return game.board.generator.getWhiteMoves(node).length <= 0
  // }
}

const checkWhiteWinFast = (node, sideToMove) => {
  if(!node.B) return true
  if(sideToMove) {
    return false //game.board.generator.getWhiteMoves(node).length > 0
  } else {
    return 0n == (game.board.generator.getBlackSliders(node) | game.board.generator.getBlackJumpers(node))
  }
}


const checkBlackWinFast = (node, sideToMove) => {
  if(!node.W) return true
  if(!sideToMove) {
    return false
  } else {
    return 0n == (game.board.generator.getWhiteSliders(node) | game.board.generator.getWhiteJumpers(node))
  }
}






const removeBitAtIdx = (b, idx) => {
  if(b >> idx & 1n) return ( b ^ (1n << idx) )
  return b
}

const addHighBitAtIdx = (bitboard, idx) => {
  return ( bitboard | (1n << idx) )
}

const negate = (b) => {
  return BigInt.asUintN(64, ~b)
}

const getOccupied = (node) => {
  return (node.W | node.B | BORDER)
}

const getEmpty = (node) => {
  return negate(getOccupied(node))
}



const indexToBit = (idx = -1) => {
  const inc = Math.floor(idx / 8)
  const bit = idx + 1 + Math.floor((idx + inc) / 9)
  if(bit >= 36) {
    return -1
  }

  return bit
}

const bitToIndex = (bit = -1) => {
  if(bit % 9 == 0 || bit >= 36) {
    return -1
  }

  const idx = bit - Math.floor(bit / 9) - 1
  return idx
}

const squareName = (idx) => {
  if(idx < 0 || idx > 31) {
    // console.warn('square name: index out of bounds. ')
    return false
  }
  const files = 'abcdefgh'
  const ranks = '12345678'

  const file_idx = (Math.floor(idx / 4) % 2 == 0) ? (((idx % 8)) * 2 + 1) : (((idx % 8) - 4) * 2)
  const rank_idx = 8 - Math.floor(idx / 4) - 1

  return files[file_idx] + ranks[rank_idx]
}

const coordinatesFromIndeces = (i, j) => {
  const alternatingRow = (i%2 == 0) ? 1 : 0
  const x = (j*2 + alternatingRow) * TILE_SIZE
  const y = i * TILE_SIZE

  return {x, y}
}



const ALL_SQUARES = negate(BORDER)

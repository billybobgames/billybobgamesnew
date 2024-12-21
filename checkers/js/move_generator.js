class MoveGenerator {
  constructor(board) {
    this.board = board
    this.move_table = new GeneratorTable()
    this.capture_table = new GeneratorTable()

    this.updateState(0n)
  }

  getMoves(node = this.state, hash = this.hash, side = 1n) {
    const ttEntry = this.move_table.fetch(hash)
    if(ttEntry) {
      return ttEntry.moves
    }
    const moves = side ? this.getWhiteMoves(node, hash) : this.getBlackMoves(node, hash)
    this.move_table.update(hash, moves)
    return moves
  }

  getCaptureMoves(node = this.state, hash = this.hash, side = 1n) {
    const ttEntry = this.capture_table.fetch(hash)
    if(ttEntry) {
      return ttEntry.moves
    }
    const moves = side ? this.getWhiteCaptureMoves(node, ALL_SQUARES, hash) : this.getBlackCaptureMoves(node, ALL_SQUARES, hash)
    this.capture_table.update(hash, moves)
    return moves
  }



  getWhiteSliders(node = this.state) {
    const { W, K } = node

    let sliders = 0n
    const NOCC = getEmpty(node)

    sliders |= (NOCC >> 4n) & W
    sliders |= (NOCC >> 5n) & W

    const WK = W & K
    if(WK) {
      sliders |= (NOCC << 4n) & WK
      sliders |= (NOCC << 5n) & WK
    }

    return sliders
  }

  getWhiteSlides(node = this.state, MASK = ALL_SQUARES) {
    const { W, K } = node

    let slides = 0n
    const NOCC = getEmpty(node)
    const I = W & MASK

    slides |= (I << 4n) & NOCC
    slides |= (I << 5n) & NOCC

    const WK = I & K
    if(WK) {
      slides |= (WK >> 4n) & NOCC
      slides |= (WK >> 5n) & NOCC
    }

    return slides
  }

  getWhiteJumpers(node = this.state, MASK = ALL_SQUARES) {
    const { W, B, K } = node
    const NOCC = getEmpty(node)
    const I = W & MASK

    let jumpers = 0n

    jumpers |= (((NOCC >> 4n) & B) >> 4n) & I
    jumpers |= (((NOCC >> 5n) & B) >> 5n) & I

    const WK = I & K
    if(WK) {
      jumpers |= (((NOCC << 4n) & B) << 4n) & WK
      jumpers |= (((NOCC << 5n) & B) << 5n) & WK
    }

    return jumpers
  }

  getWhiteJumps(node = this.state, MASK = ALL_SQUARES) {
    const { W, B, K } = node
    const NOCC = getEmpty(node)
    const I = W & MASK

    let jumps = 0n

    jumps |= (((I << 4n) & B) << 4n) & NOCC
    jumps |= (((I << 5n) & B) << 5n) & NOCC

    const WK = I & K
    if(WK) {
      jumps |= (((WK >> 4n) & B) >> 4n) & NOCC
      jumps |= (((WK >> 5n) & B) >> 5n) & NOCC
    }

    return jumps
  }

  getWhiteSlidingMoves(node = this.state, hash) {
    const { W, B, K } = node

    const moves = []
    let sliders = this.getWhiteSliders(node)
    while(sliders) {
      const currentSliderLSB = BINT.lsb(sliders)
      const currentSlider = addHighBitAtIdx(0n, currentSliderLSB)
      let availableSlides = this.getWhiteSlides(node, currentSlider )
      let slideList = []

      while(availableSlides) {
        const slideLSB = BINT.lsb(availableSlides)
        const slide = addHighBitAtIdx(0n, slideLSB)

        const kingMove = (K >> currentSliderLSB) & 1n

        const promotion = ((slide & 0b111100000000000000000000000000000000n) && !(kingMove)) ? slideLSB : 0n

        const slideJump = Jump.create(1n, currentSliderLSB, slideLSB, promotion, 0n, kingMove, 0n)

        const nextNode = Jump.apply(node, slideJump)
        slideList.push({
          jumps: [slideJump],
          hash: zobrist.hashJump(hash, slideJump, 1n),
          // calculated_hash: zobrist.hashNode(nextNode, 0n),
          node: nextNode
        })

        availableSlides ^= slide
      }

      moves.push(...slideList)
      sliders ^= currentSlider
    }

    return moves
  }

  getWhiteCaptureMoves(node = this.state, MASK = ALL_SQUARES, hash) {
    const { W, B, K } = node

    let sequences = []
    let availableJumpers = this.getWhiteJumpers(node, MASK)

    while (availableJumpers) {
      let currentJumperLSB = BINT.lsb(availableJumpers)
      let currentJumper = addHighBitAtIdx(0n, currentJumperLSB)
      let availableJumps = this.getWhiteJumps(node, currentJumper)
      let jumperSequences = []

      while (availableJumps) {
        const jumpLSB = BINT.lsb(availableJumps)
        const jump = addHighBitAtIdx(0n, jumpLSB)
        const captureShift = (currentJumperLSB - jumpLSB) / 2n
        // const captureBit = addHighBitAtIdx(0n, jumpLSB + captureShift)

        const kingMove = (K >> currentJumperLSB) & 1n
        const kingCapture = (K >> (jumpLSB + captureShift)) & 1n

        const promotion = ((jump & 0b111100000000000000000000000000000000n) && !(kingMove)) ? jumpLSB : 0n

        const jumpNotation = Jump.create(1n, currentJumperLSB, jumpLSB, promotion, jumpLSB + captureShift, kingMove, kingCapture)
        // if(kingMove) console.log('its a king move')

        const nodeAfter = Jump.apply(node, jumpNotation)

        // const hashAfterTermination = zobrist.hashNode(nodeAfter, 0n)
        const calculatedHashAfterTermination = zobrist.hashJump(hash, jumpNotation, 1n)

        if(!promotion) {
          // Check if more captures can be made from that position
          const deepSequences = this.getWhiteCaptureMoves(nodeAfter, jump, zobrist.hashJump(hash, jumpNotation, 0n))//) zobrist.hashNode(nodeAfter, 1n)
          if(deepSequences.length > 0) {
            for(let s of deepSequences) {
              jumperSequences.push({
                jumps: [jumpNotation, ...s.jumps],
                hash: s.hash,
                node: s.node
              })
            }
          } else {
            jumperSequences.push({
              jumps: [jumpNotation],
              hash: calculatedHashAfterTermination,
              // calculated_hash: hashAfterTermination,
              node: nodeAfter
            })
          }
        } else {
          jumperSequences.push({
            jumps: [jumpNotation],
            hash: calculatedHashAfterTermination,
            // calculated_hash: hashAfterTermination,
            node: nodeAfter
          })
        }

        availableJumps ^= jump
      }

      sequences.push(...jumperSequences)

      availableJumpers ^= currentJumper
    }

    return sequences
  }

  getWhiteMoves(node = this.state, hash = this.hash) {
    const captureMoves = this.getWhiteCaptureMoves(node, ALL_SQUARES, hash)
    if(captureMoves.length > 0) {
      return captureMoves
    } else {
      return this.getWhiteSlidingMoves(node, hash)
    }
  }



  getBlackSliders(node = this.state) {
    const { B, K } = node

    let sliders = 0n
    const NOCC = getEmpty(node)

    sliders |= (NOCC << 4n) & B
    sliders |= (NOCC << 5n) & B

    const BK = B & K
    if(BK) {
      sliders |= (NOCC >> 4n) & BK
      sliders |= (NOCC >> 5n) & BK
    }

    return sliders
  }

  getBlackSlides(node = this.state, MASK = ALL_SQUARES) {
    const { B, K } = node

    let slides = 0n
    const NOCC = getEmpty(node)
    const I = B & MASK

    slides |= (I >> 4n) & NOCC
    slides |= (I >> 5n) & NOCC

    const BK = I & K
    if(BK) {
      slides |= (BK << 4n) & NOCC
      slides |= (BK << 5n) & NOCC
    }

    return slides
  }

  getBlackJumpers(node = this.state, MASK = ALL_SQUARES) {
    const { W, B, K } = node
    const NOCC = getEmpty(node)
    const I = B & MASK

    let jumpers = 0n

    jumpers |= (((NOCC << 4n) & W) << 4n) & I
    jumpers |= (((NOCC << 5n) & W) << 5n) & I

    const BK = I & K
    if(BK) {
      jumpers |= (((NOCC >> 4n) & W) >> 4n) & BK
      jumpers |= (((NOCC >> 5n) & W) >> 5n) & BK
    }

    return jumpers
  }

  getBlackJumps(node = this.state, MASK = ALL_SQUARES) {
    const { W, B, K } = node
    const NOCC = getEmpty(node)
    const I = B & MASK

    let jumps = 0n

    jumps |= (((I >> 4n) & W) >> 4n) & NOCC
    jumps |= (((I >> 5n) & W) >> 5n) & NOCC

    const BK = I & K
    if(BK) {
      jumps |= (((BK << 4n) & W) << 4n) & NOCC
      jumps |= (((BK << 5n) & W) << 5n) & NOCC
    }

    return jumps
  }

  getBlackSlidingMoves(node = this.state, hash) {
    const { W, B, K } = node

    const moves = []
    let sliders = this.getBlackSliders(node)
    while(sliders) {
      const currentSliderLSB = BINT.lsb(sliders)
      const currentSlider = addHighBitAtIdx(0n, currentSliderLSB)
      let availableSlides = this.getBlackSlides(node, currentSlider)
      let slideList = []

      while(availableSlides) {
        const slideLSB = BINT.lsb(availableSlides)
        const slide = addHighBitAtIdx(0n, slideLSB)

        const kingMove = (K >> currentSliderLSB) & 1n

        const promotion = ((slide & 0b11110n) && !(kingMove)) ? slideLSB : 0n

        const slideJump = Jump.create(0n, currentSliderLSB, slideLSB, promotion, 0n, kingMove)

        const nextNode = Jump.apply(node, slideJump)
        slideList.push({
          jumps: [slideJump],
          hash: zobrist.hashJump(hash, slideJump, 1n),
          // calculated_hash: zobrist.hashNode(nextNode, 1n),
          node: nextNode
        })

        availableSlides ^= slide
      }

      moves.push(...slideList)
      sliders ^= currentSlider
    }

    return moves
  }

  getBlackCaptureMoves(node = this.state, MASK = ALL_SQUARES, hash) {
    const { W, B, K } = node

    let sequences = []
    let availableJumpers = this.getBlackJumpers(node, MASK)

    while (availableJumpers) {
      let currentJumperLSB = BINT.lsb(availableJumpers)
      let currentJumper = addHighBitAtIdx(0n, currentJumperLSB)
      let availableJumps = this.getBlackJumps(node, currentJumper)
      let jumperSequences = []

      while (availableJumps) {
        const jumpLSB = BINT.lsb(availableJumps)
        const jump = addHighBitAtIdx(0n, jumpLSB)
        const captureShift = (currentJumperLSB - jumpLSB) / 2n
        // const captureBit = addHighBitAtIdx(0n, jumpLSB + captureShift)

        const kingMove = (K >> currentJumperLSB) & 1n
        const kingCapture = (K >> (jumpLSB + captureShift)) & 1n

        const promotion = ((jump & 0b11110n) && !(kingMove)) ? jumpLSB : 0n

        const jumpNotation = Jump.create(0n, currentJumperLSB, jumpLSB, promotion, jumpLSB + captureShift, kingMove, kingCapture)
        // if(kingMove) console.log('its a king move')

        const nodeAfter = Jump.apply(node, jumpNotation)

        // const hashAfterTermination = zobrist.hashNode(nodeAfter, 1n)
        const calculatedHashAfterTermination = zobrist.hashJump(hash, jumpNotation, 1n)

        if(!promotion) {
          // Check if more captures can be made from that position
          const deepSequences = this.getBlackCaptureMoves(nodeAfter, jump, zobrist.hashJump(hash, jumpNotation, 0n))//)zobrist.hashNode(nodeAfter, 0n)
          if(deepSequences.length > 0) {
            for(let s of deepSequences) {
              jumperSequences.push({
                jumps: [jumpNotation, ...s.jumps],
                hash: s.hash,
                node: s.node
              })
            }
          } else {
            jumperSequences.push({
              jumps: [jumpNotation],
              hash: calculatedHashAfterTermination,
              // calculated_hash: hashAfterTermination,
              node: nodeAfter
            })
          }
        } else {
          jumperSequences.push({
            jumps: [jumpNotation],
            hash: calculatedHashAfterTermination,
            // calculated_hash: hashAfterTermination,
            node: nodeAfter
          })
        }

        availableJumps ^= jump
      }

      sequences.push(...jumperSequences)

      availableJumpers ^= currentJumper
    }

    return sequences
  }

  getBlackMoves(node = this.state, hash = this.hash) {
    const captureMoves = this.getBlackCaptureMoves(node, ALL_SQUARES, hash)
    if(captureMoves.length > 0) {
      return captureMoves
    } else {
      return this.getBlackSlidingMoves(node, hash)
    }
  }



  testHashing(depth = 3, node = this.state, hash = this.hash, side = 0n) {
    if(depth <= 0) {
      return
    }

    let moves = []

    if(side) {
       moves = this.getWhiteMoves(node, hash)
    } else {
      moves = this.getBlackMoves(node, hash)
    }

    if(moves.length <= 0) return

    const m = random(moves)
    b.applyMove(m)
    const nodeHashed = zobrist.hashNode(m.node, side^1n)
    const h = m.hash

    if(depth == 1 || nodeHashed != h) {
      console.log(depth, m, nodeHashed, h)
    }
    this.testHashing(depth - 1, m.node, m.hash, side^1n)
    return m
  }

  divide(depth = 1, node = this.state, side = 0n) {
    let count = 0
    if(side) {
      const moves = this.getWhiteMoves(node)
      for(let m of moves) {
        let sub = this.perft(depth - 1, m.node, 0n)
        console.log(Move.toString(m) + ': ' + sub)
        count += sub
      }
    } else {
      const moves = this.getBlackMoves(node)
      for(let m of moves) {
        let sub = this.perft(depth - 1, m.node, 1n)
        console.log(Move.toString(m) + ': ' + sub)
        count += sub
      }
    }

    console.log('Total: ' + count)

    return count
  }

  perft(depth = 1, node = this.state, side = 0n) {
    let count = 0
    if(side) {
      const moves = this.getWhiteMoves(node)
      if(depth == 1) {
        return moves.length
      }
      for(let m of moves) {
        count += this.perft(depth - 1, m.node, 0n)
      }
    } else {
      const moves = this.getBlackMoves(node)
      if(depth == 1) {
        return moves.length
      }
      for(let m of moves) {
        count += this.perft(depth - 1, m.node, 1n)
      }
    }

    return count
  }

  performanceTest() {
    const test_arr = []
    for(let i = 0; i < 1000000; i++) {
      test_arr.push(zobrist.random32())
    }

    let test_copy = []

    let start = Date.now()
    test_copy = [...test_arr]
    // for(let i = 0; i < 1000000; i++) {
    //   test_copy[i] = test_arr[i]
    // }
    let timeSpent = Date.now() - start
    return timeSpent
  }

  updateState(sideToMove) {
    let white = 0n
    for(let tile of this.board.tiles) {
      if(tile.piece) {
        if(tile.piece.white) {
          const idx = tile.i * 4 + tile.j
          const bit = indexToBit(idx)

          white = addHighBitAtIdx(white, BigInt(bit))
        }
      }
    }

    let black = 0n
    for(let tile of this.board.tiles) {
      if(tile.piece) {
        if(!tile.piece.white) {
          const idx = tile.i * 4 + tile.j
          const bit = indexToBit(idx)

          black = addHighBitAtIdx(black, BigInt(bit))
        }
      }
    }

    let kings = 0n
    for(let tile of this.board.tiles) {
      if(tile.piece) {
        if(tile.piece.promoted) {
          const idx = tile.i * 4 + tile.j
          const bit = indexToBit(idx)

          kings = addHighBitAtIdx(kings, BigInt(bit))
        }
      }
    }

    this.state = {
      W: white,
      B: black,
      K: kings
    }

    this.hash = zobrist.hashNode(this.state, sideToMove)


    return {hash: this.hash, state: this.state}
  }
}

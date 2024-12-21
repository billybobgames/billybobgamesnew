class Engine {
  constructor(board, side = 1n, strength) {
    this.board = board
    this.generator = new MoveGenerator(board)
    this.controller = new SearchController(side, strength)
    this.tt = new TranspositionTable()

    this.side = side

    this.currentEvaluation = null

    this.intLooperFinished = false
    this.looperFinishedListeners = []

    this.animationIDs = []

    this.looperPromise = null

    this.scores = {
      win: 1_000_000
    }
  }

  get looperFinished() {
    return this.intLooperFinished
  }

  set looperFinished(val) {
    this.intLooperFinished = val
    for(let i = 0; i < this.looperFinishedListeners.length; i++) {
      this.looperFinishedListeners[i]()
    }

    this.looperFinishedListeners = []
  }

  addLooperEventListener(f) {
    this.looperFinishedListeners.push(f)
  }

  async startLoop() {
    this.controller.start()

    this.looperFinished = false

    this.bestMove = null
    this.globalBestMove = null

    this.bestScore = null
    this.globalBestScore = null

    const { state, hash } = this.generator.updateState(this.side)

    const looperPromise = new Promise((resolve, reject) => {
      function resolver() {
        resolve(this.bestResult)
      }
      this.addLooperEventListener(resolver.bind(this))
    })

    this.looper()

    return looperPromise
  }

  async looper() {
    if(this.looperFinished) return

    this.controller.fh = 0
    this.controller.fhf = 0

    this.currentEvaluation = this.search(this.generator.state, this.generator.hash, this.controller.depth, -Infinity, +Infinity, this.side, this.board.history)

    this.currentEvaluation.then((score) => {
      if(!this.looperFinished) {
        this.controller.check()

        if(!this.controller.stop) {

          if(!this.controller.stopped_during_search) {
            this.globalBestMove = this.bestMove
            this.globalBestScore = this.bestScore
          }


          if(!this.controller.stopped_during_search_prev || this.controller.depth >= 2) {
            this.tt.updateTable()
          }

          this.controller.depth++

          const result = {
            bestMove: this.globalBestMove,
            normalizedScore: this.side ? this.globalBestScore / 1000 : -this.globalBestScore / 1000,
            line: this.tt.printPvLine(this.generator.hash),
            nodes: this.controller.nodes,
            score: this.globalBestScore,
            depth: this.controller.depth,
            time: this.controller.time_spent,
            ordering: this.controller.fhf / this.controller.fh,
            mate_distance: this.controller.distance_to_mate
          }

          this.bestResult = result
          this.controller.outputResults(result, '#output')


          window.requestAnimationFrame(this.looper.bind(this))
        } else {
          if(!this.controller.stopped_during_search) {
            this.globalBestMove = this.bestMove
            this.globalBestScore = this.bestScore

            const result = {
              bestMove: this.globalBestMove,
              normalizedScore: this.side ? this.globalBestScore / 1000 : -this.globalBestScore / 1000,
              line: this.tt.printPvLine(this.generator.hash),
              nodes: this.controller.nodes,
              score: this.globalBestScore,
              depth: this.controller.depth,
              time: this.controller.time_spent,
              ordering: this.controller.fhf / this.controller.fh,
              mate_distance: this.controller.distance_to_mate
            }

            this.controller.outputResults(result, '#output')

            this.bestResult = result
          }

          this.looperFinished = true
        }
      }
    })
  }

  async search(node, hash, depth, alpha, beta, side, history = []) {

    if(this.controller.nodes % 4096 == 0) {
      this.controller.check()
    }
    if(this.controller.stop) {
      this.controller.stopped_during_search = true
      return 0 // ?
    }

    this.controller.nodes++

    const isDraw = checkDraw(history)
    if(isDraw) {
      return 0
    } else if(checkWhiteWin(node, side)) {
      return side ? this.scores.win : -this.scores.win
      // return this.getWinScore(depth, side)
    } else if(checkBlackWin(node, side)) {
      return side ? -this.scores.win : this.scores.win
      // return - this.getWinScore(depth, side)
    }

    if(depth <= 0) {
      return await this.quescience(node, hash, depth, alpha, beta, side, history)
    }

    const ttEntry = this.tt.fetch(hash)
    let pvhash = null

    if(ttEntry) {
      if(ttEntry.depth >= depth) {
        if(checkDraw([...history, ttEntry.bestMove])) {

        } else {
          if(depth == this.controller.depth) {
            this.bestMove = ttEntry.bestMove
            this.bestScore = ttEntry.score
          }
          return ttEntry.score
        }
      } else {
        pvhash = ttEntry.bestMove.hash
      }
    }

    const moves = this.generator.getMoves(node, hash, side)

    // Force Engine to instantly play if only one move is available
    if(depth == this.controller.depth) {
      if(moves.length == 1) {
        this.bestMove = moves[0]
        this.bestScore = this.bestScore // ?
        this.controller.stop = true
        return this.bestScore
      }
    }

    // Find the principal variation
    if(pvhash) {
      for(let i = 0; i < moves.length; i++) {
        if(moves[i].hash == pvhash) {
          moves[0] = moves.splice(i, 1, moves[0])[0]
          break
        }
      }
    }


    let value = -Infinity
    let bestMove = null

    for(let i = 0; i < moves.length; i++) {
      let m = null
      if(i >= 1) {
        m = this.pickNextMove(i, moves)
      } else {
        m = moves[i]
      }

      const score = - await this.search(m.node, m.hash, depth - 1, -beta, -alpha, side^1n, [...history, m])

      if(this.controller.stop) {
        return 0
      }

      if(score > value) {
        value = score
        bestMove = m
      }

      alpha = Math.max(alpha, value)

      if(alpha >= beta) {
        // if(i == 0) {
        //   this.controller.fhf++
        // }
        // this.controller.fh++
        break
      }
    }

    if(depth == this.controller.depth) {
      this.bestMove = bestMove
      this.bestScore = value
    }

    this.tt.updateSoft(hash, depth, value, bestMove)

    return value
  }

  async quescience(node, hash, depth, alpha, beta, side, history = []) {

    if(this.controller.nodes % 4096 == 0) {
      this.controller.check()
    }
    if(this.controller.stop) {
      this.controller.stopped_during_search = true
      return 0
    }
    // SHOULD I KEEP IT?

    this.controller.nodes++

    const isDraw = checkDraw(history)
    if(isDraw) {
      return 0
    } else if(checkWhiteWin(node, side)) {
      return side ? this.scores.win : -this.scores.win
      // return this.getWinScore(depth, side)
    } else if(checkBlackWin(node, side)) {
      return side ? -this.scores.win : this.scores.win
      // return - this.getWinScore(depth, side)
    }

    const moves = this.generator.getCaptureMoves(node, hash, side)

    if(moves.length <= 0) {
      const score = await this.evaluation(node)
      return side ? score : -score
    }

    moves.sort((a, b) => b.jumps.length - a.jumps.length)

    let value = -Infinity
    let bestMove = null

    for(let i = 0; i < moves.length; i++) {
      const m = moves[i]
      const score = - await this.quescience(m.node, m.hash, depth - 1, -beta, -alpha, side^1n, [...history, m])
      if(this.controller.stop) {
        return 0
      }

      if(score > value) {
        value = score
        bestMove = m
      }
      alpha = Math.max(alpha, value)

      if(alpha >= beta) {
        // if(i == 0) {
        //   this.controller.fhf++
        // }
        // this.controller.fh++
        break
      }
    }

    return value
  }

  async evaluation(node) {
    const { W, B, K } = node

    const NOT_KING = negate(K)

    const WK = W & K
    const BK = B & K
    const WNK = W & NOT_KING
    const BNK = B & NOT_KING

    const material = bitCount(W) - bitCount(B)
    const materialKings = bitCount(WK) - bitCount(BK)
    const moves = bitCount(this.generator.getWhiteSlides(node)) - bitCount(this.generator.getBlackSlides(node))
    const centerBonus = bitCount(strongCenter & W) - bitCount(strongCenter & B)
    const kingCenterBonus = bitCount(spreadCenter & WK) - bitCount(spreadCenter & BK)
    const defenseBonus = bitCount(whiteDefense & WNK) - bitCount(blackDefense & BNK)
    const weakCornerBiasHome = bitCount(whiteWeakCorner & WNK) - bitCount(blackWeakCorner & BNK)
    const weakCornerBiasAttack = bitCount(blackWeakCorner & W) - bitCount(whiteWeakCorner & B)
    const advancedPawnsBias = bitCount(whiteAdvanced & WNK) - bitCount(blackAdvanced & BNK)
    const trappedKings = bitCount(getTrappedKings(W, B, K)) - bitCount(getTrappedKings(B, W, K))

    const sum = 1000 * material
              + 410 * materialKings
              + 10 * moves
              + 30 * centerBonus
              + 20 * kingCenterBonus
              + 40 * defenseBonus
              + 10 * weakCornerBiasHome
              + 10 * weakCornerBiasAttack
              + 20 * advancedPawnsBias
              - 300 * trappedKings

    return sum
  }
  
  getWinScore(depth, side) {
    const search_depth = this.controller.depth - depth
    return side ? (this.scores.win - search_depth) : - (this.scores.win - search_depth)
  }

  pickNextMove(index, moves) {
    const currentEntry = this.tt.fetch(moves[index].hash)

    if(currentEntry) {
      for(let j = index + 1; j < moves.length; j++) {
        const jEntry = this.tt.fetch(moves[j].hash)

        if(jEntry) {
          if(jEntry.score > currentEntry.score) {
            moves[index] = moves.splice(j, 1, moves[index])[0]
            break
          }
        }
      }
    }

    return moves[index]
  }
}

class SearchController {
  constructor(side, strength = 2) {
    this.max_time = Strength.time[strength]
    this.max_depth = 32 // Strength.depth[strength]
    this.stopped_during_search = false

    this.side = side
  }

  start() {
    this.start_time = Date.now()
    this.stop = false
    this.depth = 1
    this.nodes = 0

    this.fh = 0
    this.fhf = 0

    this.stopped_during_search_prev = this.stopped_during_search
    this.stopped_during_search = false

    this.distance_to_mate = -1
    this.best_mate_value = 0
  }

  check() {
    this.time_spent = Date.now() - this.start_time
    if(this.time_spent >= this.max_time + this.depth * 8 || this.depth >= this.max_depth) {
      this.stop = true
    }

    return this.stop
  }

  parseResults(res) {
    let str = ''
    const formattedScore = scoreFormat(res.normalizedScore)
    if(res.depth.toString().length <= 1) {
      str += '\u00A0'
    }
    str += `<${res.depth}> `
    str += `(${formattedScore}) `
    str += `${res.line}`
    return str
  }

  outputResults(res, divId) {
    document.querySelector(divId).innerHTML = this.parseResults(res)
  }
}

const scoreFormat = (s) => {
  if(Math.abs(s) > 900) {
    return (s > 0 ? '+∞' : '-∞')
  }

  let str = ``
  str += s.toFixed(2)
  if(s >= 0) {
    str = '+' + str
  }
  // if(s>=0) {
  //   str += '+'
  // }
  // str += s
  // str = str.substr(0, 5)
  // if(str.length <= 2) {
  //   str += '.'
  // }
  //
  // if(Math.abs(s) < 10) {
  //   while(str.length < 5) {
  //     str += '0'
  //   }
  // }

  return str

}

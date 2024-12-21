class UIHandler {
  constructor() {
    this.elements = {}

    this.getElementsOnStart()
    this.updateOnStart()
    this.bindEvents()
  }

  getElementsOnStart() {
    this.elements.toggle_white = this.sel('#checkbox-white')
    this.elements.toggle_black = this.sel('#checkbox-black')

    this.elements.strength_white = this.sel('#strength-white')
    this.elements.strength_black = this.sel('#strength-black')

    this.elements.restart_button = this.sel('#button_restart')

    this.elements.toggle_white_starts = this.sel('#toggle-white_starts')
    this.elements.toggle_draw_reps = this.sel('#toggle-draw_reps')
    this.elements.toggle_draw_moves = this.sel('#toggle-draw_moves')

    this.elements.selector_white = this.sel('#select_player-white')
    this.elements.selector_black = this.sel('#select_player-black')

    this.elements.toggle_flip_board = this.sel('#toggle-flipboard')

  }

  updateOnStart() {
    // PLAYER SETTINGS
    this.elements.toggle_white.checked = GAME_OPTIONS.playerWhiteEngine
    this.elements.toggle_black.checked = GAME_OPTIONS.playerBlackEngine

    if(!this.elements.toggle_white.checked) {
      this.elements.strength_white.readOnly = true
    } else {
      this.elements.strength_white.readOnly = false
    }

    if(!this.elements.toggle_black.checked) {
      this.elements.strength_black.readOnly = true
    } else {
      this.elements.strength_black.readOnly = false
    }

    this.elements.strength_white.value = GAME_OPTIONS.playerWhiteStrength
    this.elements.strength_black.value = GAME_OPTIONS.playerBlackStrength

    // GAME RULES
    this.elements.toggle_white_starts.checked = GAME_OPTIONS.whiteBegins
    this.elements.toggle_draw_reps.checked = DRAW_BY_REPETITION
    this.elements.toggle_draw_moves.checked = DRAW_BY_50_MOVES

    this.elements.toggle_flip_board.checked = FLIPPED_BOARD
  }

  bindEvents() {
    // PLAYER SETTINGS
    this.listen(this.elements.toggle_white, 'change', (e) => {
      GAME_OPTIONS.playerWhiteEngine = this.elements.toggle_white.checked

      if(!this.elements.toggle_white.checked) {
        this.elements.strength_white.readOnly = true
      } else {
        this.elements.strength_white.readOnly = false
      }
    })

    this.listen(this.elements.toggle_black, 'change', (e) => {
      GAME_OPTIONS.playerBlackEngine = this.elements.toggle_black.checked

      if(!this.elements.toggle_black.checked) {
        this.elements.strength_black.readOnly = true
      } else {
        this.elements.strength_black.readOnly = false
      }
    })

    this.listen(this.elements.strength_white, 'change', (e) => {
      // Check if input is legal
      if(this.elements.strength_white.value < 1) {
        this.elements.strength_white.value = 1
      } else if(this.elements.strength_white.value > 5) {
        this.elements.strength_white.value = 5
      }

      GAME_OPTIONS.playerWhiteStrength = this.elements.strength_white.value
    })

    this.listen(this.elements.strength_black, 'change', (e) => {
      // Check if input is legal
      if(this.elements.strength_black.value < 1) {
        this.elements.strength_black.value = 1
      } else if(this.elements.strength_black.value > 5) {
        this.elements.strength_black.value = 5
      }

      GAME_OPTIONS.playerBlackStrength = this.elements.strength_black.value
    })

    this.listen(this.elements.restart_button, 'click', (e) => {
      call_after_dom_update(() => {
        game.restart()
      })
    })


    // GAME RULES
    this.listen(this.elements.toggle_white_starts, 'change', (e) => {
      GAME_OPTIONS.whiteBegins = this.elements.toggle_white_starts.checked
    })

    this.listen(this.elements.toggle_draw_reps, 'change', (e) => {
      DRAW_BY_REPETITION = this.elements.toggle_draw_reps.checked
    })

    this.listen(this.elements.toggle_draw_moves, 'change', (e) => {
      DRAW_BY_50_MOVES = this.elements.toggle_draw_moves.checked
    })

    // FLIPPED BOARD
    this.listen(this.elements.toggle_flip_board, 'change', (e) => {
      FLIPPED_BOARD = this.elements.toggle_flip_board.checked
    })
  }

  sel(s) {
    return document.querySelector(s)
  }

  listen(el, action, cb) {
    el.addEventListener(action, cb)
  }

  highlightPlayer(side) {
    if(side) {
      this.elements.selector_white.setAttribute('data-highlight', 'true')
      this.elements.selector_black.setAttribute('data-highlight', 'false')
    } else {
      this.elements.selector_white.setAttribute('data-highlight', 'false')
      this.elements.selector_black.setAttribute('data-highlight', 'true')
    }
  }
}

const ui = new UIHandler()

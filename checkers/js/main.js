let game, mg, b, e


const Strength = {
  time: [0, 100, 250, 1000, 2500, 8000],
  depth: [1, 3, 5, 9, 13, 32],
}

const GAME_OPTIONS = {
  playerBlackEngine: false,
  playerWhiteEngine: true,
  playerBlackStrength: 2,
  playerWhiteStrength: 2,
  whiteBegins: false,
}

let FLIPPED_BOARD = false

const SIZE = 600
const TILE_SIZE = SIZE / 8

let DRAW_BY_REPETITION = true
let DRAW_BY_50_MOVES = true

let COLORS = {}

function setup() {
  const can = createCanvas(SIZE, SIZE)
  can.parent('board')

  COLORS = {
    white: color(255),
    black: color(0),
    promoted: color('red'),
    whiteSquare: color('#efdab6'),
    blackSquare: color('#b79559'),
    highlighted: color('#9e742d'),
    highlightedStrong: color('#6c9ccc'),
    selected: color('#edab3b'),
    legalMover: color('#edab3b'),
    legalTarget:  color('#cc5745'),
    lastJump: color('#2083b5')
  }

  game = new Game()
  b = game.board
  mg = new MoveGenerator(game.board)
  e = new Engine(game.board)
  console.log(game)


  // bindEvents()
  textFont('Rockwell')
}

function draw() {
  background(COLORS.whiteSquare)

  game.run()
}

async function mouseClicked() {
  if(mouseOverCanvas()) {
    const { board } = game
    const clickedTile = board.getTileAtCoordinates(mouseX, mouseY)
    console.log(clickedTile);
    game.arena.clickedTile(clickedTile)
  }
}


function bindEvents() {
  document.querySelector('#test').addEventListener('click', (ev) => {
    game.arena.stopped=true
  })
}

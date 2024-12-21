const mouseOverCanvas = () => {
  return (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
}

const indecesFromCoordinates = (x, y) => {
  if(FLIPPED_BOARD) {
    const twidth = width / 8
    const i =  floor(y / twidth)
    const j = floor(x / twidth + i%2 - 1) / 2

    return { i: 7 - i, j: 3 - j }
  } else {
    const twidth = width / 8
    const i =  floor(y / twidth)
    const j = floor(x / twidth + i%2 - 1) / 2

    return { i, j }
  }

}

const call_after_dom_update = (cb) => {
  const intermediate = () => window.requestAnimationFrame(cb);
  window.requestAnimationFrame(intermediate);
}

function MakeQueryablePromise(promise) {
    // Don't create a wrapper for promises that can already be queried.
    if (promise.isResolved) return promise;

    let isResolved = false;
    let isRejected = false;

    // Observe the promise, saving the fulfillment in a closure scope.
    let result = promise.then(
       function(v) { isResolved = true; return v; },
       function(e) { isRejected = true; throw e; });
    result.isFulfilled = function() { return isResolved || isRejected; };
    result.isResolved = function() { return isResolved; }
    result.isRejected = function() { return isRejected; }
    return result;
}



class BINTHelper {
  constructor() {
    this.deBruijn = [0, 48, -1, -1, 31, -1, 15, 51, -1, 63, 5, -1, -1, -1, 19, -1, 23, 28, -1, -1, -1, 40, 36, 46, -1, 13, -1, -1, -1, 34, -1, 58, -1, 60, 2, 43, 55, -1, -1, -1, 50, 62, 4, -1, 18, 27, -1, 39, 45, -1, -1, 33, 57, -1, 1, 54, -1, 49, -1, 17, -1, -1, 32, -1, 53, -1, 16, -1, -1, 52, -1, -1, -1, 64, 6, 7, 8, -1, 9, -1, -1, -1, 20, 10, -1, -1, 24, -1, 29, -1, -1, 21, -1, 11, -1, -1, 41, -1, 25, 37, -1, 47, -1, 30, 14, -1, -1, -1, -1, 22, -1, -1, 35, 12, -1, -1, -1, 59, 42, -1, -1, 61, 3, 26, 38, 44, -1, 56];

    this.multiplicator = BigInt("0x6c04f118e9966f6b");

    this.b1 = BigInt(1),
    this.b2 = BigInt(2),
    this.b4 = BigInt(4),
    this.b8 = BigInt(8),
    this.b16 = BigInt(16),
    this.b32 = BigInt(32),
    this.b57 = BigInt(57);
  }

  msb(v) {
    const {deBruijn, multiplicator, b1, b2, b4, b8, b16, b32, b57} = this

    v |= v >> b1;
    v |= v >> b2;
    v |= v >> b4;
    v |= v >> b8;
    v |= v >> b16;
    v |= v >> b32;
    return BigInt(deBruijn[
      BigInt.asUintN(
        64,
        (BigInt.asUintN(
          64,
          (v * multiplicator))) >> b57)
    ])
  }

  lsb(v) {
    const {deBruijn, multiplicator, b1, b2, b4, b8, b16, b32, b57} = this

    v = -v | v;
    return BigInt(deBruijn[
      BigInt.asUintN(
        64,
        (BigInt.asUintN(
          64,
          (~(v) * multiplicator))) >> b57)
    ])
  }

  lsb_bad(v) {
    let r = 0n
    while(!(v>>r&1n)) r++
    return r
  }
}

const BINT = new BINTHelper()

const lsb_test = (v) => {
  let r = 0n
  while(!(v>>r&1n)) r++
  return r
}


function bitCountOld (n) {
  var bits = 0n
  while (n !== 0n) {
    bits += bitCount32(n | 0n)
    n /= 0x100000000n
  }
  return bits
}

function bitCount (n) {
  const t = n.toString(2).match(/1/g)
  // const t = n.toString(2).replace(/0/g, '')
  if(t) {
    return (t.length)
  }
  return 0
}

function bitCount32 (n) {
  n = n - ((n >> 1n) & 0x55555555n)
  n = (n & 0x33333333n) + ((n >> 2n) & 0x33333333n)
  return (((n + (n >> 4n)) & 0xF0F0F0Fn) * 0x1010101n) >> 24n
}

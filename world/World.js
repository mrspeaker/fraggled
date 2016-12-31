const Chunk = require("./Chunk");
const Blerb = require("../entities/Blerb");

class World {
  constructor () {
    this.cw = 16;
    this.ch = 32;

    this.chunks = {};
    this.entities = {};

    this.addChunk(0, 0, 0);
    this.addChunk(1, 0, 0);
    this.addChunk(-1, 0, 0);
    this.addChunk(0, 0, 1);
    this.addChunk(0, 0, -1);

    this.chunkArr = [];
    this.size = 0;
    for (let c in this.chunks) {
      this.size++;
      this.chunkArr.push(this.chunks[c].id);
    }
  }

  addChunk (x, y, z) {
    const {cw, ch} = this;
    const id = x + "_" + y + "_" + z;
    this.chunks[id] = new Chunk(cw, ch, x, y, z);
    this.entities[id] = Array.from(new Array(6)).map(() => {
      return new Blerb(
        cw / 2 | 0 + (x * cw),
        1,
        cw / 2 | 0 + (z * cw),
        cw,
        ch);
    });
  }

}

module.exports = World;

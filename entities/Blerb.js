const THREE = require("three");
const geom = require("../geom/geom");
const materials = require("../geom/materials");

class Blerb extends THREE.Object3D {
  constructor(x, y, z) {
    super();
    this.tx = x | 0;
    this.ty = y | 0;
    this.tz = z | 0;
    this.lastTx = this.tx;
    this.lastTy = this.ty;
    this.lastTz = this.tz;
    this.canFall = true;
    this.h = 1.4;

    this.position.set(x, y + 1 + (this.h / 2), z);
    this.dir = Math.random() < 0.5 ? "x" : "z";
    this.speed = (Math.random() * 0.03 + 0.01) * (Math.random() < 0 ? -1 : 1);
    this.add(new THREE.Mesh(geom.blerb, materials.green));

    this.state = "walking";
    this.stateTime = 0;
  }

  setState (state) {
    this.state = state;
    this.stateTime = 0;
  }

  update (chunk) {
    let {state, stateTime, tx, ty, tz, lastTx, lastTy, lastTz} = this;
    const isStateFirst = stateTime === 0;
    stateTime = this.stateTime++;

    if (Math.random() < 0.01) {
      this.canFall = !this.canFall;
    }

    switch (state) {
    case "walking":
      if (Math.random() < 0.01) {
        this.setState(Math.random() < 0.2 ? "stacking" : "building");
      }
      if (Math.random() < 0.001) {
        this.setState("bashing");
      }
      break;
    case "building":
      if (tx !== lastTx || tz !== lastTz || this.stateTime > 1000) {
        if (this.ty < chunk.h - 1) {
          chunk.setBlock(this.tx, this.ty, this.tz, 1);
          this.stateTime = 0;
        }
        if (Math.random() < 0.5) {
          this.setState("walking");
        }
      }
      if (Math.random() < 0.01) {
        this.setState("walking");
      }
      break;
    case "stacking":
      if (this.stateTime > 10) {
        if (this.ty < chunk.h - 1) {
          chunk.setBlock(this.tx, this.ty, this.tz, 1);
          this.stateTime = 0;
        }
        if (Math.random() < 0.2) {
          this.setState("walking");
        }
      }
      break;
    case "bashing":
      if (this.stateTime > 100) {
        chunk.setBlock(this.tx, this.ty, this.tz, 0);
        chunk.setBlock(this.tx, this.ty - 1, this.tz, 0);
        chunk.setBlock(this.tx, this.ty + 1, this.tz, 0);
        chunk.setBlock(this.tx + 1, this.ty, this.tz, 0);
        chunk.setBlock(this.tx - 1, this.ty, this.tz, 0);
        chunk.setBlock(this.tx, this.ty, this.tz + 1, 0);
        chunk.setBlock(this.tx, this.ty, this.tz - 1, 0);
        chunk.setBlock(this.tx + 1, this.ty, this.tz + 1, 0);
        chunk.setBlock(this.tx - 1, this.ty, this.tz + 1, 0);
        chunk.setBlock(this.tx + 1, this.ty, this.tz - 1, 0);
        chunk.setBlock(this.tx - 1, this.ty, this.tz - 1, 0);

        this.setState("walking");
      }
      break;

    }
  }
}

module.exports = Blerb;

class Chunk {

  constructor (w, h, x = 0, y = 0, z = 0) {
    this.w = w;
    this.h = h;

    this.x = x;
    this.y = y;
    this.z = z;

    const isGround = () => Math.random() > 0.1;

    this.data = Array.from(
      new Array(this.h),
      (_, y) => Array.from(
        new Array(this.w),
        (_, x) => Array.from(
          new Array(this.w),
          (_, z) => {
            //if (y % 3 === 1 && (x === 0 || z === 0)) return 1;
            //if (y % 6 != 0) return 0;
            if (y !== 0) return 0;
            return 1;//isGround() ? 1 : 0
          }
        )
      )
    );

    this.isDirty = true;
  }

  setBlock (x, y, z, block = 1) {
    if (y < 0 || x < 0 || z < 0 ||
      y > this.h - 1 || x > this.w - 1 || z > this.w - 1) {
      return;
    }

    this.data[y][x][z] = block;
    this.isDirty = true;
  }

  goRando () {
    this.data.forEach((r, y) => {
      r.forEach((w, x) => {
        w.forEach((d, z) => {
          if (y > 0) {
            this.data[y][x][z] = Math.random() < 0.0001 ? 1 : 0;
          }
        });
      });
    });
    this.isDirty = true;
  }

}

module.exports = Chunk;

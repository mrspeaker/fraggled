class Chunk {

  constructor (w, h, x = 0, y = 0, z = 0) {
    this.w = w;
    this.h = h;
    this.x = x;
    this.y = y;
    this.z = z;
    this.id = x + "_" + y + "_" + z;

    const isGround = y => y === 0;

    this.data = Array.from(
      new Array(this.h),
      (_, y) => Array.from(
        new Array(this.w),
        (_, x) => Array.from(
          new Array(this.w),
          (_, z) => isGround(y) ? 1 : 0
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
            this.data[y][x][z] = Math.random() < 0.05 ? 3 : 0;
          }
        });
      });
    });
    this.isDirty = true;
  }

}

module.exports = Chunk;

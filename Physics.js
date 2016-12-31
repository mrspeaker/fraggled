class Physics {
  update (chunk, ents) {
    const h = chunk.h;

    ents.forEach(e => {
      const {dir, position, tx, ty, tz, state} = e;

      if (state === "bashing") {
        return;
      }

      e.lastTx = tx;
      e.lastTy = ty;
      e.lastTz = tz;

      position[dir] += e.speed;
      if (position[dir] < chunk[dir] * chunk.w) {
        position[dir] = chunk[dir] * chunk.w;
        e.speed *= -1;
        //e.dir = Math.random() < 0.5 ? "x" : "z"
      }

      if (position[dir] > (chunk[dir] * chunk.w) + chunk.w - 1) {
        position[dir] = (chunk[dir] * chunk.w) + chunk.w - 1;
        e.speed *= -1;
        //e.dir = Math.random() < 0.5 ? "x" : "z"
      }

      e.tx = Math.round(position.x - (chunk.x * (chunk.w))) % chunk.w;
      e.tz = Math.round(position.z - (chunk.z * (chunk.w))) % chunk.w;
      //console.log(e.tx, e.tz, position.x, chunk.x)

      // Hit a block
      if (chunk.data[e.ty][e.tx][e.tz] === 1) {
        if (chunk.data[e.ty + 1][e.tx][e.tz] === 1) {
          // Brick wall
          e.tx = tx;
          e.tz = tz;
          position.x = e.tx + (chunk.x * chunk.w);
          position.z = e.tz + (chunk.z * chunk.w);
          e.dir = Math.random() < 0.5 ? "x" : "z";
          e.speed *= -1;
        }
        else {
          // Step
          if (e.ty <= h - 1) {
            e.ty += 1;
          }
        }
      }
      else if (e.ty > 0) {
        // Falling
        if (e.canFall && !chunk.data[e.ty - 1][e.tx][e.tz]) {
          e.ty -= 1;
          if (e.ty === 0) e.ty = h - 1;
//        e.dir = Math.random() < 0.5 ? "x" : "z";
          //e.speed *= Math.random() < 0.5 ? -1 : 1;
        }
      }
      if (chunk.data[e.ty][e.tx][e.tz] !== 0) {
        // Stuck in wall
        if (e.ty < h - 1) {
          e.ty += 1;
        }
      }
      position.y = e.ty + (e.h / 2);
      if (!e.canFall) {
        position.y += Math.sin(Date.now() / 200) * 0.2;
      }
    });
  }
}

module.exports = Physics;

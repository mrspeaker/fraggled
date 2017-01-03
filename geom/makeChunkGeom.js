const THREE = require("three");
const materials = require("./materials");

function makeChunkGeom (c) {
  const t0 = performance.now();

  const vertices = [];
  const indices = [];
  const normals = [];
  const uvs = [];

  let vertexBufferOffset = 0;
  let indexBufferOffset = 0;
  let numberOfVertices = 0;
  let uvBufferOffset = 0;

  const bg = new THREE.BufferGeometry();

  function buildFace (u, v, w, xo, yo, zo, udir, vdir, depth) {

    var widthHalf = 1 / 2;
    var heightHalf = 1 / 2;
    var depthHalf = depth / 2;
    var vertexCounter = 0;
    var vector = new THREE.Vector3();

    // generate vertices, normals and uvs
    for (let iy = 0; iy < 2; iy++) {
      const y = iy - heightHalf;
      for (let ix = 0; ix < 2; ix++) {

        const x = ix - widthHalf;

        vector[u] = x * udir;
        vector[v] = y * vdir;
        vector[w] = depthHalf;

        // apply vector to vertex buffer
        vertices[vertexBufferOffset] = vector.x + xo;
        vertices[vertexBufferOffset + 1] = vector.y + yo;
        vertices[vertexBufferOffset + 2] = vector.z + zo;

        vector[u] = 0;
        vector[v] = 0;
        vector[w] = depth > 0 ? 1 : - 1;

        // apply vector to normal buffer
        normals[vertexBufferOffset] = vector.x;
        normals[vertexBufferOffset + 1] = vector.y;
        normals[vertexBufferOffset + 2] = vector.z;

        // uvs
        uvs[uvBufferOffset] = ix;
        uvs[uvBufferOffset + 1] = 1 - iy;

        // update offsets
        vertexBufferOffset += 3;
        uvBufferOffset += 2;
        vertexCounter += 1;
      }

    }

    // indices
    const a = numberOfVertices;
    const b = numberOfVertices + 2;
    const c = numberOfVertices + 3;
    const d = numberOfVertices + 1;

    // face one
    indices[indexBufferOffset] = a;
    indices[indexBufferOffset + 1] = b;
    indices[indexBufferOffset + 2] = d;

    // face two
    indices[indexBufferOffset + 3] = b;
    indices[indexBufferOffset + 4] = c;
    indices[indexBufferOffset + 5] = d;

    // update offset
    indexBufferOffset += 6;

    // update total number of indices
    numberOfVertices += vertexCounter;
  }

  // Build geometry for chunk
  const faces = [[], [], [], [], [], []];
  c.data.forEach((r, y) => {
    r.forEach((w, x) => {
      w.forEach((d, z) => {
        if (d === 0) return;

        // Don't add face if blocked by neighbor
        [
          x < c.w - 1 && c.data[y][x + 1][z], // right
          x > 0 && c.data[y][x - 1][z],       // left
          y < c.h - 1 && c.data[y + 1][x][z], // top
          y > 0 && c.data[y - 1][x][z],       // bottom
          z < c.w - 1 && c.data[y][x][z + 1], // front
          z > 0 && c.data[y][x][z - 1],       // back
        ]
          .forEach((n, i) => !n && faces[i].push([x, y, z]));
      });
    });
  });

  // Add each face direction separetly (to support MultiMaterials)
  faces[0].forEach(([x, y, z]) => buildFace("z", "y", "x", x, y, z, -1, -1,  1));
  faces[1].forEach(([x, y, z]) => buildFace("z", "y", "x", x, y, z,  1, -1, -1));
  faces[2].forEach(([x, y, z]) => buildFace("x", "z", "y", x, y, z,  1,  1,  1));
  faces[3].forEach(([x, y, z]) => buildFace("x", "z", "y", x, y, z,  1, -1, -1));
  faces[4].forEach(([x, y, z]) => buildFace("x", "y", "z", x, y, z,  1, -1,  1));
  faces[5].forEach(([x, y, z]) => buildFace("x", "y", "z", x, y, z, -1, -1, -1));

  // Add groups for materials
  faces.reduce((total, face, i) => {
    bg.addGroup(total, face.length * 6, i);
    return total + face.length * 6;
  }, 0);

  bg.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
  bg.addAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
  bg.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
  bg.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));

  // Create and position the mesh
  const mesh = new THREE.Mesh(bg, materials.building);
  mesh.position.x = c.x * c.w;
  mesh.position.z = c.z * c.w;
  mesh.position.y = 0.5; // Offset so bottom-aligned, not vertically-alligned.

  const t1 = performance.now();
  //console.log("Chunk create: " + (t1 - t0).toFixed(0) + " milliseconds.");
  return mesh;
}

module.exports = makeChunkGeom;

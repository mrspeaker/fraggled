const THREE = require("three");
const geom = require("./geom/geom");
const materials = require("./geom/materials");
const Blerb = require("./entities/Blerb");
const Chunk = require("./Chunk");
const Physics = require("./Physics");

class Game {

  constructor () {
    this.cw = 32;
    this.ch = 32;

    this.dist = 35;
    this.rechunkTime = 1;

    this.init();

    this.chunks = [
      new Chunk(this.cw, this.ch),
      new Chunk(this.cw, this.ch, 1, 0, 0),
      new Chunk(this.cw, this.ch, -1, 0, 0),
      new Chunk(this.cw, this.ch, 0, 0, 1),
      new Chunk(this.cw, this.ch, 0, 0, -1),
      new Chunk(this.cw, this.ch, 1, 0, 1),
      new Chunk(this.cw, this.ch, -1, 0, 1),
      new Chunk(this.cw, this.ch, 1, 0, -1),
      new Chunk(this.cw, this.ch, -1, 0, -1),
    ];

    this.physics = new Physics();
    this.addGeom();

    this.entities = Array.from(new Array(15)).map(() => {
      const b = new Blerb(
        Math.random() * 16 | 0,
        ((Math.random() * 7 | 0) + 1) * 3,
        Math.random() * 16 | 0);
      this.scene.add(b);
      return b;
    });
    this.lightScene();

    this.update = this.update.bind(this);
    requestAnimationFrame(this.update);
  }

  init () {
    this.entities = [];
    this.scene = new THREE.Scene();

    const camera = this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      10000);

    const renderer = this.renderer = new THREE.WebGLRenderer({antialias: true});
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize, false);
    resize();
    document.body.appendChild(renderer.domElement);
  }

  addGeom () {
    const {scene} = this;

    this.geom = this.chunks.map(this.makeChunk);

    this.geom[0].children[0].geometry.dynamic = true;
    this.geom.forEach(g => scene.add(g));
  }

  lightScene () {
    const {scene} = this;
    const amb = new THREE.AmbientLight(0x999999);
    scene.add(amb);

    scene.fog = new THREE.Fog(0xc0e9FD, this.dist / 2, this.dist * 2);
    scene.background = new THREE.Color(0xc0e9FD);

    //const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    //hemiLight.position.set(1, 1, 0).normalize();
    //scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-0.5, 0.75, 0.5).normalize();
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
    dirLight2.position.set(0.5, 0.75, -0.5).normalize();
    scene.add(dirLight2);
  }

  makeChunk (c) {
    const t0 = performance.now();
    const container = new THREE.Object3D();

    container.position.x = c.x * c.w;
    container.position.z = c.z * c.w;

    const vertices = [];
    const indices = [];
    const normals = [];
    const uvs = [];
    const colors = [];

    let vertexBufferOffset = 0;
    let indexBufferOffset = 0;
    let numberOfVertices = 0;
    let uvBufferOffset = 0;

    // group variables
    //var groupStart = 0;

    // const vertexCount = (2 + 2 + 2) * 4;
    // const vsize = vertexCount * 3;
    // const indicesSize = (vertexCount / 4) * 6;
    // const uvSize = vertexCount * 2;

    const bg = new THREE.BufferGeometry();

    const cols = [
      [0.2, 0.4, 0.5],
      [0.1, 0.3, 0.4],
      [1, 1, 1],
      [0.5, 0.5, 0.5]
    ];

    let curblock = 1;

    function buildPlane (u, v, w, xo, yo, zo, udir, vdir, depth, materialIndex = 1, colIndex = 0) {
      var widthHalf = 1 / 2;
      var heightHalf = 1 / 2;
      var depthHalf = depth / 2;

      var vertexCounter = 0;
      //var groupCount = 0;

      var vector = new THREE.Vector3();

      // generate vertices, normals and uvs
      for (let iy = 0; iy < 2; iy++) {
        const y = iy - heightHalf;
        for (let ix = 0; ix < 2; ix++) {
          const x = ix - widthHalf;

          // set values to correct vector component
          vector[u] = x * udir;
          vector[v] = y * vdir;
          vector[w] = depthHalf;

          // now apply vector to vertex buffer
          vertices[vertexBufferOffset] = vector.x + xo;
          vertices[vertexBufferOffset + 1] = vector.y + yo;
          vertices[vertexBufferOffset + 2] = vector.z + zo;

          // set values to correct vector component
          vector[u] = 0;
          vector[v] = 0;
          vector[w] = depth > 0 ? 1 : - 1;

          // now apply vector to normal buffer
          normals[vertexBufferOffset] = vector.x;
          normals[vertexBufferOffset + 1] = vector.y;
          normals[vertexBufferOffset + 2] = vector.z;

          colors[vertexBufferOffset] = cols[colIndex][curblock === 1 ? 0 : 2];
          colors[vertexBufferOffset + 1] = cols[colIndex][1];
          colors[vertexBufferOffset + 2] = cols[colIndex][2];

          // uvs
          uvs[uvBufferOffset] = ix;
          uvs[uvBufferOffset + 1] = 1 - iy;

          // update offsets
          vertexBufferOffset += 3;
          uvBufferOffset += 2;
          vertexCounter += 1;
        }

      }

      // 1. you need three indices to draw a single face
      // 2. a single segment consists of two faces
      // 3. so we need to generate six (2*3) indices per segment
      // indices
      var a = numberOfVertices;
      var b = numberOfVertices + 2;
      var c = numberOfVertices + 3;
      var d = numberOfVertices + 1;

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

      //groupCount += 6;
      // add a group to the geometry. this will ensure multi material support
      //bg.addGroup(groupStart, groupCount, materialIndex);
      // calculate new start value for groups
      //groupStart += groupCount;

      // update total number of indices
      numberOfVertices += vertexCounter;
    }

    const makeCube = (x = 0, y = 0, z = 0, neighbours) => {
      // Don't add face if blocked by neighbor
      neighbours = neighbours || [false, false, false, false, false, false];
      if (!neighbours[0]) buildPlane("z", "y", "x", x, y, z, -1, -1,  1, 0, 0); // right,
      if (!neighbours[1]) buildPlane("z", "y", "x", x, y, z,  1, -1, -1, 1, 0); // left
      if (!neighbours[2]) buildPlane("x", "z", "y", x, y, z,  1,  1,  1, 2, 2); // top
      if (!neighbours[3]) buildPlane("x", "z", "y", x, y, z,  1, -1, -1, 3, 3); // bottom
      if (!neighbours[4]) buildPlane("x", "y", "z", x, y, z,  1, -1,  1, 4, 1); // front
      if (!neighbours[5]) buildPlane("x", "y", "z", x, y, z, -1, -1, -1, 5, 1); // back
    };

    c.data.forEach((r, y) => {
      r.forEach((w, x) => {
        w.forEach((d, z) => {
          const isBlank = d === 0;
          if (isBlank) return;
          const neighbours = [
            x < c.w - 1 && c.data[y][x + 1][z], // right
            x > 0 && c.data[y][x - 1][z],       // left
            y < c.h - 1 && c.data[y + 1][x][z], // top
            y > 0 && c.data[y - 1][x][z],       // bottom
            z < c.w - 1 && c.data[y][x][z + 1], // front
            z > 0 && c.data[y][x][z - 1],       // back
          ];
          curblock = d;
          makeCube(x, y + 0.5, z, neighbours);
        });
      });
    });

    bg.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    bg.addAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    bg.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    bg.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    bg.addAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));

    const mesh = new THREE.Mesh(bg, materials.verty);
    container.add(mesh);

    const t1 = performance.now();
    //console.log("Chunk create: " + (t1 - t0) + " milliseconds.");
    return container;
  }

  doRechunk () {
    if (this.rechunkTime < 0) {
      this.rechunkTime = 2;
    }
  }

  rechunk (ch = 0) {
    this.scene.remove(this.geom[ch]);
    this.geom[ch].children[0].geometry.dispose();
    this.geom[ch] = null;
    this.geom[ch] = this.makeChunk(this.chunks[ch]);
    this.scene.add(this.geom[ch]);
  }

  update () {
    const {camera, scene, renderer} = this;
    const spd = Date.now() / 10000;

    this.physics.update(this.chunks[0], this.entities);
    this.entities.forEach(e => e.update(this.chunks[0]));

    renderer.render(scene, camera);

    camera.position.y = 12 + Math.cos(spd*5);
    camera.position.x = Math.cos(spd) * this.dist;
    camera.position.z = Math.sin(spd) * this.dist;
    camera.lookAt(new THREE.Vector3(8, 12, 8));

    if (this.chunks[0].isDirty) {
      this.doRechunk();
    }
    if (this.rechunkTime-- === 0) {
      this.rechunk();
    }
    if (Math.random() < 0.1) {
      const ch = ((Math.random() * (this.chunks.length - 1)) | 0) + 1;
      this.chunks[ch].goRando();
      this.rechunk(ch);
    }

    requestAnimationFrame(this.update);
  }

}

module.exports = Game;

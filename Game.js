const THREE = require("three");
const materials = require("./geom/materials");
const Blerb = require("./entities/Blerb");
const Chunk = require("./Chunk");
const Physics = require("./Physics");

class Game {

  constructor () {
    this.cw = 16;
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
    this.lightScene();

    this.entities = Array.from(new Array(15)).map(() => {
      const b = new Blerb(
        Math.random() * this.w | 0,
        0,
        Math.random() * this.w | 0);
      this.scene.add(b);
      return b;
    });

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

    this.geom[0].geometry.dynamic = true;
    this.geom.forEach(g => scene.add(g));
  }

  lightScene () {
    const {scene} = this;
    scene.background = new THREE.Color(0xc0e9FD);
    scene.fog = new THREE.Fog(0xc0e9FD, this.dist / 2, this.dist * 2);

    const amb = new THREE.AmbientLight(0x555555);
    scene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(-1, 0.5, 1).normalize();
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight2.position.set(1, 0.5, 1).normalize();
    scene.add(dirLight2);
  }

  makeChunk (c) {
    const t0 = performance.now();

    const vertices = [];
    const indices = [];
    const normals = [];
    const uvs = [];
    const colors = [];

    let vertexBufferOffset = 0;
    let indexBufferOffset = 0;
    let numberOfVertices = 0;
    let uvBufferOffset = 0;

    const bg = new THREE.BufferGeometry();

    // TODO: allow real colours
    const cols = [
      [0.2, 0.4, 0.5],
      [0.1, 0.3, 0.4],
      [1, 1, 1],
      [0.5, 0.5, 0.5]
    ];

    function buildFace (u, v, w, xo, yo, zo, udir, vdir, depth, colIndex = 0) {
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

          colors[vertexBufferOffset] = cols[colIndex][0];
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
    faces[0].forEach(([x, y, z]) => buildFace("z", "y", "x", x, y, z, -1, -1,  1, 0));
    faces[1].forEach(([x, y, z]) => buildFace("z", "y", "x", x, y, z,  1, -1, -1, 0));
    faces[2].forEach(([x, y, z]) => buildFace("x", "z", "y", x, y, z,  1,  1,  1, 2));
    faces[3].forEach(([x, y, z]) => buildFace("x", "z", "y", x, y, z,  1, -1, -1, 3));
    faces[4].forEach(([x, y, z]) => buildFace("x", "y", "z", x, y, z,  1, -1,  1, 1));
    faces[5].forEach(([x, y, z]) => buildFace("x", "y", "z", x, y, z, -1, -1, -1, 1));

    // Add groups for materials
    faces.reduce((total, face, i) => {
      bg.addGroup(total, face.length * 6, i);
      return total + face.length * 6;
    }, 0);

    bg.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
    bg.addAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    bg.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    bg.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    bg.addAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));

    // Create and position the mesh
    const mesh = new THREE.Mesh(bg, materials.building);
    mesh.position.x = c.x * c.w;
    mesh.position.z = c.z * c.w;
    mesh.position.y = 0.5;

    const t1 = performance.now();
    //console.log("Chunk create: " + (t1 - t0).toFixed(0) + " milliseconds.");
    return mesh;
  }

  doRechunk () {
    if (this.rechunkTime < 0) {
      this.rechunkTime = 3;
    }
  }

  rechunk (ch) {
    setTimeout(()=> {
      this.scene.remove(this.geom[ch]);
      this.geom[ch].geometry.dispose();
      this.geom[ch] = null;

      this.geom[ch] = this.makeChunk(this.chunks[ch]);
      this.scene.add(this.geom[ch]);
      this.chunks[ch].isDirty = false;
    },0)
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
      this.rechunk(0);
    }
    if (Math.random() < 0.01) {
      //const ch = ((Math.random() * (this.chunks.length - 1)) | 0) + 1;
      //this.chunks[ch].goRando();
      //this.rechunk(ch);
    }

    requestAnimationFrame(this.update);
  }

}

module.exports = Game;

const THREE = require("three");
const geom = require("./geom/geom");
const materials = require("./geom/materials");
const Blerb = require("./entities/Blerb");
const Chunk = require("./Chunk");
const Physics = require("./Physics");

class Game {

  constructor () {
    this.levels = 24;
    this.dist = 35;
    this.rechunkTime = 1;
    this.init();

    this.chunks = [
      new Chunk(16, this.levels),
      //new Chunk(16, this.levels, 5, 0, 0)
    ];

    this.physics = new Physics();
    this.addGeom();

    this.entities = Array.from(new Array(10)).map(() => {
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
    scene.background = new THREE.Color(0x00191D);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0.3, 0.75, -0.3);
    dirLight.position.multiplyScalar(2);
    scene.add(dirLight);
  }

  makeChunk (c) {
    const t0 = performance.now();
    const container = new THREE.Object3D();

    container.position.x = c.x * c.w;
    container.position.z = c.z * c.w;

    const mergeGeom = new THREE.Geometry();

    c.data.forEach((r, y) => {
      r.forEach((w, x) => {
        w.forEach((d, z) => {
          const isBlank = d === 0;
          if (isBlank) return;
          //const b = new THREE.BoxBufferGeometry(1, 1, 1);
          geom.ground.applyMatrix(new THREE.Matrix4().makeTranslation(x, y + 0.5, z));
          mergeGeom.merge(geom.ground);
          geom.ground.applyMatrix(new THREE.Matrix4().makeTranslation(-x, -(y + 0.5), -z));
        });
      });
    });
    //const b = new THREE.BoxBufferGeometry(1, 1, 1);
    //b.applyMatrix(new THREE.Matrix4().makeTranslation(1, 0.5, 1));
    //mergeGeom.merge(b, 1);

    const mesh = new THREE.Mesh(mergeGeom, materials.building);
    container.add(mesh);

    const t1 = performance.now();
    //console.log("Chunk create: " + (t1 - t0) + " milliseconds.");

    return container;
  }

  doRechunk () {
    if (this.rechunkTime < 0) {
      this.rechunkTime = 5;
    }
  }

  rechunk () {
    this.scene.remove(this.geom[0]);
    this.geom[0].children[0].geometry.dispose();
    this.geom[0] = null;
    this.geom[0] = this.makeChunk(this.chunks[0]);
    this.scene.add(this.geom[0]);
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

    requestAnimationFrame(this.update);
  }

}

module.exports = Game;

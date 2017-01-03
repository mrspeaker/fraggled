const THREE = require("three");
const makeChunkGeom = require("./geom/makeChunkGeom");
const World = require("./world/World");
const Physics = require("./Physics");

class Game {

  constructor () {
    this.dist = 35;
    this.rechunkIdx = 0;

    this.scene = null;
    this.geom = {};

    this.init();

    this.world = new World();
    this.physics = new Physics();

    this.addGeom();
    this.lightScene();

    this.update = this.update.bind(this);
    requestAnimationFrame(this.update);
  }

  init () {
    this.scene = new THREE.Scene();

    const camera = this.camera = new THREE.PerspectiveCamera(75, 1, 1, 10000);
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

  addGeom () {
    for (let c in this.world.chunks) {
      this.addChunkGeom(c);
    }
  }

  addChunkGeom (ch) {
    const {scene} = this;
    this.geom[ch] = makeChunkGeom(this.world.chunks[ch]);
    scene.add(this.geom[ch]);
    this.world.entities[ch].forEach(en => this.scene.add(en));
  }

  rechunk (ch) {
    if (!this.world.chunks[ch].isDirty) {
      return;
    }
    setTimeout(()=> {
      this.scene.remove(this.geom[ch]);
      this.geom[ch].geometry.dispose();
      this.geom[ch] = null;

      this.geom[ch] = makeChunkGeom(this.world.chunks[ch]);
      this.scene.add(this.geom[ch]);
      this.world.chunks[ch].isDirty = false;
    }, 0);
  }

  update () {
    const {camera, scene, renderer, world} = this;
    const spd = Date.now() / 10000;

    for (let c in world.chunks) {
      const chunk = world.chunks[c];
      const ents = world.entities[c];
      this.physics.update(chunk, ents);
      ents.forEach(e => e.update(chunk));
    }

    this.rechunk(world.chunkArr[this.rechunkIdx++ % world.size]);

    renderer.render(scene, camera);

    camera.position.y = 12 + Math.cos(spd*5);
    camera.position.x = Math.cos(spd) * this.dist;
    camera.position.z = Math.sin(spd) * this.dist;
    camera.lookAt(new THREE.Vector3(8, 12, 8));

    requestAnimationFrame(this.update);
  }

}

module.exports = Game;

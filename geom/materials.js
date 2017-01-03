const THREE = require("three");

const materials = {
  "grey": new THREE.MeshLambertMaterial({ color: 0x4B962A }),
  "white": new THREE.MeshPhongMaterial({ color: 0xffffff }),
  "green": new THREE.MeshLambertMaterial({ color: 0xaa4444 }),
  "dark": new THREE.MeshPhongMaterial({ color: 0x2f2f2f, shininess: 10 }),
  "verty": new THREE.MeshLambertMaterial({ color: 0x999999, vertexColors: THREE.VertexColors }),
  "debug": new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
  }),
  "box": new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture("res/comb.jpg"),
    // vertexColors: THREE.VertexColors
  })
};

materials.building = new THREE.MeshFaceMaterial([
  materials.box,
  materials.box,
  materials.white,
  materials.dark,
  materials.box,
  materials.box]);


module.exports = materials;

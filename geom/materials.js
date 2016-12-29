const THREE = require("three");

const materials = {
  "grey": new THREE.MeshLambertMaterial({ color: 0x4B962A }),
  "white": new THREE.MeshLambertMaterial({ color: 0xffffff }),
  "green": new THREE.MeshLambertMaterial({ color: 0xff4444 }),
  "dark": new THREE.MeshPhongMaterial({ color: 0x2f2f2f, shininess: 100 }),
  "debug": new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
  }),
  "box": new THREE.MeshLambertMaterial({
    map: THREE.ImageUtils.loadTexture("comb.jpg")
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

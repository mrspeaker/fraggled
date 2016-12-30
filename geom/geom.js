const THREE = require("three");

const geom = {
  "blank": new THREE.BoxGeometry(1, 0.1, 1),
  "ground": new THREE.BoxGeometry(1, 1, 1),
  "blerb": new THREE.BoxGeometry(0.5, 1.1, 0.5)
};

module.exports = geom;

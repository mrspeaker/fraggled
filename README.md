# Fraggled

[Fraggled world builders in action!](https://mrspeaker.github.io/fraggled/). More messing around in three.js.

[<img width="808" alt="screen shot 2016-12-31 at 2 36 25 pm" src="https://cloud.githubusercontent.com/assets/129330/21579023/91c46a44-cf66-11e6-9c97-1213e891d0e8.png">](https://mrspeaker.github.io/fraggled/)

# build

* npm install
* npm start
* browse on http://localhost:9966/

# TODO

## Optimize removing/adding geometry to scene

Currently doing scene.remove, scene.add every rechunk. Is this most efficient way?
It might be better to use the new ["range" feature of BufferAttribute](https://github.com/mrdoob/three.js/blob/r81/src/core/BufferAttribute.js#L27) to update only part of the geometry.

## Ambient Occlusion

The more a vertex is occluded by its neighbors the darker it becomes. Create a look up table with all possible neighbors:

    Vertices - Corner, Side1, Side2
    0, 0, 0 - (-1, -1, -1), (-1, -1, 0), (0, -1, -1)
    1, 0, 0 - (1, -1, -1), (0, -1, -1), (1, -1, 0)
    0, 1, 0 - (-1, 1, -1), (-1, 1, 0), (0, 1, -1)
    0, 0, 1 - (-1, -1, 1), (-1, -1, 0), (0, -1, 1)
    1, 1, 0 - (1, 1, -1), (0, 1, -1), (1, 1, 0)
    0, 1, 1 - (-1, 1, 1), (-1, 1, 0), (0, 1, 1)
    1, 0, 1 - (1, -1, 1), (1, -1, 0), (0, -1, 1)
    1, 1, 1 - (1, 1, 1), (1, 1, 0), (0, 1, 1)

For vertex 0, 0, 0 your look ups would be: Corner(-1, -1, -1), Side1(-1, -1, 0), and Side2(0, -1, -1).
* Corner = CurrentBlock + LookupTable[VertexID][0]
* Side1 = CurrentBlock + LookupTable[VertexID][1]
* Side2 = CurrentBlock + LookupTable[VertexID][2]
* AOValue = vertexAO(Corner,Side1,Side2) / 3;

Can clamp the value (in the shader) as it is usually way too dark. Also, doesn't fix errors caused by anisotropy filtering.

## Add color to geometry

(Also Required for AO).

```bg.addAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));```

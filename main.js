// import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.146.0/build/three.module.js";
// import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
// import { ARButton } from 'https://unpkg.com/three@0.133.0/examples/jsm/webxr/ARButton.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.146.0/examples/jsm/webxr/ARButton.js';

    
setupMobileDebug();
let camera, scene, renderer;
let mesh;
let image;

init();
animate();

function setupMobileDebug() {
  const containerEl = document.getElementById("console-ui");
  eruda.init({
    container: containerEl
  });
  const devToolEl = containerEl.shadowRoot.querySelector('.eruda-dev-tools');
  devToolEl.style.height = '40%'; // control the height of the dev tool panel
}

async function init() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    40
  );

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  // setup a cone mesh to put on top of the image target when it is seen
  const radius = 0.2;
  const height = 1;
  const coneGeometry = new THREE.ConeGeometry(radius, height, 32);
  coneGeometry.translate(0, height / 2, 0); // important. push mesh up on y
  const coneMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff * Math.random(),
    shininess: 6,
    flatShading: true,
    transparent: 1,
    opacity: 1
  });
  mesh = new THREE.Mesh(coneGeometry, coneMaterial);
  mesh.matrixAutoUpdate = false; // important we have to set this to false because we'll update the position with the updateMesh() function
  mesh.visible = false;
  scene.add(mesh);
  // Second mesh
  const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  cubeGeometry.translate(0, height / 2, 0); // important. push mesh up on y
  const cubeMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff * Math.random(),
    shininess: 6,
    flatShading: true,
    transparent: 1,
    opacity: 1
  });
  mesh2 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  mesh2.matrixAutoUpdate = false; // important we have to set this to false because we'll update the position with the updateMesh() function
  mesh2.visible = false;
  scene.add(mesh2);
  
  // setup the image target
  const url = "picasso.jpg";
  const imgBitmap = await getImageBitmap(url);
//   console.log(imgBitmap)
// second url
const url2 = "the-scream.jpg";
const imgBitmap2 = await getImageBitmap(url2);

  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["image-tracking"], // notice a new required feature
    trackedImages: [
      {
        image: imgBitmap, // tell webxr this is the image target we want to track
        widthInMeters: 0.7
      },
      {
        image: imgBitmap2, // tell webxr this is the image target we want to track
        widthInMeters: 0.7
      }
    ],
    optionalFeatures: ["dom-overlay", "dom-overlay-for-handheld-ar"], // for viewing the mobile debug
    domOverlay: {
      root: document.body
    }
  });
  document.body.appendChild(button);

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

async function getImageBitmap(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);
  return imageBitmap;
};

// update the cone mesh when the image target is found
function updateMesh(meshObject, pose) {
  meshObject.matrix.fromArray(pose.transform.matrix);
}

function render(timestamp, frame) {
  if (frame) {
    const results = frame.getImageTrackingResults();

    for (const result of results) {
      // The result's index is the image's position in the trackedImages array specified at session creation
      const imageIndex = result.index;

      // Get the pose of the image relative to a reference space.
      const referenceSpace = renderer.xr.getReferenceSpace();
      const pose = frame.getPose(result.imageSpace, referenceSpace);
      
      const state = result.trackingState;
      console.log(imageIndex, state);

      if (state == "tracked") {
        if (imageIndex === 0) {
          mesh.visible = true;
          updateMesh(mesh, pose);
        } else {  // imageIndex === 1
          mesh2.visible = true;
          updateMesh(mesh2, pose);
        }
       
      } else if (state == "emulated") {
        // do something when image is lost
        if (imageIndex === 0) {
          mesh.visible = false; 
        } else { // imageIndex === 1
          mesh2.visible = false;
        }
      }
    }
  }
  renderer.render(scene, camera);
}

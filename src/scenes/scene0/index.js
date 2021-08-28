import * as THREE from "three";
import { Arrow } from "./Arrow";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import {
  createSky,
  createWire,
  createRing,
  createRefPlane,
  cross,
  createCompass,
} from "./utils";
import { Pane } from "tweakpane";
import { Electron } from "./Electron";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { OrthographicCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export const renderScene = () => {
  let configs = {
    referencePlane: false,
    currentDir: "down",
    showHand: false,
    w: 0.1,
  };
  const compass = createCompass(configs);
  console.log(configs);
  const scene = new THREE.Scene();
  // const camera = new THREE.PerspectiveCamera(
  //   75,
  //   window.innerWidth / window.innerHeight,
  //   0.1,
  //   1000
  // );
  // remove metalness from material if using OrthographicCamera !!!
  const camera = new THREE.OrthographicCamera(
    window.innerWidth / -180,
    window.innerWidth / 180,
    window.innerHeight / 180,
    window.innerHeight / -180,
    1,
    1000
  );
  camera.position.set(5, 5, 5);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.physicallyCorrectLights = true;
  document.body.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  const alight = new THREE.AmbientLight("grey", 0.2);
  const dlight = new THREE.DirectionalLight("white", 0.6);
  dlight.position.set(0, 10, 2);

  let objects = [];
  objects.push(compass);
  const dragControls = new DragControls(objects, camera, renderer.domElement);
  // dragControls.deactivate();
  const pane = new Pane();

  let electrons = [];
  let rings = [];
  let backArrows = [];
  let frontArrows = [];
  let hand;

  // const sky = createSky(renderer);
  const Wire = createWire(0.4, 0.4, 7);

  for (let i = 0; i < 4; i++) {
    const Ring = createRing(0.8 + i * 0.4, 0.04);
    Ring.rotation.x = -Math.PI / 2;
    rings.push(Ring);

    const bArrow = new Arrow(0.1, 0.3);
    bArrow.getMesh().position.y = -2.0 + i * 0.4;
    bArrow.getMesh().rotation.z = Math.PI / 2;
    backArrows.push(bArrow);

    const fArrow = new Arrow(0.1, 0.3);
    fArrow.getMesh().position.y = 0.8 + i * 0.4;
    fArrow.getMesh().rotation.z = -Math.PI / 2;
    frontArrows.push(fArrow);
  }

  for (let i = 0; i < 8; i++) {
    const electron = new Electron(0.3, "red", false, configs.currentDir);
    electron.getMesh().position.y = -3.2 + i * 0.8;
    electrons.push(electron);
  }

  const crossHelper1 = cross();
  crossHelper1.position.x = -2;
  crossHelper1.position.z += 0.01;

  const referencePlane = createRefPlane(5, 5);

  const currentDirection = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    "white"
  );
  currentDirection.position.set(1, 2, 0);
  console.log(currentDirection);

  const loader = new OBJLoader();
  loader.setPath("./assets/");
  loader.load("thumbsUp.obj", (obj) => {
    // this._scene.add(obj);
    obj.scale.set(0.05, 0.05, 0.05);
    obj.position.set(-2, 2, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xaaffff,
    });
    obj.material = material;
    hand = obj;
    console.log(hand);
  });

  // const text = createText("Raunit", new Vector3(1, 1, 1), 2, "green");

  scene.add(
    // sky,
    camera,
    Wire,
    compass,
    currentDirection,
    alight,
    dlight
    // text
  );

  for (let i = 0; i < 4; i++) {
    rings[i].add(backArrows[i].getMesh());
    rings[i].add(frontArrows[i].getMesh());
    Wire.add(rings[i]);
  }

  for (let j = 0; j < 8; j++) {
    scene.add(electrons[j].getMesh());
  }

  pane.addInput(configs, "referencePlane").on("change", (e) => {
    // console.log(e);
    if (e.value) {
      scene.add(referencePlane, crossHelper1);
    } else {
      scene.remove(referencePlane, crossHelper1);
    }
  });
  let newDirection;

  pane.addInput(configs, "showHand").on("change", (e) => {
    if (e.value) {
      scene.add(hand);
    } else {
      scene.remove(hand);
    }
  });

  pane
    .addInput(configs, "currentDir", {
      options: {
        up: "up",
        down: "down",
      },
    })
    .on("change", (e) => {
      for (let i = 0; i < 8; i++) electrons[i]._direction = e.value;
      if (e.value === "down") {
        configs.w = 0.1;
        frontArrows.forEach((arrow) => {
          arrow.getMesh().rotation.z = -Math.PI / 2;
        });
        backArrows.forEach((arrow) => {
          arrow.getMesh().rotation.z = Math.PI / 2;
        });
        crossHelper1.position.x = -2;

        let direction = compass.position.normalize();
        let newPos = new Vector3(direction.x * 3.0, 0, direction.z * 3.0);
        // let initial_angle = configs.currentDir === "down" ? -Math.PI / 2 : Math.PI / 2;
        compass.rotation.y = Math.PI / 2;
        compass.position.copy(newPos);

        hand.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI);
      } else {
        frontArrows.forEach((arrow) => {
          arrow.getMesh().rotation.z = Math.PI / 2;
        });
        backArrows.forEach((arrow) => {
          arrow.getMesh().rotation.z = -Math.PI / 2;
        });
        crossHelper1.position.x = 2;
      }
      if (e.value === "up") {
        configs.w = -0.1;
        compass.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI);
        hand.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI);
        scene.remove(currentDirection);
        newDirection = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 0),
          1,
          "white"
        );
        newDirection.position.set(1, 1, 0);
        scene.add(newDirection);
      } else {
        compass.rotateOnAxis(new THREE.Vector3(0, 1, 0), -Math.PI);
        scene.remove(newDirection);
        scene.add(currentDirection);
      }
    });

  dragControls.addEventListener("dragstart", (e) => {
    controls.enabled = false;
    let comp = e.object;
    let direction = comp.position.normalize();
    let newPos = new Vector3(direction.x * 3.0, 0, direction.z * 3.0);
    let angle = Math.atan2(direction.z, direction.x);
    let initial_angle =
      configs.currentDir === "down" ? -Math.PI / 2 : Math.PI / 2;
    comp.rotation.y = initial_angle;
    comp.position.copy(newPos);
  });

  dragControls.addEventListener("drag", (e) => {
    controls.enabled = false;
    let comp = e.object;
    let direction = comp.position.normalize();
    let newPos = new Vector3(direction.x * 3.0, 0, direction.z * 3.0);
    let angle = Math.atan2(direction.z, direction.x);
    let initial_angle =
      configs.currentDir === "down" ? -Math.PI / 2 : Math.PI / 2;
    comp.rotation.y = initial_angle - angle;
    comp.position.copy(newPos);
    // let angle = new Vector3(0, 0, 1).angleTo(comp.position);
    // comp.rotateOnAxis(new THREE.Vector3(0, 0, 1), angle);
  });

  dragControls.addEventListener("dragend", (e) => {
    controls.enabled = true;
  });

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    for (let i = 0; i < electrons.length; i++) {
      electrons[i].behaviour();
    }
    for (let i = 0; i < rings.length; i++) {
      rings[i].rotation.z += -configs.w;
    }
    renderer.render(scene, camera);
  };

  animate();
};

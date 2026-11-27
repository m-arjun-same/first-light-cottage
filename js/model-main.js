/* Foxglove & Ember — hero: ONE real 3D croissant (GLB mesh, Three.js).
   Same engine as the approved hero sample, scoped to the main page's
   hero section. No particles. Auto-spin with entrance grow-in,
   rocking and breathing; Light/Dark toggle (hero only), drag to
   turn, gentle mouse parallax. */
import * as THREE from 'three';
import { GLTFLoader } from '../assets/vendor/three/GLTFLoader.js';
import { RoomEnvironment } from '../assets/vendor/three/RoomEnvironment.js';
import { MeshoptDecoder } from '../assets/vendor/three/meshopt_decoder.module.js';

var section = document.querySelector('.s-hero--model');
var canvas = document.querySelector('[data-hero-gl]');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

var scene = new THREE.Scene();
var pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.6, 5.2);
camera.lookAt(0, -0.05, 0);

var key = new THREE.DirectionalLight(0xfff1d6, 2.2);
key.position.set(2.5, 3.5, 3);
scene.add(key);
var rim = new THREE.DirectionalLight(0xfe8826, 0.9);
rim.position.set(-3, 1.2, -2.5);
scene.add(rim);
scene.add(new THREE.AmbientLight(0xfff6e8, 0.35));

var holder = new THREE.Group();
scene.add(holder);

var loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.load('assets/models/croissant.glb', function (gltf) {
  var model = gltf.scene;
  var box = new THREE.Box3().setFromObject(model);
  var size = box.getSize(new THREE.Vector3());
  var centre = box.getCenter(new THREE.Vector3());
  model.position.sub(centre);
  var s = 2.8 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(s);
  holder.add(model);
}, undefined, function () { section.classList.add('no-gl'); });

/* soft contact shadow */
var shadowBase = 0.10;
var shadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.05, 40),
  new THREE.MeshBasicMaterial({ color: 0x60150d, transparent: true, opacity: shadowBase, depthWrite: false })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -0.88;
shadow.scale.set(1.25, 1, 1);
scene.add(shadow);

/* state + theme toggle (spin/pulse pills removed at Dinesh's order) */
var velY = 0, targetRX = 0.32, dragging = false, lastX = 0, lastY = 0;
var parX = 0, parY = 0;
holder.rotation.x = targetRX;

document.querySelector('[data-hero-theme]').addEventListener('click', function () {
  var dark = section.classList.toggle('is-dark');
  shadowBase = dark ? 0.30 : 0.10;
  shadow.material.color.set(dark ? 0x000000 : 0x60150d);
});

canvas.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('pointerup', function () { dragging = false; });
window.addEventListener('pointermove', function (e) {
  if (!dragging) return;
  velY = (e.clientX - lastX) * 0.005;
  holder.rotation.y += velY;
  targetRX = THREE.MathUtils.clamp(targetRX + (e.clientY - lastY) * 0.004, -0.4, 1.1);
  lastX = e.clientX; lastY = e.clientY;
});
section.addEventListener('pointermove', function (e) {
  var r = section.getBoundingClientRect();
  parX = ((e.clientX - r.left) / r.width) * 2 - 1;
  parY = ((e.clientY - r.top) / r.height) * 2 - 1;
});

var fit = 1;
function resize() {
  var w = section.clientWidth, h = section.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  var visibleW = 2 * 5.2 * Math.tan(THREE.MathUtils.degToRad(19)) * camera.aspect;
  fit = Math.min(1, (visibleW * 0.92) / 2.8);
  holder.scale.setScalar(fit);
  shadow.scale.set(1.25 * fit, fit, 1);
  shadow.position.y = camera.aspect < 1 ? -0.55 : -0.88;
}
window.addEventListener('resize', resize);
resize();

/* render only while the hero is on screen */
var visible = true;
new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(section);

var clock = new THREE.Clock();
var introT = 0;
(function tick() {
  requestAnimationFrame(tick);
  if (!visible) return;
  var t = clock.getElapsedTime();
  if (introT < 1) introT = Math.min(1, introT + 0.011);
  var e = 1 - Math.pow(1 - introT, 3); /* ease-out entrance */
  if (!dragging) {
    holder.rotation.y += 0.005 + velY + (1 - e) * 0.045;
    velY *= 0.95;
  }
  var sc = fit * (0.55 + 0.45 * e) * (1 + Math.sin(t * 1.3) * 0.012); /* grow-in + breathing */
  holder.scale.set(sc, sc, sc);
  holder.rotation.x += (targetRX - holder.rotation.x) * 0.06 + parY * 0.0006;
  holder.rotation.z = Math.sin(t * 0.7) * 0.045 + parX * -0.03; /* gentle rocking */
  holder.position.y = Math.sin(t * 1.1) * 0.07 - (1 - e) * 0.35;
  holder.position.x = parX * 0.08;
  shadow.material.opacity = shadowBase + Math.sin(t * 1.1) * 0.018;
  renderer.render(scene, camera);
})();

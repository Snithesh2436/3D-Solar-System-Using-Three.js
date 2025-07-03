const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 5, 500);

scene.add(pointLight);

// Sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planets data
const planetsData = [
  { name: "Mercury", color: 0xaaaaaa, size: 0.2, distance: 4, speed: 0.04 },
  { name: "Venus",   color: 0xffcc66, size: 0.4, distance: 6, speed: 0.03 },
  { name: "Earth",   color: 0x3366ff, size: 0.5, distance: 8, speed: 0.02 },
  { name: "Mars",    color: 0xff3300, size: 0.3, distance: 10, speed: 0.015 },
  { name: "Jupiter", color: 0xff9966, size: 1.1, distance: 14, speed: 0.01 },
  { name: "Saturn",  color: 0xffff99, size: 0.9, distance: 18, speed: 0.007 },
  { name: "Uranus",  color: 0x66ffff, size: 0.7, distance: 22, speed: 0.005 },
  { name: "Neptune", color: 0x3366cc, size: 0.7, distance: 26, speed: 0.004 }
];

const planets = [];
const orbitAngles = [];
const speeds = {};

planetsData.forEach((data, i) => {
  const geometry = new THREE.SphereGeometry(data.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: data.color });
  const planet = new THREE.Mesh(geometry, material);
  scene.add(planet);
  planets.push(planet);
  orbitAngles.push(Math.random() * Math.PI * 2);
  speeds[data.name] = data.speed;

  // UI Controls
  const controls = document.getElementById('controls');
  const label = document.createElement('label');
  label.textContent = `${data.name} Speed:`;
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '0.1';
  slider.step = '0.001';
  slider.value = data.speed;
  slider.addEventListener('input', () => {
    speeds[data.name] = parseFloat(slider.value);
  });
  label.appendChild(slider);
  controls.appendChild(label);
});

// Pause/Resume Button
let paused = false;
const pauseBtn = document.createElement('button');
pauseBtn.textContent = 'Pause';
pauseBtn.onclick = () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
};
document.getElementById('controls').appendChild(pauseBtn);

camera.position.set(30, 20, 30);
camera.lookAt(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    planets.forEach((planet, i) => {
      const { name, distance } = planetsData[i];
      orbitAngles[i] += speeds[name];
      planet.position.x = Math.cos(orbitAngles[i]) * distance;
      planet.position.z = Math.sin(orbitAngles[i]) * distance;
    });
  }
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// === Stars ===
function addStars(count = 500) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < count; i++) {
    const x = THREE.MathUtils.randFloatSpread(600);
    const y = THREE.MathUtils.randFloatSpread(600);
    const z = THREE.MathUtils.randFloatSpread(600);
    positions.push(x, y, z);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}
addStars();

// === Orbit Lines ===
const orbitLines = [];
function addOrbit(distance) {
  const orbitShape = new THREE.EllipseCurve(0, 0, distance, distance, 0, 2 * Math.PI, false, 0);
  const points = orbitShape.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0, p.y)));
  const material = new THREE.LineBasicMaterial({ color: 0x555555 });
  const ellipse = new THREE.LineLoop(geometry, material);
  scene.add(ellipse);
  orbitLines.push(ellipse);
}
planetsData.forEach(data => addOrbit(data.distance));

// === Tooltip on Hover ===
const tooltip = document.getElementById('tooltip');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    const planet = intersects[0].object;
    const name = planetsData[planets.indexOf(planet)].name;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.innerText = name;
  } else {
    tooltip.style.display = 'none';
  }
});

// === Camera Zoom on Planet Click ===
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    const clickedPlanet = intersects[0].object;
    const targetPos = clickedPlanet.position.clone().normalize().multiplyScalar(8).add(clickedPlanet.position);
    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y + 3,
      z: targetPos.z + 5,
      duration: 1.5,
      onUpdate: () => camera.lookAt(clickedPlanet.position)
    });
  } else {
    gsap.to(camera.position, {
      x: 30, y: 20, z: 30,
      duration: 1.5,
      onUpdate: () => camera.lookAt(0, 0, 0)
    });
  }
});

// === Dark/Light Mode Toggle ===
let isDarkMode = true;
const toggleBtn = document.createElement('button');
toggleBtn.textContent = 'Toggle Light Mode';
toggleBtn.onclick = () => {
  isDarkMode = !isDarkMode;
  toggleBtn.textContent = isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  scene.background = new THREE.Color(isDarkMode ? 0x000000 : 0xf0f0f0);
  orbitLines.forEach(line => line.material.color.set(isDarkMode ? 0x555555 : 0x888888));
  const controlsDiv = document.getElementById('controls');
  controlsDiv.style.background = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
  controlsDiv.style.color = isDarkMode ? 'white' : 'black';
  tooltip.style.background = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
  tooltip.style.color = isDarkMode ? 'white' : 'black';
};
document.getElementById('controls').appendChild(toggleBtn);

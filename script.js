// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// After setting up the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(5, 8, 5);
pointLight.castShadow = true;
// Improve shadow quality
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 500;
scene.add(pointLight);

// Create a cube with PhongMaterial instead of BasicMaterial
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhongMaterial({ 
    color: 0xD44D4D,
    shininess: 60
});
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true; // Enable shadow casting
scene.add(cube);

// Add a plane
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x579584 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
plane.position.y = -2; // Position below the cube
plane.receiveShadow = true; // Enable shadow receiving
scene.add(plane);

camera.position.z = 5;
camera.position.y = 1;

// After the scene setup...
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Add these variables after the existing declarations
let velocity = { x: 0, y: 0 };
let isDecelerating = false;
const friction = 0.9; // Adjust this value to change deceleration speed
const velocityThreshold = 0.001; // Minimum velocity before stopping

// Add these event listeners after the window resize listener
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
renderer.domElement.addEventListener('touchend', onTouchEnd);

function onMouseDown(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cube);
    
    if (intersects.length > 0) {
        isDragging = true;
        isDecelerating = false;
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
}

function onMouseMove(event) {
    if (isDragging) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };

        // Store the velocity for use after release
        velocity.x = deltaMove.x * 0.01;
        velocity.y = -deltaMove.y * 0.01;

        // Direct movement while dragging
        cube.position.x += deltaMove.x * 0.01;
        cube.position.y -= deltaMove.y * 0.01;

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
}

function onMouseUp() {
    isDragging = false;
    isDecelerating = true;
}

function onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cube);
    
    if (intersects.length > 0) {
        isDragging = true;
        isDecelerating = false;
        previousMousePosition = {
            x: touch.clientX,
            y: touch.clientY
        };
    }
}

function onTouchMove(event) {
    event.preventDefault();
    if (isDragging) {
        const touch = event.touches[0];
        const deltaMove = {
            x: touch.clientX - previousMousePosition.x,
            y: touch.clientY - previousMousePosition.y
        };

        // Store the velocity for use after release
        velocity.x = deltaMove.x * 0.01;
        velocity.y = -deltaMove.y * 0.01;

        // Direct movement while dragging
        cube.position.x += deltaMove.x * 0.01;
        cube.position.y -= deltaMove.y * 0.01;

        previousMousePosition = {
            x: touch.clientX,
            y: touch.clientY
        };
    }
}

function onTouchEnd() {
    isDragging = false;
    isDecelerating = true;
}

// Modify the animate function
function animate() {
    requestAnimationFrame(animate);

    // Handle deceleration
    if (isDecelerating) {
        if (Math.abs(velocity.x) > velocityThreshold || Math.abs(velocity.y) > velocityThreshold) {
            cube.position.x += velocity.x;
            cube.position.y += velocity.y;
            
            // Apply friction
            velocity.x *= friction;
            velocity.y *= friction;
        } else {
            // Stop movement when velocity is very low
            isDecelerating = false;
            velocity.x = 0;
            velocity.y = 0;
        }
    }
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    

    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

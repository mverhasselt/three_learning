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
const geometry = new THREE.IcosahedronGeometry(0.8);
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

// Add these variables with the other declarations
let enableTilt = false;
let tiltSensitivity = 0.05;

// Add event listener for device orientation
window.addEventListener('deviceorientation', handleOrientation, true);

// Add a function to handle device orientation
function handleOrientation(event) {
    if (!enableTilt || isDragging || isDecelerating) return;
    
    // Beta is front-to-back tilt in degrees, in the range [-180,180]
    // Gamma is left-to-right tilt in degrees, in the range [-90,90]
    const tiltX = event.gamma * tiltSensitivity;
    const tiltY = event.beta * tiltSensitivity;
    
    if (tiltX !== null && tiltY !== null) {
        velocity.x = tiltX * 0.01;
        velocity.y = -tiltY * 0.01;
        
        cube.position.x += velocity.x;
        cube.position.y += velocity.y;
    }
}

// Add these event listeners after the window resize listener
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
renderer.domElement.addEventListener('touchend', onTouchEnd);

// Add these helper functions after the event listener declarations
function startDrag(x, y) {
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cube);
    
    if (intersects.length > 0) {
        isDragging = true;
        isDecelerating = false;
        previousMousePosition = { x, y };
    }
}

function updateDrag(x, y) {
    if (isDragging) {
        const deltaMove = {
            x: x - previousMousePosition.x,
            y: y - previousMousePosition.y
        };

        // Store the velocity for use after release
        velocity.x = deltaMove.x * 0.01;
        velocity.y = -deltaMove.y * 0.01;

        // Direct movement while dragging
        cube.position.x += deltaMove.x * 0.01;
        cube.position.y -= deltaMove.y * 0.01;

        previousMousePosition = { x, y };
    }
}

function endDrag() {
    isDragging = false;
    isDecelerating = true;
}

// Simplify the event handlers to use the shared functions
function onMouseDown(event) {
    event.preventDefault();
    startDrag(event.clientX, event.clientY);
}

function onMouseMove(event) {
    updateDrag(event.clientX, event.clientY);
}

function onMouseUp() {
    endDrag();
}

function onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    startDrag(touch.clientX, touch.clientY);
}

function onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    updateDrag(touch.clientX, touch.clientY);
}

function onTouchEnd() {
    endDrag();
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

// Add a function to request device orientation permission (needed for iOS)
function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    enableTilt = true;
                }
            })
            .catch(console.error);
    } else {
        // Handle regular non-iOS devices
        enableTilt = true;
    }
}

// Add a button to your HTML to request permission and enable tilt
const button = document.createElement('button');
button.textContent = 'Enable Tilt Controls';
button.style.position = 'fixed';
button.style.bottom = '20px';
button.style.left = '50%';
button.style.transform = 'translateX(-50%)';
button.style.padding = '10px 20px';
button.style.zIndex = '1000';
button.addEventListener('click', requestOrientationPermission);
document.body.appendChild(button);

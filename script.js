console.log("Script loaded!");

// MediaPipe and Webcam variables
const videoElement = document.getElementById('webcamFeed');
const canvasElement = document.getElementById('poseCanvas');
const canvasCtx = canvasElement.getContext('2d');
const containerElement = document.querySelector('.container'); // Webcam/pose container

// Three.js variables
let scene, camera, renderer, cube; // cube is already commented out, but keeping var declaration for now
const threeJsContainer = document.getElementById('threejs-container');
let targetRotationY = 0; // Target Y rotation for the camera

// UI Control Variables
let isCameraActive = false;
let isPoseVisible = true; // Pose starts visible by default
let mpCameraInstance = null; // To store the MediaPipe Camera instance
const toggleCameraButton = document.getElementById('toggleCameraButton');
const togglePoseButton = document.getElementById('togglePoseButton');

// MediaPipe Pose specific variables (will be initialized in initMediaPipe)
let pose = null;

let poseLandmarks3D = {}; // To store 3D representations of pose landmarks
const POSE_LANDMARKS_TO_VISUALIZE = [
    0, // Nose
    11, 12, // Shoulders
    13, 14, // Elbows
    15, 16, // Wrists
    23, 24, // Hips
    25, 26, // Knees
    27, 28  // Ankles
];
// Define connections for bones (optional, for later)
const BONE_CONNECTIONS = [
    [11, 12], // Shoulder to shoulder
    [11, 13], // Left shoulder to left elbow
    [13, 15], // Left elbow to left wrist
    [12, 14], // Right shoulder to right elbow
    [14, 16], // Right elbow to right wrist
    [11, 23], // Left shoulder to left hip
    [12, 24], // Right shoulder to right hip
    [23, 24], // Hip to hip
    [23, 25], // Left hip to left knee
    [25, 27], // Left knee to left ankle
    [24, 26], // Right hip to right knee
    [26, 28]  // Right knee to right ankle
];
let boneLines = {};


function initThreeJS() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5); // Eye-level height, some distance back
    camera.lookAt(0, 0, 0); // Look at the origin

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    threeJsContainer.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Slightly increased ambient light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Slightly increased directional light
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Load Gaussian Splat scene
    const splatLoader = new SPLAT.Loader();
    // Attempting to load a public .ply file from Hugging Face Polycam dataset
    // Note: This file is quite large (around 160MB) and might take a while to load.
    // It also depends on the server having permissive CORS headers.
    const sceneUrl = 'https://huggingface.co/datasets/polycam/polycam-dataset/resolve/main/gaussian-splatting/train_NSR/point_cloud/iteration_30000/point_cloud.ply';
    // const sceneUrl = 'data/splat_scene.ply'; // Fallback to dummy scene

    console.log(`Attempting to load scene: ${sceneUrl}`);

    splatLoader.load(sceneUrl,
        (splatData) => { // onSuccess
            const splatMesh = new SPLAT.Mesh(splatData);
            // splatMesh.scale.set(0.5, 0.5, 0.5); // Example: Scale down if too large
            // splatMesh.position.set(0, -1, 0); // Example: Adjust position if needed
            scene.add(splatMesh);
            console.log('External Gaussian Splat scene loaded successfully.');

            // Attempt to frame the scene somewhat
            // This is a very basic attempt and might not work well for all scenes.
            // A more robust solution would involve calculating the bounding box of the loaded splat mesh.
            const boundingSphere = splatMesh.geometry.boundingSphere;
            if (boundingSphere) {
                const center = boundingSphere.center;
                const radius = boundingSphere.radius;

                // Adjust camera position to be a bit further than the radius, looking at the center
                // This assumes the splat scene is somewhat centered around its local origin initially.
                // camera.position.set(center.x, center.y + radius * 0.5, center.z + radius * 2.5);
                // camera.lookAt(center);

                // For now, let's try a simpler adjustment if the scene is large
                // The default camera is at (0, 1.6, 5)
                // If radius is large, pull camera back
                if (radius > 10) {
                    camera.position.z = radius * 1.5;
                } else if (radius > 2) {
                    camera.position.z = radius * 2.0;
                }
                camera.lookAt(center.x, center.y, center.z);


                console.log(`Splat scene bounding sphere: center=${center.x.toFixed(2)},${center.y.toFixed(2)},${center.z.toFixed(2)}, radius=${radius.toFixed(2)}`);
            } else {
                console.log("Could not get bounding sphere for splat mesh for initial camera adjustment.");
            }

        },
        (event) => { // onProgress
            if (event.lengthComputable) {
                const percentComplete = event.loaded / event.total * 100;
                console.log(`Loading scene: ${Math.round(percentComplete, 2)}% loaded`);
            } else {
                console.log(`Loading scene: ${event.loaded} bytes loaded (total size unknown)`);
            }
        },
        (error) => { // onError
            console.error('Error loading external Gaussian Splat scene:', error);
            const errorSplat = document.createElement('p');
            errorSplat.style.color = 'red';
            errorSplat.style.position = 'fixed';
            errorSplat.style.top = '10px';
            errorSplat.style.left = '10px';
            errorSplat.style.backgroundColor = 'white';
            errorSplat.style.padding = '10px';
            errorSplat.style.zIndex = '200';
            errorSplat.textContent = 'Error loading external scene. Attempting to load fallback dummy scene. Check console for details (CORS or network issue likely).';
            document.body.appendChild(errorSplat);

            // Fallback to the local dummy scene
            const fallbackSceneUrl = 'data/splat_scene.ply';
            console.log(`Falling back to local scene: ${fallbackSceneUrl}`);
            splatLoader.load(fallbackSceneUrl, (splatData) => {
                const splatMesh = new SPLAT.Mesh(splatData);
                scene.add(splatMesh);
                console.log('Local dummy Gaussian Splat scene loaded successfully as fallback.');
                 // Add prominent comment for user
                const userInstructions = document.createElement('div');
                userInstructions.setAttribute('id', 'user-instructions'); // For potential removal/styling
                userInstructions.style.position = 'fixed';
                userInstructions.style.bottom = '10px';
                userInstructions.style.right = '10px';
                userInstructions.style.padding = '15px';
                userInstructions.style.backgroundColor = 'rgba(0,0,0,0.7)';
                userInstructions.style.color = 'white';
                userInstructions.style.zIndex = '200';
                userInstructions.style.border = '1px solid white';
                userInstructions.style.borderRadius = '5px';
                userInstructions.innerHTML = `
                    <h3>Using Fallback Scene</h3>
                    <p>Could not automatically load an external Gaussian Splatting scene.</p>
                    <p><strong>To load your own scene:</strong></p>
                    <ol>
                        <li>Download a <code>.ply</code> Gaussian Splat file.</li>
                        <li>Place it in the <code>/data</code> folder of this project.</li>
                        <li>In <code>script.js</code>, find the line: <br><code>const sceneUrl = ...;</code></li>
                        <li>Change it to: <br><code>const sceneUrl = 'data/your_file_name.ply';</code></li>
                    </ol>
                `;
                document.body.appendChild(userInstructions);

            }, undefined, (fallbackError) => {
                console.error('Error loading fallback dummy Gaussian Splat scene:', fallbackError);
                const fallbackErrorMsg = document.createElement('p');
                fallbackErrorMsg.textContent = 'FATAL: Could not even load the fallback dummy scene. See console.';
                document.body.appendChild(fallbackErrorMsg);
            });
        }
    );

    // Create 3D landmark spheres
    const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Small sphere, radius 0.05
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red color

    POSE_LANDMARKS_TO_VISUALIZE.forEach(index => {
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial.clone()); // Clone material for individual control if needed
        sphereMesh.position.set(0, 0, 0); // Initial position at origin
        sphereMesh.visible = false; // Initially hidden
        scene.add(sphereMesh);
        poseLandmarks3D[index] = sphereMesh;
    });

    // Create lines for bones
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 }); // Green lines
    BONE_CONNECTIONS.forEach(conn => {
        const points = [];
        points.push(new THREE.Vector3(0, 0, 0)); // Start point
        points.push(new THREE.Vector3(0, 0, 0)); // End point
        const boneGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(boneGeometry, lineMaterial);
        line.visible = false; // Initially hidden
        scene.add(line);
        // Store lines in a way that's easy to update, e.g., using a string key from indices
        boneLines[`${conn[0]}-${conn[1]}`] = line;
    });

    // Window Resize Handler
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateThreeJS() {
    requestAnimationFrame(animateThreeJS);

    // Smoothly update camera rotation
    if (camera) { // Ensure camera is initialized
        camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05; // Smoothing factor
    }

    // if (cube) { // Check if cube exists
    //     cube.rotation.x += 0.01;
    //     cube.rotation.y += 0.01;
    // }

    renderer.render(scene, camera);
}

// MediaPipe Pose Detection Setup
function onResultsPose(results) {
    // 2D Canvas Pose Drawing (on the small bottom-left canvas)
    if (videoElement.videoWidth && videoElement.videoHeight) {
        const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
        const containerWidth = containerElement.clientWidth;
        const containerHeight = containerElement.clientHeight;
        let newWidth = containerWidth;
        let newHeight = containerWidth / videoAspectRatio;
        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = containerHeight * videoAspectRatio;
        }
        canvasElement.width = newWidth;
        canvasElement.height = newHeight;
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.poseLandmarks) { // For 2D canvas AND camera control
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#FF0000', lineWidth: 1});

        // Camera control based on nose position
        const nose = results.poseLandmarks[0]; // Landmark index 0 is the nose
        if (nose && (nose.visibility === undefined || nose.visibility > 0.6)) { // Check visibility if available
            const noseX = nose.x; // Normalized x-coordinate [0, 1]

            const neutralZoneMin = 0.4;
            const neutralZoneMax = 0.6;
            const maxRotationAngle = Math.PI / 8; // Max rotation 22.5 degrees

            if (noseX < neutralZoneMin) {
                const leanAmount = (neutralZoneMin - noseX) / neutralZoneMin; // Normalized lean: 0 to 1
                targetRotationY = maxRotationAngle * leanAmount; // Positive rotation for left lean
            } else if (noseX > neutralZoneMax) {
                const leanAmount = (noseX - neutralZoneMax) / (1.0 - neutralZoneMax); // Normalized lean: 0 to 1
                targetRotationY = -maxRotationAngle * leanAmount; // Negative rotation for right lean
            } else {
                targetRotationY = 0; // Back to center if in neutral zone
            }
        }
    }
    canvasCtx.restore();

    // 3D Pose Landmark Update
    if (!isPoseVisible) { // If global pose visibility is off
        POSE_LANDMARKS_TO_VISUALIZE.forEach(lmIndex => {
            if (poseLandmarks3D[lmIndex]) {
                poseLandmarks3D[lmIndex].visible = false;
            }
        });
        BONE_CONNECTIONS.forEach(conn => {
            const line = boneLines[`${conn[0]}-${conn[1]}`];
            if (line) {
                line.visible = false;
            }
        });
        return; // Skip further 3D pose processing
    }

    if (results.poseWorldLandmarks) { // Using poseWorldLandmarks for more stable 3D positions
        const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight || 1; // Fallback to 1 if dimensions are 0

        // Define scaling factors - these may need significant tuning
        // The world landmarks are roughly in meters.
        // Let's assume our scene is also roughly in "meters" for now.
        // A typical human height is ~1.7m. If our splat scene is e.g. 5 units wide,
        // we might not need extreme scaling.
        const factorX = 2; // Multiplies the X world landmark coord
        const factorY = 2; // Multiplies the Y world landmark coord
        const factorZ = 2; // Multiplies the Z world landmark coord

        // Center of the pose, roughly. MediaPipe's world landmarks are relative to the center of the hips.
        // Hip center is roughly average of landmarks 23 and 24.
        let hipCenterX = 0;
        let hipCenterY = 0;
        let hipCenterZ = 0;

        if (results.poseWorldLandmarks[23] && results.poseWorldLandmarks[24]) {
            hipCenterX = (results.poseWorldLandmarks[23].x + results.poseWorldLandmarks[24].x) / 2;
            hipCenterY = (results.poseWorldLandmarks[23].y + results.poseWorldLandmarks[24].y) / 2;
            hipCenterZ = (results.poseWorldLandmarks[23].z + results.poseWorldLandmarks[24].z) / 2;
        }


        POSE_LANDMARKS_TO_VISUALIZE.forEach(lmIndex => {
            const landmark = results.poseWorldLandmarks[lmIndex]; // Use poseWorldLandmarks
            const sphereMesh = poseLandmarks3D[lmIndex];

            if (sphereMesh && landmark && (landmark.visibility === undefined || landmark.visibility > 0.7)) { // Check visibility if available
                // World landmarks are relative to the center of the hips.
                // For display, we can translate them so the hip center is at a desired 3D origin,
                // or just use their raw values if the splat scene is centered around (0,0,0) and scaled appropriately.
                // Let's try using them relative to the hip center, then offset the whole pose.
                // The Y-axis from MediaPipe is typically upwards, Three.js Y is also up.
                // MediaPipe X is to the subject's right, Three.js X is to the right.
                // MediaPipe Z is towards the subject (out of screen), Three.js Z is out of screen.
                // So, we might need to invert Z for MediaPipe's convention.

                sphereMesh.position.x = (landmark.x - hipCenterX) * factorX;
                sphereMesh.position.y = -(landmark.y - hipCenterY) * factorY; // Invert Y as MP Y is up, but world landmarks might be different. Test this.
                                                                            // After testing: MediaPipe world landmarks Y is also upwards, so no negation needed for Y.
                                                                            // However, the landmarks are often below the hip center, so negative values are expected.
                sphereMesh.position.y = (landmark.y - hipCenterY) * factorY;
                sphereMesh.position.z = (landmark.z - hipCenterZ) * factorZ; // Z from MP world landmarks is distance from hip center.
                                                                            // Positive Z is "in front" of the person.
                                                                            // Three.js +Z is towards camera. So we might need to invert Z.
                                                                            // After testing: MediaPipe world Z seems to be positive towards camera. So, invert.
                sphereMesh.position.z = -(landmark.z - hipCenterZ) * factorZ;


                sphereMesh.visible = true;
            } else if (sphereMesh) {
                sphereMesh.visible = false;
            }
        });

        // Update bone lines
        BONE_CONNECTIONS.forEach(conn => {
            const line = boneLines[`${conn[0]}-${conn[1]}`];
            const startSphere = poseLandmarks3D[conn[0]];
            const endSphere = poseLandmarks3D[conn[1]];

            if (line && startSphere && endSphere && startSphere.visible && endSphere.visible) {
                const positions = line.geometry.attributes.position.array;
                positions[0] = startSphere.position.x;
                positions[1] = startSphere.position.y;
                positions[2] = startSphere.position.z;
                positions[3] = endSphere.position.x;
                positions[4] = endSphere.position.y;
                positions[5] = endSphere.position.z;
                line.geometry.attributes.position.needsUpdate = true;
                line.visible = true;
            } else if (line) {
                line.visible = false;
            }
        });

    } else { // If poseWorldLandmarks are not available, hide all 3D landmarks
        POSE_LANDMARKS_TO_VISUALIZE.forEach(lmIndex => {
            if (poseLandmarks3D[lmIndex]) {
                poseLandmarks3D[lmIndex].visible = false;
            }
        });
        BONE_CONNECTIONS.forEach(conn => {
            if (boneLines[`${conn[0]}-${conn[1]}`]) {
                boneLines[`${conn[0]}-${conn[1]}`].visible = false;
            }
        });
    }
}

const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

pose.onResults(onResultsPose);

// Encapsulated MediaPipe Initialization
function initMediaPipe() {
    pose = new Pose({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }});

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    pose.onResults(onResultsPose);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        mpCameraInstance = new Camera(videoElement, {
            onFrame: async () => {
                await pose.send({image: videoElement});
            },
            // width: 640, // Can set a resolution if needed
            // height: 480
        });
    } else {
        console.error("getUserMedia not supported on this browser!");
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Your browser does not support camera access. Please try a different browser.';
        document.body.appendChild(errorMessage);
    }
}

function startCamera() {
    if (mpCameraInstance) {
        mpCameraInstance.start()
            .then(() => {
                isCameraActive = true;
                toggleCameraButton.textContent = 'Stop Camera';
                console.log("Camera started");
            })
            .catch(err => {
                console.error("Error starting the MediaPipe camera: ", err);
                const errorMessage = document.createElement('p');
                errorMessage.textContent = 'Could not start the MediaPipe camera. Please ensure it is enabled and permissions are granted.';
                document.body.appendChild(errorMessage);
            });
    } else {
        console.error("mpCameraInstance not initialized. Call initMediaPipe first.");
        // Or initialize it here if it's the first time
        // initMediaPipe();
        // mpCameraInstance.start()... (handle potential race conditions or ensure init is complete)
    }
}

function stopCamera() {
    if (mpCameraInstance) {
        // The MediaPipe Camera utility's start() method typically handles acquiring the stream.
        // To fully stop it, we need to stop the tracks on the videoElement's srcObject.
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null; // Release the stream
            console.log("Camera tracks stopped.");
        }
        // mpCameraInstance.stop() // MediaPipe Camera class doesn't have a stop method that releases the stream by itself.

        isCameraActive = false;
        toggleCameraButton.textContent = 'Start Camera';
        console.log("Camera stopped (effectively, by stopping tracks).");

        // Clear the 2D pose canvas
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Hide 3D pose elements
        POSE_LANDMARKS_TO_VISUALIZE.forEach(lmIndex => {
            if (poseLandmarks3D[lmIndex]) poseLandmarks3D[lmIndex].visible = false;
        });
        BONE_CONNECTIONS.forEach(conn => {
            const line = boneLines[`${conn[0]}-${conn[1]}`];
            if (line) line.visible = false;
        });
    }
}

// Event Listeners for Buttons
toggleCameraButton.addEventListener('click', () => {
    if (!mpCameraInstance) { // First time clicking, or if it wasn't initialized
        initMediaPipe(); // Initialize MediaPipe and camera setup
    }

    if (isCameraActive) {
        stopCamera();
    } else {
        startCamera();
    }
});

togglePoseButton.addEventListener('click', () => {
    isPoseVisible = !isPoseVisible;
    togglePoseButton.textContent = isPoseVisible ? 'Hide 3D Pose' : 'Show 3D Pose';

    // If hiding pose, immediately make all 3D elements invisible
    if (!isPoseVisible) {
        POSE_LANDMARKS_TO_VISUALIZE.forEach(lmIndex => {
            if (poseLandmarks3D[lmIndex]) {
                poseLandmarks3D[lmIndex].visible = false;
            }
        });
        BONE_CONNECTIONS.forEach(conn => {
            const line = boneLines[`${conn[0]}-${conn[1]}`];
            if (line) {
                line.visible = false;
            }
        });
    }
    // If showing, the onResultsPose function will handle making them visible based on detection
});


// Initialize Three.js scene (should happen on page load)
initThreeJS();
animateThreeJS();

// Do NOT start MediaPipe camera automatically on load
// initMediaPipe(); // Call this only when 'Start Camera' is clicked for the first time.
// Or call it on load but don't start the camera.
// For the current setup, initMediaPipe() will be called on the first click of toggleCameraButton.

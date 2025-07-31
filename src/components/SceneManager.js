import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Room } from './Room.js';
import { Furniture } from './Furniture.js';

export default class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.furnitureGroup = new THREE.Group();
        this.selectedObject = null;
        this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.roomSize = 10; // Define room size for boundary checks

        this.scene.add(this.furnitureGroup);
        this.setupScene();
        this.addObjects();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this), false);
        this.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this), false);
        this.renderer.domElement.addEventListener('pointerup', this.onPointerUp.bind(this), false);
    }

    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.set(0, 5, 10);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI / 2;
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
    }

    addObjects() {
        new Room(this.scene);
        new Furniture(this.furnitureGroup);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onPointerDown(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.furnitureGroup.children);
        if (intersects.length > 0) {
            this.controls.enabled = false;
            this.selectedObject = intersects[0].object;
        }
    }

    onPointerMove(event) {
        if (this.selectedObject) {
            // 1. Find the potential new position on the floor
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersectionPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.floorPlane, intersectionPoint);

            // 2. Clamp the position to keep the object within the room walls
            const selectedObjectSize = new THREE.Box3().setFromObject(this.selectedObject).getSize(new THREE.Vector3());
            const halfRoomSize = this.roomSize / 2;
            const halfX = selectedObjectSize.x / 2;
            const halfZ = selectedObjectSize.z / 2;

            intersectionPoint.x = THREE.MathUtils.clamp(intersectionPoint.x, -halfRoomSize + halfX, halfRoomSize - halfX);
            intersectionPoint.z = THREE.MathUtils.clamp(intersectionPoint.z, -halfRoomSize + halfZ, halfRoomSize - halfZ);

            // 3. Check for collisions with other objects
            let highestY = 0; // The top of the highest object we're colliding with
            const selectedObjectBBox = new THREE.Box3().setFromObject(this.selectedObject);
            const collisionTargets = this.furnitureGroup.children.filter(child => child !== this.selectedObject);

            for (const target of collisionTargets) {
                const targetBBox = new THREE.Box3().setFromObject(target);
                
                // Create a temporary BBox for the selected object at its potential new X/Z position
                const tempBBox = selectedObjectBBox.clone();
                tempBBox.translate(new THREE.Vector3(
                    intersectionPoint.x - this.selectedObject.position.x,
                    0, // We only care about X/Z intersection for now
                    intersectionPoint.z - this.selectedObject.position.z
                ));

                if (tempBBox.intersectsBox(targetBBox)) {
                    // We have a collision! Find the top of this target object.
                    const targetTopY = target.position.y + (targetBBox.getSize(new THREE.Vector3()).y / 2);
                    // If this object is the highest one we've hit so far, update highestY
                    if (targetTopY > highestY) {
                        highestY = targetTopY;
                    }
                }
            }
            
            // 4. Set the final position
            this.selectedObject.position.x = intersectionPoint.x;
            this.selectedObject.position.z = intersectionPoint.z;
            // The final Y position is on top of the highest collided object, or on the floor if no collisions.
            this.selectedObject.position.y = highestY + (selectedObjectSize.y / 2);
        }
    }

    onPointerUp() {
        this.controls.enabled = true;
        this.selectedObject = null;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

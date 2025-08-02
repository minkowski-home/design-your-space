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
        this.roomSize = 10;

        // Physics Properties
        this.gravity = new THREE.Vector3(0, -9.8, 0);
        this.tempVector = new THREE.Vector3();
        this.clock = new THREE.Clock();

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
            if (!this.selectedObject.userData.velocity) {
                this.selectedObject.userData.velocity = new THREE.Vector3();
            }
        }
    }

    onPointerMove(event) {
        if (this.selectedObject) {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersectionPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.floorPlane, intersectionPoint);
            const selectedObjectSize = new THREE.Box3().setFromObject(this.selectedObject).getSize(new THREE.Vector3());
            const halfRoomSize = this.roomSize / 2;
            intersectionPoint.x = THREE.MathUtils.clamp(intersectionPoint.x, -halfRoomSize + (selectedObjectSize.x / 2), halfRoomSize - (selectedObjectSize.x / 2));
            intersectionPoint.z = THREE.MathUtils.clamp(intersectionPoint.z, -halfRoomSize + (selectedObjectSize.z / 2), halfRoomSize - (selectedObjectSize.z / 2));
            
            let highestY = 0;
            const selectedObjectBBox = new THREE.Box3().setFromObject(this.selectedObject);
            const collisionTargets = this.furnitureGroup.children.filter(child => child !== this.selectedObject);
            for (const target of collisionTargets) {
                const targetBBox = new THREE.Box3().setFromObject(target);
                const tempBBox = selectedObjectBBox.clone();
                tempBBox.translate(new THREE.Vector3(intersectionPoint.x - this.selectedObject.position.x, 0, intersectionPoint.z - this.selectedObject.position.z));
                if (tempBBox.intersectsBox(targetBBox)) {
                    const targetTopY = target.position.y + (targetBBox.getSize(this.tempVector).y / 2);
                    if (targetTopY > highestY) {
                        highestY = targetTopY;
                    }
                }
            }
            this.selectedObject.position.x = intersectionPoint.x;
            this.selectedObject.position.z = intersectionPoint.z;
            this.selectedObject.position.y = highestY + (selectedObjectSize.y / 2);
        }
    }

    onPointerUp() {
        this.controls.enabled = true;
        if (this.selectedObject) {
            this.selectedObject.userData.velocity.y = 0;
            this.selectedObject = null;
        }
    }

    applyGravity(deltaTime) {
        for (const object of this.furnitureGroup.children) {
            if (object === this.selectedObject) continue;
            if (!object.userData.velocity) {
                object.userData.velocity = new THREE.Vector3();
            }

            const objectBBox = new THREE.Box3().setFromObject(object);
            const objectSize = objectBBox.getSize(this.tempVector);
            const halfHeight = objectSize.y / 2;
            const objectBottom = object.position.y - halfHeight;

            let groundY = 0;
            const collisionTargets = this.furnitureGroup.children.filter(child => child !== object);
            
            for (const target of collisionTargets) {
                const targetBBox = new THREE.Box3().setFromObject(target);
                
                // --- STRICT BOUNDING BOX CHECK ---
                // Check if the XZ projections of the bounding boxes overlap.
                const intersectsXZ = 
                    objectBBox.min.x < targetBBox.max.x &&
                    objectBBox.max.x > targetBBox.min.x &&
                    objectBBox.min.z < targetBBox.max.z &&
                    objectBBox.max.z > targetBBox.min.z;

                if (intersectsXZ) {
                    const targetTopY = target.position.y + (targetBBox.getSize(this.tempVector).y / 2);
                    // Check if the target is the highest support directly underneath the object.
                    if (targetTopY > groundY && targetTopY <= objectBottom + 0.01) {
                        groundY = targetTopY;
                    }
                }
            }
            
            if (objectBottom > groundY) {
                object.userData.velocity.y += this.gravity.y * deltaTime;
            } else {
                object.userData.velocity.y = 0;
                object.position.y = groundY + halfHeight;
            }

            object.position.y += object.userData.velocity.y * deltaTime;
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const deltaTime = this.clock.getDelta();
        this.applyGravity(deltaTime);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

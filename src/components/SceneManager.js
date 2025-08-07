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

        // Parent-child relationship tracking
        this.objectRelationships = new Map(); // Maps object to its parent
        this.childObjects = new Map(); // Maps object to array of its children
        this.tempVector = new THREE.Vector3();

        this.scene.add(this.furnitureGroup);
        this.setupScene();
        this.addObjects();
        
        // Initialize parent-child relationships after objects are added
        this.updateObjectRelationships();

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
            // Update relationships before starting to move
            this.updateObjectRelationships();
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
            
            // Calculate the highest Y position for stacking (only consider objects not in the same stack)
            let highestY = 0;
            const selectedObjectBBox = new THREE.Box3().setFromObject(this.selectedObject);
            const objectsInStack = this.getObjectsInStack(this.selectedObject);
            const collisionTargets = this.furnitureGroup.children.filter(child => !objectsInStack.has(child));
            
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

            // Calculate target position for the selected object
            const targetX = intersectionPoint.x;
            const targetZ = intersectionPoint.z;
            const targetY = highestY + (selectedObjectSize.y / 2);

            // Calculate movement delta
            const deltaX = targetX - this.selectedObject.position.x;
            const deltaZ = targetZ - this.selectedObject.position.z;
            const deltaY = targetY - this.selectedObject.position.y;

            // Only move if there's actual movement
            if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001 || Math.abs(deltaZ) > 0.001) {
                // Move the entire stack together
                this.moveEntireStack(this.selectedObject, deltaX, deltaY, deltaZ);
            }
        }
    }

    onPointerUp() {
        this.controls.enabled = true;
        if (this.selectedObject) {
            // Update parent-child relationships after movement
            this.updateObjectRelationships();
            this.selectedObject = null;
        }
    }

    // Get all objects in the same stack (including the given object)
    getObjectsInStack(object) {
        const stackObjects = new Set([object]);
        
        // Add all children recursively
        const addChildren = (obj) => {
            const children = this.childObjects.get(obj) || [];
            for (const child of children) {
                stackObjects.add(child);
                addChildren(child);
            }
        };
        
        addChildren(object);
        return stackObjects;
    }

    // Move the entire stack together
    moveEntireStack(rootObject, deltaX, deltaY, deltaZ) {
        const stackObjects = this.getObjectsInStack(rootObject);
        
        for (const obj of stackObjects) {
            obj.position.x += deltaX;
            obj.position.y += deltaY;
            obj.position.z += deltaZ;
        }
    }

    updateObjectRelationships() {
        // Clear existing relationships
        this.objectRelationships.clear();
        this.childObjects.clear();

        // Initialize child arrays for all objects
        for (const object of this.furnitureGroup.children) {
            this.childObjects.set(object, []);
        }

        // Sort objects by Y position (lowest to highest) to ensure proper relationship detection
        const sortedObjects = [...this.furnitureGroup.children].sort((a, b) => a.position.y - b.position.y);

        // Determine parent-child relationships based on stacking
        for (const object of sortedObjects) {
            const objectBBox = new THREE.Box3().setFromObject(object);
            const objectSize = objectBBox.getSize(this.tempVector);
            const objectBottom = object.position.y - (objectSize.y / 2);

            let bestParent = null;
            let bestParentTopY = -1;

            // Find the best parent (highest object that this object is sitting on)
            for (const potentialParent of this.furnitureGroup.children) {
                if (potentialParent === object) continue;

                const parentBBox = new THREE.Box3().setFromObject(potentialParent);
                const parentSize = parentBBox.getSize(this.tempVector);
                const parentTopY = potentialParent.position.y + (parentSize.y / 2);

                // Check if object is sitting on this potential parent
                const intersectsXZ = 
                    objectBBox.min.x < parentBBox.max.x &&
                    objectBBox.max.x > parentBBox.min.x &&
                    objectBBox.min.z < parentBBox.max.z &&
                    objectBBox.max.z > parentBBox.min.z;

                // More lenient tolerance for relationship detection
                if (intersectsXZ && Math.abs(objectBottom - parentTopY) < 0.2) {
                    if (parentTopY > bestParentTopY) {
                        bestParentTopY = parentTopY;
                        bestParent = potentialParent;
                    }
                }
            }

            // Set the relationship (avoid circular dependencies)
            if (bestParent && !this.wouldCreateCircularRelationship(object, bestParent)) {
                this.objectRelationships.set(object, bestParent);
                this.childObjects.get(bestParent).push(object);
            }
        }
    }

    // Helper function to check if adding a relationship would create a circular dependency
    wouldCreateCircularRelationship(child, parent) {
        let current = parent;
        while (current) {
            if (current === child) {
                return true; // Circular relationship detected
            }
            current = this.objectRelationships.get(current);
        }
        return false;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

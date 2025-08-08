import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Furniture {
    constructor(furnitureGroup) {
        this.group = furnitureGroup;
        this.roomSize = 10; // Define the boundary for placing furniture
        this.gltfLoader = new GLTFLoader();
        this.loadedModels = [];
        this.isLoading = true;
        
        // Load GLB models first, then create random furniture
        this.loadGLBModels().then(() => {
            this.createMultipleFurniture(3); // Reduced to 3 since we'll have GLB models too
            this.isLoading = false;
        }).catch(error => {
            console.error('Error in constructor:', error);
            // Fallback to just random furniture if GLB loading fails
            this.createMultipleFurniture(3);
            this.isLoading = false;
        });
    }

    /**
     * Loads all GLB models from the public/models directory
     */
    async loadGLBModels() {
        try {
            // Define known models with their properties
            const modelConfigs = [
                {
                    path: '/models/White_Pebble_Vase_0802124528_texture.glb',
                    name: 'White Pebble Vase',
                    scale: 0.5,
                    probability: 0.7 // Back to 70% chance to spawn
                }
                // Add more models here as they become available
            ];

            // Load each model
            for (const config of modelConfigs) {
                try {
                    const model = await this.loadGLBModel(config.path);
                    if (model) {
                        this.loadedModels.push({
                            name: config.name,
                            model: model,
                            scale: config.scale,
                            probability: config.probability
                        });
                    }
                } catch (error) {
                    console.error(`Failed to load ${config.name}:`, error);
                }
            }
        } catch (error) {
            console.error('Error loading GLB models:', error);
        }
    }

    /**
     * Loads a single GLB model
     * @param {string} modelPath - Path to the GLB file
     * @returns {Promise<THREE.Group>} - The loaded model group
     */
    loadGLBModel(modelPath) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                modelPath,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Center the model
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);
                    
                    // Scale the model appropriately
                    const size = box.getSize(new THREE.Vector3());
                    const maxSize = Math.max(size.x, size.y, size.z);
                    const targetSize = 1.0; // Target size of 1 unit
                    const scale = targetSize / maxSize;
                    model.scale.setScalar(scale);
                    
                    resolve(model);
                },
                (progress) => {
                    // Progress tracking (optional)
                },
                (error) => {
                    console.error(`Error loading ${modelPath}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Creates a specified number of random furniture objects.
     * @param {number} count - The number of furniture items to create.
     */
    createMultipleFurniture(count) {
        for (let i = 0; i < count; i++) {
            this.createRandomFurniture();
        }
        
        // Add GLB models to the scene
        this.addGLBModelsToScene();
    }

    /**
     * Creates a single piece of furniture with random properties and adds it to the group.
     */
    createRandomFurniture() {
        const size = Math.random() * 0.8 + 0.5; // Random size between 0.5 and 1.3
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const cube = new THREE.Mesh(geometry, material);

        // Set random position within the room boundaries
        const halfRoom = (this.roomSize - size) / 2;
        cube.position.x = Math.random() * (this.roomSize - size) - halfRoom;
        cube.position.z = Math.random() * (this.roomSize - size) - halfRoom;
        
        // Place the object on the floor
        cube.position.y = size / 2;

        this.group.add(cube);
    }

    /**
     * Adds loaded GLB models to the scene at random positions
     */
    addGLBModelsToScene() {
        if (this.loadedModels.length === 0) {
            return;
        }
        
        for (const modelData of this.loadedModels) {
            // Use probability to determine if this model should be spawned
            if (Math.random() < modelData.probability) {
                const modelInstance = modelData.model.clone();

                // Apply scale before calculating bounds
                modelInstance.scale.multiplyScalar(modelData.scale);

                // Compute bounding box to determine correct height placement
                const bbox = new THREE.Box3().setFromObject(modelInstance);
                const size = bbox.getSize(new THREE.Vector3());

                // Set random position within the room boundaries
                const halfRoom = (this.roomSize - 1) / 2;
                modelInstance.position.x = Math.random() * (this.roomSize - 1) - halfRoom;
                modelInstance.position.z = Math.random() * (this.roomSize - 1) - halfRoom;

                // Place the model on the floor based on its actual height
                modelInstance.position.y = size.y / 2;

                // Add to the furniture group
                this.group.add(modelInstance);
            }
        }
    }
}

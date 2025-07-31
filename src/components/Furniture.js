import * as THREE from 'three';

export class Furniture {
    constructor(furnitureGroup) {
        this.group = furnitureGroup;
        this.roomSize = 10; // Define the boundary for placing furniture
        this.createMultipleFurniture(5); // Create 5 furniture items
    }

    /**
     * Creates a specified number of random furniture objects.
     * @param {number} count - The number of furniture items to create.
     */
    createMultipleFurniture(count) {
        for (let i = 0; i < count; i++) {
            this.createRandomFurniture();
        }
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
}

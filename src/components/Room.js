import * as THREE from 'three';

export class Room {
    constructor(scene) {
        this.scene = scene;
        this.createRoom();
    }

    createRoom() {
        const roomSize = 10;
        const wallHeight = 5;

        // --- Floor ---
        const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.scene.add(floor);

        // --- Walls ---
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xa0a0a0 });

        // Wall 1: Back wall
        const wallGeometry1 = new THREE.BoxGeometry(roomSize, wallHeight, 0.1);
        const wall1 = new THREE.Mesh(wallGeometry1, wallMaterial);
        wall1.position.set(0, wallHeight / 2, -roomSize / 2);
        this.scene.add(wall1);

        // Wall 2: Front wall (omitted for camera view, but you could add it)
        // const wall2 = wall1.clone();
        // wall2.position.set(0, wallHeight / 2, roomSize / 2);
        // this.scene.add(wall2);

        // Wall 3: Left wall
        const wallGeometry2 = new THREE.BoxGeometry(roomSize, wallHeight, 0.1);
        const wall3 = new THREE.Mesh(wallGeometry2, wallMaterial);
        wall3.rotation.y = Math.PI / 2;
        wall3.position.set(-roomSize / 2, wallHeight / 2, 0);
        this.scene.add(wall3);
        
        // Wall 4: Right wall
        const wall4 = wall3.clone();
        wall4.position.set(roomSize / 2, wallHeight / 2, 0);
        this.scene.add(wall4);
    }
}

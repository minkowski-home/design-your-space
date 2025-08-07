# Design Your Space by Minkowski Home

![Design Your Space Banner](https://placehold.co/1200x400/8D2729/F3F2EC?text=Design%20Your%20Space)

Welcome to **Design Your Space**, an interactive 3D room planner that allows you to visualize furniture and home decor products in a realistic, physics-enabled environment. This project, built with Three.js and Vite, serves as the foundation for a powerful e-commerce tool for Minkowski Home.

---

## ✨ Features

This application provides a dynamic and intuitive way to design and visualize interior spaces.

* **Interactive 3D Scene:** A fully rendered 3D room provides the canvas for your design.
* **Mixed Furniture System:** Combines high-quality GLB models with procedurally generated furniture for diverse room layouts.
* **Drag-and-Drop Furniture:** Select and move furniture objects around the room with simple mouse controls.
* **Smart Stacking & Collision:** Objects realistically stack on top of one another. The physics engine prevents objects from overlapping or passing through each other.
* **Parent-Child Movement:** When an object is placed on top of another, moving the bottom object will move all stacked objects together as a unit.
* **Dynamic Camera Controls:** Orbit, pan, and zoom the camera to view your design from any angle.
* **Strict Room Boundaries:** Furniture and other objects cannot be moved through walls, ensuring a contained and realistic design space.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You must have **Node.js** installed on your machine. We recommend the LTS (Long-Term Support) version.
* [Download Node.js](https://nodejs.org/)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/minkowski-home/design-your-space.git](https://github.com/minkowski-home/design-your-space.git)
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd design-your-space
    ```
3.  **Install NPM packages:** This command will download all the necessary dependencies like Three.js and Vite.
    ```sh
    npm install
    ```
4.  **Run the development server:** This will start the Vite server and open the application in your browser.
    ```sh
    npm run dev
    ```

You should now see the application running at `http://localhost:5173` (or a similar address).

---

## 🛠️ Technology Stack

This project leverages a modern web development stack to deliver a fast and interactive 3D experience.

* **[Three.js](https://threejs.org/):** The core 3D library for rendering and managing the scene, objects, and interactivity.
* **[Vite](https://vitejs.dev/):** A next-generation frontend build tool that provides a blazing-fast development server and optimized production builds.
* **[JavaScript (ES6+):](https://developer.mozilla.org/en-US/docs/Web/JavaScript)** The programming language used to build the application logic.
* **HTML5 & CSS3:** For structuring and styling the web interface.

---

## 🎨 Managing 3D Models

The application supports high-quality GLB models for realistic furniture visualization.

### **Adding New Models**

1. **Place GLB files** in the `/public/models/` directory
2. **Update configuration** in `src/components/Furniture.js`:
   ```javascript
   {
       path: '/models/your_model.glb',
       name: 'Your Model Name',
       scale: 0.5,
       height: 0.3,
       probability: 0.7
   }
   ```

### **Model Management Script**

Use the included script to manage your models:
```bash
# List all available models
node scripts/manage_models.js list

# Generate configuration for new models
node scripts/manage_models.js config
```

### **Model Requirements**

- **Format:** GLB (GL Binary) files
- **Size:** Optimized for web (recommended < 10MB)
- **Scale:** Models are automatically scaled to fit the scene
- **Positioning:** Models are centered and placed on the floor

## 🔮 Future Development

This project is the first step towards a larger vision. Potential future enhancements include:

* **Enhanced Model Library:** Expanding the collection with more Minkowski Home product models
* **WebAR Integration:** An "View in Your Room" feature allowing users to place 3D models in their own space using their smartphone camera.
* **Custom Room Scanning:** Investigating SDKs and APIs to allow users to scan and import their own room layouts.
* **UI for Furniture Selection:** A user interface to browse and add specific products to the scene.

---

## 📄 License

This project is proprietary and confidential.

Copyright (c) 2025 Minkowski Home / Kartik. All Rights Reserved.

Please see the `LICENSE` file for more details.

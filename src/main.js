import SceneManager from './components/SceneManager.js';

const container = document.getElementById('app-container');
const sceneManager = new SceneManager(container);

sceneManager.animate();
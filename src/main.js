import { OpeningScene } from './album.js';

const root = document.querySelector('#opening-scene');

// Integrate the next scene here. The default intentionally holds the open album.
const openingScene = new OpeningScene(root, {
  onOpenComplete: ({ album }) => {
    // Example: mountMemories({ from: album });
  },
});

// Public handle is useful to integrate this standalone scene into any framework.
window.anniversaryOpening = openingScene;

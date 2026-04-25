# js_game

link preview https://sz-12.github.io/js_game/

# Survival Bunny Game 🐰🥕

A polished, web-based 2D survival platformer built entirely with HTML, CSS, and Vanilla JavaScript. 

## 🎮 Gameplay
Guide Pip the Bunny safely through a dangerous forest! 
* **Objective:** Collect the required number of carrots in each level to reveal the hidden burrow. Reach the burrow safely to advance to the next stage.
* **Watch Out:** Avoid the fast-moving foxes and lions patrolling the forest.
* **Progression:** The game features discrete levels with escalating difficulty—enemies get faster, and you'll need more carrots to survive!

## 🕹️ Controls
* **[Space]** or **[↑]** - Jump
* **[←]** **[→]** or **[A]** **[D]** - Move Left / Right
* **[Enter]** - Start / Next Level

## ✨ Technical Features
* **Zero Dependencies:** Built entirely from scratch using native web technologies, demonstrating clean DOM manipulation and logic.
* **Parallax Environment:** Features a multi-layered CSS background for dynamic depth and immersion, balancing visual design with performance.
* **Synthesized Audio:** Uses the native Web Audio API to generate sound effects (jumps, hits, collections, and level clears) procedurally—no external `.mp3` or `.wav` dependencies.
* **State Management:** Clean Vanilla JS game loop using `requestAnimationFrame` and scalable JSON-style level configurations.
* **Custom Physics & Collision:** Implements gravity-based jumping arcs and Axis-Aligned Bounding Box (AABB) collision detection logic.



## 📁 Project Structure
* `index.html` - The game's DOM structure, HUD, and UI overlays.
* `style.css` - Visual styling, UI layouts, parallax layering, and CSS animations.
* `script.js` - The main game loop, physics (gravity/velocity), collision detection, spawning logic, and audio synthesis.
* `assets/` - Contains all game sprites, character assets, and background layers.

---
*Designed and developed as a showcase of full-stack creative development, seamlessly blending aesthetic design with highly functional JavaScript logic.*

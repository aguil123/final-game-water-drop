// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly

// Water can control variables
const waterCan = document.getElementById("water-can");
const gameContainer = document.getElementById("game-container");
let score = document.getElementById("score");
let canX = 0;
let canY = 0;
const canSpeed = 5; // Pixels per frame
const canSize = 50;

// Keyboard state tracking
const keys = {};

// Active lasers shot from the water can
const lasers = [];
const laserSpeed = 12;

// Track which keys are pressed
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function positionWaterCan() {
  const containerWidth = gameContainer.offsetWidth;
  const containerHeight = gameContainer.offsetHeight;

  canX = Math.max(0, Math.min(containerWidth - canSize, containerWidth / 2 - canSize / 2));
  canY = Math.max(0, containerHeight - canSize - 20);

  waterCan.style.left = canX + "px";
  waterCan.style.top = canY + "px";
}

window.addEventListener("resize", positionWaterCan);

// Game loop for smooth water can movement
function gameLoop() {
  // Get container dimensions
  const containerWidth = gameContainer.offsetWidth;
  const containerHeight = gameContainer.offsetHeight;

  // Handle WASD movement
  if (keys["w"]) canY = Math.max(0, canY - canSpeed); // Move up
  if (keys["s"]) canY = Math.min(containerHeight - canSize, canY + canSpeed); // Move down
  if (keys["a"]) canX = Math.max(0, canX - canSpeed); // Move left
  if (keys["d"]) canX = Math.min(containerWidth - canSize, canX + canSpeed); // Move right

  // Apply the new position
  waterCan.style.left = canX + "px";
  waterCan.style.top = canY + "px";

  // Update lasers in every frame
  updateLasers();

  // Continue the loop
  requestAnimationFrame(gameLoop);
}

function updateLasers() {
  // Measure the visible container once per frame for offscreen checks
  const containerRect = gameContainer.getBoundingClientRect();

  // Iterate backwards to safely remove lasers while looping
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];

    // Move the laser along its normalized direction vector
    laser.x += laser.vx * laser.speed;
    laser.y += laser.vy * laser.speed;

    // Update the on-screen laser position and rotation every frame
    laser.el.style.left = laser.x + "px";
    laser.el.style.top = laser.y + "px";
    laser.el.style.transform = `rotate(${laser.angle}rad)`;
    checkLaserCollisions();

    // Remove lasers that travel outside the visible game container
    const offLeft = laser.x < -50;
    const offRight = laser.x > containerRect.width + 50;
    const offTop = laser.y < -50;
    const offBottom = laser.y > containerRect.height + 50;

    if (offLeft || offRight || offTop || offBottom) {
      laser.el.remove();
      lasers.splice(i, 1);
    }
  }
}

// Start the game loop
positionWaterCan();
gameLoop();

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);
}

// Shoot a laser when the user clicks inside the container
gameContainer.addEventListener("click", (event) => {
  // Convert the click from window coordinates into container-local coordinates
  const containerRect = gameContainer.getBoundingClientRect();
  const targetX = event.clientX - containerRect.left;
  const targetY = event.clientY - containerRect.top;

  // Laser starts at the center top of the water can
  const startX = canX + canSize / 2;
  const startY = canY;

  // Calculate direction from the can to the click point
  const dx = targetX - startX;
  const dy = targetY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance === 0) return; // No movement if clicked exactly at the start

  // Normalize the direction vector so speed is constant
  const vx = dx / distance;
  const vy = dy / distance;
  const angle = Math.atan2(vy, vx);

  // Create the laser DOM element and position it at the can
  const laserEl = document.createElement("div");
  laserEl.className = "laser";
  laserEl.style.left = startX + "px";
  laserEl.style.top = startY + "px";
  laserEl.style.transform = `rotate(${angle}rad)`;

  gameContainer.appendChild(laserEl);

  // Store the laser in the update list so it moves each frame
  lasers.push({
    x: startX,
    y: startY,
    vx,
    vy,
    angle,
    speed: laserSpeed,
    el: laserEl,
  });
});

function createDrop() {
  // Create a new div element that will be our drop
  const drop = document.createElement("div");

  // Randomly choose blue or brown drops
  const isBrown = Math.random() < 0.5;
  drop.className = isBrown ? "bad-drop" : "water-drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * Math.max(1, gameWidth - size);
  drop.style.left = xPosition + "px";

  // Set the animation duration so the drop falls smoothly
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Remove drops from the DOM after the fall animation ends
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}

//Laser hit detection
function detectCollision(laser, drop){
  const laserRect = laser.el.getBoundingClientRect();
  const dropRect = drop.getBoundingClientRect();

  return !(
    laserRect.top > dropRect.bottom ||
    laserRect.bottom < dropRect.top ||
    laserRect.left > dropRect.right ||
    laserRect.right < dropRect.left
  );
}


//collision check function
function checkLaserCollisions(){
  const gameContainerRect = gameContainer.getBoundingClientRect();
  const allDrops = gameContainer.querySelectorAll(".bad-drop");

  //loop through each laser backwards to safely remove them if they hit a drop
  for(let i = lasers.length - 1; i >= 0; i--){
    const laser = lasers[i];

    //check each drop for collision with the current laser
    for(let j = allDrops.length - 1; j >= 0; j--){
      const drop = allDrops[j];

      if(detectCollision(laser, drop)){
        //remove the drop from the DOM
        drop.remove();
        score.textContent = parseInt(score.textContent) + 1; //increment score

        //remove the laser from the DOM and the lasers array
        laser.el.remove();
        lasers.splice(i, 1);

        //break out of the inner loop since this laser is gone
        break;
      }
}

  }
}

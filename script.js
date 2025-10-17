// --- Config and block setup ---
const BLOCK_SIZE = 24;
const BLOCK_SCALE = 1.03;
const BACKGROUND_BLOCK_SCALE = 2.0;
const CAMERA_WIDTH = 16;
const CAMERA_HEIGHT = 9;
const GROUND_LEVEL = 10;
const CHUNK_SIZE = 32;
const MINE_REACH = 5;
const CRACK_IMAGE_URL = "crack.png";
const HOTBAR_SIZE = 10;
const INVENTORY_SIZE = 30;
const HOTBAR_BLOCKS = [
  "dirt", "stone", "sand", "clay", "snow", "hotstone", "magma", "wood", "brick", "cloud"
];
const ALL_BLOCKS = [
  "dirt","stone","sand","clay","snow","hotstone","magma","wood","brick","cloud",
  "styx_temple","elysium","asphodel","tartarus","hades_house"
];
// Underworld layers
const UNDERWORLD_LAYERS = [
  { name: "styx_temple", y: -150, height: 10, bg: "styx_bg" },
  { name: "elysium", y: -250, height: 10, bg: "elysium_bg" },
  { name: "asphodel", y: -350, height: 10, bg: "asphodel_bg" },
  { name: "tartarus", y: -450, height: 14, bg: "tartarus_bg" },
  { name: "hades_house", y: -500, height: 20, bg: "hades_bg" }
];
// Colors
const COLORS = {
  air: "#223366",
  grass: "#3cbb3c",
  dirt: "#87692b",
  stone: "#888",
  sand: "#e8e2aa",
  clay: "#b97a56",
  snow: "#e0e8f0",
  hotstone: "#c75d35",
  magma: "#f85a0a",
  lava: "#ff4100",
  leaf: "#5ed04b",
  wood: "#7c4f20",
  brick: "#a64832",
  ore: "#e4e45c",
  player: "#fff1c1",
  select: "#fffd7f",
  cloud: "#e3eaff",
  hellstone: "#6c162b",
  styx_temple: "#d4bfae",
  elysium: "#a1e2c1",
  asphodel: "#cfcfcf",
  tartarus: "#5c1a5c",
  hades_house: "#222222",
  darkstone_bg: "#333344",
  styx_bg: "#b2a17c",
  elysium_bg: "#8ec9aa",
  asphodel_bg: "#bbbbbb",
  tartarus_bg: "#3a083a",
  hades_bg: "#111111"
};
// --- Block images and cracks ---
const BLOCK_IMAGES = {}; // See your original images setup...
const CRACK_IMAGE = new window.Image(); CRACK_IMAGE.src = CRACK_IMAGE_URL;
let crackLoaded = false; CRACK_IMAGE.onload = () => { crackLoaded = true; };

// --- Inventory and hotbar data ---
let inventoryGrid = new Array(INVENTORY_SIZE).fill(null).map(() => ({ type: null, count: 0 }));
let hotbarSlots = new Array(HOTBAR_SIZE).fill(null).map(() => ({ type: null, count: 0 }));
let hotbarSelected = 0;
let inventoryOpen = false;

// --- World arrays and original inventory logic ---
let world = {}, background = {};
let inventory = {}; // original inventoryPanel logic!
for(const k of HOTBAR_BLOCKS) inventory[k]=10;

// --- Hotbar UI (original) ---
function updateHotbar() {
  const hotbar = document.getElementById('hotbar');
  hotbar.innerHTML = "";
  for(let i=0;i<HOTBAR_BLOCKS.length;i++) {
    const block = HOTBAR_BLOCKS[i];
    let found = false, count = 0;
    for(let j=0;j<HOTBAR_SIZE;j++) {
      if(hotbarSlots[j].type === block) { found = true; count = hotbarSlots[j].count; break; }
    }
    count = inventory[block] || count || 0;
    const slot = document.createElement('div');
    slot.className = "hotbar-slot" + (i===hotbarSelected?" selected":"");
    slot.innerHTML = `
      <div class="slot-key">${i+1}</div>
      <div class="slot-swatch" style="background:${COLORS[block]}"></div>
      <span>${block}</span>
      <span class="slot-count">${count}</span>
    `;
    slot.onclick = ()=>{ hotbarSelected = i; updateHotbar(); };
    hotbar.appendChild(slot);
  }
}
// --- InventoryPanel (original) ---
function showInventory() {
  document.getElementById('inventoryPanel').style.display = "block";
  updateInventoryDisplay();
}
function hideInventory() {
  document.getElementById('inventoryPanel').style.display = "none";
}
function updateInventoryDisplay() {
  const itemsDiv = document.getElementById('inventoryItems');
  let out = "";
  let hasAny = false;
  for(const k in inventory) {
    if(inventory[k] > 0) {
      out += `<span style="color:${COLORS[k]||'#fff'}">${k}</span>: <b>${inventory[k]}</b><br>`;
      hasAny = true;
    }
  }
  if(!hasAny) out = "<i>(empty)</i>";
  itemsDiv.innerHTML = out;
}
// --- Inventory Overlay (new) ---
function updateInventoryOverlay() {
  const invHotbarDiv = document.getElementById('inventoryHotbar');
  invHotbarDiv.innerHTML = "";
  for(let i=0;i<HOTBAR_SIZE;i++) {
    const slot = hotbarSlots[i];
    const el = document.createElement('div');
    el.className = "inventory-hotbar-slot";
    el.draggable = true;
    el.dataset.hotbarSlot = i;
    el.innerHTML = `
      <div class="slot-swatch" style="background:${slot.type ? COLORS[slot.type] : "#222"}"></div>
      <span>${slot.type ? slot.type : ""}</span>
      ${slot.count ? `<span class="slot-count">${slot.count}</span>` : ""}
    `;
    invHotbarDiv.appendChild(el);
  }
  const grid = document.getElementById('inventoryGrid');
  grid.innerHTML = "";
  for(let i=0;i<INVENTORY_SIZE;i++) {
    const slot = inventoryGrid[i];
    const el = document.createElement('div');
    el.className = "inventory-slot";
    el.draggable = true;
    el.dataset.inventorySlot = i;
    el.innerHTML = `
      <div class="slot-swatch" style="background:${slot.type ? COLORS[slot.type] : "#222"}"></div>
      <span>${slot.type ? slot.type : ""}</span>
      ${slot.count ? `<span class="slot-count">${slot.count}</span>` : ""}
    `;
    grid.appendChild(el);
  }
}
function showInventoryOverlay() {
  document.getElementById('inventoryOverlay').classList.add("visible");
  updateInventoryOverlay();
}
function hideInventoryOverlay() {
  document.getElementById('inventoryOverlay').classList.remove("visible");
}
// --- Drag & drop logic for overlay ---
let dragSource = null;
document.addEventListener('dragstart', (e) => {
  if (e.target.classList.contains("inventory-slot")) {
    dragSource = { type: "inventory", slot: parseInt(e.target.dataset.inventorySlot) };
    e.target.classList.add("dragging");
  }
  if (e.target.classList.contains("inventory-hotbar-slot")) {
    dragSource = { type: "hotbar", slot: parseInt(e.target.dataset.hotbarSlot) };
    e.target.classList.add("dragging");
  }
});
document.addEventListener('dragend', (e) => {
  document.querySelectorAll(".dragging").forEach(el => el.classList.remove("dragging"));
  dragSource = null;
});
document.getElementById('inventoryGrid').addEventListener('dragover', e => e.preventDefault());
document.getElementById('inventoryGrid').addEventListener('drop', e => {
  if (!dragSource) return;
  if (!e.target.classList.contains("inventory-slot")) return;
  let dst = parseInt(e.target.dataset.inventorySlot);
  if (dragSource.type === "inventory") {
    let tmp = inventoryGrid[dst];
    inventoryGrid[dst] = inventoryGrid[dragSource.slot];
    inventoryGrid[dragSource.slot] = tmp;
  } else if (dragSource.type === "hotbar") {
    let tmp = inventoryGrid[dst];
    inventoryGrid[dst] = hotbarSlots[dragSource.slot];
    hotbarSlots[dragSource.slot] = tmp;
  }
  updateInventoryOverlay();
  updateHotbar();
});
document.getElementById('inventoryHotbar').addEventListener('dragover', e => e.preventDefault());
document.getElementById('inventoryHotbar').addEventListener('drop', e => {
  if (!dragSource) return;
  if (!e.target.classList.contains("inventory-hotbar-slot")) return;
  let dst = parseInt(e.target.dataset.hotbarSlot);
  if (dragSource.type === "hotbar") {
    let tmp = hotbarSlots[dst];
    hotbarSlots[dst] = hotbarSlots[dragSource.slot];
    hotbarSlots[dragSource.slot] = tmp;
  } else if (dragSource.type === "inventory") {
    let tmp = hotbarSlots[dst];
    hotbarSlots[dst] = inventoryGrid[dragSource.slot];
    inventoryGrid[dragSource.slot] = tmp;
  }
  updateInventoryOverlay();
  updateHotbar();
});

// --- Hotbar select by number ---
document.addEventListener('keydown', e => {
  if (inventoryOpen) return;
  if(/[1-9]/.test(e.key)) {
    let idx = parseInt(e.key)-1;
    if(idx >= 0 && idx < HOTBAR_SIZE) {
      hotbarSelected = idx;
      updateHotbar();
    }
  }
  if(e.key === "i" || e.key === "I") {
    inventoryOpen = !inventoryOpen;
    if(inventoryOpen) {
      showInventoryOverlay();
    } else {
      hideInventoryOverlay();
    }
  }
});

// --- Add to both inventories when mining ---
function addToBothInventories(blockType, amt=1) {
  // Original inventoryPanel system
  if (!inventory.hasOwnProperty(blockType)) inventory[blockType] = 0;
  inventory[blockType] += amt;
  updateHotbar();
  updateInventoryDisplay();
  // New overlay system
  for(let i=0;i<HOTBAR_SIZE;i++) {
    if(hotbarSlots[i].type === blockType) {
      hotbarSlots[i].count += amt;
      updateHotbar();
      updateInventoryOverlay();
      return;
    }
  }
  for(let i=0;i<HOTBAR_SIZE;i++) {
    if(!hotbarSlots[i].type) {
      hotbarSlots[i].type = blockType;
      hotbarSlots[i].count = amt;
      updateHotbar();
      updateInventoryOverlay();
      return;
    }
  }
  for(let i=0;i<INVENTORY_SIZE;i++) {
    if(inventoryGrid[i].type === blockType) {
      inventoryGrid[i].count += amt;
      updateHotbar();
      updateInventoryOverlay();
      return;
    }
  }
  for(let i=0;i<INVENTORY_SIZE;i++) {
    if(!inventoryGrid[i].type) {
      inventoryGrid[i].type = blockType;
      inventoryGrid[i].count = amt;
      updateHotbar();
      updateInventoryOverlay();
      return;
    }
  }
}

// --- World Generation, Underworld, Backgrounds, etc ---
function isUnderworldLayer(y) {
  for (const layer of UNDERWORLD_LAYERS) {
    if (y >= layer.y && y < layer.y + layer.height)
      return layer;
  }
  return null;
}
function generateChunk(cx, cy) {
  for(let dx=0; dx<CHUNK_SIZE; dx++) {
    let x = cx * CHUNK_SIZE + dx;
    let h = GROUND_LEVEL + 8;
    for(let dy=0; dy<CHUNK_SIZE; dy++) {
      let y = cy * CHUNK_SIZE + dy;
      let key = x + "," + y;
      if(world.hasOwnProperty(key)) continue;
      let layer = isUnderworldLayer(y);
      if (layer) {
        let type = "air";
        if (y === layer.y || y === layer.y + layer.height - 1 || x % 32 === 0 || x % 32 === 31) {
          type = layer.name;
        } else if ((x+layer.y)%30 === 0 && y > layer.y && y < layer.y + layer.height - 1) {
          type = layer.name;
        }
        setBackground(x, y, layer.bg);
        world[key] = type;
        continue;
      }
      if (y < h) {
        world[key] = "air";
      } else if (y === h) {
        world[key] = "grass";
      } else if (y < h+3) {
        world[key] = "dirt";
      } else {
        world[key] = "stone";
      }
      if (y >= h + 5 && y < h + 10 && world[key] !== "air") {
        setBackground(x, y, "darkstone_bg");
      }
    }
  }
}
function ensureWorldGenerated(camX, camY) {
  let left = Math.floor(camX - CAMERA_WIDTH/2);
  let top = Math.floor(camY - CAMERA_HEIGHT/2);
  let right = left + CAMERA_WIDTH + 2;
  let bottom = top + CAMERA_HEIGHT + 2;
  let min_cx = Math.floor(left / CHUNK_SIZE);
  let max_cx = Math.floor(right / CHUNK_SIZE);
  let min_cy = Math.floor(top / CHUNK_SIZE);
  let max_cy = Math.floor(bottom / CHUNK_SIZE);
  for(let cx=min_cx; cx<=max_cx; cx++) {
    for(let cy=min_cy; cy<=max_cy; cy++) {
      let probeX = cx*CHUNK_SIZE, probeY = cy*CHUNK_SIZE;
      if(getBlock(probeX, probeY) === null) {
        generateChunk(cx, cy);
      }
    }
  }
}

// --- Canvas and player setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let RENDER_SCALE = 1;
function resizeCanvas() {
  const DPR = window.devicePixelRatio || 1;
  const minWidthScale  = Math.floor(window.innerWidth  / (CAMERA_WIDTH  * BLOCK_SIZE)) || 1;
  const minHeightScale = Math.floor(window.innerHeight / (CAMERA_HEIGHT * BLOCK_SIZE)) || 1;
  RENDER_SCALE = Math.max(1, Math.min(minWidthScale, minHeightScale));
  const cssWidth  = CAMERA_WIDTH  * BLOCK_SIZE * RENDER_SCALE;
  const cssHeight = CAMERA_HEIGHT * BLOCK_SIZE * RENDER_SCALE;
  canvas.style.width  = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width  = Math.floor(cssWidth * DPR);
  canvas.height = Math.floor(cssHeight * DPR);
  ctx.setTransform(DPR * RENDER_SCALE, 0, 0, DPR * RENDER_SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = "low";
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
let player = { x: 0, y: GROUND_LEVEL+5, w: 0.7, h: 0.95, vx: 0, vy: 0, onGround: false };
// --- Mining system ---
let mining = { active: false, x: null, y: null, startTime: null, duration: null, blockType: null };
function getMouseTile(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const mx_css = clientX - rect.left;
  const my_css = clientY - rect.top;
  const mx = Math.floor(mx_css / (BLOCK_SIZE * RENDER_SCALE));
  const my = Math.floor(my_css / (BLOCK_SIZE * RENDER_SCALE));
  const cx = Math.floor(camera.x - CAMERA_WIDTH / 2 + mx);
  const cy = Math.floor(camera.y - CAMERA_HEIGHT / 2 + my);
  return { x: cx, y: cy };
}
let mouseDown = false, mouseButton = null;
canvas.addEventListener('mousedown', (e)=>{
  mouseDown = true; mouseButton = e.button;
  const mouseTile = getMouseTile(e.clientX, e.clientY);
  if (mouseButton === 0) startMining(mouseTile);
  canvas.focus();
});
canvas.addEventListener('mouseup', ()=>{ mouseDown = false; mouseButton = null; stopMining(); });
canvas.addEventListener('mouseleave', ()=>{ mouseDown = false; mouseButton = null; stopMining(); });
canvas.addEventListener('mousemove', (e)=>{
  if (!mouseDown) { stopMining(); return; }
  const mouseTile = getMouseTile(e.clientX, e.clientY);
  if (mouseButton === 0) startMining(mouseTile);
});
function startMining(tile) {
  let t = getBlock(tile.x, tile.y);
  if (!t || t === 'air' || t.endsWith("_bg")) return;
  if(mining.active && mining.x === tile.x && mining.y === tile.y) return;
  mining.active = true;
  mining.x = tile.x;
  mining.y = tile.y;
  mining.startTime = performance.now();
  mining.duration = 1000;
  mining.blockType = t;
}
function stopMining() {
  mining.active = false;
  mining.x = null;
  mining.y = null;
  mining.startTime = null;
  mining.duration = null;
  mining.blockType = null;
}
// --- Controls ---
let left = false, right = false, up = false, jumpRequest = false;
let camera = { x: player.x, y: player.y };
document.addEventListener('keydown', handleKeydown);
document.addEventListener('keyup', handleKeyup);
function handleKeydown(e) {
  if (inventoryOpen) return;
  if(e.key==='ArrowLeft' || e.key==='a') left = true;
  if(e.key==='ArrowRight' || e.key==='d') right = true;
  if(e.key==='ArrowUp' || e.key==='w' || e.key===' ') { up = true; jumpRequest = true; }
}
function handleKeyup(e) {
  if(e.key==='ArrowLeft' || e.key==='a') left = false;
  if(e.key==='ArrowRight' || e.key==='d') right = false;
  if(e.key==='ArrowUp' || e.key==='w' || e.key===' ') up = false;
}
// --- Physics & mining update ---
function update() {
  ensureWorldGenerated(camera.x, camera.y);
  let targetVx = 0;
  if(left) targetVx -= 3.2;
  if(right) targetVx += 3.2;
  player.vx += (targetVx - player.vx) * 0.25;
  if(jumpRequest && player.onGround) {
    player.vy = -7;
    jumpRequest = false;
  }
  player.vy += 0.4;
  player.x += player.vx * (1/60);
  player.y += player.vy * (1/60);
  camera.x += (player.x - camera.x) * 0.12;
  camera.y += (player.y - camera.y) * 0.12;
  if (mining.active) {
    let now = performance.now();
    let progress = (now - mining.startTime) / mining.duration;
    if (progress >= 1) {
      setBlock(mining.x, mining.y, 'air');
      addToBothInventories(mining.blockType, 1);
      stopMining();
    }
  }
}
// --- Draw ---
function draw() {
  let camX = camera.x - CAMERA_WIDTH/2;
  let camY = camera.y - CAMERA_HEIGHT/2;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  let left = Math.floor(camX), top = Math.floor(camY);
  for(let x=left; x<=left+CAMERA_WIDTH; x++) {
    for(let y=top; y<=top+CAMERA_HEIGHT; y++) {
      let t = getBackground(x, y);
      if(t) {
        let px = (x - camX) * BLOCK_SIZE;
        let py = (y - camY) * BLOCK_SIZE;
        let size = BLOCK_SIZE * BACKGROUND_BLOCK_SCALE;
        let adjust = (size - BLOCK_SIZE) / 2;
        ctx.fillStyle = COLORS[t] || "#222";
        ctx.fillRect(px - adjust, py - adjust, size, size);
      }
    }
  }
  for(let x=left; x<=left+CAMERA_WIDTH; x++) {
    for(let y=top; y<=top+CAMERA_HEIGHT; y++) {
      let t = getBlock(x, y);
      if(t && t !== "air") {
        let px = (x - camX) * BLOCK_SIZE;
        let py = (y - camY) * BLOCK_SIZE;
        let size = BLOCK_SIZE * BLOCK_SCALE;
        let adjust = (size - BLOCK_SIZE) / 2;
        ctx.fillStyle = COLORS[t] || "#ff00ff";
        ctx.fillRect(px - adjust, py - adjust, size, size);
        if (mining.active && mining.x === x && mining.y === y && crackLoaded) {
          let now = performance.now();
          let progress = Math.min(1, (now - mining.startTime) / mining.duration);
          let crackScale = lerp(0.3, 1.0, progress);
          let crackSize = BLOCK_SIZE * crackScale;
          let crackAdjust = (crackSize - BLOCK_SIZE) / 2;
          ctx.save();
          ctx.globalAlpha = 0.35 + 0.65 * progress;
          ctx.drawImage(CRACK_IMAGE,
            px - crackAdjust,
            py - crackAdjust,
            crackSize,
            crackSize
          );
          ctx.restore();
        }
      }
    }
  }
  let sx = (player.x - camX - player.w/2) * BLOCK_SIZE;
  let sy = (player.y - camY) * BLOCK_SIZE;
  ctx.fillStyle = "#fff1c1";
  ctx.fillRect(sx, sy, player.w*BLOCK_SIZE, player.h*BLOCK_SIZE);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(sx, sy, player.w*BLOCK_SIZE, player.h*BLOCK_SIZE);
}
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
updateHotbar();
updateInventoryDisplay();
updateInventoryOverlay();
loop();

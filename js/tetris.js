// シンプルなテトリス実装
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const ROWS = 24, COLS = 16, BLOCK = 25; // 800/16=50, 600/24=25
const colors = [
  null, "#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "#fff"
];
const tetrominoes = [
  [],
  [[1,1,1,1]], // I
  [[2,2],[2,2]], // O
  [[0,3,0],[3,3,3]], // T
  [[4,0,0],[4,4,4]], // J
  [[0,0,5],[5,5,5]], // L
  [[6,6,0],[0,6,6]], // S
  [[0,7,7],[7,7,0]]  // Z
];
let arena = Array.from({length: ROWS},()=>Array(COLS).fill(0));
let dropCounter = 0, dropInterval = 500, lastTime = 0, score = 0;
let gameOver = false;

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => row.forEach((v, x) => {
    if (v) {
      ctx.fillStyle = colors[v];
      ctx.fillRect((x+offset.x)*BLOCK, (y+offset.y)*BLOCK, BLOCK-1, BLOCK-1);
    }
  }));
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => row.forEach((v, x) => {
    if (v) arena[y+player.pos.y][x+player.pos.x] = v;
  }));
}

function collide(arena, player) {
  return player.matrix.some((row, y) =>
    row.some((v, x) =>
      v && (arena[y+player.pos.y]?.[x+player.pos.x] ?? 1)
    )
  );
}

function rotate(matrix, dir) {
  // 非正方形にも対応した回転（新しい配列を返す）
  const h = matrix.length;
  const w = matrix[0].length;
  const result = Array.from({length: w}, () => Array(h).fill(0));
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      if (dir > 0) {
        result[x][h - 1 - y] = matrix[y][x];
      } else {
        result[w - 1 - x][y] = matrix[y][x];
      }
    }
  }
  return result;
}

function playerRotate(dir) {
  const pos = player.pos.x;
  const oldMatrix = player.matrix;
  const rotated = rotate(player.matrix, dir);
  player.matrix = rotated;
  let offset = 1;
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (Math.abs(offset) > player.matrix[0].length) {
      player.matrix = oldMatrix; // 回転前に戻す
      player.pos.x = pos;
      return;
    }
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    if (collide(arena, player)) {
      gameOver = true;
      document.getElementById('score').textContent = "ゲームオーバー! スコア: " + score;
    }
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y=arena.length-1; y>=0; --y) {
    if (arena[y].every(v=>v!==0)) {
      arena.splice(y,1);
      arena.unshift(Array(COLS).fill(0));
      score += rowCount*100;
      rowCount *= 2;
    }
  }
  document.getElementById('score').textContent = "スコア: " + score;
}

function playerReset() {
  const type = Math.floor(Math.random()*7)+1;
  player.matrix = tetrominoes[type].map(row=>row.slice());
  player.pos.y = 0;
  player.pos.x = (COLS/2|0)-(player.matrix[0].length/2|0);
  if (collide(arena, player)) gameOver = true;
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  // 縦線
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK, 0);
    ctx.lineTo(x * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  // 横線
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK);
    ctx.lineTo(COLS * BLOCK, y * BLOCK);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGhost(player) {
  // ゴーストミノの位置を計算
  const ghost = {
    pos: { x: player.pos.x, y: player.pos.y },
    matrix: player.matrix
  };
  while (!collide(arena, ghost)) {
    ghost.pos.y++;
  }
  ghost.pos.y--;

  // ゴーストミノを半透明で描画
  ctx.save();
  ctx.globalAlpha = 0.3;
  drawMatrix(ghost.matrix, ghost.pos);
  ctx.globalAlpha = 1.0;
  ctx.restore();
}

function draw() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  drawGrid(); // グリッド線を描画
  drawMatrix(arena, {x:0,y:0});
  drawGhost(player); // ゴーストミノを描画
  drawMatrix(player.matrix, player.pos);
}

function update(time=0) {
  if (gameOver) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

function hardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--; // 1つ戻す
  merge(arena, player);
  playerReset();
  arenaSweep();
  if (collide(arena, player)) {
    gameOver = true;
    document.getElementById('score').textContent = "ゲームオーバー! スコア: " + score;
  }
  dropCounter = 0;
}

// キーリピート対応
let keyInterval = null;
let keyDown = null;
let keyDownTime = 0;
const KEY_REPEAT_DELAY = 120; // ms
const KEY_REPEAT_MIN = 500;   // 0.5秒（500ms）未満はリピートしない

function handleKeyDown(e) {
  if (gameOver) return;
  if (keyDown === e.code) return; // すでに押下中なら無視
  keyDown = e.code;
  keyDownTime = Date.now();

  const repeatAction = () => {
    if (gameOver) return;
    switch (keyDown) {
      case "ArrowLeft":
        playerMove(-1); draw();
        break;
      case "ArrowRight":
        playerMove(1); draw();
        break;
      case "ArrowDown":
        playerDrop(); draw();
        break;
    }
  };

  // 1回目即時実行
  if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowDown") {
    repeatAction();
    // 0.1秒後からリピート開始
    keyInterval = setTimeout(() => {
      keyInterval = setInterval(repeatAction, KEY_REPEAT_DELAY);
    }, KEY_REPEAT_MIN);
  } else if (e.key === "z" || e.key === "Z") {
    playerRotate(-1); draw();
  } else if (e.key === "x" || e.key === "X") {
    hardDrop(); draw();
  } else if (e.key === "ArrowUp") {
    playerRotate(1); draw();
  }
}

function handleKeyUp(e) {
  if (keyDown === e.code) {
    // 0.1秒以内ならリピートは発動していないので、setTimeoutを解除
    if (keyInterval) {
      clearTimeout(keyInterval);
      clearInterval(keyInterval);
      keyInterval = null;
    }
    keyDown = null;
    keyDownTime = 0;
  }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

document.getElementById('restartBtn').onclick = ()=>{
  arena = Array.from({length: ROWS},()=>Array(COLS).fill(0));
  score = 0;
  gameOver = false;
  document.getElementById('score').textContent = "スコア: 0";
  playerReset();
  draw();
  requestAnimationFrame(update);
};

// 仮想ボタンのイベント
document.getElementById('leftBtn')?.addEventListener('touchstart', e => { e.preventDefault(); playerMove(-1); draw(); });
document.getElementById('rightBtn')?.addEventListener('touchstart', e => { e.preventDefault(); playerMove(1); draw(); });
document.getElementById('downBtn')?.addEventListener('touchstart', e => { e.preventDefault(); playerDrop(); draw(); });
document.getElementById('rotateBtn')?.addEventListener('touchstart', e => { e.preventDefault(); playerRotate(-1); draw(); });
document.getElementById('hardDropBtn')?.addEventListener('touchstart', e => { e.preventDefault(); hardDrop(); draw(); });

// PCクリックにも対応
document.getElementById('leftBtn')?.addEventListener('click', () => { playerMove(-1); draw(); });
document.getElementById('rightBtn')?.addEventListener('click', () => { playerMove(1); draw(); });
document.getElementById('downBtn')?.addEventListener('click', () => { playerDrop(); draw(); });
document.getElementById('rotateBtn')?.addEventListener('click', () => { playerRotate(-1); draw(); });
document.getElementById('hardDropBtn')?.addEventListener('click', () => { hardDrop(); draw(); });
// 初期化
const player = {pos:{x:0,y:0}, matrix:null};
playerReset();
draw();
requestAnimationFrame(update);
const canvas = document.getElementById('block-canvas');
const ctx = canvas.getContext('2d');

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

const ballRadius = 8;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 3;
let dy = -3;

const brickRowCount = 5;
const brickColumnCount = 7;
const brickWidth = 55;
const brickHeight = 18;
const brickPadding = 8;
const brickOffsetTop = 30;
const brickOffsetLeft = 15;

let rightPressed = false;
let leftPressed = false;
let score = 0;
let isGameOver = false;
let isStarted = false; // ゲーム開始フラグ

const bricks = [];
for(let c=0; c<brickColumnCount; c++) {
    bricks[c] = [];
    for(let r=0; r<brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

function drawBricks() {
    for(let c=0; c<brickColumnCount; c++) {
        for(let r=0; r<brickRowCount; r++) {
            if(bricks[c][r].status === 1) {
                const brickX = (c*(brickWidth+brickPadding)) + brickOffsetLeft;
                const brickY = (r*(brickHeight+brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = "#90caf9";
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#ffb3c6";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height-paddleHeight-5, paddleWidth, paddleHeight);
    ctx.fillStyle = "#64b5f6";
    ctx.fill();
    ctx.closePath();
}

function drawScore() {
    document.getElementById('block-score').textContent = "スコア: " + score;
}

function collisionDetection() {
    for(let c=0; c<brickColumnCount; c++) {
        for(let r=0; r<brickRowCount; r++) {
            const b = bricks[c][r];
            if(b.status === 1) {
                if(x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    score += 10;
                    if(score === brickRowCount*brickColumnCount*10) {
                        setTimeout(() => {
                            alert("クリア！スコア: " + score);
                            document.location.reload();
                        }, 100);
                    }
                }
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    collisionDetection();

    if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if(y + dy < ballRadius) {
        dy = -dy;
    } else if(y + dy > canvas.height-ballRadius-paddleHeight-5) {
        if(x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else if(y + dy > canvas.height-ballRadius) {
            isGameOver = true;
            setTimeout(() => {
                alert("ゲームオーバー スコア: " + score);
                document.location.reload();
            }, 100);
        }
    }

    if(rightPressed && paddleX < canvas.width-paddleWidth) {
        paddleX += 7;
    }
    if(leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    x += dx;
    y += dy;

    if(!isGameOver && isStarted) {
        requestAnimationFrame(draw);
    }
}

// イベントリスナー
document.addEventListener("keydown", e => {
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", e => {
    if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

// タッチ操作対応
canvas.addEventListener("touchstart", function(e) {
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    if(touchX < canvas.width/2) leftPressed = true;
    else rightPressed = true;
});
canvas.addEventListener("touchend", function() {
    leftPressed = false;
    rightPressed = false;
});

// スタートボタン処理
const startBtn = document.getElementById('block-restart');
startBtn.textContent = "スタート";
startBtn.onclick = function() {
    if (!isStarted) {
        isStarted = true;
        startBtn.disabled = true;
        draw();
    } else {
        document.location.reload();
    }
};

// 初期状態でスコアとブロックだけ描画
ctx.clearRect(0, 0, canvas.width, canvas.height);
drawBricks();
drawPaddle();
drawBall();
drawScore();
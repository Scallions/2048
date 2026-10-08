/**
 * Created by gl on 2016/12/2.
 */
var chessbox = new Array();//储存每个位置数字
var chess = document.getElementById('2048');
var context = chess.getContext('2d');
if (context.setTransform) context.setTransform(2, 0, 0, 2, 0, 0);
var count = 0;
var gameOver = false;
var animating = false;
var pendingMoves = [];
var moveEffects = { tiles: [], merges: [] };
var spawnedTile = null;
var animationGeneration = 0;
var bestScore = 0;
try { bestScore = Math.max(0, Number(localStorage.getItem('2048-best')) || 0); } catch (e) {}
var socer;
var soc=document.getElementById('socer');
// 固定 400 单位的逻辑坐标；高分辨率画布和 CSS 负责清晰度、缩放。
function roundFill(x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
}
function initchess() {
    context.fillStyle = '#b7a794';
    context.fillRect(0, 0, 400, 400);
    context.fillStyle = '#cbbdac';
    for (var row = 0; row < 4; row++) {
        for (var column = 0; column < 4; column++) {
            roundFill(13 + column * 96, 13 + row * 96, 86, 86, 10);
        }
    }
}
function updateScores() {
    soc.innerText = socer;
    if (socer > bestScore) {
        bestScore = socer;
        try { localStorage.setItem('2048-best', bestScore); } catch (e) {}
    }
    var best = document.getElementById('best-score');
    if (best) best.innerText = bestScore;
    [soc, best].forEach(function (element) {
        if (element && element.parentElement && element.parentElement.classList) {
            element.parentElement.classList.toggle('score-long', String(element.innerText).length > 4);
        }
    });
}
//初始化储存数字的二维数组
function init2048() {
    for(var i = 0;i<4;i++)
    {
        chessbox[i]= new Array();
        for(var j=0;j<4;j++)
        {
            chessbox[i][j]=0;
        }
    }
    socer=0;
    count=0;
    gameOver=false;
    animationGeneration++;
    animating = false;
    pendingMoves = [];
    spawnedTile = null;
    updateScores();
    var overlay = document.getElementById('game-over');
    if (overlay) overlay.hidden = true;
}
// 静态绘制和动画共用相同的方块绘制方法。
function tileColor(value) {
    var colors = { 2: '#eee5d8', 4: '#eed8b2', 8: '#eca46c', 16: '#e88755',
        32: '#dc6d4e', 64: '#c9543f', 128: '#d7ad55', 256: '#c79a3d',
        512: '#b48a31', 1024: '#98712a', 2048: '#7c5926',
        4096: '#695043', 8192: '#574239', 16384: '#40342e' };
    return colors[value] || '#40342e';
}
function drawTile(value, row, column, scale) {
    if (!value) return;
    scale = scale === undefined ? 1 : scale;
    var size = 86 * scale;
    var x = column * 96 + 56;
    var y = row * 96 + 56;
    context.fillStyle = tileColor(value);
    roundFill(x - size / 2, y - size / 2, size, size, 10 * scale);
    context.fillStyle = value >= 32 && value !== 128 && value !== 256 ? '#fffaf2' : '#665444';
    context.font = 'bold ' + (value >= 1024 ? 30 : 40) * scale + 'px Arial';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillText(value, x, y);
}
function draw(i,j) { drawTile(chessbox[i][j], i, j); }
//绘制所有方格
function drawchess() {
    initchess();
    for(var i = 0;i<4;i++)
    {
        for(var j=0;j<4;j++)
        {
            draw(i,j);
        }
    }
}
//生成一个数
function boom() {
    spawnedTile = null;
    var a;
    var c;
    c=0;
    if(Math.random()<0.5){
        a=2;
    }else{
        a=4;
    }
    var b=new Array();
    for(var i = 0;i<32;i++)
    {
        b[i]=0;
    }
    for(var i = 0;i<4;i++)
    {
        for(var j=0;j<4;j++)
        {
            if(chessbox[i][j] == 0){
                b[2*c]=i;
                b[2*c+1]=j;
                c++;
            }
        }
    }
    if (c!=0){
        var d=Math.floor(c*Math.random());
        chessbox[b[2*d]][b[d*2+1]]=a;
        spawnedTile = { row: b[2*d], column: b[d*2+1], value: a };
        return 1;
    }else{return 0;}
}
// 沿移动方向读取一行：去零、合并一次、补零。
function mergeLine(line) {
    var values = line.filter(function (value) { return value !== 0; });
    var result = [];
    var groups = [];
    var sources = [];
    line.forEach(function (value, index) { if (value !== 0) sources.push(index); });
    var score = 0;
    for (var i = 0; i < values.length; i++) {
        if (i + 1 < values.length && values[i] === values[i + 1]) {
            var merged = values[i] * 2;
            result.push(merged);
            groups.push([sources[i], sources[i + 1]]);
            score += merged;
            i++;
        } else {
            result.push(values[i]);
            groups.push([sources[i]]);
        }
    }
    while (result.length < 4) result.push(0);
    return { values: result, score: score, groups: groups };
}
function move(direction) {
    count = 0;
    moveEffects = { tiles: [], merges: [] };
    var vertical = direction === 'up' || direction === 'down';
    var reverse = direction === 'down' || direction === 'right';
    for (var i = 0; i < 4; i++) {
        var line = [];
        for (var j = 0; j < 4; j++) {
            var position = reverse ? 3 - j : j;
            line.push(vertical ? chessbox[position][i] : chessbox[i][position]);
        }
        var merged = mergeLine(line);
        socer += merged.score;
        merged.groups.forEach(function (sources, target) {
            var destination = reverse ? 3 - target : target;
            var row = vertical ? destination : i;
            var column = vertical ? i : destination;
            sources.forEach(function (source) {
                var origin = reverse ? 3 - source : source;
                moveEffects.tiles.push({ value: line[source],
                    fromRow: vertical ? origin : i, fromColumn: vertical ? i : origin,
                    row: row, column: column });
            });
            if (sources.length === 2) {
                moveEffects.merges.push({ row: row, column: column, value: merged.values[target] });
            }
        });
        for (var j = 0; j < 4; j++) {
            var position = reverse ? 3 - j : j;
            var row = vertical ? position : i;
            var column = vertical ? i : position;
            if (chessbox[row][column] !== merged.values[j]) count++;
            chessbox[row][column] = merged.values[j];
        }
    }
    return count !== 0;
}
function move8() { return move('up'); }
function move2() { return move('down'); }
function move4() { return move('left'); }
function move6() { return move('right'); }
// 空格或任意相邻的相同数字，都意味着还可以继续。
function canMove() {
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            if (chessbox[i][j] === 0) return true;
            if (i < 3 && chessbox[i][j] === chessbox[i + 1][j]) return true;
            if (j < 3 && chessbox[i][j] === chessbox[i][j + 1]) return true;
        }
    }
    return false;
}
function over() {
    var overlay = document.getElementById('game-over');
    if (overlay) overlay.hidden = false;
}
function restartGame() {
    // 重开时使旧动画帧失效，避免上一局的帧覆盖新棋盘。
    init2048();
    [chess, soc].forEach(function (element) {
        if (element.getAnimations) element.getAnimations().forEach(function (animation) { animation.cancel(); });
    });
    if (document.querySelectorAll) document.querySelectorAll('.socer .score-gain').forEach(function (badge) { badge.remove(); });
    boom();
    boom();
    drawchess();
    if (chess.focus) chess.focus({ preventScroll: true });
}
function reducedMotion() {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function scoreFeedback(gain) {
    if (!gain || reducedMotion() || !document.createElement) return;
    var badge = document.createElement('span');
    badge.className = 'score-gain';
    badge.textContent = '+' + gain;
    soc.parentElement.appendChild(badge);
    badge.addEventListener('animationend', function () { badge.remove(); }, { once: true });
    if (soc.animate) soc.animate([
        { transform: 'scale(1)' }, { transform: 'scale(1.28)', color: '#c97443' },
        { transform: 'scale(1)' }
    ], { duration: 260, easing: 'ease-out' });
}
function finishTurn() {
    animating = false;
    drawchess();
    if (gameOver) {
        pendingMoves = [];
        over();
    } else if (pendingMoves.length) {
        playTurn(pendingMoves.shift());
    }
}
function animateTurn() {
    if (typeof requestAnimationFrame !== 'function' || reducedMotion()) {
        finishTurn();
        return;
    }
    animating = true;
    var started;
    var impactPlayed = false;
    var effects = moveEffects;
    var spawn = spawnedTile;
    var generation = animationGeneration;
    function frame(now) {
        if (generation !== animationGeneration) return;
        if (started === undefined) started = now;
        var elapsed = now - started;
        initchess();
        if (elapsed < 115) {
            var t = 1 - Math.pow(1 - elapsed / 115, 3);
            effects.tiles.forEach(function (tile) {
                drawTile(tile.value,
                    tile.fromRow + (tile.row - tile.fromRow) * t,
                    tile.fromColumn + (tile.column - tile.fromColumn) * t);
            });
        } else {
            if (!impactPlayed) {
                impactPlayed = true;
                if (effects.merges.length && chess.animate) {
                    chess.animate([
                        { transform: 'translate(0,0)' }, { transform: 'translate(2px,-2px)' },
                        { transform: 'translate(-2px,1px)' }, { transform: 'translate(0,0)' }
                    ], { duration: 170, easing: 'ease-out' });
                }
            }
            var pop = Math.min((elapsed - 115) / 210, 1);
            for (var row = 0; row < 4; row++) {
                for (var column = 0; column < 4; column++) {
                    var merging = effects.merges.some(function (tile) {
                        return tile.row === row && tile.column === column;
                    });
                    var scale = merging ? 1 + 0.18 * Math.sin(pop * Math.PI) : 1;
                    if (spawn && spawn.row === row && spawn.column === column) {
                        var t = Math.min((elapsed - 115) / 180, 1);
                        scale = t === 0 ? 0.01 : 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
                    }
                    drawTile(chessbox[row][column], row, column, scale);
                }
            }
            effects.merges.forEach(function (tile) {
                // 合并中心迸出短促的光点，透明度随时间衰减。
                context.save();
                context.globalAlpha = 1 - pop;
                context.fillStyle = tileColor(tile.value);
                for (var i = 0; i < 8; i++) {
                    var angle = i * Math.PI / 4;
                    var distance = 38 + pop * 30;
                    var size = 5 * (1 - pop);
                    context.fillRect(tile.column * 96 + 56 + Math.cos(angle) * distance - size / 2,
                        tile.row * 96 + 56 + Math.sin(angle) * distance - size / 2, size, size);
                }
                context.restore();
            });
        }
        if (elapsed < 325) requestAnimationFrame(frame);
        else finishTurn();
    }
    requestAnimationFrame(frame);
}
function playTurn(direction) {
    var previousScore = socer;
    if (!move(direction)) {
        if (!canMove()) { gameOver = true; over(); }
        return;
    }
    boom();
    updateScores();
    gameOver = !canMove();
    scoreFeedback(socer - previousScore);
    animateTurn();
}
onkeydown=function (e) {
    if (!e) return;
    var directions = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right'
    };
    var legacyDirections = { 38: 'up', 40: 'down', 37: 'left', 39: 'right' };
    var direction = e.key ? directions[e.key] : legacyDirections[e.keyCode];
    if (!direction) return;
    if (e.preventDefault) e.preventDefault();
    if (gameOver) return;
    if (animating) {
        if (pendingMoves.length < 2) pendingMoves.push(direction);
        return;
    }
    playTurn(direction);
}
if (chess.addEventListener) {
    var pointerStart = null;
    chess.addEventListener('pointerdown', function (event) {
        if (!event.isPrimary || event.button !== 0) return;
        pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
        chess.setPointerCapture(event.pointerId);
    });
    chess.addEventListener('pointerup', function (event) {
        if (!pointerStart || event.pointerId !== pointerStart.id) return;
        var dx = event.clientX - pointerStart.x;
        var dy = event.clientY - pointerStart.y;
        pointerStart = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
        var key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
        onkeydown({ key: key });
    });
    chess.addEventListener('pointercancel', function () { pointerStart = null; });
    document.getElementById('new-game').addEventListener('click', restartGame);
    document.getElementById('play-again').addEventListener('click', restartGame);
}
init2048();
chessbox[0][0]=2;
chessbox[1][0]=2;
drawchess();

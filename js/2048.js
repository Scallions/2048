/**
 * Created by gl on 2016/12/2.
 */
var chessbox = new Array();//储存每个位置数字
var chess = document.getElementById('2048');
var context = chess.getContext('2d');
var count = 0;
var gameOver = false;
var animating = false;
var pendingMoves = [];
var moveEffects = { tiles: [], merges: [] };
var spawnedTile = null;
var socer;
var soc=document.getElementById('socer');
//画棋盘
function initchess() {
    context.strokeStyle = "#BFBFBF";
    context.fillStyle='#F7F6F3';
    context.fillRect(0,0,400,400);
}
// 每次绘制网格都重置路径，避免历史线段累积。
function drawgrid() {
    context.beginPath();
    for (var i = 0; i < 5; i++) {
        context.moveTo(i * 100, 0);
        context.lineTo(i * 100, 400);
        context.moveTo(0, i * 100);
        context.lineTo(400, i * 100);
    }
    context.stroke();
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
    soc.innerText=socer;
}
// 静态绘制和动画共用相同的方块绘制方法。
function tileColor(value) {
    var colors = { 2: '#abc797', 4: '#FF8B8B', 8: '#61BFAD', 16: '#B6E2E3',
        32: '#005397', 64: '#32B67A', 128: '#BEB4D6', 256: '#BEA1A5',
        512: '#EFCF60', 1024: '#0D37B0', 2048: '#EF3D49',
        4096: '#293571', 8192: '#045A5B', 16384: '#FA9A29' };
    return colors[value] || '#abc797';
}
function drawTile(value, row, column, scale) {
    if (!value) return;
    scale = scale === undefined ? 1 : scale;
    var size = 100 * scale;
    var x = column * 100 + 50;
    var y = row * 100 + 50;
    context.fillStyle = tileColor(value);
    context.fillRect(x - size / 2, y - size / 2, size, size);
    context.fillStyle = value >= 32 && value !== 128 && value !== 256 && value !== 512 ? '#fff' : '#2b2b2b';
    context.font = 'bold ' + (value >= 1024 ? 26 : 32) * scale + 'px Arial';
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
    drawgrid();
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
function  drawtext(i,j,string) {
    context.fillStyle='#3B755F';
    context.fillRect(100*j,100*i,100,100);
    context.fillStyle='#2b2b2b';
    context.font="30px Arial";
    context.textBaseline = 'middle';//设置文本的垂直对齐方式
    context.textAlign = 'center'; //设置文本的水平对对齐方式
    context.fillText(string,100*j+50,100*i+50);
}
function over() {
    drawtext(1,1,'O');
    drawtext(1,2,'V');
    drawtext(2,1,'E');
    drawtext(2,2,'R');
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
        { transform: 'scale(1)' }, { transform: 'scale(1.28)', color: '#397457' },
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
    function frame(now) {
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
                    var distance = 42 + pop * 36;
                    var size = 5 * (1 - pop);
                    context.fillRect(tile.column * 100 + 50 + Math.cos(angle) * distance - size / 2,
                        tile.row * 100 + 50 + Math.sin(angle) * distance - size / 2, size, size);
                }
                context.restore();
            });
        }
        drawgrid();
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
    soc.innerText = socer;
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
init2048();
chessbox[0][0]=2;
chessbox[1][0]=2;
drawchess();

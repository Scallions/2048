/**
 * Created by gl on 2016/12/2.
 */
var chessbox = new Array();//储存每个位置数字
var chess = document.getElementById('2048');
var context = chess.getContext('2d');
var count = 0;
var gameOver = false;
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
//绘制方格
function draw(i,j) {
    var color='#abc797';
    switch (chessbox[i][j])
    {
        case 4:color='#FF8B8B';
            break;
        case 8:color='#61BFAD';
            break;
        case 16:color='#B6E2E3';
            break;
        case 32:color='#005397';
            break;
        case 64:color='#32B67A';
            break;
        case 128:color='#BEB4D6';
            break;
        case 256:color='#BEA1A5';
            break;
        case 512:color='#EFCF60';
            break;
        case 1024:color='#0D37B0';
            break;
        case 2048:color='#EF3D49';
            break;
        case 4096:color='#293571';
            break;
        case 8192:color='#045A5B';
            break;
        case 16384:color='#FA9A29';
            break;
    }
    if(chessbox[i][j]!=0){
        context.fillStyle=color;
        context.fillRect(100*j,100*i,100,100);
        context.fillStyle='#2b2b2b';
        context.font="30px Arial";
        context.textBaseline = 'middle';//设置文本的垂直对齐方式
        context.textAlign = 'center'; //设置文本的水平对对齐方式
        context.fillText(chessbox[i][j],100*j+50,100*i+50);
    }
    else{//小格背景
        var color='#F7F6F3';
        context.fillStyle=color;
        context.fillRect(100*j,100*i,100,100);
        context.fillStyle='#2b2b2b';

    }
}
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
        return 1;
    }else{return 0;}
}
// 沿移动方向读取一行：去零、合并一次、补零。
function mergeLine(line) {
    var values = line.filter(function (value) { return value !== 0; });
    var result = [];
    var score = 0;
    for (var i = 0; i < values.length; i++) {
        if (i + 1 < values.length && values[i] === values[i + 1]) {
            var merged = values[i] * 2;
            result.push(merged);
            score += merged;
            i++;
        } else {
            result.push(values[i]);
        }
    }
    while (result.length < 4) result.push(0);
    return { values: result, score: score };
}
function move(direction) {
    count = 0;
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
    if (move(direction)) {
        boom();
        drawchess();
    }
    soc.innerText=socer;
    if (!canMove()) {
        gameOver = true;
        over();
    }
}
init2048();
chessbox[0][0]=2;
chessbox[1][0]=2;
drawchess();

/**
 * Created by gl on 2016/12/2.
 */
var chessbox = new Array();//储存每个位置数字
var chess = document.getElementById('2048');
var context = chess.getContext('2d');
var count;
var socer;
var soc=document.getElementById('socer');
//画棋盘
function initchess() {
    context.strokeStyle = "#BFBFBF";
    context.fillStyle='#F7F6F3';
    context.fillRect(0,0,400,400);
    for(var i=0; i<5; i++)
    {

        context.moveTo(0 + i*100, 0);
        context.lineTo(0 + i*100, 400);
        context.moveTo(0, 0 + i*100);
        context.lineTo(400, 0 + i*100);
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
    for(var i=0; i<5; i++)
    {
        context.moveTo(0 + i*100, 0);
        context.lineTo(0 + i*100, 400);
        context.moveTo(0, 0 + i*100);
        context.lineTo(400, 0 + i*100);
    }
    context.stroke();
}
//绘制所有方格
function drawchess() {
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
        draw(b[2*d],b[d*2+1]);
        return 1;
    }else{return 0;}
}
//移动改变数据
function  move8() {
    for (var i = 0; i < 4; i++) {
        for (var j = 1; j < 4; j++) {
            var n = j;
            while (n > 0) {
                if (chessbox[n][i] == 0) {
                    break;
                }
                else if (chessbox[n - 1][i] == 0) {
                    chessbox[n - 1][i] = chessbox[n][i];
                    chessbox[n][i] = 0;
                    draw(n,i);
                    draw(n-1,i);
                    count++;
                }
                else if (chessbox[n][i] == chessbox[n - 1][i]) {
                    chessbox[n - 1][i] += chessbox[n][i];
                    chessbox[n][i] = 0;
                    socer+=chessbox[n - 1][i];
                    draw(n,i);
                    draw(n-1,i);
                    count++;
                    break;
                }
                else {
                    break;
                }
                n--;
            }
        }
    }
}
function  move2(){
    for(var i=0;i<4;i++){
        for(var j=2;j>=0;j--){
            var n=j;
            while(n<3)
            {
                if(chessbox[n][i]==0){
                    break;
                }
                else if(chessbox[n+1][i]==0)
                {
                    chessbox[n+1][i]=chessbox[n][i];
                    chessbox[n][i]=0;
                    draw(n,i);
                    draw(n+1,i);
                    count++;
                }
                else if(chessbox[n][i]==chessbox[n+1][i])
                {
                    chessbox[n+1][i]+=chessbox[n][i];
                    chessbox[n][i]=0;
                    socer+=chessbox[n+1][i];
                    count++;
                    draw(n,i);
                    draw(n+1,i);
                    break;
                }
                else{break;}
                n++;
            }
        }
    }
}
function  move4(){
    for(var i=0;i<4;i++){
        for(var j=1;j<4;j++){
            var n=j;
            while(n>0)
            {
                if(chessbox[i][n]==0){
                    break;
                }
                else if(chessbox[i][n-1]==0)
                {
                    chessbox[i][n-1]=chessbox[i][n];
                    chessbox[i][n]=0;
                    count++;
                    draw(i,n);
                    draw(i,n-1);
                }
                else if(chessbox[i][n]==chessbox[i][n-1])
                {
                    chessbox[i][n-1]+=chessbox[i][n];
                    chessbox[i][n]=0;
                    socer+=chessbox[i][n-1];
                    count++;
                    draw(i,n);
                    draw(i,n-1);
                    break;
                }
                else{break;}
                n--;
            }
        }
    }
}
function  move6(){
    for(var i=0;i<4;i++){
        for(var j=2;j>=0;j--){
            var n=j;
            while(n<3)
            {
                if(chessbox[i][n]==0){
                    break;
                }
                else if(chessbox[i][n+1]==0)
                {
                    chessbox[i][n+1]=chessbox[i][n];
                    chessbox[i][n]=0;
                    draw(i,n);
                    draw(i,n+1);
                    count++;
                }
                else if(chessbox[i][n]==chessbox[i][n+1])
                {
                    chessbox[i][n+1]+=chessbox[i][n];
                    chessbox[i][n]=0;
                    socer+=chessbox[i][n+1];
                    count++;
                    draw(i,n);
                    draw(i,n+1);
                    break;
                }
                else{break;}
                n++;
            }
        }
    }
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
    count=0;
    if(e && e.keyCode==38){//上
        move8();
    }
    if(e && e.keyCode==37){//left
        move4();
    }
    if(e && e.keyCode==40){//下
        move2();
    }
    if(e && e.keyCode==39){//right
        move6();
    }
    soc.innerText=socer;
    if(count!=0)
    {
        boom();
    }else{
        var sum;
        sum=0;
        for(var i = 0;i<4;i++)
        {
            for(var j=0;j<4;j++)
            {
                if(chessbox[i][j]!=0)sum++;
            }
        }
        if (sum==16)over();
    }
}
initchess();
init2048();
chessbox[0][0]=2;
chessbox[1][0]=2;
drawchess();




const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function load() {
    const rendering = { segments: 0, strokes: [], labels: [] };
    const context = {
        beginPath() { rendering.segments = 0; },
        moveTo() { rendering.segments++; },
        lineTo() { rendering.segments++; },
        stroke() { rendering.strokes.push(rendering.segments); },
        fillRect() {},
        fillText(text) { rendering.labels.push(text); }
    };
    const score = { innerText: 0 };
    const game = {
        document: { getElementById(id) {
            return id === '2048' ? { getContext: () => context } : score;
        } },
        Math: Object.assign(Object.create(Math), { random: () => 0 })
    };
    vm.createContext(game);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/2048.js'), 'utf8'), game);
    return { game, rendering, score };
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function boardFor(line, direction) {
    const board = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    line.forEach((value, j) => {
        const position = ['down', 'right'].includes(direction) ? 3 - j : j;
        if (['up', 'down'].includes(direction)) board[position][0] = value;
        else board[0][position] = value;
    });
    return board;
}
for (const direction of ['left', 'right', 'up', 'down']) {
    test(`${direction}: merges each tile once and scores correctly`, () => {
        const { game } = load();
        for (const [input, expected, score] of [
            [[2, 2, 4, 0], [4, 4, 0, 0], 4],
            [[2, 2, 2, 2], [4, 4, 0, 0], 8],
            [[2, 0, 2, 2], [4, 2, 0, 0], 4],
            [[4, 4, 8, 8], [8, 16, 0, 0], 24],
            [[0, 2, 0, 4], [2, 4, 0, 0], 0]
        ]) {
            game.chessbox = boardFor(input, direction);
            game.socer = 0;
            assert.equal(game.move(direction), true);
            assert.deepEqual(plain(game.chessbox), boardFor(expected, direction));
            assert.equal(game.socer, score);
        }
    });
}
const playable = [[2,4,8,16],[2,8,16,32],[4,16,32,64],[8,32,64,128]];
const dead = [[2,4,8,16],[4,8,16,32],[8,16,32,64],[16,32,64,128]];
test('full board remains playable when another direction can merge', () => {
    const { game, rendering } = load();
    game.chessbox = playable.map(row => row.slice());
    game.onkeydown({ key: 'ArrowLeft', preventDefault() {} });
    assert.equal(game.gameOver, false);
    assert.deepEqual(plain(game.chessbox), playable);
    assert.equal(rendering.labels.includes('O'), false);
    game.chessbox = playable[0].map((_, j) => playable.map(row => row[j]));
    assert.equal(game.canMove(), true);
});
test('unrelated keys are ignored even on a dead board', () => {
    const { game, rendering } = load();
    game.chessbox = dead.map(row => row.slice());
    game.onkeydown({ key: 'a', preventDefault() { assert.fail('unrelated key blocked'); } });
    assert.equal(game.gameOver, false);
    assert.deepEqual(plain(game.chessbox), dead);
    assert.equal(rendering.labels.includes('O'), false);
});
test('dead board ends and further input does not draw again', () => {
    const { game, rendering } = load();
    game.chessbox = dead.map(row => row.slice());
    game.onkeydown({ key: 'ArrowLeft' });
    assert.equal(game.gameOver, true);
    const labels = rendering.labels.length;
    game.onkeydown({ key: 'ArrowUp' });
    assert.equal(rendering.labels.length, labels);
});
test('spawn filling last empty cell immediately checks for game over', () => {
    const { game } = load();
    game.chessbox = dead.map(row => row.slice());
    game.chessbox[0] = [4, 8, 16, 0];
    game.onkeydown({ key: 'ArrowRight' });
    assert.equal(game.chessbox[0][0], 2);
    assert.equal(game.gameOver, true);
});
test('no-op moves do not spawn or repaint and arrows prevent scrolling', () => {
    const { game, rendering } = load();
    game.chessbox = boardFor([2,4,0,0], 'left');
    const strokes = rendering.strokes.length;
    let prevented = false;
    game.onkeydown({ key: 'ArrowLeft', preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(plain(game.chessbox), boardFor([2,4,0,0], 'left'));
    assert.equal(rendering.strokes.length, strokes);
});
test('each redraw strokes exactly one fresh grid path', () => {
    const { game, rendering } = load();
    for (let i = 0; i < 100; i++) game.drawchess();
    assert.equal(rendering.strokes.length, 101);
    assert.ok(rendering.strokes.every(segments => segments === 20));
});

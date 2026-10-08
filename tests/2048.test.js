const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function load(initialBest = 0) {
    const rendering = { segments: 0, strokes: [], labels: [], maxPathSegments: 0 };
    const context = {
        beginPath() { rendering.segments = 0; },
        moveTo() { rendering.segments++; },
        lineTo() { rendering.segments++; },
        stroke() { rendering.strokes.push(rendering.segments); },
        roundRect() { rendering.segments++; rendering.maxPathSegments = Math.max(rendering.maxPathSegments, rendering.segments); },
        fill() {},
        fillRect() {},
        fillText(text) { rendering.labels.push(text); }
    };
    const score = { innerText: 0 };
    const best = { innerText: initialBest };
    const overlay = { hidden: true };
    const storage = new Map([['2048-best', String(initialBest)]]);
    const game = {
        document: { getElementById(id) {
            return id === '2048' ? { getContext: () => context } : ({ socer: score, 'best-score': best, 'game-over': overlay }[id] || null);
        } },
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, String(value)) },
        Math: Object.assign(Object.create(Math), { random: () => 0 })
    };
    vm.createContext(game);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/2048.js'), 'utf8'), game);
    return { game, rendering, score, best, overlay, storage };
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
test('rounded board paths stay bounded across repeated redraws', () => {
    const { game, rendering } = load();
    for (let i = 0; i < 100; i++) game.drawchess();
    assert.equal(rendering.maxPathSegments, 1);
});

function installFrames(game) {
    const frames = [];
    let now = 0;
    game.context.save = () => {};
    game.context.restore = () => {};
    game.requestAnimationFrame = callback => { frames.push(callback); };
    return {
        frames,
        flush() {
            let remaining = 200;
            while (frames.length && remaining-- > 0) frames.shift()(now += 20);
            assert.equal(frames.length, 0, 'animation must settle');
        }
    };
}
test('every rapid input applies immediately and releasing input leaves no delayed moves', () => {
    const { game } = load();
    const reference = load().game;
    const scheduler = installFrames(game);
    for (const key of ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
        game.onkeydown({ key });
        reference.onkeydown({ key });
        assert.deepEqual(plain(game.chessbox), plain(reference.chessbox), key + ' must apply before the next frame');
        assert.equal(game.socer, reference.socer);
    }
    const stoppedBoard = plain(game.chessbox);
    const stoppedScore = game.socer;
    scheduler.flush();
    assert.equal(game.animating, false);
    assert.deepEqual(plain(game.chessbox), stoppedBoard);
    assert.equal(game.socer, stoppedScore);
});
test('a stale frame cannot repaint or finish a newer move animation', () => {
    const { game, rendering } = load();
    const scheduler = installFrames(game);
    game.onkeydown({ key: 'ArrowUp' });
    const staleFrame = scheduler.frames.shift();
    game.onkeydown({ key: 'ArrowRight' });
    const board = plain(game.chessbox);
    const labels = rendering.labels.length;
    staleFrame(20);
    assert.equal(rendering.labels.length, labels);
    assert.equal(game.animating, true);
    assert.deepEqual(plain(game.chessbox), board);
    scheduler.flush();
    assert.deepEqual(plain(game.chessbox), board);
});
test('an invalid move during animation settles visuals without spawning another tile', () => {
    const { game } = load();
    const scheduler = installFrames(game);
    game.onkeydown({ key: 'ArrowUp' });
    const board = plain(game.chessbox);
    game.onkeydown({ key: 'ArrowLeft' });
    assert.equal(game.animating, false);
    assert.deepEqual(plain(game.chessbox), board);
    scheduler.flush();
    assert.deepEqual(plain(game.chessbox), board);
    assert.equal(game.socer, 4);
});
test('game over is drawn after the last spawn animation and stays visible', () => {
    const { game, overlay } = load();
    const scheduler = installFrames(game);
    game.chessbox = dead.map(row => row.slice());
    game.chessbox[0] = [4, 8, 16, 0];
    game.onkeydown({ key: 'ArrowRight' });
    assert.equal(game.gameOver, true);
    assert.equal(overlay.hidden, true);
    game.onkeydown({ key: 'ArrowUp' });
    scheduler.flush();
    assert.equal(overlay.hidden, false);
    assert.equal(game.animating, false);
});
test('reduced motion skips animation while preserving the same move and score', () => {
    const { game } = load();
    const scheduler = installFrames(game);
    game.matchMedia = () => ({ matches: true });
    game.onkeydown({ key: 'ArrowUp' });
    assert.equal(scheduler.frames.length, 0);
    assert.equal(game.animating, false);
    assert.equal(game.socer, 4);
    assert.deepEqual(plain(game.chessbox), [[4,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
});

test('restart during interrupted animations discards old frames, retaining best score', () => {
    const { game, best, storage, overlay } = load();
    const scheduler = installFrames(game);
    game.onkeydown({ key: 'ArrowUp' });
    game.onkeydown({ key: 'ArrowRight' });
    assert.equal(game.animating, true);
    assert.equal(best.innerText, 4);
    assert.equal(storage.get('2048-best'), '4');
    game.restartGame();
    const newBoard = plain(game.chessbox);
    scheduler.flush();
    assert.deepEqual(plain(game.chessbox), newBoard);
    assert.equal(game.chessbox.flat().filter(Boolean).length, 2);
    assert.equal(game.socer, 0);
    assert.equal(best.innerText, 4);
    assert.equal(game.animating, false);
    assert.equal(overlay.hidden, true);
});
test('highest score loads from storage and cannot decrease on a new game', () => {
    const { game, best, storage } = load(120);
    game.onkeydown({ key: 'ArrowUp' });
    game.restartGame();
    assert.equal(best.innerText, 120);
    assert.equal(storage.get('2048-best'), '120');
});

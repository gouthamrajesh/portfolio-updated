/* Daily Sudoku engine: deterministic per-day generator, solver, and progress/share/counter helpers. */
(function (global) {
  /* ---- seeded PRNG (mulberry32) ---- */
  function mulberry32(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h >>> 0;
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function dateKeyFor(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  var EPOCH = new Date(2026, 7, 4); // Aug 4, 2026 = Daily Sudoku #1
  function puzzleNumberFor(d) {
    var startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var diffDays = Math.round((startOfDay - EPOCH) / 86400000);
    return Math.max(1, diffDays + 1);
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* ---- base solved grid (valid Sudoku solution) ---- */
  var BASE = [
    [1,2,3,4,5,6,7,8,9],
    [4,5,6,7,8,9,1,2,3],
    [7,8,9,1,2,3,4,5,6],
    [2,3,1,5,6,4,8,9,7],
    [5,6,4,8,9,7,2,3,1],
    [8,9,7,2,3,1,5,6,4],
    [3,1,2,6,4,5,9,7,8],
    [6,4,5,9,7,8,3,1,2],
    [9,7,8,3,1,2,6,4,5]
  ];

  function generateSolution(rng) {
    var grid = BASE.map(function (row) { return row.slice(); });

    // relabel digits 1-9
    var digitMap = shuffle([1,2,3,4,5,6,7,8,9], rng);
    grid = grid.map(function (row) { return row.map(function (v) { return digitMap[v - 1]; }); });

    // permute rows within each band of 3
    var afterRows = new Array(9);
    for (var band = 0; band < 3; band++) {
      var rOrder = shuffle([0,1,2], rng);
      for (var i = 0; i < 3; i++) afterRows[band * 3 + i] = grid[band * 3 + rOrder[i]];
    }
    grid = afterRows;

    // permute columns within each stack of 3
    var afterCols = grid.map(function () { return new Array(9); });
    for (var stack = 0; stack < 3; stack++) {
      var cOrder = shuffle([0,1,2], rng);
      for (var r = 0; r < 9; r++) {
        for (var j = 0; j < 3; j++) afterCols[r][stack * 3 + j] = grid[r][stack * 3 + cOrder[j]];
      }
    }
    grid = afterCols;

    // permute the 3 bands themselves
    var bandOrder = shuffle([0,1,2], rng);
    var afterBands = new Array(9);
    for (var b = 0; b < 3; b++) {
      for (var i2 = 0; i2 < 3; i2++) afterBands[b * 3 + i2] = grid[bandOrder[b] * 3 + i2];
    }
    grid = afterBands;

    // permute the 3 stacks themselves
    var stackOrder = shuffle([0,1,2], rng);
    var afterStacks = grid.map(function () { return new Array(9); });
    for (var s = 0; s < 3; s++) {
      for (var r2 = 0; r2 < 9; r2++) {
        for (var j2 = 0; j2 < 3; j2++) afterStacks[r2][s * 3 + j2] = grid[r2][stackOrder[s] * 3 + j2];
      }
    }
    grid = afterStacks;

    // optional transpose
    if (rng() < 0.5) {
      var t = [];
      for (var r3 = 0; r3 < 9; r3++) {
        var row = [];
        for (var c3 = 0; c3 < 9; c3++) row.push(grid[c3][r3]);
        t.push(row);
      }
      grid = t;
    }

    return grid;
  }

  /* ---- backtracking solver with early-exit solution counting ---- */
  function countSolutions(grid, limit) {
    var g = grid.map(function (row) { return row.slice(); });
    var count = 0;

    function isValid(r, c, val) {
      for (var i = 0; i < 9; i++) {
        if (g[r][i] === val || g[i][c] === val) return false;
      }
      var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (var i2 = 0; i2 < 3; i2++) {
        for (var j2 = 0; j2 < 3; j2++) {
          if (g[br + i2][bc + j2] === val) return false;
        }
      }
      return true;
    }

    function findEmpty() {
      for (var r = 0; r < 9; r++) {
        for (var c = 0; c < 9; c++) {
          if (g[r][c] === 0) return [r, c];
        }
      }
      return null;
    }

    function backtrack() {
      if (count >= limit) return;
      var pos = findEmpty();
      if (!pos) { count++; return; }
      var r = pos[0], c = pos[1];
      for (var v = 1; v <= 9; v++) {
        if (isValid(r, c, v)) {
          g[r][c] = v;
          backtrack();
          g[r][c] = 0;
          if (count >= limit) return;
        }
      }
    }

    backtrack();
    return count;
  }

  function digHoles(solution, rng, minClues) {
    var puzzle = solution.map(function (row) { return row.slice(); });
    var cells = [];
    for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) cells.push([r, c]);
    cells = shuffle(cells, rng);

    var clues = 81;
    for (var i = 0; i < cells.length && clues > minClues; i++) {
      var r2 = cells[i][0], c2 = cells[i][1];
      var backup = puzzle[r2][c2];
      puzzle[r2][c2] = 0;
      if (countSolutions(puzzle, 2) === 1) {
        clues--;
      } else {
        puzzle[r2][c2] = backup;
      }
    }
    return puzzle;
  }

  /* ---- daily puzzle, cached per date in localStorage ---- */
  function getDailyPuzzle(dateOverride) {
    var d = dateOverride || new Date();
    var key = dateKeyFor(d);
    var cacheKey = 'gr_sudoku_cache_' + key;
    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && cached.puzzle && cached.solution) return cached;
    } catch (e) {}

    var seed = hashString('gr-daily-sudoku-' + key);
    var rng = mulberry32(seed);
    var solution = generateSolution(rng);
    var puzzle = digHoles(solution, rng, 32);
    var result = { dateKey: key, number: puzzleNumberFor(d), solution: solution, puzzle: puzzle };
    try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) {}
    return result;
  }

  /* ---- progress persistence ---- */
  function loadProgress(dateKey) {
    try { return JSON.parse(localStorage.getItem('gr_sudoku_progress_' + dateKey) || 'null'); }
    catch (e) { return null; }
  }
  function saveProgress(dateKey, progress) {
    try { localStorage.setItem('gr_sudoku_progress_' + dateKey, JSON.stringify(progress)); }
    catch (e) {}
  }

  /* ---- counters ---- */
  function getPersonalPlayed() {
    return Number(localStorage.getItem('gr_sudoku_played') || 0);
  }
  function incrementPersonalPlayed() {
    var n = getPersonalPlayed() + 1;
    try { localStorage.setItem('gr_sudoku_played', n); } catch (e) {}
    return n;
  }

  var COUNTER_URL = 'https://abacus.jasoncameron.dev/hit/gouthamrajesh-portfolio/sudoku-plays';
  function hitGlobalCounter() {
    return fetch(COUNTER_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) { return typeof data.value === 'number' ? data.value : null; })
      .catch(function () { return null; });
  }

  /* ---- sharing ---- */
  function buildShareText(number, elapsedSeconds, mistakes) {
    var m = Math.floor(elapsedSeconds / 60), s = elapsedSeconds % 60;
    var time = pad2(m) + ':' + pad2(s);
    var mistakeText = mistakes > 0 ? (' (' + mistakes + ' mistake' + (mistakes === 1 ? '' : 's') + ')') : '';
    var url = global.location.origin + global.location.pathname;
    return "Goutham's Daily Sudoku #" + number + "\n✅ Solved in " + time + mistakeText + "\n🧩 Play today's puzzle → " + url;
  }

  function shareResult(text) {
    if (navigator.share) {
      return navigator.share({ text: text }).catch(function () {});
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error('no share method available'));
  }

  global.Sudoku = {
    getDailyPuzzle: getDailyPuzzle,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    getPersonalPlayed: getPersonalPlayed,
    incrementPersonalPlayed: incrementPersonalPlayed,
    hitGlobalCounter: hitGlobalCounter,
    buildShareText: buildShareText,
    shareResult: shareResult,
    countSolutions: countSolutions,
    _dateKeyFor: dateKeyFor
  };
})(window);

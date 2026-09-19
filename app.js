(function () {
  var SUBJECTS = [
    { id: 'english', name: 'English', file: 'questions/english.json' },
    { id: 'science', name: 'Int. Science', file: 'questions/science.json' },
    { id: 'maths', name: 'Mathematics', file: 'questions/maths.json' }
  ];
  var bank = {};      // id -> items
  var cur = 'english';
  var order = [];     // shuffled indices
  var pos = 0;
  var answered = {};  // pos -> picked index
  var score = 0;

  var $ = function (id) { return document.getElementById(id); };
  var tabsEl = $('tabs'), qEl = $('q'), optsEl = $('opts'), exEl = $('explain'),
      posEl = $('pos'), pfillEl = $('pfill'), scoreEl = $('score'), bestEl = $('best'),
      topicEl = $('topic');

  function shuffled(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    if ($('shuffle').checked) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
    }
    return a;
  }

  function bestKey() { return 'someq_best_' + cur; }
  function showBest() {
    var b = parseInt(localStorage.getItem(bestKey()) || '0', 10);
    bestEl.textContent = b > 0 ? ('Best ' + b + '/' + (bank[cur] || []).length) : '';
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    SUBJECTS.forEach(function (s) {
      var n = (bank[s.id] || []).length;
      var b = document.createElement('button');
      b.className = 'tab' + (s.id === cur ? ' on' : '');
      b.innerHTML = '<b>' + s.name + '</b><small>' + n + ' questions</small>';
      b.onclick = function () { switchSubject(s.id); };
      tabsEl.appendChild(b);
    });
  }

  function switchSubject(id) {
    cur = id; pos = 0; answered = {}; score = 0;
    order = shuffled((bank[cur] || []).length);
    renderTabs(); showBest(); render();
  }

  function render() {
    var items = bank[cur] || [];
    if (!items.length) {
      qEl.textContent = 'No questions loaded.';
      optsEl.innerHTML = ''; exEl.className = 'explain'; topicEl.textContent = '';
      return;
    }
    pos = Math.max(0, Math.min(pos, items.length - 1));
    var q = items[order[pos]];
    topicEl.textContent = q.topic || cur;
    qEl.textContent = (pos + 1) + '. ' + q.q;
    posEl.textContent = (pos + 1) + ' / ' + items.length;
    pfillEl.style.width = Math.round(((pos + 1) / items.length) * 100) + '%';
    scoreEl.textContent = 'Score ' + score;
    optsEl.innerHTML = '';
    var picked = answered[pos];
    q.options.forEach(function (text, idx) {
      var b = document.createElement('button');
      var cls = 'opt';
      if (picked !== undefined) {
        cls += ' lock';
        if (idx === q.answer) cls += ' right';
        else if (idx === picked) cls += ' wrong';
        else cls += ' dim';
      }
      b.className = cls;
      var k = document.createElement('span'); k.className = 'k'; k.textContent = 'ABCD'[idx];
      var s = document.createElement('span'); s.textContent = text;
      b.appendChild(k); b.appendChild(s);
      if (picked === undefined) {
        b.onclick = function () { answer(idx); };
      }
      optsEl.appendChild(b);
    });
    if (picked !== undefined) {
      var ok = picked === q.answer;
      exEl.innerHTML = (ok ? '<b>Correct.</b> ' : '<b>Answer: ' + 'ABCD'[q.answer] + '.</b> ') +
        (q.explain ? escapeHtml(q.explain) : '');
      exEl.className = 'explain show';
    } else {
      exEl.className = 'explain'; exEl.innerHTML = '';
    }
    $('prev').disabled = pos === 0;
    $('next').disabled = pos >= items.length - 1;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function answer(idx) {
    var items = bank[cur] || [];
    var q = items[order[pos]];
    answered[pos] = idx;
    if (idx === q.answer) {
      score++;
      var b = parseInt(localStorage.getItem(bestKey()) || '0', 10);
      if (score > b) { try { localStorage.setItem(bestKey(), String(score)); } catch (e) {} }
    }
    showBest(); render();
  }

  $('prev').onclick = function () { if (pos > 0) { pos--; render(); } };
  $('next').onclick = function () {
    var items = bank[cur] || [];
    if (pos < items.length - 1) { pos++; render(); }
  };
  $('restart').onclick = function () {
    pos = 0; answered = {}; score = 0;
    order = shuffled((bank[cur] || []).length);
    render();
  };
  $('shuffle').onchange = function () {
    order = shuffled((bank[cur] || []).length);
    pos = 0; answered = {}; score = 0;
    render();
  };

  Promise.all(SUBJECTS.map(function (s) {
    return fetch(s.file).then(function (r) {
      if (!r.ok) throw new Error(s.file + ' ' + r.status);
      return r.json();
    }).then(function (d) { bank[s.id] = d; });
  })).then(function () {
    order = shuffled((bank[cur] || []).length);
    renderTabs(); showBest(); render();
  }).catch(function (e) {
    qEl.textContent = 'Failed to load questions: ' + e.message;
  });
})();

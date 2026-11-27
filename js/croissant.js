/* Café Breizh — ONE actual food item as living particles.
   Particles are sampled from the REAL croissant photo (assets/img/fe-croissant.webp):
   every particle takes its position AND its colour from an actual pixel of the
   photo, with brightness as relief depth. Own code, raw WebGL, no libraries. */
(function () {
  var canvas = document.querySelector('[data-cymatic]');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: true, alpha: true });
  if (!gl) { document.body.classList.add('no-gl'); return; }

  var VS = [
    'attribute vec3 aPos;',      /* target: the photo pixel position */
    'attribute vec3 aStart;',    /* burst-in start */
    'attribute vec3 aCol;',      /* the photo pixel colour */
    'attribute float aRnd;',
    'uniform float uTime, uMorph, uPulse, uSize, uPixelRatio, uSway, uFit;',
    'uniform vec2 uMouse, uScale;',
    'varying vec3 vCol;',
    'varying float vFade;',
    'void main(){',
    '  float e = 1.0 - pow(1.0 - uMorph, 3.0);',
    '  vec3 p = mix(aStart, aPos, e);',
    /* gentle living drift */
    '  p.x += sin(uTime*0.7 + aRnd*40.0)*0.008;',
    '  p.y += cos(uTime*0.6 + aRnd*31.0)*0.008;',
    /* pulse wave from centre */
    '  float d = length(aPos.xy);',
    '  float w = sin(d*7.0 - uPulse*10.566) * exp(-uPulse*2.6) * step(0.001, uPulse);',
    '  p += normalize(vec3(aPos.xy, 0.35)) * w * 0.16;',
    /* sway like the reference sculpture */
    '  float ang = sin(uTime*0.22)*0.45*uSway + uMouse.x*0.35;',
    '  float ca = cos(ang), sa = sin(ang);',
    '  p = vec3(ca*p.x - sa*p.z, p.y, sa*p.x + ca*p.z);',
    '  float tilt = 0.16 + uMouse.y*0.22;',
    '  float ct = cos(tilt), st = sin(tilt);',
    '  p = vec3(p.x, ct*p.y - st*p.z, st*p.y + ct*p.z);',
    '  p.xy += uMouse*0.05;',
    '  p.xy *= uScale * uFit;',
    '  vCol = aCol;',
    '  vFade = 0.75 + 0.25*sin(aRnd*90.0 + uTime*1.4);',
    '  vec4 mv = vec4(p, 1.0);',
    '  gl_Position = vec4(mv.xy, mv.z*0.2, 1.0);',
    '  gl_PointSize = uSize * uPixelRatio * (0.7 + aRnd*0.6);',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'varying vec3 vCol;',
    'varying float vFade;',
    'void main(){',
    '  vec2 uv = gl_PointCoord - 0.5;',
    '  float d = length(uv);',
    '  float a = smoothstep(0.5, 0.30, d);',
    '  if (a < 0.01) discard;',
    '  gl_FragColor = vec4(vCol, a * vFade);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var U = {};
  ['uTime', 'uMorph', 'uPulse', 'uSize', 'uPixelRatio', 'uSway', 'uFit', 'uMouse', 'uScale'].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  var N = 42000;
  var buf = null;

  function buildFromImage(img) {
    var S = 240; /* sample grid */
    var c = document.createElement('canvas'); c.width = c.height = S;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    /* crop: the halved croissant held in hands, centre of the portrait photo */
    var W = img.naturalWidth, H = img.naturalHeight;
    var s = W * 0.96, sx = (W - s) / 2, sy = H * 0.17;
    ctx.drawImage(img, sx, sy, s, s, 0, 0, S, S);
    var data = ctx.getImageData(0, 0, S, S).data;

    var pos = new Float32Array(N * 3), start = new Float32Array(N * 3),
        col = new Float32Array(N * 3), rnd = new Float32Array(N);
    var placed = 0, guard = 0;
    while (placed < N && guard < N * 30) {
      guard++;
      var px = (Math.random() * S) | 0, py = (Math.random() * S) | 0;
      var nx = (px / (S - 1)) * 2 - 1, ny = (py / (S - 1)) * 2 - 1;
      if (nx * nx + ny * ny > 0.96) continue; /* round plate crop */
      var idx = (py * S + px) * 4;
      var r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
      var lum = 0.299 * r + 0.587 * g + 0.114 * b;
      /* grade: deepen + saturate so the pale crumb reads on the crème ground */
      function grade(c) { return Math.min(1, Math.pow(c, 1.3) * 1.18); }
      var gr = grade(r), gg = grade(g), gb = grade(b);
      var gl2 = 0.299 * gr + 0.587 * gg + 0.114 * gb;
      var i3 = placed * 3;
      pos[i3] = nx * 1.12;
      pos[i3 + 1] = -ny * 1.12;
      pos[i3 + 2] = (lum - 0.45) * 0.55; /* brightness = relief */
      col[i3] = Math.min(1, gl2 + (gr - gl2) * 1.3);
      col[i3 + 1] = Math.min(1, gl2 + (gg - gl2) * 1.3);
      col[i3 + 2] = Math.min(1, gl2 + (gb - gl2) * 1.3);
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), rr = 1.7 + Math.random() * 0.5;
      start[i3] = rr * Math.sin(ph) * Math.cos(th);
      start[i3 + 1] = rr * Math.sin(ph) * Math.sin(th);
      start[i3 + 2] = rr * Math.cos(ph) * 0.4;
      rnd[placed] = Math.random();
      placed++;
    }

    function attr(name, arr, size) {
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return b;
    }
    attr('aPos', pos, 3); attr('aStart', start, 3); attr('aCol', col, 3); attr('aRnd', rnd, 1);
    buf = true;
  }

  var img = new Image();
  img.onload = function () { buildFromImage(img); };
  img.src = 'assets/img/fe-croissant.webp';

  /* controls — same wiring as the reference sample */
  var spinning = true, pulseStart = -10;
  var pauseBtn = document.querySelector('[data-pause]');
  var playBtn = document.querySelector('[data-play]');
  function setSpin(v) {
    spinning = v;
    if (pauseBtn) pauseBtn.classList.toggle('is-off', !v);
    if (playBtn) playBtn.classList.toggle('is-off', v);
  }
  var pulseBtn = document.querySelector('[data-pulse]');
  if (pulseBtn) pulseBtn.addEventListener('click', function () { pulseStart = perfNow(); });
  if (pauseBtn) pauseBtn.addEventListener('click', function () { setSpin(false); });
  if (playBtn) playBtn.addEventListener('click', function () { setSpin(true); });
  var themeBtn = document.querySelector('[data-theme]');
  if (themeBtn) themeBtn.addEventListener('click', function () { document.body.classList.toggle('dark'); });

  var mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = (e.clientY / window.innerHeight) * 2 - 1;
  });

  var t0 = performance.now();
  function perfNow() { return (performance.now() - t0) / 1000; }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    var a = canvas.clientWidth / canvas.clientHeight;
    gl.uniform2f(U.uScale, Math.min(1, 1 / a), Math.min(1, a));
    gl.uniform1f(U.uFit, canvas.clientWidth < 760 ? 0.92 : 0.84);
    gl.uniform1f(U.uPixelRatio, dpr);
    gl.uniform1f(U.uSize, Math.max(1.8, canvas.clientHeight / 220));
  }
  window.addEventListener('resize', resize);
  resize();

  var swayCur = 1;
  function frame() {
    requestAnimationFrame(frame);
    if (!buf) return;
    var t = perfNow();
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    swayCur += ((spinning ? 1 : 0) - swayCur) * 0.05;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uMorph, Math.min(1, t / 1.6));
    gl.uniform1f(U.uPulse, pulseStart < 0 ? 0 : t - pulseStart);
    gl.uniform1f(U.uSway, swayCur);
    gl.uniform2f(U.uMouse, mx, -my);
    gl.drawArrays(gl.POINTS, 0, N);
  }
  frame();
})();

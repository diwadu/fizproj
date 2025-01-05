/* =======================
   Kluczowe zmienne
======================= */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* Skalowanie dynamiczne */
let dynamicScaleX = 1;
let dynamicScaleY = 1;
let maxXDynamic = 300;
let maxYDynamic = 150;

/* Suwaki / Dropdown */
const velocitySlider = document.getElementById("velocitySlider");
const angleSlider = document.getElementById("angleSlider");
const gravitySelect = document.getElementById("gravitySelect");

/* Etykiety wyświetlane */
const velocityValue = document.getElementById("velocityValue");
const angleValue = document.getElementById("angleValue");
const currentVelocity = document.getElementById("currentVelocity");
const currentAngle = document.getElementById("currentAngle");

/* Inne elementy HTML */
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const distanceX = document.getElementById("distanceX");
const distanceY = document.getElementById("distanceY");
const timeVal = document.getElementById("timeVal");

/* Parametry fizyczne */
let g = parseFloat(gravitySelect.value);
let velocity = parseFloat(velocitySlider.value);
let angle = parseFloat(angleSlider.value) * (Math.PI / 180);
let dt = 0.1;
const mass = 1;

/* Zmienne stanu ruchu */
let t = 0,
  x = 0,
  y = 0;
let animationId;
let isSimulating = false;

/* Podstawowe marginesy osi */
const margin = 50;
const maxX = 300;
const maxY = 150;
const scaleX = (canvas.width - 2 * margin) / maxX;
const scaleY = (canvas.height - 2 * margin) / maxY;

/* Tablica ze śladem */
let pathPoints = [];

/* =======================
   Funkcje pomocnicze
======================= */

/* Aktualizacja wyświetlanych wartości */
function updateLabels() {
  velocityValue.textContent = velocitySlider.value;
  angleValue.textContent = angleSlider.value;
  currentVelocity.textContent = velocitySlider.value;
  currentAngle.textContent = angleSlider.value;
}

/* Listenery dla suwaków i dropdowna */
velocitySlider.addEventListener("input", () => {
  velocity = parseFloat(velocitySlider.value);
  updateLabels();
});
angleSlider.addEventListener("input", () => {
  angle = parseFloat(angleSlider.value) * (Math.PI / 180);
  updateLabels();
});
gravitySelect.addEventListener("change", () => {
  g = parseFloat(gravitySelect.value);
  updateLabels();
  drawAxesAndGrid();
});

/* Rysowanie osi + siatki */
function drawAxesAndGrid() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#888";
  ctx.fillStyle = "black";
  ctx.lineWidth = 1;
  ctx.font = "14px Arial";

  const range = (velocity * velocity * Math.sin(2 * angle)) / g;
  const maxHeight =
    (velocity * velocity * Math.pow(Math.sin(angle), 2)) / (2 * g);

  maxXDynamic = range * 1.2;
  maxYDynamic = maxHeight * 1.2;

  dynamicScaleX = (canvas.width - 2 * margin) / maxXDynamic;
  dynamicScaleY = (canvas.height - 2 * margin) / maxYDynamic;

  const stepX = Math.ceil(maxXDynamic / 6 / 10) * 10;
  const stepY = Math.ceil(maxYDynamic / 6 / 5) * 5;

  for (let valX = 0; valX <= maxXDynamic; valX += stepX) {
    const px = margin + valX * dynamicScaleX;
    ctx.beginPath();
    ctx.moveTo(px, margin);
    ctx.lineTo(px, canvas.height - margin);
    ctx.stroke();
    ctx.closePath();
    ctx.fillText(valX.toString(), px - 10, canvas.height - margin + 20);
  }

  for (let valY = 0; valY <= maxYDynamic; valY += stepY) {
    const py = canvas.height - margin - valY * dynamicScaleY;
    ctx.beginPath();
    ctx.moveTo(margin, py);
    ctx.lineTo(canvas.width - margin, py);
    ctx.stroke();
    ctx.closePath();
    ctx.fillText(valY.toString(), margin - 30, py + 100); // w oryginale +100?
  }

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(margin, canvas.height - margin);
  ctx.lineTo(canvas.width - margin, canvas.height - margin);
  ctx.stroke();
  ctx.closePath();

  drawArrow(
    canvas.width - margin - 10,
    canvas.height - margin,
    canvas.width - margin,
    canvas.height - margin
  );
  ctx.fillText("x [m]", canvas.width - margin + 10, canvas.height - margin + 5);

  ctx.beginPath();
  ctx.moveTo(margin, canvas.height - margin);
  ctx.lineTo(margin, margin);
  ctx.stroke();
  ctx.closePath();

  drawArrow(margin, margin + 10, margin, margin);

  ctx.save();
  ctx.translate(margin, margin - 10);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("h [m]", 0, 0);
  ctx.restore();

  ctx.restore();
}

/* Rysowanie grotki */
function drawArrow(fromX, fromY, toX, toY) {
  const headLen = 10;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
  ctx.closePath();
}

/* Rysowanie piłki */
function drawBall(posX, posY) {
  const radius = 5;
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
}

/* Rysowanie śladu (trajektorii) */
function drawPath() {
  if (!pathPoints.length) return;
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].cx, pathPoints[0].cy);
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].cx, pathPoints[i].cy);
  }
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

/* Dodawanie wyświetlania energii do infoBox (opcjonalne) */
function addEnergyDisplays() {
  const infoBox = document.getElementById("infoBox");

  const epP = document.createElement("p");
  epP.innerHTML =
    "Energia potencjalna (E<sub>p</sub>): <span id='potentialEnergy'>0</span> J";
  infoBox.appendChild(epP);

  const ekP = document.createElement("p");
  ekP.innerHTML =
    "Energia kinetyczna (E<sub>k</sub>): <span id='kineticEnergy'>0</span> J";
  infoBox.appendChild(ekP);

  const totalEP = document.createElement("p");
  totalEP.innerHTML =
    "Energia całkowita (E): <span id='totalEnergy'>0</span> J";
  infoBox.appendChild(totalEP);
}

/* Główna pętla symulacji */

function simulate() {
  drawAxesAndGrid();

  // Obliczanie pozycji
  x = velocity * Math.cos(angle) * t;
  y = velocity * Math.sin(angle) * t - 0.5 * g * t * t;

  // Skalowanie do canvas
  const canvasX = margin + x * dynamicScaleX;
  const canvasY = canvas.height - margin - y * dynamicScaleY;

  // Rysowanie śladu
  if (
    canvasX >= margin &&
    canvasX <= canvas.width - margin &&
    canvasY >= margin &&
    canvasY <= canvas.height - margin
  ) {
    pathPoints.push({ cx: canvasX, cy: canvasY });
  }
  drawPath();

  // Rysowanie piłki (jeżeli nad ziemią)
  if (canvasY < canvas.height - margin && y >= 0) {
    drawBall(canvasX, canvasY);
  }

  // Wyświetlanie x, y, t
  distanceX.textContent = x.toFixed(2);
  distanceY.textContent = y.toFixed(2);
  timeVal.textContent = t.toFixed(2);

  //Obliczenia energii ===
  // v_x i v_y w danym momencie
  const vx = velocity * Math.cos(angle);
  const vy = velocity * Math.sin(angle) - g * t;
  const speed = Math.sqrt(vx * vx + vy * vy);

  const Ek = 0.5 * mass * speed * speed; // energia kinetyczna
  const Ep = mass * g * y; // energia potencjalna
  const E = Ek + Ep; // energia całkowita

  // Wstawianie do elementów HTML
  const potEl = document.getElementById("potentialEnergy");
  const kinEl = document.getElementById("kineticEnergy");
  const totEl = document.getElementById("totalEnergy");

  if (potEl && kinEl && totEl) {
    potEl.textContent = Ep.toFixed(2);
    kinEl.textContent = Ek.toFixed(2);
    totEl.textContent = E.toFixed(2);
  }

  // Inkrementacja czasu
  t += dt;

  // Sprawdzenie, czy obiekt "wylądował"
  if (y <= 0 && t > 0.1) {
    isSimulating = false;
    cancelAnimationFrame(animationId);
  } else {
    animationId = requestAnimationFrame(simulate);
  }
}

/* Obsługa przycisków */
startButton.addEventListener("click", () => {
  if (!isSimulating) {
    velocity = parseFloat(velocitySlider.value);
    angle = parseFloat(angleSlider.value) * (Math.PI / 180);
    t = 0;
    x = 0;
    y = 0;
    pathPoints = [];

    isSimulating = true;
    simulate();
  }
});

resetButton.addEventListener("click", () => {
  isSimulating = false;
  cancelAnimationFrame(animationId);

  t = 0;
  x = 0;
  y = 0;
  pathPoints = [];

  distanceX.textContent = "0";
  distanceY.textContent = "0";
  timeVal.textContent = "0";

  dynamicScaleX = 1;
  dynamicScaleY = 1;
  maxXDynamic = 300;
  maxYDynamic = 150;

  currentVelocity.textContent = velocitySlider.value;
  currentAngle.textContent = angleSlider.value;

  drawAxesAndGrid();
});

/* Inicjalizacja na starcie */
updateLabels();
drawAxesAndGrid();
addEnergyDisplays();

const colExBtn = document.querySelector("h2 a");
const theoryBox = document.getElementsByClassName("theory")[0];

colExBtn.addEventListener("click", () => {
  let collapsed = colExBtn.textContent === "[ukryj]" ? true : false;
  if (collapsed) {
    theoryBox.style.display = "none";
    colExBtn.textContent = "[pokaż]";
  } else {
    theoryBox.style.display = "block";
    colExBtn.textContent = "[ukryj]";
  }
});

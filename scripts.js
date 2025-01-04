// -------------------
// Kluczowe zmienne
// -------------------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Suwaki
const velocitySlider = document.getElementById("velocitySlider");
const angleSlider = document.getElementById("angleSlider");

// Dropdown dla przyspieszenia grawitacyjnego
const gravitySelect = document.getElementById("gravitySelect");

// Etykiety pokazujące wartości
const velocityValue = document.getElementById("velocityValue");
const angleValue = document.getElementById("angleValue");
const currentVelocity = document.getElementById("currentVelocity");
const currentAngle = document.getElementById("currentAngle");

// Inne elementy HTML
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");

const distanceX = document.getElementById("distanceX");
const distanceY = document.getElementById("distanceY");
const timeVal = document.getElementById("timeVal");

// Parametry fizyczne
let g = parseFloat(gravitySelect.value); // m/s^2
let velocity = parseFloat(velocitySlider.value);
let angle = parseFloat(angleSlider.value) * (Math.PI / 180); // konwersja stopni -> rad

// Położenie i czas
let t = 0;
let x = 0;
let y = 0;
let dt = 0.1; // krok czasowy (sekundy)

// Zmienne do sterowania symulacją
let animationId;
let isSimulating = false;

// ------------------------------
// Skalowanie i marginesy osi
// ------------------------------
// Załóżmy, że chcemy maks. rozpiętość X ~ 300 m (aby przy zasięgach rzędu 250 m
// wypełniać znaczną część szerokości).
// Dla wysokości Y niech to będzie np. 150 m.
const margin = 50; // margines wokół canvas (px)
const maxX = 300; // maksymalny zakres w metrach (oś X)
const maxY = 150; // maksymalny zakres w metrach (oś Y)

// Obliczamy współczynnik skalowania (metry -> piksele)
const scaleX = (canvas.width - 2 * margin) / maxX;
const scaleY = (canvas.height - 2 * margin) / maxY;

// ------------------------------
// Ślad (trajektoria)
// ------------------------------
let pathPoints = [];

// ------------------------------
// Energia mechaniczna
// ------------------------------
const mass = 1; // kg [NOWOŚĆ]

// --------------------------------
// Aktualizacja etykiet suwaków
// --------------------------------
function updateLabels() {
  velocityValue.textContent = velocitySlider.value;
  angleValue.textContent = angleSlider.value;
  currentVelocity.textContent = velocitySlider.value;
  currentAngle.textContent = angleSlider.value;
}

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
});

// ---------------------------
// Rysowanie osi + kratki
// ---------------------------
function drawAxesAndGrid() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#888";
  ctx.fillStyle = "black";
  ctx.lineWidth = 1;
  ctx.font = "14px Arial";

  // Rysowanie siatki pionowej i poziomej
  // Krok w "rzeczywistych" metrach (co 50 m w poziomie, co 25 m w pionie - przykładowo)
  const stepX = 50;
  const stepY = 25;

  // Siatka pionowa (dla X)
  for (let valX = 0; valX <= maxX; valX += stepX) {
    let px = margin + valX * scaleX;
    ctx.beginPath();
    ctx.moveTo(px, margin);
    ctx.lineTo(px, canvas.height - margin);
    ctx.stroke();
    ctx.closePath();

    // Opis podziałki na osi X (nad osią)
    ctx.fillText(valX.toString(), px - 10, canvas.height - margin + 20);
  }

  // Siatka pozioma (dla Y)
  for (let valY = 0; valY <= maxY; valY += stepY) {
    let py = canvas.height - margin - valY * scaleY;
    ctx.beginPath();
    ctx.moveTo(margin, py);
    ctx.lineTo(canvas.width - margin, py);
    ctx.stroke();
    ctx.closePath();

    // Opis podziałki na osi Y (z lewej strony)
    // Dodajemy kilka px, by tekst nie zachodził na linię
    ctx.fillText(valY.toString(), margin - 30, py + 5);
  }

  // -----------------
  // Rysowanie osi X
  // -----------------
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  // Główna linia osi X
  ctx.beginPath();
  ctx.moveTo(margin, canvas.height - margin);
  ctx.lineTo(canvas.width - margin, canvas.height - margin);
  ctx.stroke();
  ctx.closePath();

  // Strzałka na osi X (groty)
  drawArrow(
    canvas.width - margin - 10, // początek grotki
    canvas.height - margin,
    canvas.width - margin, // koniec grotki
    canvas.height - margin
  );

  // Podpis osi X
  ctx.fillText("X [m]", canvas.width - margin + 10, canvas.height - margin + 5);

  // -----------------
  // Rysowanie osi Y
  // -----------------
  ctx.beginPath();
  ctx.moveTo(margin, canvas.height - margin);
  ctx.lineTo(margin, margin);
  ctx.stroke();
  ctx.closePath();

  // Strzałka na osi Y
  drawArrow(margin, margin + 10, margin, margin);

  // Podpis osi Y
  // Osią Y jest pionowa, więc umieszczamy napis w pionie lub tuż nad strzałką
  ctx.save();
  ctx.translate(margin - 10, margin - 20); // lekkie przesunięcie
  ctx.rotate(-Math.PI / 2); // obróć o 90 st. w lewo
  ctx.fillText("h [m]", 0, 0);
  ctx.restore();

  ctx.restore();
}

// --------------------------
// Funkcja rysowania grotki
// --------------------------
function drawArrow(fromX, fromY, toX, toY) {
  const headLen = 10; // długość grotki
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.closePath();

  // lewa część grotki
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.stroke();
  ctx.closePath();

  // prawa część grotki
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
  ctx.closePath();
}

// ------------------------
// Rysowanie piłki
// ------------------------
function drawBall(posX, posY) {
  const radius = 5;
  ctx.beginPath();
  ctx.arc(posX, posY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
}

// ------------------------
// Rysowanie śladu (trajektorii)
// ------------------------
function drawPath() {
  if (pathPoints.length === 0) return;
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

// -----------------------------
// Funkcja dodająca elementy do infoBox [NOWOŚĆ]
// -----------------------------
function addEnergyDisplays() {
  const infoBox = document.getElementById("infoBox");

  // Energia potencjalna
  const epP = document.createElement("p");
  epP.innerHTML =
    "Energia potencjalna (E<sub>p</sub>): <span id='potentialEnergy'>0</span> J";
  infoBox.appendChild(epP);

  // Energia kinetyczna
  const ekP = document.createElement("p");
  ekP.innerHTML =
    "Energia kinetyczna (E<sub>k</sub>): <span id='kineticEnergy'>0</span> J";
  infoBox.appendChild(ekP);

  // Energia całkowita
  const totalEP = document.createElement("p");
  totalEP.innerHTML =
    "Energia całkowita (E): <span id='totalEnergy'>0</span> J";
  infoBox.appendChild(totalEP);
}

// -----------------------------
// Główna pętla symulacji
// -----------------------------
function simulate() {
  // Rysujemy na nowo osie i kratkę
  drawAxesAndGrid();

  // Obliczamy aktualną pozycję w metrach
  x = velocity * Math.cos(angle) * t;
  y = velocity * Math.sin(angle) * t - 0.5 * g * t * t;

  // Skalujemy do współrzędnych canvas
  const canvasX = margin + x * scaleX;
  const canvasY = canvas.height - margin - y * scaleY;

  // Dodajemy punkt do śladu (jeśli mieści się w granicach)
  if (
    canvasX >= margin &&
    canvasX <= canvas.width - margin &&
    canvasY <= canvas.height - margin &&
    canvasY >= margin
  ) {
    pathPoints.push({ cx: canvasX, cy: canvasY });
  }

  // Rysujemy ślad
  drawPath();

  // Rysujemy piłkę (jeżeli jest nad "ziemią")
  if (canvasY < canvas.height - margin && y >= 0) {
    drawBall(canvasX, canvasY);
  }

  // Wyświetlanie parametrów w <span>ach
  distanceX.textContent = x.toFixed(2);
  distanceY.textContent = y.toFixed(2);
  timeVal.textContent = t.toFixed(2);

  // -------------------
  // Obliczenia energii [NOWOŚĆ]
  // -------------------
  const vx = velocity * Math.cos(angle); // Prędkość pozioma (const.)
  const vy = velocity * Math.sin(angle) - g * t; // Prędkość pionowa
  const speed = Math.sqrt(vx * vx + vy * vy); // Całkowita prędkość

  const Ek = 0.5 * mass * speed * speed; // Energia kinetyczna
  const Ep = mass * g * y; // Energia potencjalna
  const E = Ek + Ep; // Energia całkowita

  // Aktualizacja wartości energii w interfejsie
  const kineticEnergyElem = document.getElementById("kineticEnergy");
  const potentialEnergyElem = document.getElementById("potentialEnergy");
  const totalEnergyElem = document.getElementById("totalEnergy");

  if (kineticEnergyElem && potentialEnergyElem && totalEnergyElem) {
    kineticEnergyElem.textContent = Ek.toFixed(2);
    potentialEnergyElem.textContent = Ep.toFixed(2);
    totalEnergyElem.textContent = E.toFixed(2);
  }

  // Inkrementujemy czas
  t += dt;

  // Jeśli obiekt spadł poniżej y=0 (ziemia), a już był w ruchu, kończymy animację
  if (y <= 0 && t > 0.1) {
    isSimulating = false;
    cancelAnimationFrame(animationId);
  } else {
    animationId = requestAnimationFrame(simulate);
  }
}

// -----------------------
/* Obsługa przycisków */
// -----------------------
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

  const kineticEnergyElem = document.getElementById("kineticEnergy");
  const potentialEnergyElem = document.getElementById("potentialEnergy");
  const totalEnergyElem = document.getElementById("totalEnergy");

  if (kineticEnergyElem) kineticEnergyElem.textContent = "0";
  if (potentialEnergyElem) potentialEnergyElem.textContent = "0";
  if (totalEnergyElem) totalEnergyElem.textContent = "0";

  drawAxesAndGrid();
});

// -----------------------
// Inicjalizacja
// -----------------------
updateLabels();
drawAxesAndGrid(); // Rysujemy osie i kratkę na samym początku
addEnergyDisplays(); // [NOWOŚĆ] Dodajemy wyświetlanie energii

const canvas = document.getElementById("fireworks-canvas");
const ctx = canvas.getContext("2d");
const balloonContainer = document.getElementById("balloon-container");
const scoreBoard = document.getElementById("score-board");
const soundToggle = document.getElementById("sound-toggle");
const resetButton = document.getElementById("reset-button");

const animals = [
  { emoji: "🐨", nameTr: "Koala" },
  { emoji: "🐷", nameTr: "Domuz" },
  { emoji: "🐮", nameTr: "İnek" },
  { emoji: "🐶", nameTr: "Köpek" },
  { emoji: "🐱", nameTr: "Kedi" },
  { emoji: "🐭", nameTr: "Fare" },
  { emoji: "🐹", nameTr: "Hamster" },
  { emoji: "🐰", nameTr: "Tavşan" },
  { emoji: "🐵", nameTr: "Maymun" },
  { emoji: "🐻", nameTr: "Ayı" },
  { emoji: "🐼", nameTr: "Panda" },
  { emoji: "🐯", nameTr: "Kaplan" },
  { emoji: "🦁", nameTr: "Aslan" },
  { emoji: "🦊", nameTr: "Tilki" },
  { emoji: "🐴", nameTr: "At" },
  { emoji: "🦄", nameTr: "Tek boynuzlu at" },
  { emoji: "🐺", nameTr: "Kurt" },
  { emoji: "🦧", nameTr: "Goril" },
  { emoji: "🐤", nameTr: "Civciv" },
  { emoji: "🐦", nameTr: "Kuş" },
  { emoji: "🐧", nameTr: "Penguen" },
  { emoji: "🐔", nameTr: "Tavuk" },
  { emoji: "🦆", nameTr: "Ördek" },
  { emoji: "🦅", nameTr: "Kartal" },
  { emoji: "🦉", nameTr: "Baykuş" },
  { emoji: "🦋", nameTr: "Kelebek" },
  { emoji: "🐌", nameTr: "Salyangoz" },
  { emoji: "🐝", nameTr: "Bal arısı" },
  { emoji: "🐜", nameTr: "Karınca" },
  { emoji: "🐞", nameTr: "Uğur böceği" },
  { emoji: "🐸", nameTr: "Kurbağa" },
  { emoji: "🐙", nameTr: "Ahtapot" },
  { emoji: "🐢", nameTr: "Kaplumbağa" },
  { emoji: "🦂", nameTr: "Akrep" },
  { emoji: "🦀", nameTr: "Yengeç" },
];

const counts = Object.fromEntries(animals.map((animal) => [animal.emoji, 0]));
const animalByEmoji = Object.fromEntries(animals.map((animal) => [animal.emoji, animal]));

const colors = [
  "#ff5252",
  "#ff4081",
  "#e040fb",
  "#7c4dff",
  "#536dfe",
  "#448aff",
  "#40c4ff",
  "#18ffff",
  "#64ffda",
  "#b2ff59",
  "#eeff41",
  "#ffd740",
  "#ffab40",
  "#ff6e40",
];

let soundEnabled = true;
let particles = [];

function speak(text, element) {
  if (!soundEnabled || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "tr-TR";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  if (element) {
    element.classList.add("is-speaking");
    utterance.onend = () => element.classList.remove("is-speaking");
    utterance.onerror = () => element.classList.remove("is-speaking");
  }

  window.speechSynthesis.speak(utterance);
}

function playPopSound() {
  if (!soundEnabled) return;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(90, audioContext.currentTime + 0.08);

  gain.gain.setValueAtTime(0.22, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.08);
}

function updateScoreBoard() {
  scoreBoard.innerHTML = "";
  const visibleAnimals = animals.filter((animal) => counts[animal.emoji] > 0);

  if (visibleAnimals.length === 0) {
    scoreBoard.textContent = "Henüz balon patlatılmadı.";
    return;
  }

  visibleAnimals.forEach((animal) => {
    const item = document.createElement("button");
    item.className = "score-item";
    item.type = "button";
    item.title = `${animal.nameTr} seslendir`;
    item.innerHTML = `<span class="score-emoji">${animal.emoji}</span><span>${counts[animal.emoji]}</span>`;
    item.addEventListener("click", () => speak(animal.nameTr, item));
    scoreBoard.appendChild(item);
  });
}

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velocity = {
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
    };
    this.alpha = 1;
    this.friction = 0.95;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(this.alpha, 0);
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= 0.012;
  }

  static createExplosion(x, y, color, amount = 32) {
    for (let i = 0; i < amount; i += 1) {
      particles.push(new Particle(x, y, color));
    }
  }
}

function createFirework() {
  const x = Math.random() * window.innerWidth;
  const y = 130 + Math.random() * (window.innerHeight / 2);
  const color = `hsl(${Math.random() * 360}, 78%, 60%)`;
  Particle.createExplosion(x, y, color, 90);
}

function animateFireworks() {
  requestAnimationFrame(animateFireworks);
  ctx.fillStyle = "rgba(253, 239, 249, 0.16)";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  particles = particles.filter((particle) => particle.alpha > 0);
  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });

  if (Math.random() < 0.02) createFirework();
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createBalloon() {
  const balloon = document.createElement("div");
  const animal = randomItem(animals);
  const color = randomItem(colors);
  const emojiSpan = document.createElement("span");

  balloon.className = "balloon";
  balloon.dataset.animal = animal.emoji;
  balloon.style.backgroundColor = color;
  balloon.style.left = `${Math.random() * 88 + 2}vw`;
  balloon.style.animationDuration = `${7 + Math.random() * 6}s`;

  emojiSpan.className = "balloon-emoji";
  emojiSpan.textContent = animal.emoji;
  balloon.appendChild(emojiSpan);

  balloon.addEventListener("click", (event) => {
    event.stopPropagation();
    popBalloon(balloon, color);
  });

  balloon.addEventListener("touchstart", (event) => {
    event.preventDefault();
    popBalloon(balloon, color);
  }, { passive: false });

  balloon.addEventListener("animationend", () => balloon.remove());
  balloonContainer.appendChild(balloon);
}

function popBalloon(balloon, color) {
  if (!balloon.isConnected || balloon.dataset.popped === "true") return;

  balloon.dataset.popped = "true";
  const animal = animalByEmoji[balloon.dataset.animal];
  if (animal) {
    counts[animal.emoji] += 1;
    updateScoreBoard();
    speak(animal.nameTr);
  }

  playPopSound();

  const rect = balloon.getBoundingClientRect();
  Particle.createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, color, 42);

  balloon.style.transition = "transform 0.12s ease-out, opacity 0.12s ease-out";
  balloon.style.transform = "scale(1.55)";
  balloon.style.opacity = "0";
  window.setTimeout(() => balloon.remove(), 130);
}

soundToggle.addEventListener("click", async () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.textContent = soundEnabled ? "Ses: Açık" : "Ses: Kapalı";

  if (soundEnabled) {
    speak("Ses açıldı");
  } else if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

resetButton.addEventListener("click", () => {
  animals.forEach((animal) => {
    counts[animal.emoji] = 0;
  });
  balloonContainer.innerHTML = "";
  particles = [];
  updateScoreBoard();
});

updateScoreBoard();
animateFireworks();
window.setInterval(createBalloon, 700);

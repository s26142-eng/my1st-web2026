let car;
let traffic = [];
let tireTracks = [];
let particles = [];
let score = 0;
let gameOver = false;

function setup() {
  createCanvas(600, 700);
  car = new PlayerCar(width / 2, height - 120);
}

function draw() {
  background(40);

  // Draw road boundaries and center lines
  drawRoad();

  if (!gameOver) {
    // Update and display tire tracks
    for (let i = tireTracks.length - 1; i >= 0; i--) {
      tireTracks[i].update();
      tireTracks[i].display();
      if (tireTracks[i].isFinished()) {
        tireTracks.splice(i, 1);
      }
    }

    // Update and display player car
    car.update();
    car.display();

    // Spawn and handle obstacles / traffic
    if (frameCount % 60 === 0) {
      traffic.push(new TrafficCar());
    }

    for (let i = traffic.length - 1; i >= 0; i--) {
      traffic[i].update();
      traffic[i].display();

      // Check collision
      if (car.hits(traffic[i])) {
        gameOver = true;
      }

      // Remove off-screen traffic & increment score
      if (traffic[i].offScreen()) {
        traffic.splice(i, 1);
        score += 10;
      }
    }

    // Exhaust particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].display();
      if (particles[i].isFinished()) {
        particles.splice(i, 1);
      }
    }

    displayUI();
  } else {
    drawGameOver();
  }
}

function keyPressed() {
  if (gameOver && key === ' ') {
    resetGame();
  }
}

function resetGame() {
  traffic = [];
  tireTracks = [];
  particles = [];
  score = 0;
  car = new PlayerCar(width / 2, height - 120);
  gameOver = false;
}

function drawRoad() {
  // Road surface
  fill(60);
  noStroke();
  rect(100, 0, 400, height);

  // Road side lines
  stroke(255);
  strokeWeight(4);
  line(100, 0, 100, height);
  line(500, 0, 500, height);

  // Animated dashed center line
  stroke(255, 204, 0);
  strokeWeight(3);
  let dashOffset = (frameCount * 5) % 40;
  for (let y = -40 + dashOffset; y < height; y += 40) {
    line(width / 2, y, width / 2, y + 20);
  }
}

function displayUI() {
  noStroke();
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Score: ${score}`, 20, 20);
}

function drawGameOver() {
  fill(0, 180);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(255, 80, 80);
  textSize(48);
  text("CRASHED!", width / 2, height / 2 - 30);

  fill(255);
  textSize(22);
  text(`Final Score: ${score}`, width / 2, height / 2 + 20);
  textSize(16);
  text("Press SPACE to Restart", width / 2, height / 2 + 60);
}

// Player Car Class
class PlayerCar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 50;
    this.angle = 0;
    this.speed = 0;
    this.maxSpeed = 6;
    this.acceleration = 0.2;
    this.friction = 0.05;
  }

  update() {
    // Steer controls
    if (keyIsDown(LEFT_ARROW)) this.angle -= 0.05;
    if (keyIsDown(RIGHT_ARROW)) this.angle += 0.05;

    // Drive controls
    if (keyIsDown(UP_ARROW)) {
      this.speed += this.acceleration;
      // Spawn exhaust particles
      if (frameCount % 3 === 0) {
        particles.push(new Particle(this.x, this.y, this.angle));
      }
    } else if (keyIsDown(DOWN_ARROW)) {
      this.speed -= this.acceleration;
    } else {
      // Natural deceleration
      if (this.speed > 0) this.speed -= this.friction;
      if (this.speed < 0) this.speed += this.friction;
      if (Math.abs(this.speed) < this.friction) this.speed = 0;
    }

    this.speed = constrain(this.speed, -this.maxSpeed / 2, this.maxSpeed);

    // Leave skid marks if turning while driving fast
    if (Math.abs(this.speed) > 3 && (keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW))) {
      tireTracks.push(new Track(this.x, this.y));
    }

    // Move car
    this.x += sin(this.angle) * this.speed;
    this.y -= cos(this.angle) * this.speed;

    // Keep car within road boundaries
    this.x = constrain(this.x, 115 + this.w / 2, 485 - this.w / 2);
    this.y = constrain(this.y, this.h / 2, height - this.h / 2);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    // Car Body
    fill(230, 50, 50);
    stroke(150, 20, 20);
    strokeWeight(2);
    rectMode(CENTER);
    rect(0, 0, this.w, this.h, 6);

    // Windshield
    fill(180, 220, 255);
    noStroke();
    rect(0, -5, this.w - 6, 12, 2);

    // Wheels
    fill(20);
    rect(-this.w / 2, -12, 4, 10);
    rect(this.w / 2, -12, 4, 10);
    rect(-this.w / 2, 12, 4, 10);
    rect(this.w / 2, 12, 4, 10);

    pop();
  }

  hits(other) {
    let d = dist(this.x, this.y, other.x, other.y);
    return d < (this.w + other.w) / 1.8;
  }
}

// Obstacle / Traffic Car Class
class TrafficCar {
  constructor() {
    this.w = 30;
    this.h = 50;
    this.x = random(130, 470);
    this.y = -this.h;
    this.speed = random(3, 7);
    this.color = color(random(50, 200), random(50, 200), random(200, 255));
  }

  update() {
    this.y += this.speed;
  }

  display() {
    push();
    translate(this.x, this.y);
    fill(this.color);
    stroke(0, 50);
    strokeWeight(2);
    rectMode(CENTER);
    rect(0, 0, this.w, this.h, 6);

    // Roof detail
    fill(30, 100);
    rect(0, 0, this.w - 8, this.h - 16, 3);
    pop();
  }

  offScreen() {
    return this.y > height + this.h;
  }
}

// Tire Skid Mark Class
class Track {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.alpha = 150;
  }

  update() {
    this.alpha -= 3;
  }

  display() {
    noStroke();
    fill(20, this.alpha);
    ellipse(this.x, this.y, 6, 6);
  }

  isFinished() {
    return this.alpha <= 0;
  }
}

// Exhaust Particle Class
class Particle {
  constructor(x, y, angle) {
    this.x = x - sin(angle) * 20;
    this.y = y + cos(angle) * 20;
    this.vx = random(-0.5, 0.5);
    this.vy = random(0.5, 1.5);
    this.alpha = 200;
    this.size = random(4, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 10;
  }

  display() {
    noStroke();
    fill(180, this.alpha);
    ellipse(this.x, this.y, this.size);
  }

  isFinished() {
    return this.alpha <= 0;
  }
}
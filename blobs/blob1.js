let canvas, ctx;
let render, init;
let blob;

class Blob {
  constructor() {
    this.points = [];
  }

  init() {
    for (let i = 0; i < this.numPoints; i++) {
      let point = new Point(this.divisional * (i + 1), this);
      // point.acceleration = -1 + Math.random() * 2;
      this.push(point);
    }
  }

  render() {
    let canvas = this.canvas;
    let ctx = this.ctx;
    let position = this.position;
    let pointsArray = this.points;
    let points = this.numPoints;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    pointsArray[0].solveWith(pointsArray[points - 1], pointsArray[1]);
    let p0 = pointsArray[points - 1].position;
    let p1 = pointsArray[0].position;
    let _p2 = p1;
  
    ctx.beginPath();
    ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
  
    for (let i = 1; i < points; i++) {
      pointsArray[i].solveWith(pointsArray[i - 1], pointsArray[i + 1] || pointsArray[0]);
      let p2 = pointsArray[i].position;
      var xc = (p1.x + p2.x) / 2;
      var yc = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
      p1 = p2;
    }
  
    var xc = (p1.x + _p2.x) / 2;
    var yc = (p1.y + _p2.y) / 2;
    ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
  
    // If the image is ready, clip the region and draw the image within the blob
    if (this._imageReady) {
      ctx.save();
      ctx.clip();
      ctx.drawImage(this._image, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Fallback to filling the blob if there's no image
      ctx.fillStyle = this.blobColor || this.color; 
      ctx.fill();
    }
  
    ctx.strokeStyle = '#000000';
    // Uncomment if you want to draw the blob outline.
    // ctx.stroke();
  
    requestAnimationFrame(this.render.bind(this));
  }

  push(item) {
    if (item instanceof Point) {
      this.points.push(item);
    }
  }

  set canvas(value) {
    if (value instanceof HTMLElement && value.tagName.toLowerCase() === 'canvas') {
      this._canvas = value;
      this.ctx = this._canvas.getContext('2d');
    }
  }
  
  get canvas() {
    return this._canvas;
  }

  set numPoints(value) {
    if (value > 2) {
      this._points = value;
    }
  }
  get numPoints() {
    return this._points || 32;
  }

  set radius(value) {
    if (value > 0) {
      this._radius = value;
    }
  }
  get radius() {
    return this._radius || 710;//  ####################################################
  }

  set position(value) {
    if (typeof value == 'object' && value.x && value.y) {
      this._position = value;
    }
  }
  get position() {
    return this._position || { x: 1, y: 1.1 };
  }

  get divisional() {
    return Math.PI * 2 / this.numPoints;
  }

  get center() {
    return { x: this.canvas.width * this.position.x, y: this.canvas.height * this.position.y };
  }

  set running(value) {
    this._running = value === true;
  }
  get running() {
    return this.running !== false;
  }

  set color(value) {
    if (typeof value == 'string') {
      this._color = value;
    }
  }
  get color() {
    return this._color || '#000000'; // default color
  }

  set image(value) {
    if (typeof value == 'string') { 
      this._image = new Image();
      this._image.src = value;
      this._image.onload = () => { 
        this._imageReady = true; 
        console.log("Image is ready"); 
      };
      
      this._image.onerror = () => { console.error("Image failed to load:", value); };
    }
  }
  
  get image() {
    return this._image;
  }
  

}

class Point {
  constructor(azimuth, parent) {
    this.parent = parent;
    this.azimuth = Math.PI - azimuth;
    this._components = {
      x: Math.cos(this.azimuth),
      y: Math.sin(this.azimuth)
    };

    this.acceleration = -0.3 + Math.random() * 0.6;
  }

  solveWith(leftPoint, rightPoint) {
    this.acceleration = (-0.3 * this.radialEffect + (leftPoint.radialEffect - this.radialEffect) + (rightPoint.radialEffect - this.radialEffect)) * this.elasticity - this.speed * this.friction;
  }

  set acceleration(value) {
    if (typeof value == 'number') {
      this._acceleration = value;
      this.speed += this._acceleration * 2;
    }
  }
  get acceleration() {
    return this._acceleration || 0;
  }

  set speed(value) {
    if (typeof value == 'number') {
      this._speed = value;
      this.radialEffect += this._speed * 5;
    }
  }
  get speed() {
    return this._speed || 0;
  }

  set radialEffect(value) {
    if (typeof value == 'number') {
      this._radialEffect = value;
    }
  }
  get radialEffect() {
    return this._radialEffect || 0;
  }

  get position() {
    return {
      x: this.parent.center.x + this.components.x * (this.parent.radius + this.radialEffect),
      y: this.parent.center.y + this.components.y * (this.parent.radius + this.radialEffect)
    }
  }

  get components() {
    return this._components;
  }

  set elasticity(value) {
    if (typeof value === 'number') {
      this._elasticity = value;
    }
  }
  get elasticity() {
    return this._elasticity || 0.001;
  }
  set friction(value) {
    if (typeof value === 'number') {
      this._friction = value;
    }
  }
  get friction() {
    return this._friction || 0.0085;
  }
}

blob = new Blob;
blob.image = 'assets/galaxy.jpg';  // replace 'path_to_your_image.jpg' with your image URL


init = function () {
  canvas = document.getElementById('blobCanvas');

  let resize = function () {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  let oldMousePoint = { x: 0, y: 0 };
  let hover = false;

  function getCoords(e) {
      // if touch event, retrieve position from the touches array
      if (e.touches) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      // else, get position from mouse event
      return { x: e.clientX, y: e.clientY };
  }

  function moveHandler(e) {
      let coords = getCoords(e);

      let pos = blob.center;
      let diff = { x: coords.x - pos.x, y: coords.y - pos.y };
      let dist = Math.sqrt((diff.x * diff.x) + (diff.y * diff.y));
      let angle = null;

      blob.mousePos = { x: pos.x - coords.x, y: pos.y - coords.y };

      if (dist < blob.radius && hover === false) {
          let vector = { x: coords.x - pos.x, y: coords.y - pos.y };
          angle = Math.atan2(vector.y, vector.x);
          hover = true;
      } else if (dist > blob.radius && hover === true) {
          let vector = { x: coords.x - pos.x, y: coords.y - pos.y };
          angle = Math.atan2(vector.y, vector.x);
          hover = false;
          blob.color = null;
      }

      if (typeof angle == 'number') {
          let nearestPoint = null;
          let distanceFromPoint = 100;

          blob.points.forEach((point) => {
              if (Math.abs(angle - point.azimuth) < distanceFromPoint) {
                  nearestPoint = point;
                  distanceFromPoint = Math.abs(angle - point.azimuth);
              }
          });

          if (nearestPoint) {
              let strength = { x: oldMousePoint.x - coords.x, y: oldMousePoint.y - coords.y };
              strength = Math.sqrt((strength.x * strength.x) + (strength.y * strength.y)) * 10;
              if (strength > 100) strength = 230;
              nearestPoint.acceleration = strength / 100 * (hover ? -1 : 1);
          }
      }

      oldMousePoint.x = coords.x;
      oldMousePoint.y = coords.y;
  }

  window.addEventListener('pointermove', moveHandler);
  window.addEventListener('touchmove', moveHandler);

  blob.canvas = canvas;
  blob.init();
  blob.render();
}


init();

/* eslint-env worker */
/* eslint no-restricted-globals: ["off"] */

// lorenzWorker.js
importScripts('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');

function calculateLorenz(x, y, z, sigma, rho, beta, dt, steps) {
  const points = [];
  for (let i = 0; i < steps; i++) {
    const dx = sigma * (y - x) * dt;
    const dy = (x * (rho - z) - y) * dt;
    const dz = (x * y - beta * z) * dt;
    x += dx;
    y += dy;
    z += dz;
    points.push([x, y, z]);
  }
  return points;
}

self.onmessage = function (e) {
  let { x, y, z, sigma, rho, beta, dt, steps, updateInterval } = e.data;
  let lastUpdateTime = performance.now();
  let newPoints = [];

  const updatePoints = () => {
    const now = performance.now();
    if (now - lastUpdateTime >= updateInterval) {
      const nextPoints = calculateLorenz(x, y, z, sigma, rho, beta, dt, steps);
      newPoints = [...newPoints, ...nextPoints];
      x = nextPoints[nextPoints.length - 1][0];
      y = nextPoints[nextPoints.length - 1][1];
      z = nextPoints[nextPoints.length - 1][2];
      self.postMessage({ points: newPoints });
      lastUpdateTime = now;
    }
    requestAnimationFrame(updatePoints);
  };

  updatePoints();
};

// src/LorenzSystem.js
export function calculateLorenz(x0, y0, z0, sigma, rho, beta, dt, steps) {
    let x = x0;
    let y = y0;
    let z = z0;
  
    const points = [];
  
    for (let i = 0; i < steps; i++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;
  
      x += dx * dt;
      y += dy * dt;
      z += dz * dt;
  
      points.push([x, y, z]);
    }
  
    return points;
  }
  
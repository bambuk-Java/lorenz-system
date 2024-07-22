import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { calculateLorenz } from './LorenzSystem';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Extend OrbitControls to make it available as a JSX component
extend({ OrbitControls });

// LorenzAttractor-Komponente zum Zeichnen der Lorenz-Kurve
function LorenzAttractor({ points, color, opacity }) {
  const lineRef = useRef();

  const geometry = useMemo(() => {
    if (points.length > 0) {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
      return new THREE.BufferGeometry().setFromPoints(curve.getPoints(points.length * 10));
    }
    return new THREE.BufferGeometry();
  }, [points]);

  useEffect(() => {
    lineRef.current.geometry = geometry;
  }, [geometry]);

  return (
    <line ref={lineRef}>
      <bufferGeometry attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

// Controls-Komponente zur Steuerung der Kamera
function Controls({ target, cameraPosition, enableRotate }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (cameraPosition) {
      camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    }
    if (target) {
      controlsRef.current.target.set(target.x, target.y, target.z);
    }
    controlsRef.current.update();
  }, [target, cameraPosition]);

  useFrame(() => controlsRef.current.update());

  return <orbitControls ref={controlsRef} args={[camera, gl.domElement]} enableRotate={enableRotate} />;
}

// Axes-Komponente zur Darstellung der Achsen
function Axes({ visible }) {
  const axesRef = useRef();

  useEffect(() => {
    if (visible) {
      // Erstellen der Achsenlinien
      const size = 900;
      const linewidth = 5;

      const createAxis = (color, points) => {
        const material = new THREE.LineBasicMaterial({ color, linewidth });
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.Line(geometry, material);
      };

      const xAxis = createAxis(0x2d2d2d, [
        new THREE.Vector3(-size, 0, 0),
        new THREE.Vector3(size, 0, 0),
      ]);

      const yAxis = createAxis(0x2d2d2d, [
        new THREE.Vector3(0, -size, 0),
        new THREE.Vector3(0, size, 0),
      ]);

      const zAxis = createAxis(0x2d2d2d, [
        new THREE.Vector3(0, 0, -size),
        new THREE.Vector3(0, 0, size),
      ]);

      // Entfernen alter Achsenlinien und Hinzufügen neuer
      axesRef.current.clear();
      axesRef.current.add(xAxis);
      axesRef.current.add(yAxis);
      axesRef.current.add(zAxis);
    }
  }, [visible]);

  return visible ? (
    <group ref={axesRef}>
      <Html position={[950, 0, 0]}>
        <div style={{ color: 'black', fontSize: '20px', width: '40px', height: '40px', textAlign: 'center', lineHeight: '40px' }}>X</div>
      </Html>
      <Html position={[-950, 0, 0]}>
        <div style={{ color: 'black', fontSize: '20px', width: '40px', height: '40px', textAlign: 'center', lineHeight: '40px' }}>
          <span>-</span><span>X</span>
        </div>
      </Html>
      <Html position={[0, 950, 0]}>
        <div style={{ color: 'black', fontSize: '20px', width: '40px', height: '40px', textAlign: 'center', lineHeight: '40px' }}>Y</div>
      </Html>
      <Html position={[0, -950, 0]}>
        <div style={{ color: 'black', fontSize: '20px', width: '40px', height: '40px', textAlign: 'center', lineHeight: '40px' }}>
          <span>-</span><span>Y</span>
        </div>
      </Html>
      <Html position={[0, 0, 950]}>
        <div style={{ color: 'black', fontSize: '20px', width: '40px', height: '40px', textAlign: 'center', lineHeight: '40px' }}>Z</div>
      </Html>
      <Html position={[0, 0, -950]}>
        <div style={{ color: 'black', fontSize: '20px', width: '40px', height: '40px', textAlign: 'center', lineHeight: '40px' }}>
          <span>-</span><span>Z</span>
        </div>
      </Html>
    </group>
  ) : null;
}

// FollowCamera-Komponente zur Verfolgung eines Punktes
function FollowCamera({ points1, points2, points3, isFollowing, followPointIndex, targetPosition, setTargetPosition, radius }) {
  const { camera } = useThree();
  const angleRef = useRef(0);

  useFrame(() => {
    if (isFollowing) {
      let followPoint;
      if (followPointIndex === 1 && points1.length > 0) {
        followPoint = points1[points1.length - 1];
      } else if (followPointIndex === 2 && points2.length > 0) {
        followPoint = points2[points2.length - 1];
      } else if (followPointIndex === 3 && points3.length > 0) {
        followPoint = points3[points3.length - 1];
      }
      if (followPoint) {
        const newTargetPosition = new THREE.Vector3(...followPoint);
        setTargetPosition(newTargetPosition);

        // Update angle for orbiting
        angleRef.current += 0.005; // Slower angle increment
        const x = newTargetPosition.x + radius * Math.cos(angleRef.current);
        const y = newTargetPosition.y + radius * Math.sin(angleRef.current);
        const z = newTargetPosition.z + radius * Math.sin(angleRef.current);

        // Set camera position
        camera.position.set(x, y, z);
        camera.lookAt(newTargetPosition);
      }
    }
  });

  return null;
}

// Hauptkomponente für den Lorenz-Visualisierer
export default function LorenzVisualizer() {
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.01;
  const steps = 10;
  const updateInterval = 90; // Zeitintervall für die Berechnung
  const displayInterval = 200; // Zeitintervall für das Rendering

  const [pointsBuffer, setPointsBuffer] = useState([]);
  const [points, setPoints] = useState([]);
  const [center, setCenter] = useState(new THREE.Vector3(0, 0, 0));
  const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(0, 0, 100));
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(0, 0, 0));
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPointIndex, setFollowPointIndex] = useState(null);
  const [radius, setRadius] = useState(20); // Orbit radius

  useEffect(() => {
    let x = 0.1, y = 0, z = 0;
    let newPoints = [];
    let lastUpdateTime = performance.now();
    let lastDisplayTime = performance.now();

    const updatePoints = () => {
      const now = performance.now();
      if (now - lastUpdateTime >= updateInterval) {
        const nextPoints = calculateLorenz(x, y, z, sigma, rho, beta, dt, steps);
        x = nextPoints[nextPoints.length - 1][0];
        y = nextPoints[nextPoints.length - 1][1];
        z = nextPoints[nextPoints.length - 1][2];
        newPoints = [...newPoints, ...nextPoints];

        if (newPoints.length > 5000) {
          newPoints = newPoints.slice(-5000);
          const updatedCenter = new THREE.Vector3(
            ...newPoints.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1], acc[2] + point[2]], [0, 0, 0])
              .map(coord => coord / newPoints.length)
          );
          setCenter(updatedCenter);
        }

        setPointsBuffer(newPoints);
        lastUpdateTime = now;
      }

      requestAnimationFrame(updatePoints);
    };

    const displayPoints = () => {
      const now = performance.now();
      if (now - lastDisplayTime >= displayInterval) {
        setPoints(pointsBuffer);
        lastDisplayTime = now;
      }

      requestAnimationFrame(displayPoints);
    };

    updatePoints();
    displayPoints();

    return () => {
      cancelAnimationFrame(updatePoints);
      cancelAnimationFrame(displayPoints);
    };
  }, [sigma, rho, beta, dt, steps, updateInterval, displayInterval]);

  const switchCamera = (position, target) => {
    setIsFollowing(false);
    setCameraPosition(position);
    setTargetPosition(target);
  };

  const startFollowing = (pointsIndex) => {
    setFollowPointIndex(pointsIndex);
    setIsFollowing(true);
  };

  const third = Math.floor(points.length / 3);
  const points1 = useMemo(() => points.slice(0, third), [points, third]);
  const points2 = useMemo(() => points.slice(third, 2 * third), [points, third]);
  const points3 = useMemo(() => points.slice(2 * third), [points, third]);

  return (
    <div className="canvas-container">
      <Canvas camera={{ position: cameraPosition }}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <LorenzAttractor points={points1} color="blue" opacity={isFollowing && followPointIndex !== 1 ? 0.3 : 1} />
        <LorenzAttractor points={points2} color="red" opacity={isFollowing && followPointIndex !== 2 ? 0.3 : 1} />
        <LorenzAttractor points={points3} color="green" opacity={isFollowing && followPointIndex !== 3 ? 0.3 : 1} />
        <Controls target={targetPosition} cameraPosition={cameraPosition} enableRotate={true} />
        <Axes visible={!isFollowing} />
        <FollowCamera
          points1={points1}
          points2={points2}
          points3={points3}
          isFollowing={isFollowing}
          followPointIndex={followPointIndex}
          targetPosition={targetPosition}
          setTargetPosition={setTargetPosition}
          radius={radius}
        />
      </Canvas>
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <button onClick={() => switchCamera(new THREE.Vector3(0, 0, 100), center)}>Standard</button>
        <button onClick={() => switchCamera(new THREE.Vector3(100, 0, 0), center)}>Side</button>
        <button onClick={() => switchCamera(new THREE.Vector3(0, 100, 0), center)}>Top</button>
        <button onClick={() => startFollowing(1)}>Follow Blue</button>
        <button onClick={() => startFollowing(2)}>Follow Red</button>
        <button onClick={() => startFollowing(3)}>Follow Green</button>
      </div>
    </div>
  );
}

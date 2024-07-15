import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { calculateLorenz } from './LorenzSystem';

extend({ OrbitControls });

function LorenzAttractor({ points, color }) {
  const lineRef = useRef();

  useEffect(() => {
    if (points.length > 0) {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(points.length * 10));
      lineRef.current.geometry = geometry;
    }
  }, [points]);

  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color={color} />
    </line>
  );
}

function Controls({ target, cameraPosition }) {
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

  useFrame(() => {
    controlsRef.current.update();
  });

  return <orbitControls ref={controlsRef} args={[camera, gl.domElement]} />;
}

function Axes() {
  const axesRef = useRef();

  useEffect(() => {
    const size = 900;
    const linewidth = 5;
    const materialX = new THREE.LineBasicMaterial({ color: 0x2d2d2d, linewidth });
    const materialZ = new THREE.LineBasicMaterial({ color: 0x2d2d2d, linewidth });
    const materialY = new THREE.LineBasicMaterial({ color: 0x2d2d2d, linewidth });

    const pointsX = [
      new THREE.Vector3(-size, 0, 0),
      new THREE.Vector3(size, 0, 0),
    ];
    const geometryX = new THREE.BufferGeometry().setFromPoints(pointsX);
    const lineX = new THREE.Line(geometryX, materialX);

    const pointsY = [
      new THREE.Vector3(0, -size, 0),
      new THREE.Vector3(0, size, 0),
    ];
    const geometryY = new THREE.BufferGeometry().setFromPoints(pointsY);
    const lineY = new THREE.Line(geometryY, materialY);

    const pointsZ = [
      new THREE.Vector3(0, 0, -size),
      new THREE.Vector3(0, 0, size),
    ];
    const geometryZ = new THREE.BufferGeometry().setFromPoints(pointsZ);
    const lineZ = new THREE.Line(geometryZ, materialZ);

    axesRef.current.add(lineX);
    axesRef.current.add(lineY);
    axesRef.current.add(lineZ);
  }, []);

  return (
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
  );
}

export default function LorenzVisualizer() {
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.01;
  const steps = 10;

  const [points, setPoints] = useState([]);
  const [center, setCenter] = useState(new THREE.Vector3(0, 0, 0));
  const [cameraPosition, setCameraPosition] = useState(new THREE.Vector3(0, 0, 100));
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(0, 0, 0));
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPointIndex, setFollowPointIndex] = useState(null);

  useEffect(() => {
    let x = 0.1, y = 0, z = 0;
    let newPoints = [];

    const interval = setInterval(() => {
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

      setPoints(newPoints);
    }, 100);

    return () => clearInterval(interval);
  }, [sigma, rho, beta, dt, steps]);

  useFrame(({ camera }) => {
    if (isFollowing && followPointIndex !== null) {
      const followPoints = followPointIndex === 1 ? points1 : followPointIndex === 2 ? points2 : points3;
      if (followPoints.length > 0) {
        const lastPoint = new THREE.Vector3(...followPoints[followPoints.length - 1]);
        const delta = lastPoint.clone().sub(targetPosition);
        setTargetPosition(lastPoint);
        setCameraPosition(camera.position.clone().add(delta));
      }
    }
  });

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
  const points1 = points.slice(0, third);
  const points2 = points.slice(third, 2 * third);
  const points3 = points.slice(2 * third);

  return (
    <div className="canvas-container">
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <LorenzAttractor points={points1} color="blue" />
        <LorenzAttractor points={points2} color="red" />
        <LorenzAttractor points={points3} color="green" />
        <Controls target={targetPosition} cameraPosition={cameraPosition} />
        <Axes />
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

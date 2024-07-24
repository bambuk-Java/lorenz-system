import React, { useRef } from 'react';
import { Html } from '@react-three/drei';

const Grid = React.forwardRef((props, ref) => (
    <group ref={ref}>
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
  ));

export default Grid;

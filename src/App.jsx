import { useState } from 'react'
import './App.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber';
import Experience from './Experience.jsx';
import * as THREE from 'three';

function App() {

  return (
    <>
      <Canvas 
        onCreated={state => {
          state.gl.toneMapping = THREE.ReinhardToneMapping }}
          shadows
          gl={{
            preserveDrawingBuffer: true
        }}
        >
          <mesh position={[0,0,0]} rotation={[0,0,0]} scale={[1,1,1]}>
            <sphereGeometry />
            <meshStandardMaterial roughness={0.1} metalness={1}/>
          </mesh>
          {/* <SheetProvider sheet={demoSheet}> */}
            <Experience/>
          {/* </SheetProvider> */}
      </Canvas>
    </>
  )
}

export default App

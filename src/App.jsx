import React,{ useState , useEffect} from 'react'
import './App.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber';
import Experience from './Experience.jsx';
import * as THREE from 'three';

function App() {
  useEffect(() => {
    const handleResize = () => {
      const canvas = document.querySelector('Canvas');
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <Canvas 
        // onCreated={state => {
        //   state.gl.toneMapping = THREE.ReinhardToneMapping }}
          shadows
          gl={{
            preserveDrawingBuffer: true,
            precision: 'highp'
        }}
        camera={{ position: [8, 8, 8], fov: 40}}
        >
          {/* <SheetProvider sheet={demoSheet}> */}
            <Experience/>
          {/* </SheetProvider> */}
      </Canvas>
    </>
  )
}

export default App

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { FirstPersonControls,OrbitControls,  useGLTF, Text, Environment, AdaptiveDpr, BakeShadows, PerformanceMonitor, MeshReflectorMaterial, useEnvironment } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette, DotScreen, Noise, SSAO, SMAA, GodRays, FXAA, Sepia, SelectiveBloom, ShockWave, HueSaturation, Scanline, Autofocus, LensFlare } from '@react-three/postprocessing';
import * as THREE from 'three';
import PropTypes from 'prop-types';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { TextureLoader } from 'three';
import { useScroll, useTexture, Html, Sphere,Plane, Box, Torus, TorusKnot } from '@react-three/drei';
import { Physics, RigidBody, RapierRigidBody, quat, vec3, euler  } from "@react-three/rapier";
import { gsap } from 'gsap';
// import WASDMovement from './WASDMovement2';
import PlayerInput from './player_input';

export default function Experience() {
  const envMap = useEnvironment({path: "../../public/hdris/pngs"});
  useEffect(() => {
    console.log('useEffect');
  },[]);
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
    return(
        <Canvas
            // onCreated={state => {
          //   state.gl.toneMapping = THREE.ReinhardToneMapping }}
          shadows
          gl={{
            precision: 'mediump'
        }}
        camera={{ position: [8, 8, 8], fov: 40}}
        >
        <axesHelper args={[2]} />
        <Physics
            gravity={[0, 0, 0]}
            colliders={false}
            debug>
            
            
            <RigidBody colliders="ball">
                <Sphere position={[10,10,10]}/>
            </RigidBody>
            {/* <WASDMovement/> */}
            <PlayerInput/>
            {/* <RigidBody colliders="cuboid" type={'fixed'} restitution={0.1}>
                <Plane position={[0,-0.3,0]}scale={10} rotation={[-Math.PI/2,0,0]}/>
            </RigidBody> */}
        </Physics>
        <ambientLight intensity={1} frustumCulled/>
        <Environment
        map={envMap}
        // map = {null}
        background />
        {/* <OrbitControls/> */}
        {/* <EffectComposer>
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer> */}
        </Canvas>
    )
}
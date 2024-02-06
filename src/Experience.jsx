import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Text, Environment, AdaptiveDpr, BakeShadows, PerformanceMonitor, MeshReflectorMaterial, useEnvironment } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette, DotScreen, Noise, SSAO, SMAA, GodRays, FXAA, Sepia, SelectiveBloom, ShockWave, HueSaturation, Scanline, Autofocus, LensFlare } from '@react-three/postprocessing';
import * as THREE from 'three';
import PropTypes from 'prop-types';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { TextureLoader } from 'three';
import { useScroll, useTexture, Html } from '@react-three/drei';
import { gsap } from 'gsap';


export default function Experience() {
    return(
        <>
            <Environment files="hdris/nebula_n0.hdr" background/>
            <OrbitControls />
        </>
    )
}
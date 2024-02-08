// WASDMovement.js
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import {math} from './math.js';
import * as THREE from 'three';

const WASDMovement = ({ object, movementSpeed = 0.1, acceleration = 0.001, deceleration = 0.98 }) => {
    const [keysState, setKeysState] = useState({
        W: false,shift:false,w:false, A: false, a:false, S: false, s:false, D: false ,d:false
    });
    const velocity = useRef(new THREE.Vector3(0, 0, 0));

    const getFacingNormal = () => {
        // Default normal vector (0, 0, 1) representing the positive Z-axis
        const defaultNormal = new THREE.Vector3(0, 0, 1);
    
        // Transform the default normal vector to world space
        const worldNormal = defaultNormal.clone().applyMatrix4(objectRef.current.matrixWorld);
    
        return worldNormal;
    };
    const { camera } = useThree();
    const objectRef = useRef(object);
    var moveDirection = new THREE.Vector3(0,0,0);
    
    var decceleration_ = new THREE.Vector3(-0.0005, -0.0001, -1);
    var acceleration_ = new THREE.Vector3(100, 0.5, 25000);
    var velocity_ = new THREE.Vector3(0, 0, 0);
    const lastTimestamp = useRef(null);
    useEffect(() => {
        const handleKeyDown = (event) => {
        setKeysState((prevKeys) => ({ ...prevKeys, [event.key]: true }));
        };

        const handleKeyUp = (event) => {
        setKeysState((prevKeys) => ({ ...prevKeys, [event.key]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        // console.log(keysState);
        // console.log(objectRef.current.position);
    }, [keysState]);
    useFrame((state, time) => {
        
    });
    return null;
};

export default WASDMovement;

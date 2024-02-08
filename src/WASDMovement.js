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
        const currentTimestamp = time;
        const timeInSeconds = lastTimestamp.current ? (currentTimestamp - lastTimestamp.current) / 1000 : 0;
        lastTimestamp.current = currentTimestamp;
        if (!objectRef.current) return;
    
        moveDirection.x = 0;
        moveDirection.y = 0;
        moveDirection.z = 0;

        const rotationMatrix = new THREE.Matrix4();
        objectRef.current.updateMatrixWorld();
    
        objectRef.current.matrixWorld.extractRotation(rotationMatrix);
        
        if (keysState.W || keysState.w) moveDirection.z += -1;
        if (keysState.A || keysState.a) moveDirection.x += -1;
        if (keysState.S || keysState.s) moveDirection.z += 1;
        if (keysState.D || keysState.d) moveDirection.x += 1;
        // console.log(moveDirection.x, moveDirection.z)
        const facingNormal = getFacingNormal();
        // moveDirection.applyMatrix4(rotationMatrix);
    
        // velocity.current.x += (moveDirection.x * acceleration - velocity.current.x) * deceleration;
        // velocity.current.z += (moveDirection.z * acceleration - velocity.current.z) * deceleration;
    
        // const moveDistance = movementSpeed * velocity.current.z;
        // const strafeDistance = movementSpeed * velocity.current.x;
    
        // const moveVector = new THREE.Vector3(0, 0, -moveDistance);
        // const strafeVector = new THREE.Vector3(strafeDistance, 0, 0);
    
        // moveVector.applyQuaternion(objectRef.current.quaternion);
        // strafeVector.applyQuaternion(objectRef.current.quaternion);
    
        // objectRef.current.position.add(moveVector);
        // objectRef.current.position.add(strafeVector);
    
        // const angle = Math.atan2(moveDirection.x, moveDirection.z);
        // objectRef.current.rotation.y = angle;
    
        // const cameraOffset = new THREE.Vector3(0, 5, -10);
        // const cameraPosition = objectRef.current.position.clone().add(cameraOffset);
        // camera.position.lerp(cameraPosition, 0.1);
        // camera.lookAt(objectRef.current.position);



        const velocity = velocity_;
        const frameDecceleration = new THREE.Vector3(
            velocity.x * decceleration_.x,
            velocity.y * decceleration_.y,
            velocity.z * decceleration_.z
        );
        frameDecceleration.multiplyScalar(timeInSeconds);
        velocity.add(frameDecceleration);
        velocity.z = -math.clamp(Math.abs(velocity.z), 50.0, 125.0);
        const _PARENT_Q = objectRef.current.quaternion.clone();
        const _PARENT_P = objectRef.current.position.clone();
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = _PARENT_Q.clone();
    
        const acc = acceleration_.clone();
        acc.multiplyScalar(10.0);
        if (keysState.shift) {
            acc.multiplyScalar(2.0);
        }
    
        if (keysState.w || keysState.W) {
            _A.set(1, 0, 0);
            _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * acc.y * -1);
            _R.multiply(_Q);
        }
        // if (keysState.s || keysState.S) {
        //     _A.set(1, 0, 0);
        //     _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * acc.y * 1);
        //     _R.multiply(_Q);
        // }
        // if (keysState.a || keysState.A) {
        //     _A.set(0, 1, 0);
        //     _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * acc.y * -1);
        //     _R.multiply(_Q);
        // }
        // if (keysState.d || keysState.D) {
        //     _A.set(0, 1, 0);
        //     _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * acc.y * 1);
        //     _R.multiply(_Q);
        // }
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(_PARENT_Q);
        forward.normalize();
    
        const updown = new THREE.Vector3(0, 1, 0);
        updown.applyQuaternion(_PARENT_Q);
        updown.normalize();
  
        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(_PARENT_Q);
        sideways.normalize();
    
        sideways.multiplyScalar(velocity.x * timeInSeconds);
        updown.multiplyScalar(velocity.y * timeInSeconds);
        forward.multiplyScalar(velocity.z * timeInSeconds);
    
        const pos = objectRef.current.position.clone();
        pos.add(forward);
        pos.add(sideways);
        pos.add(updown);
        // console.log(objectRef.current.position);
        objectRef.current.position.copy(pos);
        objectRef.current.quaternion.copy(_R);
    }); 
        // this.Parent.SetPosition(pos);
        // this.Parent.SetQuaternion(_R);
    return null;
};

export default WASDMovement;

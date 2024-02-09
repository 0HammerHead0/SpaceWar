// WASDMovement.js
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import {math} from './math.js';
import * as THREE from 'three';
import { Physics, RigidBody, RapierRigidBody, quat, vec3, euler  } from "@react-three/rapier";

const velocity     = {forward_backward:0,left_right:0};
const acceleration = {forward_backward:0.1,left_right:0.05};
const deceleration = {forward_backward:0.01,left_right:0.005};
const vecotityMax  = {forward_backward:0.1,left_right:0.05};
function updateCamPos(state,delta,playerBody){
    const idealOffset = new THREE.Vector3(0,6,8);
    idealOffset.applyQuaternion(playerBody.quaternion);
    idealOffset.add(playerBody.position);
    const t = 1.0 - Math.pow(0.001, delta);
    state.camera.position.copy(state.camera.position.clone().lerp(idealOffset, t));
}
function updateCamLookAt(state,delta,playerBody){
    const idealLookAt = new THREE.Vector3(0,0,-3);
    idealLookAt.applyQuaternion(playerBody.quaternion);
    idealLookAt.add(playerBody.position);
    const t = 1.0 - Math.pow(0.001, delta);
    state.camera.lookAt(state.camera.position.clone().lerp(idealLookAt, t));
}
var mouseMovementX;
var mouseMovementY;
document.onmousemove = (e) => {
    mouseMovementX = (e.clientX - window.innerWidth/2)/(window.innerWidth/2);
    mouseMovementY = (e.clientY - window.innerHeight/2)/(window.innerHeight/2);
}
function getMouseMovement(){
    // console.log(mouseMovementX,mouseMovementY);
    return {x:mouseMovementX,y:mouseMovementY};
}
const PlayerInput = () => {
    const playerBodyMesh = useRef();
    const [keysState, setKeysState] = useState({
        W: false,Shift:false,w:false, A: false, a:false, S: false, s:false, D: false ,d:false
    });
    const getFacingNormal = () => {
        const defaultNormal = new THREE.Vector3(0, 0, 0);
        const worldNormal = defaultNormal.clone().applyMatrix4(playerBodyMesh.current.matrixWorld);
    
        return worldNormal;
    };
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
    useFrame((state, delta) => {
        const playerBody = playerBodyMesh.current;
        if(keysState.w || keysState.W){
            if(velocity.forward_backward<vecotityMax.forward_backward)
                velocity.forward_backward += acceleration.forward_backward * delta;
        }
        if(keysState.s || keysState.S){
            if(velocity.forward_backward>-vecotityMax.forward_backward)
                velocity.forward_backward -= acceleration.forward_backward * delta;
        }
        if(keysState.a || keysState.A){
            if(velocity.left_right>-vecotityMax.left_right)
                velocity.left_right -= acceleration.left_right * delta;
        }
        if(keysState.d || keysState.D){
            if(velocity.left_right<vecotityMax.left_right)
                velocity.left_right += acceleration.left_right * delta;
        }
        // deceleration
        if (!keysState.w && !keysState.W) {
            if (velocity.forward_backward > 0) {
                console.log('decelerating', velocity.forward_backward);
                velocity.forward_backward -= deceleration.forward_backward * delta;
            }
        }
        if (!keysState.s && !keysState.S) {
            if (velocity.forward_backward < 0) {
                velocity.forward_backward += deceleration.forward_backward * delta;
            }
        }
        if (!keysState.a && !keysState.A) {
            if (velocity.left_right > 0) {
                velocity.left_right -= deceleration.left_right * delta;
            }
        }
        if (!keysState.d && !keysState.D) {
            if (velocity.left_right < 0) {
                velocity.left_right += deceleration.left_right * delta;
            }
        }
        const forwardBackwardDistance = velocity.forward_backward ;
        const leftRightDistance = velocity.left_right ;
        playerBody.position.x += leftRightDistance;
        playerBody.position.z -= forwardBackwardDistance;
        // state.camera.position.set(playerBody.position.x, playerBody.position.y + 6, playerBody.position.z + 8);
        updateCamPos(state,delta,playerBody);
        updateCamLookAt(state,delta,playerBody);
        getMouseMovement();
        // state.camera.lookAt(playerBody.position);
        const forwardBackwardVector = new THREE.Vector3(0, 0, -forwardBackwardDistance);
        const leftRightVector = new THREE.Vector3(-leftRightDistance, 0, 0);
        const facingNormal = getFacingNormal();
        // ----------------------------------------------------------
        // const matrixWorld = playerBody.matrixWorld.clone();

        // // Extracting the forward vector (negative Z-axis)
        // const forwardVector = new THREE.Vector3(0, 0, -1);
        // forwardVector.applyMatrix4(matrixWorld);

        // console.log('Forward Vector:', forwardVector);

        // ----------------------------------------------------------
        // const forwardBackwardComponent = forwardVector.clone().multiply(forwardBackwardVector);
        // const leftRightComponent = forwardVector.clone().multiply(leftRightVector);
        // playerBody.position.add(forwardBackwardComponent);
        // playerBody.position.add(leftRightComponent);

    });
    return <>
    <mesh ref={playerBodyMesh}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.1} metalness={0.5} side={THREE.DoubleSide}/>
    </mesh>
    </>
};

export default PlayerInput;

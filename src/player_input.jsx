// WASDMovement.js
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import {math} from './math.js';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { Physics, RigidBody, RapierRigidBody, quat, vec3, euler  } from "@react-three/rapier";

const velocity     = {forward_backward:0,left_right:0};
const acceleration = {forward_backward:0.1,left_right:0.05};
const deceleration = {forward_backward:0.01,left_right:0.005};
const vecotityMax  = {forward_backward:0.1,left_right:0.05};

const maxAngleX = Math.PI/4;
const maxAngleY = Math.PI/6;

const maxCumulativeRotationX = Math.PI / 3; // 60 degrees in radians
const maxCumulativeRotationY = Math.PI / 9; // 20 degrees in radians
let cumulativeRotationX = 0;
let cumulativeRotationY = 0;
const rotationThreshold = 0.05; // Adjust as needed

const rotateModelAccordingToMouse = (state,delta, playerBodyMesh) => {
    const mouseMovement = getMouseMovement();
    const percentageX = mouseMovement.x;
    const percentageY = mouseMovement.y;

    let targetAngleX = -maxAngleX * percentageX * delta;
    let targetAngleY = -maxAngleY* percentageY * delta;

    cumulativeRotationX = THREE.MathUtils.clamp(cumulativeRotationX + targetAngleX, -maxCumulativeRotationX, maxCumulativeRotationX);
    cumulativeRotationY = THREE.MathUtils.clamp(cumulativeRotationY + targetAngleY, -maxCumulativeRotationY, maxCumulativeRotationY);

    const currentRotation = playerBodyMesh.current.quaternion.clone();

    const rotationQuaternionX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngleX);
    const rotationQuaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetAngleY);

    currentRotation.multiply(rotationQuaternionX).multiply(rotationQuaternionY);

    playerBodyMesh.current.setRotationFromQuaternion(currentRotation);

    // Check if rotation is close to zero, then reset cumulative rotations
    if (Math.abs(targetAngleX) < rotationThreshold && Math.abs(targetAngleY) < rotationThreshold) {
        cumulativeRotationX = 0;
        cumulativeRotationY = 0;
    }
};
function Model({ envMap }) {
    const gltf = useGLTF('models/compressed.glb');
    const model = gltf.scene;
    model.traverse((child) => {
    });
    return <primitive object={gltf.scene} />;
  }

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
        const normalVector = new THREE.Vector3(leftRightDistance, 0, -forwardBackwardDistance);
        normalVector.applyQuaternion(playerBody.quaternion);
        normalVector.add(playerBody.position);
        playerBody.position.copy(normalVector);
        // playerBody.position.x += leftRightDistance;
        // playerBody.position.z -= forwardBackwardDistance;


        updateCamPos(state,delta,playerBody);
        updateCamLookAt(state,delta,playerBody);
        getMouseMovement();
        rotateModelAccordingToMouse(state,delta,playerBodyMesh);
    });
    return <>
    <mesh ref={playerBodyMesh}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.1} metalness={0.5} side={THREE.DoubleSide}/>
    </mesh>
    </>
};

export default PlayerInput;

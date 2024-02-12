// WASDMovement.js
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import {math} from './math.js';
import * as THREE from 'three';
import { useGLTF , Box} from '@react-three/drei';
import { Physics, RigidBody, RapierRigidBody, quat, vec3, euler  } from "@react-three/rapier";

const localAxes = {
    x: new THREE.Vector3(),
    y: new THREE.Vector3(),
    z: new THREE.Vector3(),
};

var rotation_ = new THREE.Quaternion();
const velocity     = {forward_backward:0,left_right:0};
const acceleration = {forward_backward:0.1,left_right:0.05};
const deceleration = {forward_backward:0.008,left_right:0.003};
const velocityMax  = {forward_backward:0.1,left_right:0.05};

const maxAngleX = Math.PI/4;
const maxAngleY = Math.PI/6;

const rotateModelAccordingToMouse = (delta,playerBodyMesh) => {
    const mouseMovement = getMouseMovement();
    const percentageX = mouseMovement.x;
    const percentageY = mouseMovement.y;

    let targetAngleX = -maxAngleX * percentageX * delta * (velocity.left_right/velocityMax.left_right);
    let targetAngleY = -maxAngleY* percentageY * 1.5 * delta * (velocity.forward_backward/velocityMax.forward_backward);
    const currentRotation = playerBodyMesh.current.quaternion.clone();

    const rotationQuaternionX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngleX);
    const rotationQuaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetAngleY);

    currentRotation.multiply(rotationQuaternionX).multiply(rotationQuaternionY);
    playerBodyMesh.current.quaternion.copy(currentRotation);
};
const factor = 2;

const oldRightVector = new THREE.Vector3(1, 0, 0);
const newRightVector = new THREE.Vector3(1,0.008,0);

const oldLeftVector = new THREE.Vector3(-1, 0, 0);
const newLeftVector = new THREE.Vector3(-1,0.008,0);

const rotateObjectTowardsRight = (object) => {
    const localOldRightVector = oldRightVector.clone().normalize();
    const localNewRightVector = newRightVector.clone().normalize();
    const rotationRightQuaternion = new THREE.Quaternion().setFromUnitVectors(localOldRightVector, localNewRightVector)
    object.quaternion.multiply(rotationRightQuaternion)
};
const rotateObjectTowardsLeft = (object) => {
    const localOldLeftVector = oldLeftVector.clone().normalize();
    const localNewLeftVector = newLeftVector.clone().normalize();
    const rotationLeftQuaternion = new THREE.Quaternion().setFromUnitVectors(localOldLeftVector, localNewLeftVector)
    object.quaternion.multiply(rotationLeftQuaternion);
};

function Model({ envMap }) {
    const gltf = useGLTF('models/swordfish.glb');
    const model = gltf.scene;
    model.traverse((child) => {
        child.castShadow = true;
        child.receiveShadow = true;
        if(child.name=='rest-thruster'){
            child.material.emissiveIntensity = 100;
            child.material.emissive = new THREE.Color(0x0000ff);
        }
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
        var modelMoving = false;
        if(keysState.w || keysState.W){
            if(velocity.forward_backward<velocityMax.forward_backward)
                velocity.forward_backward += acceleration.forward_backward * delta;
            modelMoving = true;
        }
        if(keysState.s || keysState.S){
            if(velocity.forward_backward>-velocityMax.forward_backward)
            velocity.forward_backward -= acceleration.forward_backward * delta;
            modelMoving = true;
        }
        if(keysState.a || keysState.A){
            if(velocity.left_right>-velocityMax.left_right){
                velocity.left_right -= acceleration.left_right * delta;
            }
            rotateObjectTowardsRight(playerBody);
            modelMoving = true;
        }
        if(keysState.d || keysState.D){
            if(velocity.left_right<velocityMax.left_right){
                velocity.left_right += acceleration.left_right * delta;
            }
            rotateObjectTowardsLeft(playerBody);
            modelMoving = true;
        }
        // deceleration
        if (!keysState.w && !keysState.W) {
            if (velocity.forward_backward > 0) {
                velocity.forward_backward -= deceleration.forward_backward * delta;
                modelMoving = true;
                if(velocity.forward_backward<0.0000005)
                    velocity.forward_backward = 0;
            }
        }
        if (!keysState.s && !keysState.S) {
            if (velocity.forward_backward < 0) {
                velocity.forward_backward += deceleration.forward_backward * delta;
                modelMoving = true;
                if(velocity.forward_backward>-0.0000005)
                    velocity.forward_backward = 0;
            }
        }
        if (!keysState.a && !keysState.A) {
            if (velocity.left_right > 0) {
                modelMoving = true;
                velocity.left_right -= deceleration.left_right * delta;
                if(velocity.left_right<0.0000005)
                    velocity.left_right = 0;
            }
        }
        if (!keysState.d && !keysState.D) {
            if (velocity.left_right < 0) {
                modelMoving = true;
                velocity.left_right += deceleration.left_right * delta;
                if(velocity.left_right>-0.0000005)
                    velocity.left_right = 0;
            }
        }
        const forwardBackwardDistance = velocity.forward_backward ;
        const leftRightDistance = velocity.left_right ;
        const normalVector = new THREE.Vector3(leftRightDistance, 0, -forwardBackwardDistance);
        normalVector.applyQuaternion(playerBody.quaternion);
        normalVector.add(playerBody.position);
        playerBody.position.copy(normalVector);


        updateCamPos(state,delta,playerBody);
        updateCamLookAt(state,delta,playerBody);
        getMouseMovement();
        if(modelMoving)
            rotateModelAccordingToMouse(delta,playerBodyMesh);
    });
    return <>
    <mesh ref={playerBodyMesh} scale={0.7 } >
        {/* <boxGeometry />
        <meshStandardMaterial roughness={0.1} metalness={0.5} side={THREE.DoubleSide}/> */}
        {/* <RigidBody type={'dynamic'} colliders={'cuboid'}> */}
            <Model/>
        {/* </RigidBody> */}
    </mesh>
    </>
};

export default PlayerInput;

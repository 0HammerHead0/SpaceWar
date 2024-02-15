// WASDMovement.js
import { useFrame, useThree } from '@react-three/fiber';
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {math} from './math.js';      
import * as THREE from 'three';
import { useGLTF , Box} from '@react-three/drei';
import { Physics, RigidBody, RapierRigidBody, quat, vec3, euler  } from "@react-three/rapier";
import {functions} from './functions.js';

var gamepad;
var socket ;
var mouseMovementX;
var mouseMovementY;
const velocity     = {forward_backward:0,left_right:0};
const acceleration = {forward_backward:0.1,left_right:0.05};
const deceleration = {forward_backward:0.008,left_right:0.003};
const velocityMax  = {forward_backward:0.1,left_right:0.05};

const maxAngleX = Math.PI/4;
const maxAngleY = Math.PI/6;

const oldRightVector = new THREE.Vector3(1, 0, 0);
const newRightVector = new THREE.Vector3(1,2,0);
const rightCrossVector = new THREE.Vector3().crossVectors(oldRightVector, newRightVector).normalize();
const leftAngle = oldRightVector.angleTo(newRightVector);

const oldLeftVector = new THREE.Vector3(-1, 0, 0);
const newLeftVector = new THREE.Vector3(-1,2,0);
const leftCrossVector = new THREE.Vector3().crossVectors(oldLeftVector, newLeftVector).normalize();
const rightAngle = oldLeftVector.angleTo(newLeftVector);


const rotateModelAccordingToMouse = (delta,playerBodyMesh) => {
    const mouseMovement = getMouseMovement();
    const percentageX = mouseMovement.x;
    const percentageY = mouseMovement.y;

    let targetAngleX = -maxAngleX * percentageX * delta * (velocity.left_right/velocityMax.left_right);
    let targetAngleY = -maxAngleY* percentageY * 1.5 * delta * (velocity.forward_backward/velocityMax.forward_backward);

    const rotationQuaternionX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngleX);
    const rotationQuaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetAngleY);

    playerBodyMesh.current.quaternion.multiply(rotationQuaternionX).multiply(rotationQuaternionY);
};
const rotateModelAccordingToJoystick = (delta,playerBodyMesh,percentageX,percentageY) => {
    let targetAngleX = -maxAngleX * percentageX * delta * (velocity.left_right/velocityMax.left_right);
    let targetAngleY = -maxAngleY* percentageY * 1.5 * delta * (velocity.forward_backward/velocityMax.forward_backward);
    const currentRotation = playerBodyMesh.current.quaternion.clone();

    const rotationQuaternionX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngleX);
    const rotationQuaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetAngleY);
    
    currentRotation.multiply(rotationQuaternionX).multiply(rotationQuaternionY);
    playerBodyMesh.current.quaternion.copy(currentRotation);
}
const startRumble = (gamepad) => {
    if (gamepad && gamepad.vibrationActuator) {
      const rumbleOptions = {
        startDelay: 0,
        duration: 200, // Rumble duration in milliseconds
        strongMagnitude: 0.6,
        weakMagnitude: 0.6,
      };
      gamepad.vibrationActuator.playEffect('dual-rumble', rumbleOptions);
    }
  };

const rotateObjectTowardsRight = (object,factor,delta) => {
    const rotationRightQuaternion = new THREE.Quaternion().setFromAxisAngle(rightCrossVector, leftAngle*factor*delta);
    object.quaternion.multiply(rotationRightQuaternion)
};
const rotateObjectTowardsLeft = (object,factor,delta) => {
    const rotationLeftQuaternion = new THREE.Quaternion().setFromAxisAngle(leftCrossVector, rightAngle*factor*delta);
    object.quaternion.multiply(rotationLeftQuaternion);
};

function Model({ envMap }) {
    const gltf = useGLTF('../public/models/swordfish.glb');
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
document.onmousemove = (e) => {
    mouseMovementX = (e.clientX - window.innerWidth/2)/(window.innerWidth/2);
    mouseMovementY = (e.clientY - window.innerHeight/2)/(window.innerHeight/2);
}
function getMouseMovement(){
    return {x:mouseMovementX,y:mouseMovementY};
}
const PlayerInput = () => {
    const { gameID } = useParams();
    const playerBodyMesh = useRef();
    const [xL, setXL] = useState(0);
    const [yL, setYL] = useState(0);
    const [xR, setXR] = useState(0);
    const [yR, setYR] = useState(0);
    const [rightTrigger, setRightTrigger] = useState(0);
    const [leftTrigger, setLeftTrigger] = useState(0);
    const [RB, setRB] = useState(false);
    const [LB, setLB] = useState(false);
    const [aPressed, setAPressed] = useState(false);
    const [bPressed, setBPressed] = useState(false);
    const [xPressed, setXPressed] = useState(false);
    const [yPressed, setYPressed] = useState(false);
    const [keysState, setKeysState] = useState({
        W: false,Shift:false,w:false, A: false, a:false, S: false, s:false, D: false ,d:false
    });
   
    // useEffect(()=>{
    //     const data_to_send = {xL, yL, xR, yR, rightTrigger, leftTrigger, RB, LB, aPressed, bPressed, xPressed, yPressed, keysState};
    //     if (socket) {
    //         socket.send(JSON.stringify(data_to_send));
    //     } else {
    //         console.log("WebSocket connection is not open.");
    //     }
    // },[xL,yL,xR,yR,rightTrigger,leftTrigger,RB,LB,aPressed,bPressed,xPressed,yPressed,keysState])
    useEffect(() => {
        const interval = setInterval(() => {
            gamepad = navigator.getGamepads()[0];
            if (gamepad) {
                setXL(-gamepad.axes[0]);
                setYL(gamepad.axes[1]);
                setXR(gamepad.axes[2]);
                setYR(-gamepad.axes[3]);
                setRightTrigger(gamepad.buttons[7].value);
                setLeftTrigger(gamepad.buttons[6].value);
                setAPressed(gamepad.buttons[0].pressed);
                setBPressed(gamepad.buttons[1].pressed);
                setXPressed(gamepad.buttons[2].pressed);
                setYPressed(gamepad.buttons[3].pressed);
                setRB(gamepad.buttons[5].pressed);
                setLB(gamepad.buttons[4].pressed);
            }
            // gamepad.buttons.forEach((button, index) => {
            //     if (button.pressed) {
            //         console.log(`Button ${index} pressed`);
            //     }
            // });
        }, 10);
        return () => clearInterval(interval);
    });
    // useEffect(() => {
    //     console.log(gameID);
    //     socket  = new WebSocket("ws://localhost:3000");
    // },[]);
    useEffect(()=>{
        if(gamepad){
            if(RB || LB){
               startRumble(gamepad);
            }
        }
    })
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
    }, [velocity]);
    useFrame((state, delta) => {
        
    //    socket.addEventListener('open', function (event) {
    //     console.log("connection opened");
    //     });
    //     socket.addEventListener('message', function (event) {
    //         const message = JSON.parse(event.data);
    //     });
    //     socket.addEventListener('close', function (event) {
    //         console.log("connection closed");
    //     });

        const playerBody = playerBodyMesh.current;
        var modelMoving = false;
        if(!navigator.getGamepads()[0]){
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
                rotateObjectTowardsRight(playerBody,1,delta);
                modelMoving = true;
            }
            if(keysState.d || keysState.D){
                if(velocity.left_right<velocityMax.left_right){
                    velocity.left_right += acceleration.left_right * delta;
                }
                rotateObjectTowardsLeft(playerBody,1,delta);
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
            if(modelMoving){
                getMouseMovement();
                rotateModelAccordingToMouse(delta,playerBodyMesh);
            }
        }
        else{
            // forward_backward
            if(Math.abs(yL)>0.0001){
                if(yL < 0){ // forward
                    if(velocity.forward_backward< -yL*velocityMax.forward_backward)
                        velocity.forward_backward += acceleration.forward_backward * delta * -yL;
                    modelMoving = true;
                }
                else{ // backward
                    if(velocity.forward_backward> -yL*velocityMax.forward_backward)
                        velocity.forward_backward += acceleration.forward_backward * delta * -yL;
                modelMoving = true;
                }
            }
            else{
                if (velocity.forward_backward < 0) {
                    velocity.forward_backward += deceleration.forward_backward * delta;
                    modelMoving = true;
                    if(velocity.forward_backward>-0.0000005)
                        velocity.forward_backward = 0;
                }
                else if (velocity.forward_backward > 0) {
                    velocity.forward_backward -= deceleration.forward_backward * delta;
                    modelMoving = true;
                    if(velocity.forward_backward<0.0000005)
                        velocity.forward_backward = 0;
                }
            }
            // left_right
            if(Math.abs(xL)>0.0001){
                if(xL < 0){ // left
                    if(velocity.left_right< -xL*velocityMax.left_right){
                        velocity.left_right += acceleration.left_right * delta * -xL;
                        rotateObjectTowardsRight(playerBody,xL,delta);
                    }
                    modelMoving = true;
                }
                else{ // right
                    if(velocity.left_right> -xL*velocityMax.left_right){
                        velocity.left_right += acceleration.left_right * delta * -xL;
                        rotateObjectTowardsLeft(playerBody,-xL,delta);
                    }
                    modelMoving = true;
                }
            }
            else{
                if (velocity.left_right < 0) {
                    velocity.left_right += deceleration.left_right * delta;
                    modelMoving = true;
                    if(velocity.left_right>-0.0000005)
                        velocity.left_right = 0;
                }
                else if (velocity.left_right > 0) {
                    velocity.left_right -= deceleration.left_right * delta;
                    modelMoving = true;
                    if(velocity.left_right<0.0000005)
                        velocity.left_right = 0;
                }
            }
            // right-joystick
            // x-axis
            if(Math.abs(xR)>0.0001 || Math.abs(yR)>0.0001){
                rotateModelAccordingToJoystick(delta,playerBodyMesh,xR,yR);
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

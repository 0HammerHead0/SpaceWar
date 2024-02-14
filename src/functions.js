import * as THREE from 'three';
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

document.onmousemove = (e) => {
    mouseMovementX = (e.clientX - window.innerWidth/2)/(window.innerWidth/2);
    mouseMovementY = (e.clientY - window.innerHeight/2)/(window.innerHeight/2);
}
function getMouseMovement(){
    return {x:mouseMovementX,y:mouseMovementY};
}
export const functions = (function() {
    return {
        rotateModelAccordingToMouse: (delta,playerBodyMesh) => {
            const mouseMovement = getMouseMovement();
            const percentageX = mouseMovement.x;
            const percentageY = mouseMovement.y;
        
            let targetAngleX = -maxAngleX * percentageX * delta * (velocity.left_right/velocityMax.left_right);
            let targetAngleY = -maxAngleY* percentageY * 1.5 * delta * (velocity.forward_backward/velocityMax.forward_backward);
        
            const rotationQuaternionX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngleX);
            const rotationQuaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetAngleY);
        
            playerBodyMesh.current.quaternion.multiply(rotationQuaternionX).multiply(rotationQuaternionY);
        },
        rotateModelAccordingToJoystick: (delta,playerBodyMesh,percentageX,percentageY) => {
            let targetAngleX = -maxAngleX * percentageX * delta * (velocity.left_right/velocityMax.left_right);
            let targetAngleY = -maxAngleY* percentageY * 1.5 * delta * (velocity.forward_backward/velocityMax.forward_backward);
            const currentRotation = playerBodyMesh.current.quaternion.clone();
        
            const rotationQuaternionX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngleX);
            const rotationQuaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetAngleY);
            
            currentRotation.multiply(rotationQuaternionX).multiply(rotationQuaternionY);
            playerBodyMesh.current.quaternion.copy(currentRotation);
        },
        startRumble: (gamepad) => {
            if (gamepad && gamepad.vibrationActuator) {
              const rumbleOptions = {
                startDelay: 0,
                duration: 200, // Rumble duration in milliseconds
                strongMagnitude: 0.6,
                weakMagnitude: 0.6,
              };
              gamepad.vibrationActuator.playEffect('dual-rumble', rumbleOptions);
            }
        },
        rotateObjectTowardsRight: (object,factor,delta) => {
            const rotationRightQuaternion = new THREE.Quaternion().setFromAxisAngle(rightCrossVector, leftAngle*factor*delta);
            object.quaternion.multiply(rotationRightQuaternion)
        },
        rotateObjectTowardsLeft: (object,factor,delta) => {
            const rotationLeftQuaternion = new THREE.Quaternion().setFromAxisAngle(leftCrossVector, rightAngle*factor*delta);
            object.quaternion.multiply(rotationLeftQuaternion);
        },
        updateCamPos: (state,delta,playerBody) => {
            const idealOffset = new THREE.Vector3(0,6,8);
            idealOffset.applyQuaternion(playerBody.quaternion);
            idealOffset.add(playerBody.position);
            const t = 1.0 - Math.pow(0.001, delta);
            state.camera.position.copy(state.camera.position.clone().lerp(idealOffset, t));
        },
        updateCamLookAt: (state,delta,playerBody) => {
            const idealLookAt = new THREE.Vector3(0,0,-3);
            idealLookAt.applyQuaternion(playerBody.quaternion);
            idealLookAt.add(playerBody.position);
            const t = 1.0 - Math.pow(0.001, delta);
            state.camera.lookAt(state.camera.position.clone().lerp(idealLookAt, t));
        },
    };
})();


// WASDMovement.js
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const WASDMovement = ({ object, movementSpeed = 0.1, acceleration = 0.001, deceleration = 0.98 }) => {
  const keys = useRef({ W: false, A: false, S: false, D: false });
  const velocity = useRef(new THREE.Vector3(0, 0, 0));

  const { camera } = useThree();

  useEffect(() => {
    const handleKeyDown = (event) => {
      keys.current[event.key] = true;
    };

    const handleKeyUp = (event) => {
      keys.current[event.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    const moveDirection = new THREE.Vector3();
    const rotationMatrix = new THREE.Matrix4();
    object.updateMatrixWorld();
    object.matrixWorld.extractRotation(rotationMatrix);

    if (keys.current.W) moveDirection.z = -1;
    if (keys.current.A) moveDirection.x = -1;
    if (keys.current.S) moveDirection.z = 1;
    if (keys.current.D) moveDirection.x = 1;

    moveDirection.applyMatrix4(rotationMatrix);

    velocity.current.x += (moveDirection.x * acceleration - velocity.current.x) * deceleration;
    velocity.current.z += (moveDirection.z * acceleration - velocity.current.z) * deceleration;

    const moveDistance = movementSpeed * velocity.current.z;
    const strafeDistance = movementSpeed * velocity.current.x;

    object.translateZ(-moveDistance);
    object.translateX(strafeDistance);

    // Orient the player in the direction of movement
    const angle = Math.atan2(moveDirection.x, moveDirection.z);
    object.rotation.y = angle;

    // Update camera position to follow the player
    const cameraOffset = new THREE.Vector3(0, 5, -10);
    const cameraPosition = object.position.clone().add(cameraOffset);
    camera.position.lerp(cameraPosition, 0.1);
    camera.lookAt(object.position);
  });

  return null;
};

export default WASDMovement;

// WASDMovement.js
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import {math} from './math.js';
import * as THREE from 'three';
import { Physics, RigidBody, RapierRigidBody, quat, vec3, euler  } from "@react-three/rapier";

const WASDMovement = () => {
    const playerBody = useRef();
    const playerBodyMesh = useRef();
    const jump = () => {
        console.log('jump')
        playerBody.current.applyImpulse({ x: 0, y:10, z: 0 });
    }
    const [keysState, setKeysState] = useState({
        W: false,Shift:false,w:false, A: false, a:false, S: false, s:false, D: false ,d:false
    });
    const velocity = useRef(new THREE.Vector3(0, 0, 0));

    const getFacingNormal = () => {
        const defaultNormal = new THREE.Vector3(0, 0, 0);
        const worldNormal = defaultNormal.clone().applyMatrix4(playerBody.current.matrixWorld);
    
        return worldNormal;
    };
    const { camera } = useThree();
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
        
    }, [keysState]);
    useFrame((state, delta) => {
        const impulse = { x: 0, y: 0, z: 0 };
        const impulseStrength = 10 * delta;
        if (keysState.W || keysState.w) {
            impulse.z -= impulseStrength;
        }
        if (keysState.S || keysState.s) {
            impulse.z += impulseStrength;
        }
        if (keysState.A || keysState.a) {
            impulse.x -= impulseStrength;
        }
        if (keysState.D || keysState.d) {
            impulse.x += impulseStrength;
        }
        playerBody.current.applyImpulse(impulse);
        // camera.position.copy(playerBody.current.translation());
        // camera.lookAt(playerBody.current.translation().x, playerBody.current.translation().y, playerBody.current.translation().z);
        // camera.position.z += 5;wawadasd
        // playerBodyMesh.current.position.copy(playerBody.current.translwation());
        console.log(playerBodyMesh.current.position)
        playerBodyMesh.current.position.copy(playerBody.current.translation());
        // console.log(playerBody.current.translation())
    });
    return <>
    <RigidBody
            type={'dynamic'} ref={playerBody}
            colliders="cuboid"
            linearDamping={1}
            angularDamping={1}>
                <mesh onClick={jump} ref={playerBodyMesh}>
                    <boxGeometry />
                    <meshStandardMaterial roughness={0.1} metalness={0.5} side={THREE.DoubleSide}/>
                </mesh>
    </RigidBody>
    </>
};

export default WASDMovement;

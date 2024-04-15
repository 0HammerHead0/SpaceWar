import { useFrame, useThree } from '@react-three/fiber';
import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import {math} from './math.js';      
import * as THREE from 'three';
import { useGLTF , Box, Sphere, Wireframe, Html, Edges, PositionalAudio} from '@react-three/drei';
import { Physics, RigidBody, RapierRigidBody, quat, vec3, euler  } from "@react-three/rapier";
import {functions} from './functions.js';
import address from './socketAdd.js';
import LaserRay from './LaserRay.jsx';
import HealthBar from './HealthBar';
import { client } from 'websocket';
import EndGame from './EndGame.jsx';
import ListItem from './ListItem.jsx';
import exitsong from "/sounds/exit.mp3"
var gamepad;
var socket;
// let message;
var mouseMovementX;
var mouseMovementY;
const velocity     = {forward_backward:0,left_right:0};
const acceleration = {forward_backward:0.2,left_right:0.05};
const deceleration = {forward_backward:0.008,left_right:0.003};
const velocityMax  = {forward_backward:0.3,left_right:0.05};
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

function resetPosition(playerBodyMesh){
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    playerBodyMesh.position.set(x,y,z);
    playerBodyMesh.lookAt(0,0,0);
}

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
    let targetAngleY = -maxAngleY * percentageY * 1.5 * delta * (velocity.forward_backward/velocityMax.forward_backward);
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

function Model() {
    const gltf = useGLTF('../../public/models/xwing.glb');

    const clonedScene = useMemo(() => {
        return gltf.scene.clone(true);
    }, [gltf.scene]);

    return <primitive object={clonedScene} />;
}
function updateCamPos(state,delta,playerBody){
    const idealOffset = new THREE.Vector3(0,3,8);
    idealOffset.applyQuaternion(playerBody.quaternion);
    idealOffset.add(playerBody.position);
    const t = 1.0 - Math.pow(0.01, delta);
    state.camera.position.copy(state.camera.position.clone().lerp(idealOffset, t));
}
function updateCamLookAt(state,delta,playerBody){
    const idealLookAt = new THREE.Vector3(0,0,-3);
    idealLookAt.applyQuaternion(playerBody.quaternion);
    idealLookAt.add(playerBody.position);
    const t = 1.0 - Math.pow(0.01, delta);
    state.camera.lookAt(state.camera.position.clone().lerp(idealLookAt, t));
}
document.onmousemove = (e) => {
    mouseMovementX = (e.clientX - window.innerWidth/2)/(window.innerWidth/2);
    mouseMovementY = (e.clientY - window.innerHeight/2)/(window.innerHeight/2);
}
function getMouseMovement(){
    return {x:mouseMovementX,y:mouseMovementY};
}
// function Sound({ url }) {
//     const sound = useRef()
//     const { camera } = useThree()
//     const [listener] = useState(() => new THREE.AudioListener())
//     const buffer = useLoader(THREE.AudioLoader, url)
//     useEffect(() => {
//       sound.current.setBuffer(buffer)
//       sound.current.setRefDistance(1)
//       sound.current.setLoop(true)
//       sound.current.play()
//       camera.add(listener)
//       return () => camera.remove(listener)
//     }, [])
//     return <positionalAudio ref={sound} args={[listener]} />
// }
const PlayerInput = () => {
    const { camera, scene } = useThree();
    
    const [laserRays, setLaserRays] = useState([]);

    const [enemyPlayers, setEnemyPlayers] = useState({});
    const [enemyIds, setEnemyIds] = useState([]);
    const [playerData, setPlayerData] = useState({
        end:false,
        numberOfPlayers: 1,
        players: {
            [String(useParams().clientID)]: {
                health: 100,
                position: [0, 0, 0],
                quaternion: [0, 0, 0, 0],
                kills: 0,
            },
        },
    });
    const { gameID } = useParams();
    const { clientID } = useParams();
    var enemyClientID;
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
    var health = 100;
    var position = [0,0,0];
    var quaternion = [0,0,0,0];
    var kills = 0;
    const leftTopLaser = new THREE.Vector3(-1.9,0.1,1.2);
    const leftBottomLaser = new THREE.Vector3(-1.9,-0.1,1.2);
    const rightTopLaser = new THREE.Vector3(1.9,0.1,1.2);
    const rightBottomLaser = new THREE.Vector3(1.9,-0.1,1.2);
    const laserArray = [leftTopLaser,leftBottomLaser,rightBottomLaser,rightTopLaser]
    var laserIndex = 0
    const createLaserRay = () => {
        laserIndex = (laserIndex + 1) % 4;
        const laser = laserArray[laserIndex].clone();
        laser.applyQuaternion(playerBodyMesh.current.quaternion);
        laser.add(playerBodyMesh.current.position);
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(playerBodyMesh.current.quaternion);
    
        const laserRay = new LaserRay(
            new THREE.Ray(laser, direction),
            scene,
            camera
        );
        scene.add(laserRay.getMesh());
    
        const payload = {
            method: "rayAnimation",
            gameID,
            clientID,
            origin: laser.toArray(),
            direction: direction.toArray()
        };
        
        const listener = new THREE.AudioListener();
        camera.add(listener);
        
        // Create a PositionalAudio object
        const sound = new THREE.PositionalAudio(listener);
        
        // Load the audio file
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('/sounds/laser-gun.mp3', function(buffer) {
            // Set the audio buffer
            sound.setBuffer(buffer);
            // Set other properties as needed
            sound.setRefDistance(1);
            sound.setLoop(false);
            // Play the audio
            sound.play();
        });
        
        // Add the PositionalAudio to the playerBodyMesh
        playerBodyMesh.current.add(sound);
        
        
        
        socket.send(JSON.stringify(payload));
        // Return an object containing both the LaserRay object and the LaserSound component
        return laserRay
    };
    
    const updateLaserRays = (delta) => {
        setLaserRays((prevRays) => {
            const updatedRays = [];
            prevRays.forEach((laserRay) => {
                laserRay.update(delta,socket,gameID,clientID);
                if (!laserRay.hitEnemy) {
                    updatedRays.push(laserRay);
                }
                // else {
                //     scene.remove(laserRay.getMesh());
                // }
            });
            return updatedRays;
        });
    };
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
        }, 100);
        return () => clearInterval(interval);
    });
    useEffect(() => {
        const handleMouseDown = (event) => {
            if (event.button === 0) {
              // Left mouse click
              const laserRay = createLaserRay();
              setLaserRays((prevRays) => [...prevRays, laserRay]);
            }
            // scene.traverse((object) => {
            //     if (object.isMesh && object.name && object.name.startsWith('enemy-')) {
            //         console.log(object.name)
            //     }
            // });
        };
        window.addEventListener('mousedown', handleMouseDown);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
    };
    }, []);
    useEffect(() => {
        socket = new WebSocket("ws://172.16.54.53:3000")
    },[]);
    useEffect(() => {
        const handleOpen = (event) => {
            console.log("event open :",event);
        };
        const handleMessage = (event) => {
            const message = JSON.parse(event.data);
            if(message.method === "broadcast"){
                const {end,numberOfPlayers,players} = message.games;
                setPlayerData({
                    end,
                    numberOfPlayers,
                    players: { ...players },
                });
                setEnemyPlayers((prevPlayers) => {
                    const allEnemys = [];
                    const updatedEnemyPlayers = { ...prevPlayers }; 
                    for (const clientID_ in players) {
                        if (clientID_ !== clientID) {
                            updatedEnemyPlayers[clientID_] = players[clientID_];
                            allEnemys.push(clientID_);
                        }
                        // else{
                        //     // --heightOuterHealthBar: 1rem;
                        //     // --widthOuterHealthBar: calc(60%);
                        //     // --bottomOuterHealthBar: 6rem;
                        //     // --heightInnerHealthBar: calc(var(--heightOuterHealthBar) - 0.1rem);
                        //     // --widthInnerHealthBar: calc(var(--widthOuterHealthBar) - 0.1rem);
                        // }
                    }
                    setEnemyIds(allEnemys);
                    return updatedEnemyPlayers;
                });
            }
            else if(message.method == "rayAnimation"){
                const rayClientID = message.clientID
                if(rayClientID!=clientID){
                    const laser = new THREE.Vector3().fromArray(message.origin)
                    const direction =  new THREE.Vector3().fromArray(message.direction)
                    const laserRay = new LaserRay(
                        new THREE.Ray(laser, direction),
                        scene,
                        camera
                    );
                    setLaserRays((prevRays) => [...prevRays, laserRay]);
                    
                    // Load the laser sound
                    const audioLoader = new THREE.AudioLoader();
                    const listener = new THREE.AudioListener();
                    camera.add(listener)
                    audioLoader.load('/sounds/laser-gun.mp3', function(buffer) {
                        // Create a PositionalAudio object
                        const sound = new THREE.PositionalAudio(listener);
                        sound.setBuffer(buffer);
                        sound.setRefDistance(1);
                        sound.setLoop(false);
                        // Attach the audio to the enemy model
                        const enemyModel = scene.getObjectByName(`enemy-${rayClientID}`);
                        if (enemyModel) {
                            enemyModel.add(sound);
                            // Play the audio
                            sound.play();
                        }
                        else{
                            console.log("no such enemey model")
                        }
                    });

                    ///////////////
                    scene.add(laserRay.getMesh());
                }
            }
        };
    
        const handleClose = (event) => {
          console.log("connection closed");
        };
        const handleError = (event) => {
            console.log("connection error");
        };

        socket.addEventListener("open", handleOpen);
        socket.addEventListener("message", handleMessage);
        socket.addEventListener("close", handleClose);
        socket.addEventListener("error", handleError);
        return () => {
            socket.removeEventListener("open", handleOpen);
            socket.removeEventListener("message", handleMessage);
            socket.removeEventListener("close", handleClose);
            socket.removeEventListener("error", handleError);
        };
    }, [socket,setEnemyPlayers]);
    useEffect(()=>{
        if(gamepad){
            if(RB || LB){
               startRumble(gamepad);
            }
        }
    },[LB,RB])
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
        const innerHealthBar = document.getElementsByClassName("innerHealthBar")[0];
        const killCounter=document.getElementsByClassName("killCounter")[0];
        enemyIds.forEach((enemyId) => {
            const enemyHealth = document.getElementById(enemyId+"innerHealthBar");
            enemyHealth.style.width  = `calc((var(--widthOuterHealthBar_) - 0.1rem) * ${playerData.players[enemyId].health/100} )`
        });
        innerHealthBar.style.width  = `calc((var(--widthOuterHealthBar) - 0.1rem) * ${playerData.players[clientID].health/100} )`
        killCounter.textContent = "Kill: " + playerData.players[clientID].kills;
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
        // make it limit to 60 times per second
        updateLaserRays();
        if (performance.now() % (1000/60)< 16 && modelMoving) {
            const broadCastPayload = {
                health,
                position:playerBody.position.toArray(),
                quaternion:playerBody.quaternion.toArray(),
                kills
            }
            // console.log(playerData)
            socket.send(JSON.stringify({method:"update",gameID,clientID,data:broadCastPayload}));
        }
        if(playerData.players[clientID].health<=0){
            resetPosition(playerBodyMesh)
        }     
    });useEffect(() => {

        const audio = new Audio(exitsong);
        if (playerData.end) {
            
            audio.loop = true;
            audio.volume = 0.2;
            const delay = 1000; // Adjust the delay time in milliseconds
            setTimeout(() => {
              audio.play();
            }, delay);
            let endgame = document.getElementsByClassName("EndGame")[0]; // Get the first element with class "EndGame"
            endgame.style.zIndex = 1000;
            endgame.style.opacity = 1;
            let list = document.getElementById("list")
            let endGameContentWrapper = document.createElement('div'); // Create a new div wrapper
            let max_kill=-1
            let winner=null
            Object.keys(playerData.players).forEach((clientID) => {
                if(playerData.players[clientID].kills>max_kill){
                    max_kill=playerData.players[clientID].kills;
                    winner=clientID
                }
            });
            Object.keys(playerData.players).forEach((clientID) => {
                let content = document.createElement('div'); // Create a new div for each player's data
                content.className = "content";
                content.innerHTML = `
                    <div class="left">
                        <p>${clientID}</p>
                    </div>
                    <div class="right">
                        <p>${playerData.players[clientID].kills}</p>
                    </div>
                `;
                if(clientID==winner){
                    content.className="green_bg content"
                }
                endGameContentWrapper.appendChild(content); // Append each player's data div to the wrapper
            });
            list.innerHTML='';
            list.appendChild(endGameContentWrapper)
        }
        return() =>{
            audio.pause();
            audio.currentTime = 0;
        }
    }, [playerData.end, playerData.numberOfPlayers]);    
    return <>
    <mesh ref={playerBodyMesh} scale={0.7 }  key={clientID}>
        <Model/>
    </mesh>
    {
        enemyIds.map((enemyId)=>{
            return(
                <mesh scale={0.7}
                key={enemyId}
                position={new THREE.Vector3().fromArray(enemyPlayers[enemyId].position)}
                quaternion={new THREE.Quaternion().fromArray(enemyPlayers[enemyId].quaternion)}
                >   <Html>
                        <img id='crosshair' src="/red_dot-removebg-preview.png"/>
                    </Html>
                    <Model/>
                    <mesh name = {"enemy-" + enemyId} scale={[0.7,0.2,0.7]} >
                        <sphereGeometry args={[5, 20, 20]} />
                        <meshStandardMaterial color={0x0909ff} transparent={true} opacity={0.1}/>
                    </mesh>
                    <Html
                        wrapperClass="enemyHealthBarWrapper"
                        center
                        sprite
                        transform
                        distanceFactor={4}
                        position={[0, -2, 0]}
                    >
                        <div id={enemyId+"outerHealthBar"} className='enemy-outerHealthBar'></div>
                        <div id={enemyId+"innerHealthBar"} className='enemy-innerHealthBar'></div>
                    </Html>
                </mesh>
            )
        })
    }
    </>
};

export default PlayerInput;
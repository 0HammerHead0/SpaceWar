import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useParams } from 'react-router-dom';
class LaserRay {
  constructor(ray,scene,camera) {
    this.ray = ray;
    this.scene = scene;
    const geometry = new THREE.CylinderGeometry(0.025, 0.05, 5, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfffff,
      emissiveIntensity: 100
    });
    this.laserSegment = new THREE.Mesh(geometry, material);
    this.laserSegment.visible = false;
    this.travelDistance = 0;
    this.maxLength = 200;
    this.laserSegment.position.copy(this.ray.origin)
    this.hitEnemy = false;
    this.stopTraversing = false;
    this.camera = camera
  }

  update(delta,socket,gameID, clientID) {
    console.log(this.hitEnemy)
    if(!this.hitEnemy){
      if (this.travelDistance < this.maxLength) {
        const step = 5;
        this.laserSegment.visible = true;

        const deltaDistance = Math.min(step, this.maxLength - this.travelDistance);
        const deltaVector = new THREE.Vector3().copy(this.ray.direction).multiplyScalar(deltaDistance);
        this.laserSegment.position.add(deltaVector);
        this.travelDistance += deltaDistance;
        this.laserSegment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.ray.direction);
        this.customTraverse(this.scene,(object) => {
          if (object.isMesh && object.name && object.name.startsWith('enemy-') ) {
            const rayCaster = new THREE.Raycaster(this.laserSegment.position,this.ray.direction.normalize(),0,1);
            const intersects = rayCaster.intersectObjects([object],true);
            if (intersects.length > 0) {
              console.log(`Intersection with enemy: ${object.name.slice(6,)}`);
              this.hitEnemy = true;
              this.stopTraversing = true;
              this.destroy();
              const payload = {
                gameID: gameID,
                clientID: clientID,
                method: "hit",
                enemyID: object.name.slice(6,)
              }
              // console.log(payload)

              const listener = new THREE.AudioListener();
              this.camera.add(listener);
              
              // Create a PositionalAudio object
              const sound = new THREE.PositionalAudio(listener);
              
              // Load the audio file
              const audioLoader = new THREE.AudioLoader();
              audioLoader.load('/sounds/missile-explosion.mp3', function(buffer) {
                  // Set the audio buffer
                  sound.setBuffer(buffer);
                  // Set other properties as needed
                  sound.setRefDistance(10);
                  sound.setLoop(false);
                  // Play the audio
                  sound.play();
              });
              
              // Add the PositionalAudio to the playerBodyMesh
              object.add(sound);

              socket.send(JSON.stringify(payload))
            }
          }
        });
        this.stopTraversing = false;
      }
      else {
        this.hitEnemy = true
        this.destroy();
      }
    }
  }

  destroy() {
    this.laserSegment.visible = false;
    this.laserSegment.geometry.dispose();
    this.laserSegment.material.dispose();
    this.scene.remove(this.laserSegment);
  }

  getMesh() {
    return this.laserSegment;
  }
  intersectObjects(object){
    const rayCaster = new THREE.Raycaster(this.ray.origin,this.ray.direction.normalize());
    return rayCaster.intersectObjects([object],true)
  }
  customTraverse(object, callback) {
    callback(object);
    for (const child of object.children) {
      this.customTraverse(child, callback);
      if (this.stopTraversing) {
        return;
      }
    }
  }
}
export default LaserRay;
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
class LaserRay {
  constructor(ray,scene) {
    this.ray = ray;
    this.scene = scene;
    const geometry = new THREE.CylinderGeometry(0.025, 0.05, 10, 6);
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
  }

  update(delta) {
    if (this.travelDistance < this.maxLength) {
        const step = 8;
        this.laserSegment.visible = true;

        const deltaDistance = Math.min(step, this.maxLength - this.travelDistance);
        const deltaVector = new THREE.Vector3().copy(this.ray.direction).multiplyScalar(deltaDistance);
        this.laserSegment.position.add(deltaVector);
        this.travelDistance += deltaDistance;
        
        this.laserSegment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.ray.direction);
        // const intersections = checkIntersections(this.ray); // Implement this function
        // if (intersections.length > 0) {
        //     // Handle intersection (e.g., destroy the laser)
        //     this.destroy();
        // }
    }
    else {
        this.destroy();
    }
  }

  destroy() {
    // Cleanup or remove the laser segment from the scene
    this.laserSegment.visible = false;
    this.laserSegment.geometry.dispose()
    this.laserSegment.material.dispose();
    this.scene.remove(this.laserSegment)
    // Additional cleanup logic if needed
  }

  getMesh() {
    return this.laserSegment;
  }
}
function checkIntersections(ray, objectsToIntersect) {
    // Create a raycaster and set it up with the laser ray
    const raycaster = new THREE.Raycaster(ray.origin, ray.direction);
    
    // Perform the raycast to find intersections with objects
    const intersections = raycaster.intersectObjects(objectsToIntersect, true);
  
    return intersections;
  }
  
export default LaserRay;

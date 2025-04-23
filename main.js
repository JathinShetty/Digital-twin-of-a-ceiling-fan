import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class FanSimulation {
  constructor() {
    this.fanOn = false;
    this.fanSpeed = 0;
    this.fanDirection = true;
    this.doorOpen = false;
    this.windowOpen = false;
    this.motorTemperature = 0;
    this.airflowEnabled = true;
    


    this.initScene();
    this.createClassroom();
    this.createPlatform(15, 12); 
    this.addTeacherFigure();
    this.loadCeilingFan();
    this.setupParticles();
    this.createUI();
    this.setupControls();
    this.animate();
    
  }


  initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x333333);
    document.body.appendChild(this.renderer.domElement);

    // Enhanced lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Add hemisphere light for more natural illumination
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    this.scene.add(hemisphereLight);
  }



  createClassroom() {
    // Larger room dimensions
    const roomWidth = 15;
    const roomHeight = 6;
    const roomDepth = 12;

    // Main room
    const roomGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, roomDepth);
    const roomMaterial = new THREE.MeshPhongMaterial({
      color: 0xeeeeee,
      side: THREE.BackSide
    });
    this.room = new THREE.Mesh(roomGeometry, roomMaterial);
    this.room.receiveShadow = true;
    this.scene.add(this.room);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xdddddd,
      roughness: 0.8
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -roomHeight/2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Windows (now with open/close functionality)
    this.windows = [];
    const windowMaterial = new THREE.MeshPhongMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.5
    });
    const windowGeometry = new THREE.PlaneGeometry(3, 2);
    
    // Create two windows on opposite walls
    for(let i = 0; i < 2; i++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial.clone());
      window.position.set(
        i === 0 ? -roomWidth/2 + 0.1 : roomWidth/2 - 0.1,
        -1, // Position windows at appropriate height
        i === 0 ? -roomDepth/2 + 4 : roomDepth/2 - 4
      );
      window.rotation.y = i === 0 ? Math.PI/2 : -Math.PI/2;
      window.castShadow = true;
      this.scene.add(window);
      this.windows.push(window);
    }

    // Enhanced desks with legs
    this.createDesks(roomWidth, roomDepth);
  }

  createPlatform(roomWidth, roomDepth) {
    // Create a slightly elevated platform (teacher's area)
    const platformWidth = roomWidth * 1;
    const platformDepth = roomDepth * 0.2;
    const platformHeight = 0.6;
    
    const platformGeometry = new THREE.BoxGeometry(platformWidth, platformHeight, platformDepth);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,  // Brown wooden platform
      roughness: 0.9
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(
      0,                    // Centered horizontally
      -3 + platformHeight/2, // Just above the floor (-3 is floor level)
      roomDepth/2 - platformDepth/2  // Near the back wall with some space
    );
    
    platform.receiveShadow = true;
    platform.castShadow = true;
    this.scene.add(platform);
    
    // Add a small step to the platform
    const stepGeometry = new THREE.BoxGeometry(platformWidth/2, platformHeight/2, 0.2);
    const step = new THREE.Mesh(stepGeometry, platformMaterial);
    step.position.set(
      0,
      -3 + platformHeight/4, // Half the height of the step
      roomDepth/2 - platformDepth -0.1 // Just in front of the platform, facing the class
    );
    step.receiveShadow = true;
    step.castShadow = true;
    this.scene.add(step);
    
    return platform;
  }
  
  addHumanFigures(deskPosition) {
    for (let i = 0; i < 2; i++) {
      const humanGroup = new THREE.Group();
      
      // Color variation
      const skinColor = i === 0 ? 0xe0ac69 : 0xc68642;
      const shirtColor = i === 0 ? 0x4287f5 : 0xf54242;
      const pantsColor = i === 0 ? 0x1a237e : 0x212121;
      
      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshStandardMaterial({ color: skinColor })
      );
      head.position.y = 0.5;
      head.castShadow = true;
      humanGroup.add(head);
      
      // Torso
      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.35, 0.15),
        new THREE.MeshStandardMaterial({ color: shirtColor })
      );
      torso.position.y = 0.3;
      torso.castShadow = true;
      humanGroup.add(torso);
      
      // Legs
      const legs = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.12, 0.4),
        new THREE.MeshStandardMaterial({ color: pantsColor })
      );
      legs.position.set(0, 0.12, 0.1);
      legs.castShadow = true;
      humanGroup.add(legs);
      
      // Arms
      for (let j = 0; j < 2; j++) {
        const arm = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.25, 0.08),
          new THREE.MeshStandardMaterial({ color: shirtColor })
        );
        arm.position.set((j === 0 ? -1 : 1) * 0.15, 0.3, 0);
        arm.rotation.z = (j === 0 ? 1 : -1) * 0.2;
        arm.castShadow = true;
        humanGroup.add(arm);
      }
  
      // Position human near the desk
      humanGroup.position.set(
        deskPosition.x + (i === 0 ? -0.35 : 0.35),
        deskPosition.y - 0.2, // Seat height
        deskPosition.z - 0.5
      );
      humanGroup.rotation.y = (i === 0 ? 0.2 : -0.2);
      
      this.scene.add(humanGroup);
    }
  }
  addTeacherFigure() {
    const teacherGroup = new THREE.Group();
  
    // Colors
    const skinColor = 0xf1c27d;
    const shirtColor = 0x222831;
    const pantsColor = 0x393e46;
  
    // Head
    const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    teacherGroup.add(head);
  
    // Torso
    const torsoGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.2);
    const torsoMaterial = new THREE.MeshStandardMaterial({ color: shirtColor });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.y = 1.25;
    teacherGroup.add(torso);
  
    // Legs
    const legsGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.2);
    const legsMaterial = new THREE.MeshStandardMaterial({ color: pantsColor });
    const legs = new THREE.Mesh(legsGeometry, legsMaterial);
    legs.position.y = 0.75;
    teacherGroup.add(legs);
  
    // Arms
    for (let j = 0; j < 2; j++) {
      const armGeometry = new THREE.BoxGeometry(0.08, 0.4, 0.08);
      const armMaterial = new THREE.MeshStandardMaterial({ color: shirtColor });
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set((j === 0 ? -0.22 : 0.22), 1.25, 0);
      teacherGroup.add(arm);
    }
  
    // Position on stage
    teacherGroup.position.set(0, -3 + 0.01, 4); // Adjust z to put them near the center front
    teacherGroup.castShadow = true;
  
    this.scene.add(teacherGroup);
  }
  
  
  createDesks(width, depth) {
    const deskMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4a3520,
      roughness: 0.8
    });
    const deskTopGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.8);
    const legGeometry = new THREE.BoxGeometry(0.05, 0.7, 0.05);
    
    const deskHeight = 0.7;
    const floorY = -3;
  
    for (let i = 0; i < 8; i++) {
      const deskGroup = new THREE.Group();
  
      const deskTop = new THREE.Mesh(deskTopGeometry, deskMaterial);
      deskTop.position.y = deskHeight;
      deskGroup.add(deskTop);
  
      for (let j = 0; j < 4; j++) {
        const leg = new THREE.Mesh(legGeometry, deskMaterial);
        leg.position.set(
          (j % 2 === 0 ? -0.85 : 0.85),
          deskHeight / 2,
          (j < 2 ? -0.375 : 0.375)
        );
        deskGroup.add(leg);
      }
  
      const posX = -width / 2 + 2.5 + (i % 4) * 3;
      const posY = floorY;
      const posZ = -depth / 2 + 3 + Math.floor(i / 4) * 4;
  
      deskGroup.position.set(posX, posY, posZ);
      deskGroup.castShadow = true;
      this.scene.add(deskGroup);
  
      // ✅ Add two human figures sitting at this desk
      const deskCenter = { x: posX, y: posY + deskHeight, z: posZ };
      this.addHumanFigures(deskCenter);
    }
  }
  
  

  // Replace the loadCeilingFan() method in your code with this corrected version

loadCeilingFan() {
  this.fan = new THREE.Group();
  
  // Ceiling mount plate
  const mountGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
  const mountMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.7
  });
  const mount = new THREE.Mesh(mountGeometry, mountMaterial);
  mount.position.y = 2.97; // Position at ceiling
  mount.castShadow = true;
  this.fan.add(mount);
  
  // Down rod
  const rodGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16);
  const rodMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xc0c0c0,
    metalness: 0.7,
    roughness: 0.3
  });
  const rod = new THREE.Mesh(rodGeometry, rodMaterial);
  rod.position.y = 2.6; // Position below mount
  rod.castShadow = true;
  this.fan.add(rod);
  
  // Motor housing
  const motorGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 32);
  const motorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    metalness: 0.7,
    roughness: 0.3
  });
  const motor = new THREE.Mesh(motorGeometry, motorMaterial);
  motor.position.y = 2.2; // Position at bottom of rod
  motor.castShadow = true;
  this.fan.add(motor);
  
  // Light fixture
  const lightFixtureGeometry = new THREE.SphereGeometry(0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    roughness: 0.1,
    transmission: 0.9
  });
  const lightFixture = new THREE.Mesh(lightFixtureGeometry, glassMaterial);
  lightFixture.position.y = 2.05; // Position under motor
  lightFixture.rotation.x = Math.PI; // Flip to face downward
  lightFixture.castShadow = true;
  this.fan.add(lightFixture);
  
  // Light source (point light)
  const light = new THREE.PointLight(0xffffcc, 0.5, 10);
  light.position.y = 2.05;
  this.fan.add(light);
  
  // Create rotating blades group
  this.blades = new THREE.Group();
  this.blades.position.y = 2.2; // At motor level
  
  // Create fan blades - FIXED HORIZONTAL BLADE ORIENTATION
  const bladeCount = 5; // Typical ceiling fan has 5 blades
  
  // Create blade geometry (flat, horizontal)
  const bladeGeometry = new THREE.BoxGeometry(2.0, 0.05, 0.25); // Length, thickness, width
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513,
    roughness: 0.8
  });
  
  // Central fan motor cap (decorative)
  const capGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,  // Gold color for decorative cap
    metalness: 0.7,
    roughness: 0.3
  });
  const motorCap = new THREE.Mesh(capGeometry, capMaterial);
  this.blades.add(motorCap);
  
  // Create and position blades evenly around the motor
  for(let i = 0; i < bladeCount; i++) {
    // Create a blade
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    
    // Create blade arm (connects blade to motor)
    const armGeometry = new THREE.BoxGeometry(0.4, 0.08, 0.05);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xA0A0A0,
      metalness: 0.6,
      roughness: 0.4
    });
    const arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.x = 0.2;  // Position halfway into the blade's base
    
    // Create a group for this blade assembly
    const bladeAssembly = new THREE.Group();
    
    // Position blade slightly elevated from motor level with pitch
    blade.position.x = 1.0;  // Position blade out from center
    blade.rotation.z = 0.1;  // Slightly angle blade for airflow
    
    bladeAssembly.add(arm);
    bladeAssembly.add(blade);
    
    // Rotate the whole assembly to position around the fan
    bladeAssembly.rotation.y = (i / bladeCount) * Math.PI * 2;
    
    this.blades.add(bladeAssembly);
  }
  
  // Add blades to fan
  this.fan.add(this.blades);
  
  // Position fan in center of room
  this.fan.position.set(0, 0, 0);
  this.scene.add(this.fan);
}

updateBladeAngles() {
  if (!this.blades) return;
  
  // Loop through all blade assemblies and update their pitch
  this.blades.children.forEach(child => {
    if (child instanceof THREE.Group) {
      child.children.forEach(part => {
        if (part instanceof THREE.Mesh && part.geometry.type === 'BoxGeometry') {
          // Update x-rotation for horizontal blades
          part.rotation.x = this.bladeAngle;
        }
      });
    }
  });
}

  setupParticles() {
    this.particleCount = 10000;
    this.particles = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    this.particleVelocities = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    
    // Add a temperature array to track particle temperatures
    this.particleTemperatures = new Float32Array(this.particleCount);

    // Initialize particles - distribute throughout room with more near ceiling
    for(let i = 0; i < this.particleCount; i++) {
      positions[i*3] = (Math.random() - 0.5) * 14;
      positions[i*3+1] = -2 + Math.random() * 4; // Distribute from floor to ceiling
      positions[i*3+2] = (Math.random() - 0.5) * 11;
      
      this.particleVelocities[i*3] = 0;
      this.particleVelocities[i*3+1] = 0;
      this.particleVelocities[i*3+2] = 0;
      
      // Color based on height (lighter near ceiling)
      colors[i*3] = 0.7 + (positions[i*3+1] + 3) * 0.06; // Adjust for new floor level
      colors[i*3+1] = 0.8 + (positions[i*3+1] + 3) * 0.04;
      colors[i*3+2] = 1.0;

      // Initialize temperature (0.0 = cold, 1.0 = hot)
      // Higher particles start warmer (heat rises)
      const heightFactor = (positions[i*3+1] + 3) / 6; // Normalize height (floor at -3, ceiling at 3)
      this.particleTemperatures[i] = 0.3 + (heightFactor * 0.4); // Base temp with height influence

      // Apply temperature-based coloring
      this.updateParticleColor(colors, i, this.particleTemperatures[i]);
      
      // Random size variation (small air particles)
      sizes[i] = 0.02 + Math.random() * 0.03;
    }

    this.particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.particleSystem = new THREE.Points(this.particles, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  // Helper method to update particle color based on temperature
  updateParticleColor(colors, index, temperature) {
    // Cold: blue (0,0,1) -> Neutral: white (1,1,1) -> Hot: orange (1,0.5,0)
    if (temperature <= 0.5) {
      // Cold to neutral (blue to white)
      const t = temperature * 2; // Scale 0-0.5 to 0-1
      colors[index*3] = t;       // R: 0 to 1
      colors[index*3+1] = t;     // G: 0 to 1
      colors[index*3+2] = 1;     // B: always 1
    } else {
      // Neutral to hot (white to orange)
      const t = (temperature - 0.5) * 2; // Scale 0.5-1 to 0-1
      colors[index*3] = 1;               // R: always 1
      colors[index*3+1] = 1 - (t * 0.5); // G: 1 to 0.5
      colors[index*3+2] = 1 - t;         // B: 1 to 0
    }
  }

  updateParticles(deltaTime) {
    const positions = this.particles.attributes.position.array;
    const velocities = this.particleVelocities;
    const colors = this.particles.attributes.color.array;
    const fanPos = this.fan.position;
    const roomBounds = { x: 7.5, y: 6, z: 6 };
    const floorY = -3;
    const ceilingY = 3;
  
    // Ceiling fan is typically at Y position 2.2
    const fanY = 2.2;
    
    // Fan state parameters - REDUCED STRENGTH SCALING FACTOR for more appropriate speeds
    const fanStrength = this.fanOn ? this.fanSpeed * 0.08 : 0; // Reduced from 0.15
    const fanDirection = this.fanDirection ? 1 : -1; // 1 = downward flow (summer), -1 = upward flow (winter)
    const drag = 0.97;

      // Temperature parameters
    const tempDiffusionRate = 0.01;  // How fast temperatures equalize
    const fanCoolingFactor = 0.12;   // How much the fan cools air
    const floorCoolingFactor = 0.08; // How much the floor cools air
    const ceilingHeatingFactor = 0.1; // How much the ceiling heats air
    const windowCoolingFactor = this.windowOpen ? 0.2 : 0.02; // External cold air

  
    // REDUCED ambient air movement factors
    const ambientStrength = 0.0008 + (this.fanSpeed * 0.00005); // Reduced from 0.0015 + 0.0001
    
    // Define bench positions (approximate - adjust based on your room setup)
    const benches = [
      { x: 0, z: 4, width: 4, depth: 1 },    // North bench
      { x: 0, z: -4, width: 4, depth: 1 },   // South bench
      { x: 4, z: 0, width: 1, depth: 4 },    // East bench
      { x: -4, z: 0, width: 1, depth: 4 }    // West bench
    ];
    
    // Bench height from floor (approximate)
    const benchY = floorY + 1.2;  // Benches are typically around 1.2 units above floor
    
    // ADDED VELOCITY SCALING - to make movements more appropriate for scene scale
    // This global multiplier affects all position updates
    const velocityScale = 0.5; // Reduce overall velocity by 50%
    
    for(let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3+1];
      const z = positions[i3+2];
      
      // Calculate distance to fan (horizontal plane only)
      const dx = x - fanPos.x;
      const dz = z - fanPos.z;
      const distToFan = Math.sqrt(dx*dx + dz*dz);
      
      // Check if particle is near a bench
      let nearBench = false;
      let onBench = false;
      let benchDistanceX = 999;
      let benchDistanceZ = 999;
      
      for (const bench of benches) {
        const bx = Math.abs(x - bench.x);
        const bz = Math.abs(z - bench.z);
        
        // Check if above bench
        if (bx <= bench.width/2 && bz <= bench.depth/2) {
          // On or just above bench surface
          if (Math.abs(y - benchY) < 0.3) {
            onBench = true;
          }
          
          // Near bench (within 1 unit)
          if (y > benchY - 0.5 && y < benchY + 1) {
            nearBench = true;
            benchDistanceX = Math.min(benchDistanceX, bx);
            benchDistanceZ = Math.min(benchDistanceZ, bz);
          }
        }
      }

      // Update particle temperature
      let temp = this.particleTemperatures[i];

      // Base thermal behavior - heat rises
      const heightFromFloor = y - floorY;
      const heightRatio = heightFromFloor / (ceilingY - floorY);

      // Natural temperature gradient - warmer at ceiling, cooler at floor
      const targetTemp = 0.3 + (heightRatio * 0.6);
  
      // Temperature diffusion toward ambient
      temp += (targetTemp - temp) * tempDiffusionRate;

       // Fan effects on temperature
  if (this.fanOn) {
    // Calculate distance to fan (horizontal plane only)
    const distToFan = Math.sqrt(dx*dx + dz*dz);
    const directInfluenceRadius = 2.5 + (this.fanSpeed * 0.1);
    
    if (distToFan < directInfluenceRadius) {
      // Fan's direct cooling effect - stronger with higher speed
      const fanInfluence = (1 - distToFan/directInfluenceRadius) * fanCoolingFactor * this.fanSpeed/5;
      
      if (fanDirection > 0) { // Summer mode - downward flow
        if (y < fanY) {
          // Cool air pushed down
          temp -= fanInfluence;
        }
      } else { // Winter mode - upward flow
        if (y > fanY - 1) {
          // Mix air temperatures more evenly
          temp = (temp * 0.7) + (targetTemp * 0.3);
        }
      }
    }
  }
  
    // Floor cooling effect
    if (heightFromFloor < 0.5) {
      temp -= floorCoolingFactor * (1 - heightFromFloor/0.5) * deltaTime;
    }
    
    // Ceiling heating effect
    if (y > ceilingY - 0.5) {
      temp += ceilingHeatingFactor * (1 - (ceilingY - y)/0.5) * deltaTime;
    }
    
    // Window cooling effect
    if (this.windowOpen && x < -roomBounds.x * 0.7) {
      temp -= windowCoolingFactor * deltaTime;
    }
    
    // Door effect - mix with outside air
    if (this.doorOpen && x > roomBounds.x * 0.7) {
      // Outside air is neutral temperature
      temp = temp * 0.98 + 0.5 * 0.02;
    }
    
    // Clamp temperature between 0 and 1
    temp = Math.max(0, Math.min(1, temp));
    
    // Store updated temperature
    this.particleTemperatures[i] = temp;
    
    // Update particle color based on temperature
    this.updateParticleColor(colors, i, temp);
  
      // Apply drag relative to fan speed - ADJUSTED for appropriate speeds
      const effectiveDrag = this.fanOn ? drag - (this.fanSpeed * 0.001) : drag; // Reduced from 0.002
      velocities[i3] *= effectiveDrag;
      velocities[i3+1] *= effectiveDrag;
      velocities[i3+2] *= effectiveDrag;
      
      // Enhanced ambient air movement - REDUCED for more appropriate movement
      velocities[i3] += (Math.random() - 0.5) * ambientStrength;
      velocities[i3+1] += (Math.random() - 0.5) * ambientStrength;
      velocities[i3+2] += (Math.random() - 0.5) * ambientStrength;
      
      // Thermal buoyancy - REDUCED for more subtle effects
      let thermalFactor = 0.0002 * Math.max(0, 1 - heightFromFloor / 3); // Reduced from 0.0003
      
      // Reduce thermal rise when very close to floor or benches to encourage contact
      if (heightFromFloor < 0.15 || (onBench && Math.abs(y - benchY) < 0.15)) {
        thermalFactor *= 0.1;
      }
      
      velocities[i3+1] += thermalFactor;
  
      // Only apply fan forces if the fan is on
      if (this.fanOn) {
        // Define the fan's influence area - scaled by fan speed
        const directDowndraftRadius = 2.5 + (this.fanSpeed * 0.1);
        const fanInfluenceRadius = 5.0 + (this.fanSpeed * 0.2);
        
        // Summer mode (standard downward airflow)
        if (fanDirection > 0) {
          // 1. Central downdraft zone - directly below the fan
          if (distToFan < directDowndraftRadius && y < fanY) {
            // Stronger effect near the fan, weakens with distance
            const heightFactor = Math.min(1, (fanY - y) / 2);
            const distanceFactor = 1 - (distToFan / directDowndraftRadius);
            const downdraftStrength = fanStrength * heightFactor * distanceFactor;
            
            // Add strong downward velocity in this zone - ADJUSTED for more realistic speed
            velocities[i3+1] -= downdraftStrength * 0.8;
            
            // Add slight spiraling effect - REDUCED spiraling for more subtle movement
            const spiralStrength = downdraftStrength * 0.1; // Reduced from 0.15
            velocities[i3] += dz * spiralStrength;
            velocities[i3+2] -= dx * spiralStrength;
          }
          
          // 2. Floor outward flow zone - as air hits floor it spreads outward
          else if (y < -1.5 && distToFan < fanInfluenceRadius) {
            // Calculate how close to the floor the particle is
            const floorProximity = Math.max(0, 1 - (y - floorY) / 1.5);
            
            let floorFactor = floorProximity;
            
            // Extra boost for particles very close to floor, to enhance horizontal movement along surface
            if (y - floorY < 0.2) {
              floorFactor *= 1.5;
            }
            
            // Distance factor - ADJUSTED for more gradual effect
            const distanceFactor = Math.min(1, distToFan / directDowndraftRadius) * 
                                 (1 - Math.min(1, (distToFan / fanInfluenceRadius)));
            const outwardFactor = fanStrength * floorFactor * distanceFactor * 0.5; // Reduced from 0.6
            
            if (distToFan > 0.2) {
              // Radial outward flow along floor
              velocities[i3] += (dx / distToFan) * outwardFactor;
              velocities[i3+2] += (dz / distToFan) * outwardFactor;
            }
            
            // Less upward component when very close to floor, to keep particles skimming along surface
            const verticalFactor = (y - floorY < 0.2) ? 0.05 : 0.15;
            velocities[i3+1] += outwardFactor * verticalFactor;
          }
          
          // Special handling for bench surfaces - create flow across benches - REDUCED MAGNITUDE
          else if (nearBench && this.fanOn) {
            // Calculate flow along bench surface
            const benchFactor = fanStrength * 0.25; // Reduced from 0.3
            
            // Stronger horizontal flow very close to bench surface
            if (Math.abs(y - benchY) < 0.2) {
              // Add horizontal flow component - REDUCED for more appropriate speed
              velocities[i3] += (Math.random() - 0.5) * benchFactor * 0.5; // Reduced from 0.6
              velocities[i3+2] += (Math.random() - 0.5) * benchFactor * 0.5;
              
              // Dampen vertical movement to keep particles moving along bench
              velocities[i3+1] *= 0.9;
            }
            
            // Add circulation around bench edges - REDUCED for more subtle movement
            if (benchDistanceX < 0.3 || benchDistanceZ < 0.3) {
              // Edge turbulence effect - REDUCED
              velocities[i3] += (Math.random() - 0.5) * benchFactor * 0.3; // Reduced from 0.4
              velocities[i3+2] += (Math.random() - 0.5) * benchFactor * 0.3;
              velocities[i3+1] += (Math.random() - 0.2) * benchFactor * 0.25; // Reduced from 0.3
            }
          }
          
          // 3. Wall/edge upward flow - air rises at walls - ADJUSTED
          else if ((Math.abs(x) > roomBounds.x * 0.6 || Math.abs(z) > roomBounds.z * 0.6) && 
                  y < fanY) {
            // Calculate wall proximity
            const wallFactorX = Math.max(0, (Math.abs(x) - roomBounds.x * 0.6) / (roomBounds.x * 0.4));
            const wallFactorZ = Math.max(0, (Math.abs(z) - roomBounds.z * 0.6) / (roomBounds.z * 0.4));
            const wallFactor = Math.max(wallFactorX, wallFactorZ) * fanStrength * 0.35; // Reduced from 0.4
            
            // Upward flow along walls - adjusted effect
            velocities[i3+1] += wallFactor;
            
            // Also add slight inward component to create circulation - REDUCED
            if (x !== 0) velocities[i3] -= Math.sign(x) * wallFactor * 0.15; // Reduced from 0.2
            if (z !== 0) velocities[i3+2] -= Math.sign(z) * wallFactor * 0.15;
          }
          
          // 4. Ceiling inward flow - air moves along ceiling back toward fan - ADJUSTED
          else if (y > fanY - 0.5) {
            // Stronger effect near ceiling
            const ceilingFactor = Math.min(1, (y - (fanY - 0.5)) / 1);
            const inflowFactor = fanStrength * ceilingFactor * 0.25; // Reduced from 0.3
            
            if (distToFan > 0.2) {
              // Move toward fan along ceiling
              velocities[i3] -= (dx / distToFan) * inflowFactor;
              velocities[i3+2] -= (dz / distToFan) * inflowFactor;
            }
            
            // Add slight downward velocity when getting close to fan
            if (distToFan < directDowndraftRadius) {
              velocities[i3+1] -= inflowFactor * 0.7; // Reduced from 0.8
            }
          }
          
          // 5. Add transition zone between floor and ceiling - REDUCED for more subtle effects
          else if (distToFan > directDowndraftRadius) {
            // Vertical position factor (middle of room)
            const midRoomFactor = Math.max(0, 1 - Math.abs(y) / 2);
            const transitionFactor = fanStrength * midRoomFactor * 0.1; // Reduced from 0.15
            
            // Create gentle circulation in middle room areas
            if (distToFan > 0.2) {
              // Circular motion in mid-room
              velocities[i3] += dz * transitionFactor;
              velocities[i3+2] -= dx * transitionFactor;
            }
          }
        }
        // Winter mode (upward airflow) - OVERALL ADJUSTED FOR APPROPRIATE SPEEDS
        else {
          // 1. Central updraft - air pushed upward and outward from below fan
          if (distToFan < directDowndraftRadius && y < fanY) {
            const distanceFactor = 1 - (distToFan / directDowndraftRadius);
            
            // Stronger updraft closer to fan - REDUCED
            const updraftStrength = fanStrength * distanceFactor * 0.6; // Reduced from 0.7
            velocities[i3+1] += updraftStrength;
            
            // Also push outward slightly with spiral effect - REDUCED
            if (distToFan > 0.2) {
              velocities[i3] += (dx / distToFan) * updraftStrength * 0.25; // Reduced from 0.3
              velocities[i3+2] += (dz / distToFan) * updraftStrength * 0.25;
              
              // Add slight spiraling effect - REDUCED
              const spiralStrength = updraftStrength * 0.08; // Reduced from 0.1
              velocities[i3] -= dz * spiralStrength;
              velocities[i3+2] += dx * spiralStrength;
            }
          }
          
          // Special handling for bench surfaces - create flow across benches - REDUCED
          else if (nearBench && this.fanOn) {
            // Calculate flow along bench surface
            const benchFactor = fanStrength * 0.25; // Reduced from 0.3
            
            // Enhanced flow across bench surfaces in winter mode
            if (Math.abs(y - benchY) < 0.2) {
              // More inward flow toward fan - REDUCED
              if (distToFan > 0.2) {
                velocities[i3] -= (dx / distToFan) * benchFactor * 0.3; // Reduced from 0.4
                velocities[i3+2] -= (dz / distToFan) * benchFactor * 0.3;
              }
              
              // Add slight upward component near benches in winter mode - REDUCED
              velocities[i3+1] += benchFactor * 0.12; // Reduced from 0.15
              
              // Dampen vertical movement to keep particles moving along bench
              velocities[i3+1] *= 0.9;
            }
            
            // Add circulation around bench edges - REDUCED
            if (benchDistanceX < 0.3 || benchDistanceZ < 0.3) {
              // Edge turbulence effect - REDUCED
              velocities[i3] += (Math.random() - 0.5) * benchFactor * 0.3; // Reduced from 0.4
              velocities[i3+2] += (Math.random() - 0.5) * benchFactor * 0.3;
              velocities[i3+1] += (Math.random() * 0.3) * benchFactor * 0.8; // Reduced overall effect
            }
          }
          
          // Floor handling for winter mode - more focused inward flow - REDUCED
          else if (y - floorY < 0.3 && distToFan < fanInfluenceRadius * 0.8) {
            // Strong inward flow along floor toward fan - REDUCED
            const floorFactor = Math.max(0, 1 - (y - floorY) / 0.3) * fanStrength * 0.4; // Reduced from 0.5
            
            if (distToFan > 0.2) {
              // Move toward fan along floor
              velocities[i3] -= (dx / distToFan) * floorFactor;
              velocities[i3+2] -= (dz / distToFan) * floorFactor;
            }
            
            // Keep particles moving along floor with minimal rise
            velocities[i3+1] *= 0.9;
            
            // Add small upward component only when very close to fan - REDUCED
            if (distToFan < directDowndraftRadius * 0.5) {
              velocities[i3+1] += floorFactor * 0.35; // Reduced from 0.4
            }
          }
          
          // 2. Ceiling outward flow - air spreads along ceiling - REDUCED
          else if (y > fanY - 0.5) {
            const ceilingProximity = Math.min(1, (y - (fanY - 0.5)) / 1);
            // Modified to encourage more movement at medium distances
            const distanceFactor = Math.min(1, distToFan / directDowndraftRadius) * 
                                 (1 - Math.min(1, (distToFan / fanInfluenceRadius) * 0.8));
            const outwardFactor = fanStrength * ceilingProximity * distanceFactor * 0.35; // Reduced from 0.4
            
            if (distToFan > 0.2) {
              // Radial outward flow along ceiling
              velocities[i3] += (dx / distToFan) * outwardFactor;
              velocities[i3+2] += (dz / distToFan) * outwardFactor;
            }
            
            // Add small downward component to ensure circulation - REDUCED
            if (distToFan > directDowndraftRadius) {
              velocities[i3+1] -= outwardFactor * 0.15; // Reduced from 0.2
            }
          }
          
          // 3. Wall downward flow - air falls along walls - REDUCED
          else if ((Math.abs(x) > roomBounds.x * 0.6 || Math.abs(z) > roomBounds.z * 0.6) && 
                  y > -1) {
            const wallFactorX = Math.max(0, (Math.abs(x) - roomBounds.x * 0.6) / (roomBounds.x * 0.4));
            const wallFactorZ = Math.max(0, (Math.abs(z) - roomBounds.z * 0.6) / (roomBounds.z * 0.4));
            const wallFactor = Math.max(wallFactorX, wallFactorZ) * fanStrength * 0.35; // Reduced from 0.4
            
            // Downward flow along walls - adjusted effect
            velocities[i3+1] -= wallFactor;
            
            // Also add slight inward component to create circulation - REDUCED
            if (x !== 0) velocities[i3] -= Math.sign(x) * wallFactor * 0.15; // Reduced from 0.2
            if (z !== 0) velocities[i3+2] -= Math.sign(z) * wallFactor * 0.15;
          }
          
          // 5. Add transition zone for middle of room - REDUCED
          else if (distToFan > directDowndraftRadius) {
            // Vertical position factor (middle of room)
            const midRoomFactor = Math.max(0, 1 - Math.abs(y) / 2);
            const transitionFactor = fanStrength * midRoomFactor * 0.1; // Reduced from 0.15
            
            // Create gentle circulation in middle room areas
            if (distToFan > 0.2) {
              // Circular motion in mid-room (opposite direction from summer mode)
              velocities[i3] -= dz * transitionFactor;
              velocities[i3+2] += dx * transitionFactor;
            }
          }
        }
      }
      
      // Window and door effects - REDUCED for more appropriate speeds
      if (this.windowOpen) {
        // Create a flow toward the windows on the x-axis, stronger closest to the window
        const windowProximity = Math.max(0, 1 - Math.abs(x + roomBounds.x) / 2);
        const windowInfluence = Math.max(0, 1 - Math.abs(z) / 3) * 0.04 * (1 + windowProximity); // Reduced from 0.06
        velocities[i3] -= windowInfluence;
        
        // Add slight vertical component (cold air from window falls)
        if (x < -roomBounds.x * 0.7) {
          velocities[i3+1] -= windowInfluence * 0.4; // Reduced from 0.5
        }
      }
      
      if (this.doorOpen) {
        // Create a flow toward the door on the x-axis, stronger closest to the door
        const doorProximity = Math.max(0, 1 - Math.abs(x - roomBounds.x) / 2);
        const doorInfluence = Math.max(0, 1 - Math.abs(z) / 3) * 0.04 * (1 + doorProximity); // Reduced from 0.06
        velocities[i3] += doorInfluence;
      }
      
      // Update positions - APPLY VELOCITY SCALE to all movements
      positions[i3] += velocities[i3] * deltaTime * 60 * velocityScale;
      positions[i3+1] += velocities[i3+1] * deltaTime * 60 * velocityScale;
      positions[i3+2] += velocities[i3+2] * deltaTime * 60 * velocityScale;
      
      // Improved boundary handling with randomized reentry
      // Enhanced to encourage ground and bench contact
      
      // Handle benches - special collision case
      if (!onBench) {
        for (const bench of benches) {
          const bx = Math.abs(x - bench.x);
          const bz = Math.abs(z - bench.z);
          
          // Check if above or below bench surface
          if (bx <= bench.width/2 && bz <= bench.depth/2) {
            // Colliding with bench from above
            if (y > benchY && positions[i3+1] <= benchY) {
              positions[i3+1] = benchY + 0.01;
              velocities[i3+1] *= -0.1 + (Math.random() * 0.1);
              
              // Add horizontal movement along bench surface - REDUCED
              velocities[i3] += (Math.random() - 0.5) * 0.03 * (1 + fanStrength); // Reduced from 0.04
              velocities[i3+2] += (Math.random() - 0.5) * 0.03 * (1 + fanStrength);
            }
            // Colliding with bench from below
            else if (y < benchY && positions[i3+1] >= benchY) {
              positions[i3+1] = benchY - 0.01;
              velocities[i3+1] *= -0.1 + (Math.random() * 0.1);
              
              // Add horizontal movement under bench - REDUCED
              velocities[i3] += (Math.random() - 0.5) * 0.02 * (1 + fanStrength); // Reduced from 0.03
              velocities[i3+2] += (Math.random() - 0.5) * 0.02 * (1 + fanStrength);
            }
          }
        }
      }

  
      // Wall boundaries - REDUCED rebound velocity
      if (Math.abs(positions[i3]) > roomBounds.x) {
        // Bounce with randomization to prevent wall sticking
        positions[i3] = Math.sign(positions[i3]) * roomBounds.x * 0.98;
        velocities[i3] *= -0.3 + (Math.random() * 0.2); // Reduced from -0.4
        
        // Add slight vertical and depth movement when hitting walls - REDUCED
        velocities[i3+1] += (Math.random() - 0.4) * 0.03 * fanStrength; // Reduced from 0.04
        velocities[i3+2] += (Math.random() - 0.5) * 0.03 * fanStrength;
      }
      
      // Floor boundary - enhanced to encourage sliding along floor - ADJUSTED FOR SLOWER MOVEMENT
      if (positions[i3+1] < floorY) {
        // Floor contact with minimal bounce - particles should appear to slide along floor
        positions[i3+1] = floorY + 0.01;
        
        // Very minimal vertical bounce
        velocities[i3+1] *= -0.1 + (Math.random() * 0.1);
        
        // Add horizontal movement when touching floor - REDUCED for more appropriate speeds
        const floorHorizontalBoost = 0.03 * (1 + fanStrength * 0.5); // Reduced from 0.05
        velocities[i3] += (Math.random() - 0.5) * floorHorizontalBoost;
        velocities[i3+2] += (Math.random() - 0.5) * floorHorizontalBoost;
        
        // Occasionally add a very small upward boost - REDUCED
        if (Math.random() < 0.03) {
          velocities[i3+1] += 0.003 + (fanStrength * 0.003); // Reduced from 0.005
        }
      }
      
      // Ceiling boundary - REDUCED rebound velocity
      if (positions[i3+1] > ceilingY) {
        positions[i3+1] = ceilingY - 0.02;
        velocities[i3+1] *= -0.15 + (Math.random() * 0.15); // Reduced from -0.2 + 0.2
        
        // Add horizontal movement when hitting ceiling - REDUCED
        velocities[i3] += (Math.random() - 0.5) * 0.03 * fanStrength; // Reduced from 0.05
        velocities[i3+2] += (Math.random() - 0.5) * 0.03 * fanStrength;
      }
      
      // Z-walls boundary - REDUCED rebound velocity
      if (Math.abs(positions[i3+2]) > roomBounds.z) {
        positions[i3+2] = Math.sign(positions[i3+2]) * roomBounds.z * 0.98;
        velocities[i3+2] *= -0.3 + (Math.random() * 0.2); // Reduced from -0.4
        
        // Add slight horizontal and vertical movement - REDUCED
        velocities[i3] += (Math.random() - 0.5) * 0.03 * fanStrength; // Reduced from 0.04
        velocities[i3+1] += (Math.random() - 0.4) * 0.03 * fanStrength;
      }
      
      // Occasionally "rescue" stagnant particles - ADJUSTED FOR SMOOTHER RESCUE
      const velocityMagnitude = Math.sqrt(
        velocities[i3]*velocities[i3] + 
        velocities[i3+1]*velocities[i3+1] + 
        velocities[i3+2]*velocities[i3+2]
      );
      
      if (velocityMagnitude < 0.001) {
        // Give stagnant particles a random impulse - REDUCED for more appropriate speeds
        velocities[i3] += (Math.random() - 0.5) * 0.006; // Reduced from 0.01
        
        // For floor particles, bias horizontally but with REDUCED speed
        if (Math.abs(y - floorY) < 0.2) {
          velocities[i3+1] += (Math.random() - 0.3) * 0.002; // Reduced from 0.003
          velocities[i3] += (Math.random() - 0.5) * 0.008;  // Reduced from 0.015
          velocities[i3+2] += (Math.random() - 0.5) * 0.008;
        } 
        // For bench particles, bias horizontally with REDUCED speed
        else if (nearBench && Math.abs(y - benchY) < 0.2) {
          velocities[i3+1] += (Math.random() - 0.3) * 0.002; // Reduced from 0.003
          velocities[i3] += (Math.random() - 0.5) * 0.007;  // Reduced from 0.012
          velocities[i3+2] += (Math.random() - 0.5) * 0.007;
        }
        // For other particles - REDUCED speed
        else {
          velocities[i3+1] += (Math.random() - 0.3) * 0.006; // Reduced from 0.01
          velocities[i3+2] += (Math.random() - 0.5) * 0.006;
        }
      }
    }

      // Near the end of updateParticles function, after all particles are processed:
    this.particles.attributes.color.needsUpdate = true; // Add this line to update colors
  
    this.particles.attributes.position.needsUpdate = true;
  }

  
  createUI() {
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.position = 'fixed';
    this.uiContainer.style.top = '10px';
    this.uiContainer.style.left = '10px';
    this.uiContainer.style.background = 'rgba(0,0,0,0.7)';
    this.uiContainer.style.padding = '15px';
    this.uiContainer.style.borderRadius = '8px';
    this.uiContainer.style.color = 'white';
    this.uiContainer.style.fontFamily = 'Arial, sans-serif';
    this.uiContainer.style.zIndex = '1000';
  
    this.uiContainer.innerHTML = `
      <h3 style="margin:0 0 15px 0; border-bottom:1px solid #555; padding-bottom:5px;">Ceiling Fan Simulation</h3>
      
      <div style="margin-bottom:10px;">
        <label style="display:block; margin-bottom:5px;">Fan Speed: <span id="speedValue">0</span></label>
        <input type="range" id="speed" min="0" max="5" step="0.1" value="0" style="width:100%">
      </div>
      
      <div style="margin-bottom:10px;">
        <label style="display:block; margin-bottom:5px;">Blade Angle: <span id="angleValue">0.1</span></label>
        <input type="range" id="bladeAngle" min="0" max="0.5" step="0.01" value="0.1" style="width:100%">
      </div>
      
      <div style="margin-bottom:10px;">
        <button id="togglePower" style="padding:5px 10px; background:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer; margin-right:10px;">Turn On</button>
        <button id="reverse" style="padding:5px 10px; background:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer;">Reverse</button>
      </div>
      
      <div style="margin-bottom:10px;">
        <label style="display:block; margin-bottom:5px;">Room Environment:</label>
        <div style="display:flex; flex-direction:column; gap:5px;">
          <label style="display:flex; align-items:center;">
            <input type="checkbox" id="windowToggle" style="margin-right:8px;">
            Open Window
          </label>
        </div>
      </div>
      
      <div style="margin-bottom:10px;">
        <label style="display:block; margin-bottom:5px;">Visualization:</label>
        <div style="display:flex; justify-content:space-between;">
          <div style="width:48%;">
            <label>Opacity: <span id="opacityValue">0.4</span></label>
            <input type="range" id="opacity" min="0" max="1" step="0.1" value="0.4" style="width:100%">
          </div>
          <div style="width:48%;">
            <label>Size: <span id="sizeValue">0.04</span></label>
            <input type="range" id="size" min="0.01" max="0.1" step="0.01" value="0.04" style="width:100%">
          </div>
        </div>
      </div>
  
      <div style="margin-top:10px;">
        <label style="display:block; margin-bottom:5px;">Temperature Display:</label>
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="background:linear-gradient(to right, #0000FF, #FFFFFF, #FF8000); width:100%; height:15px; border-radius:3px;"></div>
          <div style="display:flex; justify-content:space-between; width:100%;">
            <span style="font-size:0.8em;">Cold</span>
            <span style="font-size:0.8em;">Hot</span>
          </div>
        </div>
      </div>
      
      <div style="font-size:0.9em; color:#aaa;">
        <p>Click and drag to rotate view</p>
        <p>Scroll to zoom</p>
      </div>
    `;
  
    document.body.appendChild(this.uiContainer);
  
    // Existing event listeners
    document.getElementById('speed').addEventListener('input', (e) => {
      this.fanSpeed = parseFloat(e.target.value);
      document.getElementById('speedValue').textContent = this.fanSpeed.toFixed(1);
    });
  
    document.getElementById('togglePower').addEventListener('click', () => {
      this.fanOn = !this.fanOn;
      const btn = document.getElementById('togglePower');
      btn.textContent = this.fanOn ? 'Turn Off' : 'Turn On';
      btn.style.background = this.fanOn ? '#F44336' : '#4CAF50';
    });
  
    document.getElementById('reverse').addEventListener('click', () => {
      this.fanDirection = !this.fanDirection;
    });
  
    document.getElementById('opacity').addEventListener('input', (e) => {
      this.particleMaterial.opacity = parseFloat(e.target.value);
      document.getElementById('opacityValue').textContent = e.target.value;
    });
  
    document.getElementById('size').addEventListener('input', (e) => {
      this.particleMaterial.size = parseFloat(e.target.value);
      document.getElementById('sizeValue').textContent = e.target.value;
    });
  
    document.getElementById('windowToggle').addEventListener('change', (e) => {
      this.windowOpen = e.target.checked;
      this.windows.forEach(w => {
        w.material.opacity = this.windowOpen ? 0.2 : 0.5;
      });
    });
  
    // New blade angle listener
    document.getElementById('bladeAngle').addEventListener('input', (e) => {
      this.bladeAngle = parseFloat(e.target.value);
      document.getElementById('angleValue').textContent = this.bladeAngle.toFixed(2);
      this.updateBladeAngles();
    });
  }
  

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 0, 15);
    this.controls.target.set(0, 0, 0); // Look at center of room
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
  }

  animate() {
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();

      // Update fan rotation - only rotate the blades
      if (this.blades) {
        const direction = this.fanDirection ? 1 : -1;
        this.blades.rotation.y += this.fanSpeed * deltaTime * direction;
      }

      // Update particles
      this.updateParticles(deltaTime);

      // Update door position
      if (this.door) {
        const targetX = this.doorOpen ? 7.5 - 0.5 : 7.5 - 1.9; // Door position calculation
        this.door.position.x = THREE.MathUtils.lerp(this.door.position.x, targetX, 0.1);
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}

// Start the simulation
new FanSimulation();

//change in pitch give user control and accrodingly change particles
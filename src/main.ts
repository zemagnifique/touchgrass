import * as THREE from "three";
import Stats from "stats-gl";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// import * as dat from "dat.gui";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { GrassMaterial } from "./GrassMaterial";

// Define a more complete interface for Stats
interface StatsWithDOM {
	dom: HTMLElement;
	init(renderer: THREE.WebGLRenderer): void;
	update(): void;
}

// Portal configuration
const PORTAL_CONFIG = {
	enabled: true, // Set to false to completely disable the portal
	position: { x: 0, y: 10, z: 20 }, // Moved much closer to the camera's initial position
	size: 2,
	hitboxSize: 2, // Reduced to match the portal's visual size
	color: 0x00ffff
};

export class FluffyGrass {
	// # Need access to these outside the comp
	private loadingManager: THREE.LoadingManager;
	private textureLoader: THREE.TextureLoader;
	private gltfLoader: GLTFLoader;

	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private scene: THREE.Scene;
	private canvas: HTMLCanvasElement;
	private stats: StatsWithDOM;
	private orbitControls: OrbitControls;
	// private gui: dat.GUI;
	// private sceneGUI: dat.GUI;
	private sceneProps = {
		fogColor: "#eeeeee",
		terrainColor: "#5e875e",
		fogDensity: 0.02,
	};
	private textures: { [key: string]: THREE.Texture } = {};

	Uniforms = {
		uTime: { value: 0 },
		color: { value: new THREE.Color("#0000ff") },
	};
	private clock = new THREE.Clock();

	private terrainMat: THREE.MeshPhongMaterial;
	private grassGeometry = new THREE.BufferGeometry();
	private grassMaterial: GrassMaterial;
	private grassCount = 8000;

	// Add portal-related properties
	private portal: THREE.Mesh | null = null;
	private portalRotationSpeed = 0.02;
	private portalPulseSpeed = 0.05;
	private portalPulseScale = 0.1;
	private portalClickCount = 0;
	private portalAudioFinished = false; // New flag to track audio completion

	constructor(_canvas: HTMLCanvasElement) {
		this.loadingManager = new THREE.LoadingManager();
		this.textureLoader = new THREE.TextureLoader(this.loadingManager);

		// this.gui = new dat.GUI();

		this.gltfLoader = new GLTFLoader(this.loadingManager);

		this.canvas = _canvas;
		// this.canvas.style.pointerEvents = 'all';
		this.stats = new Stats({
			minimal: true,
		}) as unknown as StatsWithDOM;

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.camera.position.set(-17, 12, -10);
		this.scene = new THREE.Scene();

		this.scene.background = new THREE.Color('#87CEEB'); // Light blue sky color
		this.scene.fog = new THREE.FogExp2(
			this.sceneProps.fogColor,
			this.sceneProps.fogDensity
		);

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
			alpha: true,
			precision: "highp", // Use high precision
		});
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.autoUpdate = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.scene.frustumCulled = true;

		this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
		this.orbitControls.enabled = true;
		this.orbitControls.autoRotate = false;
		this.orbitControls.autoRotateSpeed = -0.5;
		this.orbitControls.enableDamping = true;

		this.grassMaterial = new GrassMaterial();
		this.terrainMat = new THREE.MeshPhongMaterial({
			color: this.sceneProps.terrainColor,
		});

		this.init();
	}

	private init() {
		this.setupGUI();
		this.setupStats();
		this.setupTextures();
		// this.createCube();
		this.loadModels();
		this.setupEventListeners();
		this.addLights();
		this.createPortal();
	}

	private createCube() {
		const geometry = new THREE.BoxGeometry(2, 7, 2);
		const material = new THREE.MeshPhongMaterial({ color: 0x333333 });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(6, 5, -3);
		cube.castShadow = true;
		this.scene.add(cube);
	}

	private addLights() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
		directionalLight.castShadow = true;
		directionalLight.position.set(100, 100, 100);
		directionalLight.shadow.camera.far = 200;
		directionalLight.shadow.camera.left = -50;
		directionalLight.shadow.camera.right = 50;
		directionalLight.shadow.camera.top = 50;
		directionalLight.shadow.camera.bottom = -50;
		directionalLight.shadow.mapSize.set(2048, 2048);

		this.scene.add(directionalLight);
	}

	private addGrass(
		surfaceMesh: THREE.Mesh,
		grassGeometry: THREE.BufferGeometry
	) {
		// Create a sampler for a Mesh surface.
		const sampler = new MeshSurfaceSampler(surfaceMesh)
			.setWeightAttribute("color")
			.build();

		// Create a material for grass
		const grassInstancedMesh = new THREE.InstancedMesh(
			grassGeometry,
			this.grassMaterial.material,
			this.grassCount
		);
		grassInstancedMesh.receiveShadow = true;

		const position = new THREE.Vector3();
		const quaternion = new THREE.Quaternion();
		const scale = new THREE.Vector3(1, 1, 1);

		const normal = new THREE.Vector3();
		const yAxis = new THREE.Vector3(0, 1, 0);
		const matrix = new THREE.Matrix4();

		// Sample randomly from the surface, creating an instance of the sample
		// geometry at each sample point.
		for (let i = 0; i < this.grassCount; i++) {
			sampler.sample(position, normal);

			// Align the instance with the surface normal
			quaternion.setFromUnitVectors(yAxis, normal);
			// Create a random rotation around the y-axis
			const randomRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
			const randomQuaternion = new THREE.Quaternion().setFromEuler(
				randomRotation
			);

			// Combine the alignment with the random rotation
			quaternion.multiply(randomQuaternion);

			// Set the new scale in the matrix
			matrix.compose(position, quaternion, scale);

			grassInstancedMesh.setMatrixAt(i, matrix);
		}

		this.scene.add(grassInstancedMesh);
	}

	private loadModels() {
		const baseUrl = import.meta.env.BASE_URL;

		// Load island model
		this.gltfLoader.load(`${baseUrl}island.glb`, (gltf) => {
			let terrainMesh: THREE.Mesh;
			gltf.scene.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.material = this.terrainMat;
					child.receiveShadow = true;
					child.geometry.scale(3, 3, 3);
					terrainMesh = child;
				}
			});
			this.scene.add(gltf.scene);

			// Load grass model after island is loaded
			this.gltfLoader.load(`${baseUrl}grassLODs.glb`, (gltf) => {
				gltf.scene.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						if (child.name.includes("LOD00")) {
							child.geometry.scale(20, 20, 20);
							this.grassGeometry = child.geometry;
						}
					}
				});

				this.addGrass(terrainMesh, this.grassGeometry);
			});
		});
	}

	public render() {
		this.Uniforms.uTime.value += this.clock.getDelta();
		this.grassMaterial.update(this.Uniforms.uTime.value);
		this.renderer.render(this.scene, this.camera);
		// this.postProcessingManager.update();
		this.stats.update();
		requestAnimationFrame(() => this.render());
		this.orbitControls.update();
		const groundLevel = 2;
		// if (controls.target.y < groundLevel) {
			// controls.target.y = groundLevel;
		//   }
		if (this.camera.position.y < groundLevel) {
		this.camera.position.y = groundLevel;
		}
		const voices = window.speechSynthesis.getVoices();
	}

	private setupTextures() {
		const baseUrl = import.meta.env.BASE_URL;
		this.textures.perlinNoise = this.textureLoader.load(`${baseUrl}perlinnoise.webp`);

		this.textures.perlinNoise.wrapS = this.textures.perlinNoise.wrapT =
			THREE.RepeatWrapping;

		this.textures.grassAlpha = this.textureLoader.load(`${baseUrl}grass.jpeg`);

		this.grassMaterial.setupTextures(
			this.textures.grassAlpha,
			this.textures.perlinNoise
		);
	}

	private setupGUI() {
		// this.gui.close();
		// const guiContainer = this.gui.domElement.parentElement as HTMLDivElement;
		// guiContainer.style.zIndex = "9999";
		// guiContainer.style.position = "fixed";
		// guiContainer.style.top = "0";
		// guiContainer.style.left = "0";
		// guiContainer.style.right = "auto";
		// guiContainer.style.display = "block";

		// this.sceneGUI = this.gui.addFolder("Scene Properties");
		// this.sceneGUI.add(this.orbitControls, "autoRotate").name("Auto Rotate");
		// this.sceneGUI
			// .add(this.sceneProps, "fogDensity", 0, 0.05, 0.000001)
			// .onChange((value) => {
				// (this.scene.fog as THREE.FogExp2).density = value;
			// });
		// this.sceneGUI.addColor(this.sceneProps, "fogColor").onChange((value) => {
			// this.scene.fog?.color.set(value);
			// this.scene.background = new THREE.Color(value);
		// });

		// this.grassMaterial.setupGUI(this.sceneGUI);

		// this.sceneGUI.open();
	}

	private setupStats() {
		this.stats.init(this.renderer);
		this.stats.dom.style.bottom = "45px";
		this.stats.dom.style.top = "auto";
		this.stats.dom.style.left = "auto";
		// this.stats.dom.style.right = "0";
		this.stats.dom.style.display = "none";
		document.body.appendChild(this.stats.dom);
	}

	private setupEventListeners() {
		window.addEventListener("resize", () => this.setAspectResolution(), false);

		this.stats.dom.addEventListener("click", () => {
			console.log(this.renderer.info.render);
		});

		// Add click event listener for portal interaction
		this.canvas.addEventListener("click", (event) => this.handleClick(event));

		// const randomizeGrassColor = document.querySelector(
		// 	".randomizeButton"
		// ) as HTMLButtonElement;
		// randomizeGrassColor.addEventListener("click", () => {
		// 	this.randomizeGrassColor();
		// });
	}

	private setAspectResolution() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		// this.postProcessingManager.composer.setSize(
		// 	window.innerWidth,
		// 	window.innerHeight,
		// );
	}

	private randomizeGrassColor() {
		const randomTipColorGenerator = () => {
			const r = Math.random();
			const g = Math.random();
			const b = Math.random();
			return new THREE.Color(r, g, b);
		};
		const randomColorGenerator = () => {
			// generate random color and keep it dark
			const r = Math.random() * 0.5;
			const g = Math.random() * 0.5;
			const b = Math.random() * 0.5;
			return new THREE.Color(r, g, b);
		};
		// find new terrain color, grass base and tip1,tip2 colors randomly
		const terrainColor = randomColorGenerator();
		const grassTip1Color = randomTipColorGenerator();
		const grassTip2Color = randomTipColorGenerator();
		this.terrainMat.color = terrainColor;
		this.grassMaterial.uniforms.baseColor.value = terrainColor;
		this.grassMaterial.uniforms.tipColor1.value = grassTip1Color;
		this.grassMaterial.uniforms.tipColor2.value = grassTip2Color;
	}

	// Add method to check if a point is in the sky
	public isPointInSky(point: THREE.Vector3): boolean {
		// Consider anything above y=15 as sky
		// Add some logging to help debug
		console.log(`Point coordinates: x=${point.x}, y=${point.y}, z=${point.z}`);
		return point.y > 15;
	}

	// Add method to create portal
	private createPortal() {
		// Skip portal creation if disabled
		if (!PORTAL_CONFIG.enabled) {
			console.log('Portal is disabled');
			return;
		}

		// Create portal geometry (a filled circle)
		const portalGeometry = new THREE.CircleGeometry(PORTAL_CONFIG.size, 32);
		
		// Create portal material with a swirling effect
		const portalMaterial = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				color: { value: new THREE.Color(PORTAL_CONFIG.color) }
			},
			vertexShader: `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: `
				uniform float time;
				uniform vec3 color;
				varying vec2 vUv;
				
				void main() {
					vec2 center = vec2(0.5, 0.5);
					float dist = length(vUv - center);
					
					// Create swirling effect
					float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
					float swirl = sin(angle * 10.0 + time * 2.0) * 0.5 + 0.5;
					
					// Create pulsing effect
					float pulse = sin(time * 3.0) * 0.5 + 0.5;
					
					// Create a filled circle with smooth edges
					float circle = smoothstep(0.5, 0.0, dist);
					
					// Combine effects
					float alpha = circle * (swirl * 0.7 + pulse * 0.3);
					
					// Add some sparkles
					float sparkle = step(0.95, sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time));
					
					gl_FragColor = vec4(color, alpha + sparkle * 0.5);
				}
			`,
			transparent: true,
			blending: THREE.AdditiveBlending,
			side: THREE.DoubleSide
		});
		
		// Create portal mesh
		this.portal = new THREE.Mesh(portalGeometry, portalMaterial);
		this.portal.position.set(PORTAL_CONFIG.position.x, PORTAL_CONFIG.position.y, PORTAL_CONFIG.position.z);
		this.portal.rotation.z = Math.PI / 2; // Make it vertical
		this.portal.name = "portalMain"; // Name for easier debugging
		
		// Create a larger hitbox for easier clicking - use a box hitbox for better detection
		const hitboxGeometry = new THREE.BoxGeometry(
			PORTAL_CONFIG.size * 2, // Width - using size instead of hitboxSize
			PORTAL_CONFIG.size * 2, // Height - using size instead of hitboxSize
			PORTAL_CONFIG.size / 2 // Depth - thinner to match the portal
		);
		
		const hitboxMaterial = new THREE.MeshBasicMaterial({
			transparent: true, 
			opacity: 0.0, // Make it invisible
			side: THREE.DoubleSide
		});
		
		const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
		hitbox.name = "portalHitbox"; // Name for easier debugging
		
		// Add the hitbox to the portal
		this.portal.add(hitbox);
		
		// Add to scene
		this.scene.add(this.portal);
		
		// Add click handler
		this.portal.userData.clickable = true;
		hitbox.userData.clickable = true; // Mark the hitbox as clickable too
		
		console.log(`Portal created at position (${PORTAL_CONFIG.position.x}, ${PORTAL_CONFIG.position.y}, ${PORTAL_CONFIG.position.z})`);
		console.log(`Portal hitbox size: ${PORTAL_CONFIG.size}`);
	}

	// Update animate method to include portal animation
	public animate() {
		// ... existing animation code ...
		
		// Animate portal if it exists and is enabled
		if (this.portal && PORTAL_CONFIG.enabled) {
			// Rotate portal
			this.portal.rotation.z += this.portalRotationSpeed;
			
			// Update portal shader time uniform
			const portalMaterial = this.portal.material as THREE.ShaderMaterial;
			portalMaterial.uniforms.time.value += this.portalPulseSpeed;
			
			// Pulse portal size
			const scale = 1 + Math.sin(Date.now() * this.portalPulseSpeed) * this.portalPulseScale;
			this.portal.scale.set(scale, scale, scale);
		}
		
		// ... rest of animation code ...
	}

	// Update handleClick to handle portal clicks (including the hitbox)
	private handleClick(event: MouseEvent) {
		const canvas = this.canvas;
		const rect = canvas.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
		const y = -((event.clientY - rect.top) / canvas.height) * 2 + 1;

		// Debug click coordinates
		console.log(`Click detected at normalized coords: (${x.toFixed(2)}, ${y.toFixed(2)})`);
		console.log(`Camera position: (${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)})`);
		console.log(`Portal click count: ${this.portalClickCount}, Audio finished: ${this.portalAudioFinished}`);
		
		// Make sure the portal exists
		if (!this.portal) {
			console.log("Portal doesn't exist yet, can't detect clicks");
			return;
		}
		
		// Log portal position to help debug
		console.log(`Portal position: (${this.portal.position.x.toFixed(2)}, ${this.portal.position.y.toFixed(2)}, ${this.portal.position.z.toFixed(2)})`);
		
		// Create raycaster with increased far setting
		const raycaster = new THREE.Raycaster();
		raycaster.far = 1000; // Increase the far clipping distance
		raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
		
		// Force test against the portal and its children specifically
		const portalIntersects = raycaster.intersectObject(this.portal, true);
		
		// Also do the regular scene test
		const sceneIntersects = raycaster.intersectObjects(this.scene.children, true);
		
		// Log all intersected objects for debugging
		console.log(`Portal intersects: ${portalIntersects.length}`);
		console.log(`Scene intersects: ${sceneIntersects.length}`);
		
		// Combine the results
		const allIntersects = [...portalIntersects, ...sceneIntersects];
		
		// Check if any intersected object is our portal or its hitbox
		let portalIntersected = false;
		for (const intersect of allIntersects) {
			const obj = intersect.object;
			
			// Check if object is portal or its child
			if (obj === this.portal || 
				(obj.parent && obj.parent === this.portal) || 
				(obj.name && obj.name === "portalHitbox")) {
				portalIntersected = true;
				console.log("✓ Portal or hitbox directly intersected!");
				break;
			}
		}
		
		// Calculate distance for lenient hit detection
		const portalScreenPosition = this.portal.position.clone().project(this.camera);
		const distance = Math.sqrt(
			Math.pow(portalScreenPosition.x - x, 2) + 
			Math.pow(portalScreenPosition.y - y, 2)
		);
		
		// Create a vector pointing from the camera to the portal
		const cameraToPortal = this.portal.position.clone().sub(this.camera.position);
		const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
		
		// Calculate the angle between camera direction and direction to portal
		const angle = cameraDirection.angleTo(cameraToPortal.normalize());
		
		// If direct visual line to portal, try to be more lenient
		let portalInFrontOfCamera = angle < Math.PI/2; // Portal is in front, not behind
		const isCloseEnough = distance < 0.8; // Increased threshold for easier clicking
		
		// If we detected a hit with any method
		if (portalIntersected || isCloseEnough || (portalInFrontOfCamera && distance < 1.0)) {
			console.log('Portal interaction detected!');
			
			// Create a special event for the speech announcer to handle
			const portalEvent = new MouseEvent(event.type, event);
			Object.defineProperty(portalEvent, 'portalClick', {value: true});
			
			if (this.portalClickCount === 0) {
				// First click - play portal audio
				this.portalClickCount++;
				this.portalAudioFinished = false;
				
				// Dispatch portal click event to play audio
				window.dispatchEvent(new CustomEvent('portalClick'));
				
				// Visual feedback for first click
				this.pulsePortal();
			} else {
				// Second or later click - always attempt to redirect
				// This overrides the audio finished check to prevent blocking
				console.log('Second+ portal click detected, redirecting regardless of audio state');
				
				// Force audio to be considered finished if it isn't already
				if (!this.portalAudioFinished) {
					this.onPortalAudioComplete();
				}
				
				// Create a delay before redirect to ensure UI updates
				setTimeout(() => {
					window.location.href = 'http://portal.pieter.com';
				}, 100);
			}
		}
	}

	// Add a method to pulse the portal for visual feedback
	private pulsePortal() {
		if (this.portal) {
			const originalScale = this.portal.scale.clone();
			const pulseScale = originalScale.clone().multiplyScalar(1.5);
			
			// Pulse effect
			this.portal.scale.copy(pulseScale);
			setTimeout(() => {
				this.portal.scale.copy(originalScale);
			}, 300);
		}
	}

	// Add method to handle portal audio completion
	public onPortalAudioComplete() {
		this.portalAudioFinished = true;
		console.log('Portal audio finished, ready for second click');
		
		// Visual indicator that portal is ready for second click
		if (this.portal) {
			// Make the portal flash to indicate it's ready for second click
			const originalScale = this.portal.scale.clone();
			const flashScale = originalScale.clone().multiplyScalar(1.5);
			
			// Flash sequence
			this.portal.scale.copy(flashScale);
			setTimeout(() => {
				this.portal.scale.copy(originalScale);
				setTimeout(() => {
					this.portal.scale.copy(flashScale);
					setTimeout(() => {
						this.portal.scale.copy(originalScale);
					}, 150);
				}, 150);
			}, 150);
		}
	}
}

// Create the FluffyGrass instance
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const fluffyGrass = new FluffyGrass(canvas);

// Make it accessible from the window object
(window as any).fluffyGrass = fluffyGrass;

// Start rendering
fluffyGrass.render();

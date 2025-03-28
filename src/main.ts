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
	position: { x: 0, y: 10, z: 30 }, // Moved much closer to the camera's initial position
	size: 2,
	hitboxSize: 2, // Reduced to match the portal's visual size
	color: 0x00ffff
};

export class FluffyGrass {
	// # Need access to these outside the comp
	private loadingManager: THREE.LoadingManager;
	private textureLoader: THREE.TextureLoader;
	private gltfLoader: GLTFLoader;
	private loadingScreen: HTMLDivElement; // Add loading screen element
	private loadingProgressBar: HTMLDivElement; // Add progress bar element
	private assetsLoaded: boolean = false; // Flag to track 3D assets loading
	private audioLoaded: boolean = false; // Flag to track audio loading
	private loadingTimeout: number | null = null; // Timeout for fallback loading completion
	private isAudioPlaying: boolean = false; // Flag to track if audio is currently playing
	private allTouchesDone: boolean = false; // Flag to track if all touch audio has been played
	private amountPaid: number = 0; // Track the amount the user has paid

	// Original grass properties to restore after effects
	private originalGrassBaseColor: THREE.Color | null = null;
	private originalGrassTip1Color: THREE.Color | null = null;
	private originalGrassTip2Color: THREE.Color | null = null;
	private originalWindStrength: number = 1.0;
	private originalWindSpeed: number = 1.0;
	private effectTimeout: number | null = null;

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
	private lastClickTime = 0; // Track time of last click for double click detection

	// Add audio element to play soundtrack
	private endSoundtrack: HTMLAudioElement | null = null;

	constructor(_canvas: HTMLCanvasElement) {
		// Create loading screen first, before any asset loading begins
		this.createLoadingScreen();

		// Add fallback timeout in case loading gets stuck
		this.loadingTimeout = window.setTimeout(() => {
			console.warn('Loading timeout reached, forcing completion');
			this.assetsLoaded = true;
			this.audioLoaded = true;
			this.hideLoadingScreen();
		}, 30000); // 30 seconds timeout

		// Set up loading manager with loading events
		this.loadingManager = new THREE.LoadingManager(
			// onLoad callback
			() => {
				console.log('3D assets loaded!');
				this.assetsLoaded = true;
				this.checkAllResourcesLoaded();
			},
			// onProgress callback
			(url, itemsLoaded, itemsTotal) => {
				const progress = (itemsLoaded / itemsTotal) * 100;
				console.log(`Loading: ${progress.toFixed(0)}% (${url})`);
				if (this.loadingProgressBar) {
					this.loadingProgressBar.style.width = `${progress}%`;
				}
			},
			// onError callback
			(url) => {
				console.error(`Error loading: ${url}`);
			}
		);

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

	// Create loading screen overlay
	private createLoadingScreen() {
		// Create loading screen container
		this.loadingScreen = document.createElement('div');
		this.loadingScreen.className = 'loading-screen';
		this.loadingScreen.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: #000000;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			z-index: 9999;
		`;

		// Create loading gif container
		const loadingGifContainer = document.createElement('div');
		// loadingGifContainer.style.cssText = `
			// margin-bottom: 20px;
			// overflow: hidden;
			// border-radius: 50%;
			// width: 200px;
			// height: 200px;
			// background-color: #333;
			// display: flex;
			// align-items: center;
			// justify-content: center;
		// `;

		// Create loading gif image
		const loadingGif = document.createElement('img');
		loadingGif.src = 'images/dancinggrass.gif'; // Path to your dancing grass gif
		loadingGif.alt = 'Loading...';
		loadingGif.style.cssText = `
			width: 100%;
			height: 100%;
			object-fit: cover;
		`;

		// Create loading text
		const loadingText = document.createElement('h2');
		loadingText.textContent = 'Loading the grass...';
		loadingText.style.cssText = `
			color: #ffffff;
			font-family: Arial, sans-serif;
			margin-bottom: 20px;
			text-align: center;
		`;

		// Create loading status container
		const loadingStatus = document.createElement('div');
		loadingStatus.style.cssText = `
			color: #aaaaaa;
			font-family: Arial, sans-serif;
			font-size: 14px;
			margin-bottom: 10px;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			width: 80%;
			max-width: 400px;
		`;

		// Create status items for 3D assets and audio
		const asset3DStatus = document.createElement('div');
		asset3DStatus.innerHTML = '3D Assets: <span>⏳</span>';
		asset3DStatus.id = 'status-3d';

		const audioStatus = document.createElement('div');
		audioStatus.innerHTML = 'Audio: <span>⏳</span>';
		audioStatus.id = 'status-audio';

		loadingStatus.appendChild(asset3DStatus);
		loadingStatus.appendChild(audioStatus);

		// Create progress bar container
		const progressContainer = document.createElement('div');
		progressContainer.style.cssText = `
			width: 80%;
			max-width: 400px;
			height: 10px;
			background-color: #333333;
			border-radius: 5px;
			overflow: hidden;
		`;

		// Create progress bar
		this.loadingProgressBar = document.createElement('div');
		this.loadingProgressBar.style.cssText = `
			width: 0%;
			height: 100%;
			background-color: #4CAF50;
			transition: width 0.3s ease;
		`;

		// Assemble the loading screen
		progressContainer.appendChild(this.loadingProgressBar);
		loadingGifContainer.appendChild(loadingGif);
		this.loadingScreen.appendChild(loadingGifContainer);
		this.loadingScreen.appendChild(loadingText);
		this.loadingScreen.appendChild(loadingStatus);
		this.loadingScreen.appendChild(progressContainer);
		document.body.appendChild(this.loadingScreen);
	}

	// Hide loading screen with a fadeout animation
	private hideLoadingScreen() {
		// Clear the timeout if it exists
		if (this.loadingTimeout !== null) {
			clearTimeout(this.loadingTimeout);
			this.loadingTimeout = null;
		}

		// First fade out
		this.loadingScreen.style.transition = 'opacity 1s ease';
		this.loadingScreen.style.opacity = '0';

		// Then remove from DOM
		setTimeout(() => {
			if (this.loadingScreen.parentNode) {
				this.loadingScreen.parentNode.removeChild(this.loadingScreen);
			}
		}, 1000);
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
		
		// Add to scene
		this.scene.add(this.portal);
		
		console.log(`Portal created at position (${PORTAL_CONFIG.position.x}, ${PORTAL_CONFIG.position.y}, ${PORTAL_CONFIG.position.z})`);
	}

	// Update handleClick to detect double clicks in the sky instead of portal clicks
	private handleClick(event: MouseEvent) {
		const canvas = this.canvas;
		const rect = canvas.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
		const y = -((event.clientY - rect.top) / canvas.height) * 2 + 1;

		// Debug click coordinates
		console.log(`Click detected at normalized coords: (${x.toFixed(2)}, ${y.toFixed(2)})`);
		console.log(`Camera position: (${this.camera.position.x.toFixed(2)}, ${this.camera.position.y.toFixed(2)}, ${this.camera.position.z.toFixed(2)})`);
		
		// Create raycaster
		const raycaster = new THREE.Raycaster();
		raycaster.far = 1000; // Increase the far clipping distance
		raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
		
		// First, check if this is a click in the sky (high Y value or no intersections)
		const intersects = raycaster.intersectObjects(this.scene.children, true);
		const isClickInSky = intersects.length === 0 || 
							(intersects.length > 0 && intersects[0].point.y > 15);
		
		// Check for double click in the sky
		const now = Date.now();
		const isDoubleClick = (now - this.lastClickTime) < 500; // 500ms threshold for double click
		this.lastClickTime = now;
		
		if (isClickInSky && isDoubleClick) {
			console.log('Double click in sky detected, triggering portal!');
			
			// Create a special event for the speech announcer to handle
			const portalEvent = new MouseEvent(event.type, event);
			Object.defineProperty(portalEvent, 'portalClick', {value: true});
			
			if (this.portalClickCount === 0) {
				// First double click - play portal audio
				this.portalClickCount++;
				this.portalAudioFinished = false;
				
				// Dispatch portal click event to play audio
				window.dispatchEvent(new CustomEvent('portalClick'));
				
				// Visual feedback
				this.pulsePortal();
			} else {
				// Second or later double click - attempt to redirect
				console.log('Second portal activation detected, redirecting');
				
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

		// Check if all touches are done and if end reward hasn't been shown yet
		if (this.allTouchesDone) {
			// Play end.mp3
			const endAudio = new Audio('sounds/end/end.mp3');
			endAudio.play().catch(error => {
				console.error('Error playing end audio:', error);
			});
			
			// Show reward popup
			this.showEndReward();
			
			// Reset flag so it only shows once
			this.allTouchesDone = false;
			
			return; // Skip other click processing
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

	// Method to check if all resources are loaded
	private checkAllResourcesLoaded() {
		console.log(`Resources loaded - 3D assets: ${this.assetsLoaded}, Audio: ${this.audioLoaded}`);
		
		// Update the status indicators
		const asset3DStatus = document.getElementById('status-3d');
		const audioStatus = document.getElementById('status-audio');
		
		if (asset3DStatus) {
			asset3DStatus.innerHTML = `3D Assets: <span style="color: ${this.assetsLoaded ? '#4CAF50' : '#FFA500'}">
				${this.assetsLoaded ? '✓' : '⏳'}</span>`;
		}
		
		if (audioStatus) {
			audioStatus.innerHTML = `Audio: <span style="color: ${this.audioLoaded ? '#4CAF50' : '#FFA500'}">
				${this.audioLoaded ? '✓' : '⏳'}</span>`;
		}
		
		// Update the loading text
		const loadingText = this.loadingScreen.querySelector('h2');
		if (loadingText) {
			if (this.assetsLoaded && !this.audioLoaded) {
				loadingText.textContent = 'Loading sounds...';
			} else if (!this.assetsLoaded && this.audioLoaded) {
				loadingText.textContent = 'Loading 3D assets...';
			} else if (this.assetsLoaded && this.audioLoaded) {
				loadingText.textContent = 'Starting the experience...';
			}
		}
		
		// Hide loading screen if everything is loaded
		if (this.assetsLoaded && this.audioLoaded) {
			// Add a small delay to show the "Starting the experience..." message
			setTimeout(() => {
				this.hideLoadingScreen();
			}, 800);
		}
	}

	// Public method for speechAnnouncer.js to call when audio is loaded
	public onAudioLoaded() {
		console.log('Audio loading complete!');
		this.audioLoaded = true;
		this.checkAllResourcesLoaded();
	}

	// Method to set pink grass after first paywall payment
	public setPinkGrass() {
		// Store original colors if not already stored
		if (!this.originalGrassBaseColor) {
			this.originalGrassBaseColor = this.grassMaterial.uniforms.baseColor.value.clone();
			this.originalGrassTip1Color = this.grassMaterial.uniforms.tipColor1.value.clone();
			this.originalGrassTip2Color = this.grassMaterial.uniforms.tipColor2.value.clone();
		}
		
		// Set pink colors
		this.grassMaterial.uniforms.baseColor.value = new THREE.Color(0.8, 0.4, 0.6); // Pink base
		this.grassMaterial.uniforms.tipColor1.value = new THREE.Color(0xeb44e5); // Light pink tips
		this.grassMaterial.uniforms.tipColor2.value = new THREE.Color(0xe60fd8); // Medium pink tips
		
		console.log('Grass turned pink! Reverting in 5 seconds...');
		
		// Clear any existing timeout
		if (this.effectTimeout) {
			clearTimeout(this.effectTimeout);
		}
		
		// Set timeout to revert after 5 seconds
		this.effectTimeout = window.setTimeout(() => {
			this.restoreGrassColor();
		}, 5000);
	}
	
	// Method to set gold grass after last paywall payment
	public setGoldGrass() {
		// Store original colors if not already stored
		if (!this.originalGrassBaseColor) {
			this.originalGrassBaseColor = this.grassMaterial.uniforms.baseColor.value.clone();
			this.originalGrassTip1Color = this.grassMaterial.uniforms.tipColor1.value.clone();
			this.originalGrassTip2Color = this.grassMaterial.uniforms.tipColor2.value.clone();
		}
		
		// Set gold colors
		this.grassMaterial.uniforms.baseColor.value = new THREE.Color(0xc96a21);
		this.grassMaterial.uniforms.tipColor1.value = new THREE.Color(0xc7bc10);
		this.grassMaterial.uniforms.tipColor2.value = new THREE.Color(0xfa9802);
		// this.grassMaterial.uniforms.baseColor.value = new THREE.Color(0.85, 0.7, 0.2); // Gold base
		// this.grassMaterial.uniforms.tipColor1.value = new THREE.Color(1.0, 0.9, 0.3); // Bright gold tips
		// this.grassMaterial.uniforms.tipColor2.value = new THREE.Color(0.9, 0.8, 0.2); // Deep gold tips
		
		console.log('Grass turned to gold! Reverting in 10 seconds...');
		
		// Clear any existing timeout
		if (this.effectTimeout) {
			clearTimeout(this.effectTimeout);
		}
		
		// Set timeout to revert after 10 seconds
		this.effectTimeout = window.setTimeout(() => {
			this.restoreGrassColor();
		}, 10000);
	}
	
	// Method to increase wind effect for second/third paywall payments
	public increaseWindEffect() {
		// Store original wind values if not already stored
		if (this.grassMaterial.uniforms.windStrength) {
			this.originalWindStrength = this.grassMaterial.uniforms.windStrength.value;
			this.originalWindSpeed = this.grassMaterial.uniforms.windSpeed.value;
		}
		
		// Increase wind strength and speed
		if (this.grassMaterial.uniforms.windStrength) {
			this.grassMaterial.uniforms.windStrength.value = this.originalWindStrength * 3.0; // Triple wind strength
			this.grassMaterial.uniforms.windSpeed.value = this.originalWindSpeed * 2.0; // Double wind speed
		}
		
		console.log('Wind effect increased! Reverting in 10 seconds...');
		
		// Clear any existing timeout
		if (this.effectTimeout) {
			clearTimeout(this.effectTimeout);
		}
		
		// Set timeout to revert after 10 seconds
		this.effectTimeout = window.setTimeout(() => {
			this.restoreWindEffect();
		}, 10000);
	}
	
	// Method to restore original grass color
	private restoreGrassColor() {
		if (this.originalGrassBaseColor && this.originalGrassTip1Color && this.originalGrassTip2Color) {
			this.grassMaterial.uniforms.baseColor.value = this.originalGrassBaseColor;
			this.grassMaterial.uniforms.tipColor1.value = this.originalGrassTip1Color;
			this.grassMaterial.uniforms.tipColor2.value = this.originalGrassTip2Color;
			console.log('Grass color restored to original');
		}
	}
	
	// Method to restore original wind effect
	private restoreWindEffect() {
		if (this.grassMaterial.uniforms.windStrength) {
			this.grassMaterial.uniforms.windStrength.value = this.originalWindStrength;
			this.grassMaterial.uniforms.windSpeed.value = this.originalWindSpeed;
			console.log('Wind effect restored to original');
		}
	}

	// Method to handle paywall effects based on payment amount
	public applyPaywallEffect(amount: number) {
		console.log(`Applying paywall effect for $${amount} payment`);
		
		switch(amount) {
			case 2:
				// First paywall: pink grass for 5 seconds
				this.setPinkGrass();
				break;
			case 5:
			case 10:
				// Second and third paywalls: increased wind for 10 seconds
				this.increaseWindEffect();
				break;
			case 1000:
				// Last paywall: gold grass for 10 seconds
				this.setGoldGrass();
				break;
			default:
				console.log(`No special effect for $${amount} payment`);
		}
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

	// Add method to track payment amount
	public recordPayment(amount: number) {
		this.amountPaid = amount;
		console.log(`Payment recorded: $${amount}`);
	}

	// Add method to mark all touches as completed
	public setAllTouchesComplete() {
		this.allTouchesDone = true;
		console.log('All touch audio completed');
	}

	// Add method to show end reward popup
	public showEndReward() {
		// Create popup container
		const popup = document.createElement('div');
		popup.className = 'end-reward-popup';
		popup.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			background-color: rgba(0, 0, 0, 0.8);
			z-index: 9999;
		`;

		// Determine which grass image to show based on payment amount
		let imageSrc = '';
		if (this.amountPaid === 2) {
			imageSrc = 'images/pinkgrass.png';
		} else if (this.amountPaid === 1000) {
			imageSrc = 'images/goldgrass.png';
		} else {
			imageSrc = 'images/greengrass.png';
		}

		// Create image element
		const image = document.createElement('img');
		image.src = imageSrc;
		image.style.cssText = `
			max-width: 80%;
			max-height: 60%;
			border-radius: 10px;
			box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
		`;

		// Create title
		const title = document.createElement('h2');
		title.textContent = 'Congratulations!';
		title.style.cssText = `
			color: white;
			font-size: 2rem;
			margin: 1rem 0;
		`;

		// Create description
		const description = document.createElement('p');
		description.textContent = 'You have completed the Grass Touching experience!';
		description.style.cssText = `
			color: white;
			font-size: 1.2rem;
			margin: 0.5rem 0;
			text-align: center;
			max-width: 80%;
		`;

		// Create close button
		const closeButton = document.createElement('button');
		closeButton.textContent = 'Close';
		closeButton.style.cssText = `
			background-color: #4CAF50;
			color: white;
			border: none;
			padding: 0.8rem 1.5rem;
			margin-top: 2rem;
			border-radius: 5px;
			font-size: 1.2rem;
			cursor: pointer;
		`;

		// Add event listener to close button
		closeButton.addEventListener('click', () => {
			// Stop soundtrack if playing
			if (this.endSoundtrack) {
				this.endSoundtrack.pause();
				this.endSoundtrack = null;
			}
			document.body.removeChild(popup);
		});

		// Add elements to popup
		popup.appendChild(title);
		popup.appendChild(image);
		popup.appendChild(description);
		popup.appendChild(closeButton);

		// Play soundtrack
		this.playEndSoundtrack();

		// Add popup to document
		document.body.appendChild(popup);
	}

	// Add method to play soundtrack
	private playEndSoundtrack() {
		this.endSoundtrack = new Audio('sounds/soundtrack/soundtrack.mp3');
		this.endSoundtrack.loop = true;
		this.endSoundtrack.volume = 0.7;
		this.endSoundtrack.play().catch(error => {
			console.error('Error playing soundtrack:', error);
		});
	}
}

// Create the FluffyGrass instance
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const fluffyGrass = new FluffyGrass(canvas);

// Make it accessible from the window object
(window as any).fluffyGrass = fluffyGrass;

// Start rendering
fluffyGrass.render();

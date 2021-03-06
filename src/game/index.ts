import Stats from 'stats.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { Voxels } from './voxels';

export class Game {
	stats: Stats;
	startTime: number;
	isRunning: boolean;

	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;

	controls: TrackballControls;
	composer: EffectComposer;

	constructor(public readonly canvas: HTMLCanvasElement) {
		this.startTime = 0;
		this.isRunning = false;

		this.init();

		// force binds
		this.render = this.render.bind(this);
	}

	init(): void {
		this.stats = new Stats();
		document.body.appendChild(this.stats.dom);

		this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);

		const aspect = this.canvas.width / this.canvas.height;

		this.camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
		this.camera.position.z = -10 * 20;
		this.camera.position.y = 5 * 20;
		this.camera.position.x = -10 * 20;
		this.camera.lookAt(0, 0, 0);

		this.scene.add(new THREE.AmbientLight(0xeeeeee));

		const dirLight = new THREE.DirectionalLight(0xffffff, 0.40);
		dirLight.position.set(-0.6, 0.75, 1);
		dirLight.position.multiplyScalar(50);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.set(2048, 2048);
		const d = 256;
		dirLight.shadow.camera.left = -d;
		dirLight.shadow.camera.right = d;
		dirLight.shadow.camera.top = d;
		dirLight.shadow.camera.bottom = -d;
		this.scene.add(dirLight);

		this.controls = new TrackballControls(this.camera, this.renderer.domElement);
		this.composer = new EffectComposer(this.renderer);

		// base render pass
		this.composer.addPass(new RenderPass(this.scene, this.camera));

		// smaa pass (good performance antialiasing)
		this.composer.addPass(new SMAAPass(
			this.canvas.width * this.renderer.getPixelRatio(),
			this.canvas.height * this.renderer.getPixelRatio(),
		));
	}

	resize(): void {
		const width = this.canvas.clientWidth;
		const height = this.canvas.clientHeight;

		if(this.canvas.width !== width || this.canvas.height !== height) {
			this.renderer.setSize(width, height, false);
			this.composer.setSize(width, height);

			const aspect = width / height;
			this.camera.aspect = aspect;
			this.camera.updateProjectionMatrix();
		}
	}

	render(deltaTime: number): void {
		if(!this.isRunning) {
			return;
		}

		this.stats.begin();

		this.resize();
		this.controls.update();
		this.composer.render(deltaTime);

		this.stats.end();
	}

	start(): Promise<void> {
		if(this.isRunning) {
			return Promise.reject('Game is already running!');
		}

		return new Promise((resolve, reject) => {
			this.isRunning = true;
			this.startTime = performance.now();

			const loop = () => {
				try {
					this.render(performance.now() - this.startTime);
				} catch(err) {
					// stop loop if error
					this.isRunning = false;
					reject(err);
				}

				if(this.isRunning) {
					requestAnimationFrame(loop);
				} else {
					resolve();
				}
			};

			requestAnimationFrame(loop);
		});
	}

	stop(): void {
		// stop loop after next frame
		this.isRunning = false;
	}
}

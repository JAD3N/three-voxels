import * as THREE from 'three';
import { TrackballControls } from 'three-trackballcontrols-ts';

export class Game {
	startTime: number;
	isRunning: boolean;

	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;

	controls: TrackballControls;

	constructor(public readonly canvas: HTMLCanvasElement) {
		this.startTime = 0;
		this.isRunning = false;

		// init
		this.init();

		// force binds
		this.render = this.render.bind(this);
	}

	init(): void {
		this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xffffff);

		const aspect = this.canvas.width / this.canvas.height;

		this.camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
		this.camera.position.z = 10 * 20;
		this.camera.position.y = 5 * 20;
		this.camera.position.x = 7 * 20;
		this.camera.lookAt(0, 0, 0);

		this.scene.add(new THREE.AmbientLight(0x666666));

		const dirLight = new THREE.DirectionalLight(0xffffff);
		dirLight.position.set( -1, 0.75, 1 );
		dirLight.position.multiplyScalar( 50);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.set(1024 * 8, 1024 * 8);

            var d = 200;

            dirLight.shadow.camera.left = -d;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = -d;
		this.scene.add(dirLight);

		this.controls = new TrackballControls(this.camera as any, this.renderer.domElement);
	}

	resize(): void {
		const width = this.canvas.clientWidth;
		const height = this.canvas.clientHeight;

		if(this.canvas.width !== width || this.canvas.height !== height) {
			this.renderer.setSize(width, height, false);

			const aspect = width / height;
			this.camera.aspect = aspect;
			this.camera.updateProjectionMatrix();
		}
	}

	render(deltaTime: number): void {
		if(!this.isRunning) {
			return;
		}

		this.resize();
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
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

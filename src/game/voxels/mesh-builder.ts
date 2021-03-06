import * as THREE from 'three';

import type { Dimensions, Position, Voxels } from '.';
import type { ChunkRequest, ChunkResponse } from './worker';

export interface MeshData {
	indices: number[];
	vertices: number[];
	colors: number[];
	normals: number[];
	aos: number[];
}

export interface MeshBuilderJob {
	voxels: Voxels;
	request: ChunkRequest;
	callback: (chunk: ChunkResponse) => void;
}

export const SUPPORTS_SHARED_BUFFER = 'SharedArrayBuffer' in window && 'Worker' in window;
export const DEFAULT_MATERIAL = createDefaultMaterial();

function createDefaultMaterial(): THREE.Material {
	const shader = THREE.ShaderLib.phong;

	// add custom attribute
	let vertexShader = [
		'attribute float ao;',
		//add new line at end
		'',
	].join('\n') + shader.vertexShader;

	// apply custom attribute
	vertexShader = vertexShader.replace('#include <color_vertex>', [
		'#include <color_vertex>',
		'#ifdef USE_AMBIENT_OCCLUSION',
			'vColor.xyz *= vec3(ao, ao, ao);',
		'#endif',
	].join('\n'))

	const material = new THREE.ShaderMaterial({
		uniforms: shader.uniforms,
		fragmentShader: shader.fragmentShader,
		vertexShader,
		defines: { 'USE_AMBIENT_OCCLUSION': '' },
		vertexColors: true,
		lights: true,
	});

	return material;
}

function createWorkers(): Worker[] {
	if('Worker' in window) {
		const numOfWorkers = navigator.hardwareConcurrency || 4;
		const workers = [];

		for(let i = 0; i < numOfWorkers; i++) {
			workers.push(new Worker('build/voxels-worker.js'));
		}

		return workers;
	} else {
		return [];
	}
}

export class MeshBuilder {
	workers: Worker[];
	statuses: boolean[];

	queue: number[];
	jobs: Map<number, MeshBuilderJob>;
	job: number;

	constructor() {
		this.queue = [];
		this.jobs = new Map();
		this.job = 1;

		// create workers (if possible)
		this.workers = createWorkers();
		this.statuses = [];

		for(let i = 0; i < this.workers.length; i++) {
			const worker = this.workers[i];

			// set default status
			this.statuses[i] = true;

			// add handler
			worker.addEventListener('message', (event: MessageEvent<ChunkResponse>) => {
				this.statuses[i] = true;

				const res = event.data;
				const job = this.jobs.get(res.job);

				if(job) {
					this.jobs.delete(res.job);
					job.callback(res);
				}

				// queue processing again
				this.process();
			});
		}
	}

	process(): void {
		// check if any in queue
		if(!this.queue.length) {
			return;
		}

		if(this.workers.length) {
			const jobs = this.queue.length;

			for(let i = 0; i < Math.min(jobs, this.workers.length); i++) {
				// check if worker is busy
				if(this.statuses[i]) {
					const jobId = this.queue.shift();
					const job = this.jobs.get(jobId);

					// mark worker as busy
					this.statuses[i] = false;
					// send request
					this.workers[i].postMessage(job.request);
				}
			}
		} else {

		}
	}

	buildMesh(res: ChunkResponse): THREE.Mesh | null {
		if(!res.meshData.vertices.length) {
			return null;
		}

		const [x, y, z] = res.position;
		const { indices, vertices, colors, normals, aos } = res.meshData;
		const geometry = new THREE.BufferGeometry();

		geometry.setIndex(indices);
		geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
		geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
		geometry.setAttribute('ao', new THREE.BufferAttribute(new Float32Array(aos), 1));

		geometry.computeBoundingBox();

		// generate mesh
		const mesh = new THREE.Mesh(geometry, DEFAULT_MATERIAL);
		mesh.position.set(x, y, z);
		mesh.receiveShadow = true;
		mesh.castShadow = true;
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix();

		return mesh;
	}

	buildChunk(voxels: Voxels, position: Position, dimensions: Dimensions, process = true): Promise<THREE.Mesh | null> {
		return new Promise(resolve => {
			const jobId = this.job++;
			const job: MeshBuilderJob = {
				voxels,
				request: {
					job: jobId,
					chunk: {
						position,
						dimensions,
					},
					voxels: {
						palette: voxels.palette,
						dimensions: voxels.dimensions,
						buffer: voxels.buffer,
					},
				},
				callback: res => {
					this.jobs.delete(jobId);
					resolve(this.buildMesh(res));
				},
			};

			this.jobs.set(jobId, job);
			this.queue.push(jobId);

			if(process) {
				this.process();
			}
		});
	}

	build(voxels: Voxels, chunkSize?: Dimensions | number, camera?: THREE.Vector3): THREE.Group {
		const group = new THREE.Group();

		if(chunkSize) {
			const [
				chunkWidth,
				chunkHeight,
				chunkDepth,
			] = (typeof chunkSize === 'number'
				? [chunkSize, chunkSize, chunkSize]
				: chunkSize
			);

			const numOfChunks = [
				Math.ceil(voxels.dimensions[0] / chunkWidth),
				Math.ceil(voxels.dimensions[1] / chunkHeight),
				Math.ceil(voxels.dimensions[2] / chunkDepth),
			];

			let queue = [];

			for(let z = 0; z < numOfChunks[2]; z++) {
				for(let y = 0; y < numOfChunks[1]; y++) {
					for(let x = 0; x < numOfChunks[0]; x++) {
						const position: Position = [
							x * chunkWidth,
							y * chunkHeight,
							z * chunkDepth,
						];

						const dimensions: Dimensions = [
							chunkWidth,
							chunkHeight,
							chunkDepth,
						];

						queue.push({ position, dimensions });
					}
				}
			}

			if(camera) {
				queue = queue.sort((job1, job2) => {
					const pos1 = new THREE.Vector3(
						job1.position[0] + job1.dimensions[0] / 2,
						job1.position[1] + job1.dimensions[1] / 2,
						job1.position[2] + job1.dimensions[2] / 2,
					);

					const pos2 = new THREE.Vector3(
						job2.position[0] + job2.dimensions[0] / 2,
						job2.position[1] + job2.dimensions[1] / 2,
						job2.position[2] + job2.dimensions[2] / 2,
					);

					return pos1.distanceToSquared(camera) - pos2.distanceToSquared(camera);
				});
			}

			for(const job of queue) {
				// build chunk and add to mesh
				this.buildChunk(voxels, job.position, job.dimensions, false)
					.then(mesh => {
						if(mesh !== null) {
							group.add(mesh);
						}
					});
			}

			this.process();
		} else {
			this.buildChunk(voxels, [0, 0, 0], voxels.dimensions)
				.then(mesh => {
					if(mesh !== null) {
						group.add(mesh);
					}
				});
		}

		// return group
		return group;
	}
}

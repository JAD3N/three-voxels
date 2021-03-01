import * as THREE from 'three';
// import assert from 'assert';

export type Color = [number, number, number, number];
export type Dimensions = [number, number, number];

let mask = new Int16Array(4096);

export class Voxels extends THREE.Group {
	mesh: THREE.Mesh;
	geometry: THREE.BufferGeometry;
	materials: THREE.Material;

	constructor(
		public dimensions: Dimensions,
		public voxels: Uint8Array,
		public palette: Color[],
	) {
		super();
		this.update();
	}

	getVoxel(x: number, y: number, z: number): number {
		// assert(pos[dirX] >= 0 && pos[dirX] < this.dimensions[0], 'pos[dirX] is out of bounds');
		// assert(pos[dirY] >= 0 && pos[dirY] < this.dimensions[1], 'pos[dirY] is out of bounds');
		// assert(pos[dir] >= 0 && pos[dir] < this.dimensions[2], 'pos[dir] is out of bounds');

		return this.voxels[x + this.dimensions[0] * (y + this.dimensions[1] * z)];
	}

	update(): void {
		// clean up existing
		if(this.geometry) {
			this.geometry.dispose();
			this.clear();
		}

		this.geometry = new THREE.BufferGeometry();

		const vertices = [];
		const colors = [];
		const indices = [];

		for(let dir = 0; dir < 3; dir++) {
			const dirX = (dir + 1) % 3;
			const dirY = (dir + 2) % 3;

			const dirWidth = this.dimensions[dirX];
			const dirHeight = this.dimensions[dirY];
			// const mask = new Int16Array(dirWidth * dirHeight);

			if(mask.length < dirWidth * dirHeight) {
				mask = new Int16Array(dirWidth * dirHeight);
			}

			const pos = [0, 0, 0];
			const offset = [0, 0, 0];
			offset[dir] = 1;

			for(pos[dir] = -1; pos[dir] < this.dimensions[dir];) {
				let maskIndex = 0;

				for(pos[dirY] = 0; pos[dirY] < this.dimensions[dirY]; pos[dirY]++) {
					for(pos[dirX] = 0; pos[dirX] < this.dimensions[dirX]; pos[dirX]++, maskIndex++) {
						let aFace = 0;
						let bFace = 0;

						// check if top face is necessary
						if(pos[dir] >= 0) {
							aFace = this.getVoxel(pos[0], pos[1], pos[2]);
						}

						if(pos[dir] < this.dimensions[dir] - 1) {
							bFace = this.getVoxel(pos[0] + offset[0], pos[1] + offset[1], pos[2] + offset[2]);
						}

						if(!!aFace === !!bFace) {
							mask[maskIndex] = 0;
						} else if(!!aFace) {
							mask[maskIndex] = aFace;
						} else {
							mask[maskIndex] = -bFace;
						}
					}
				}

				pos[dir]++;
				maskIndex = 0;

				for(pos[dirY] = 0; pos[dirY] < this.dimensions[dirY]; pos[dirY]++) {
					for(pos[dirX] = 0; pos[dirX] < this.dimensions[dirX];) {
						let colorIndex = mask[maskIndex];

						if(!!colorIndex) {
							let width = 1;

							// keep going until end of boundary or value changes
							while(colorIndex === mask[maskIndex + width] && pos[dirX] + width < this.dimensions[dirX]) {
								width++;
							}

							let height = 1;
							let done = false;

							while(pos[dirY] + height < this.dimensions[dirY]) {
								// walk row below and check if value is same
								for(let i = 0; i < width; i++) {
									if(colorIndex !== mask[maskIndex + i + height * this.dimensions[dirX]]) {
										done = true;
										break;
									}
								}

								// check if completed successfully
								if(done) {
									// stop if failed to walk
									break;
								}

								height++;
							}

							const vertexCount = vertices.length / 3;

							const v2 = [0, 0, 0];
							const v3 = [0, 0, 0];

							if(colorIndex > 0) {
								v2[dirX] = width;
								v3[dirY] = height;
							} else {
								colorIndex = -colorIndex;

								v3[dirX] = width;
								v2[dirY] = height;
							}

							vertices.push(
								pos[0], pos[1], pos[2],
								pos[0] + v2[0], pos[1] + v2[1], pos[2] + v2[2],
								pos[0] + v2[0] + v3[0], pos[1] + v2[1] + v3[1], pos[2] + v2[2] + v3[2],
								pos[0] + v3[0], pos[1] + v3[1], pos[2] + v3[2],
							);

							const color = this.palette[colorIndex];

							// vertex colors are faster than textures
							colors.push(
								color[0] / 255, color[1] / 255, color[2] / 255,
								color[0] / 255, color[1] / 255, color[2] / 255,
								color[0] / 255, color[1] / 255, color[2] / 255,
								color[0] / 255, color[1] / 255, color[2] / 255,
							);

							indices.push(
								vertexCount, vertexCount + 1, vertexCount + 2,
								vertexCount, vertexCount + 2, vertexCount + 3,
							);

							// reset mask (skips area on next row)
							for(let j = 0; j < height; j++) {
								for(let i = 0; i < width; i++) {
									mask[maskIndex + i + j * this.dimensions[dirX]] = 0;
								}
							}

							// offset walked width
							pos[dirX] += width;
							maskIndex += width;
						} else {
							pos[dirX]++;
							maskIndex++;
						}
					}
				}
			}
		}

		this.geometry.setIndex(indices);
		this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
		this.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingBox();

		// TODO: materials (using roughness & reflectivity)
		this.materials = new THREE.MeshPhongMaterial({
			vertexColors: true,
			reflectivity: 0.5,
		});

		// generate mesh
		this.mesh = new THREE.Mesh(this.geometry, this.materials);
		this.mesh.receiveShadow = true;
		this.mesh.castShadow = true;

		this.castShadow = true;
		this.receiveShadow = true;

		this.add(this.mesh);
	}
}

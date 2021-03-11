import { SUPPORTS_SHARED_BUFFER } from './mesh-builder';

export type Color = [number, number, number, number];
export type Dimensions = [number, number, number];
export type Position = [number, number, number];
// export type Palette = Color[];

export interface Material {
	transparency?: number;
}

export interface Palette {
	colors: Color[];
	materials: Material[];
}

export class Voxels {
	buffer: ArrayBuffer | SharedArrayBuffer;
	voxels: Uint8Array;

	mesh: THREE.Mesh;
	geometry: THREE.BufferGeometry;
	materials: THREE.Material;

	constructor(
		public dimensions: Dimensions,
		public palette: Palette,
		voxels: Uint8Array,
	) {
		if(SUPPORTS_SHARED_BUFFER && voxels.buffer instanceof ArrayBuffer) {
			// use length of array (in case voxels is offsetted)
			const buffer = new SharedArrayBuffer(voxels.length * voxels.BYTES_PER_ELEMENT);
			const arr = new Uint8Array(buffer);

			// copy from voxels to shared array buffer
			for(let i = 0; i < voxels.length; i++) {
				arr[i] = voxels[i];
			}

			this.buffer = buffer;
			this.voxels = arr;
		} else {
			this.buffer = voxels.buffer;
			this.voxels = voxels;
		}
	}

	getVoxel(x: number, y: number, z: number): number | null {
		if(!(x >= 0 && x < this.dimensions[0])
		|| !(y >= 0 && y < this.dimensions[1])
		|| !(z >= 0 && z < this.dimensions[2])
		) {
			return null;
		}

		return this.voxels[x + this.dimensions[0] * (y + this.dimensions[1] * z)];
	}
}

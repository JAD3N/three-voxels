import type { Color, Dimensions, Palette, Position } from '.';
import type { MeshData } from './mesh-builder';
import { mesher } from './mesher';

let faceMask = new Int16Array(32 * 32);
let aoMask = new Uint8Array(32 * 32);

function getFaceMask(len: number): Int16Array {
	if(faceMask.length < len) {
		faceMask = new Int16Array(len);
	}

	return faceMask;
}

function getAOMask(len: number): Uint8Array {
	if(aoMask.length < len) {
		aoMask = new Uint8Array(len);
	}

	return aoMask;
}

export interface ChunkRequest {
	job: number;
	chunk: {
		position: Position,
		dimensions: Dimensions,
	};
	voxels: {
		palette: Palette,
		dimensions: Dimensions,
		buffer: ArrayBuffer | SharedArrayBuffer,
	};
}

export interface ChunkResponse {
	job: number;
	position: Position;
	meshData: MeshData;
}

self.addEventListener('message', (event: MessageEvent<ChunkRequest>) => {
	const {
		job,
		chunk,
		voxels,
	} = event.data;
	// use buffer to make typed array
	const voxelsArr = new Uint8Array(voxels.buffer);

	// used to get voxel from absolute position
	function getVoxel(x: number, y: number, z: number): number | null {
		if(!(x >= 0 && x < voxels.dimensions[0])
		|| !(y >= 0 && y < voxels.dimensions[1])
		|| !(z >= 0 && z < voxels.dimensions[2])
		) {
			return null;
		}

		return voxelsArr[x + voxels.dimensions[0] * (y + voxels.dimensions[1] * z)];
	}

	function getColor(colorIndex: number): Color {
		return voxels.palette[colorIndex];
	}

	// can take some time
	const meshData = mesher({
		position: chunk.position,
		dimensions: chunk.dimensions,
		getFaceMask,
		getAOMask,
		getVoxel,
		getColor,
	});

	self.postMessage({
		job,
		position: chunk.position,
		meshData,
	});
});

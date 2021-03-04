import type { Color, Dimensions, Palette, Position } from '.';
import type { MeshData } from './mesh-builder';

export interface MesherProps {
	position: Position;
	dimensions: Dimensions;
	getFaceMask: (len: number) => Int16Array;
	getAOMask: (len: number) => Uint8Array;
	getVoxel: (x: number, y: number, z: number) => number | null;
	getColor: (colorIndex: number) => Color;
}

export function aoColor(ao: number): number[] {
	const color = 1 - (ao / 3);
	return [color, color, color];
}

export function calcAO(props: MesherProps, adjacent: number | null, side1: number | null, side2: number | null) {
	// TODO: passed props because it may be used for transparency
	if(!!side1 && !!side2) {
		return 3;
	} else if((!!side1 && !!adjacent) || (!!side2 && !!adjacent)) {
		return 2;
	} else if(!!side1 || !!adjacent || !!side2) {
		return 1;
	} else {
		return 0;
	}
}

export function mesher(props: MesherProps): MeshData {
	const vertices: number[] = [];
	const colors: number[] = [];
	const indices: number[] = [];
	const ao: number[] = [];

	for(let dir = 0; dir < 3; dir++) {
		const dirX = (dir + 2) % 3;
		const dirY = (dir + 1) % 3;
		const dirWidth = props.dimensions[dirX];
		const dirHeight = props.dimensions[dirY];
		const faceMask = props.getFaceMask(dirWidth * dirHeight);
		const aoMask = props.getAOMask(dirWidth * dirHeight);

		const pos: Position = [0, 0, 0];
		const offset: Position = [0, 0, 0];
		offset[dir] = 1;

		for(pos[dir] = -1; pos[dir] < props.dimensions[dir];) {
			let maskIndex = 0;

			for(pos[dirY] = 0; pos[dirY] < dirHeight; pos[dirY]++) {
				for(pos[dirX] = 0; pos[dirX] < dirWidth; pos[dirX]++, maskIndex++) {
					function getRelative(x: number, y: number, z: number): number | null {
						return props.getVoxel(
							props.position[0] + pos[0] + x,
							props.position[1] + pos[1] + y,
							props.position[2] + pos[2] + z,
						);
					}

					let aFace = getRelative(0, 0, 0) || 0;
					let bFace = getRelative(...offset) || 0;

					if(!!aFace === !!bFace) {
						faceMask[maskIndex] = 0;
						aoMask[maskIndex] = 0;
					} else {
						const colorIndex = !!aFace ? aFace : -bFace;
						const neighbors: Record<string, number | null> = {};
						const facePos: Position = [0, 0, 0];
						let faceAO = 0;

						facePos[dir] = colorIndex > 0 ? 1 : 0;

						for(let y = -1; y < 2; y++) {
							facePos[dirY] = y;
							for(let x = -1; x < 2; x++) {
								facePos[dirX] = x;
								neighbors[`${x}:${y}`] = getRelative(...facePos);
							}
						}

						faceAO += calcAO(props, neighbors['-1:-1'], neighbors['-1:0'], neighbors['0:-1']) << 0; // xy
						faceAO += calcAO(props, neighbors['1:-1'], neighbors['0:-1'], neighbors['1:0']) << 2;
						faceAO += calcAO(props, neighbors['1:1'], neighbors['1:0'], neighbors['0:1']) << 4;
						faceAO += calcAO(props, neighbors['-1:1'], neighbors['0:1'], neighbors['-1:0']) << 6;

						if(dir === 1 && pos[0] === 0 && pos[1] === 0 && pos[2] === 1) {
							console.log(faceAO.toString(4).split('').reverse().join(''));
							console.log(dirX, dirY);
						}

						faceMask[maskIndex] = colorIndex;
						aoMask[maskIndex] = faceAO;
					}
				}
			}

			pos[dir]++;
			maskIndex = 0;

			for(pos[dirY] = 0; pos[dirY] < dirHeight; pos[dirY]++) {
				for(pos[dirX] = 0; pos[dirX] < dirWidth;) {
					let colorIndex = faceMask[maskIndex];
					let faceAO = aoMask[maskIndex];

					if(!!colorIndex) {
						let width = 1;

						// keep going until end of boundary or value changes
						while(colorIndex === faceMask[maskIndex + width] && faceAO === aoMask[maskIndex + width] && pos[dirX] + width < dirWidth) {
							width++;
						}

						let height = 1;
						let done = false;

						while(pos[dirY] + height < dirHeight) {
							// walk row below and check if value is same
							for(let i = 0; i < width; i++) {
								const index = maskIndex + i + height * props.dimensions[dirX];
								if(colorIndex !== faceMask[index] || faceAO !== aoMask[index]) {
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

						const tmp = [
							...aoColor((faceAO >> 0) & 3),
							...aoColor(colorIndex > 0
								? (faceAO >> 2) & 3
								: (faceAO >> 6) & 3
							),
							...aoColor((faceAO >> 4) & 3),
							...aoColor(colorIndex > 0
								? (faceAO >> 6) & 3
								: (faceAO >> 2) & 3
							),
						];

						if(dir === 1 && pos[0] === 0 && pos[1] === 1 && pos[2] === 1) {
							console.log(tmp, colorIndex);
						}

						ao.push(...tmp);

						const color = props.getColor(colorIndex);

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

						// reset faceMask (skips area on next row)
						for(let j = 0; j < height; j++) {
							for(let i = 0; i < width; i++) {
								faceMask[maskIndex + i + j * dirWidth] = 0;
								aoMask[maskIndex + i + j * dirWidth] = 0;
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

	return { indices, vertices, colors, ao };
}

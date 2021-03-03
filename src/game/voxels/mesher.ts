import type { Color, Dimensions, Position } from '.';
import type { MeshData } from './mesh-builder';

export interface MesherProps {
	position: Position;
	dimensions: Dimensions;
	getFaceMask: (len: number) => Int16Array;
	getAOMask: (len: number) => Uint8Array;
	getVoxel: (x: number, y: number, z: number) => number | null;
	getColor: (colorIndex: number) => Color;
}

export function mesher(props: MesherProps): MeshData {
	const vertices: number[] = [];
	const colors: number[] = [];
	const indices: number[] = [];
	const ao: number[] = [];

	for(let dir = 0; dir < 3; dir++) {
		const dirX = (dir + 1) % 3;
		const dirY = (dir + 2) % 3;
		const dirWidth = props.dimensions[dirX];
		const dirHeight = props.dimensions[dirY];
		const faceMask = props.getFaceMask(dirWidth * dirHeight);
		const aoMask = props.getFaceMask(dirWidth * dirHeight);

		const pos = [0, 0, 0];
		const offset = [0, 0, 0];
		offset[dir] = 1;

		for(pos[dir] = -1; pos[dir] < props.dimensions[dir];) {
			let maskIndex = 0;

			for(pos[dirY] = 0; pos[dirY] < dirHeight; pos[dirY]++) {
				for(pos[dirX] = 0; pos[dirX] < dirWidth; pos[dirX]++, maskIndex++) {
					let aFace = props.getVoxel(
						props.position[0] + pos[0],
						props.position[1] + pos[1],
						props.position[2] + pos[2],
					) || 0;

					let bFace = props.getVoxel(
						props.position[0] + pos[0] + offset[0],
						props.position[1] + pos[1] + offset[1],
						props.position[2] + pos[2] + offset[2],
					) || 0;

					if(!!aFace === !!bFace) {
						faceMask[maskIndex] = 0;
					} else if(!!aFace) {
						faceMask[maskIndex] = aFace;
					} else {
						faceMask[maskIndex] = -bFace;
					}
				}
			}

			pos[dir]++;
			maskIndex = 0;

			for(pos[dirY] = 0; pos[dirY] < dirHeight; pos[dirY]++) {
				for(pos[dirX] = 0; pos[dirX] < dirWidth;) {
					let colorIndex = faceMask[maskIndex];

					if(!!colorIndex) {
						let width = 1;

						// keep going until end of boundary or value changes
						while(colorIndex === faceMask[maskIndex + width] && pos[dirX] + width < dirWidth) {
							width++;
						}

						let height = 1;
						let done = false;

						while(pos[dirY] + height < dirHeight) {
							// walk row below and check if value is same
							for(let i = 0; i < width; i++) {
								if(colorIndex !== faceMask[maskIndex + i + height * props.dimensions[dirX]]) {
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

						const color = props.getColor(colorIndex);

						// vertex colors are faster than textures
						colors.push(
							color[0] / 255, color[1] / 255, color[2] / 255,
							color[0] / 255, color[1] / 255, color[2] / 255,
							color[0] / 255, color[1] / 255, color[2] / 255,
							color[0] / 255, color[1] / 255, color[2] / 255,
						);

						const test = [Math.random() * 0.2 + 0.8, Math.random() * 0.2 + 0.8, Math.random() * 0.2 + 0.8, Math.random() * 0.2 + 0.8];
						ao.push(
							test[0], test[0], test[0],
							test[1], test[1], test[1],
							test[2], test[2], test[2],
							test[3], test[3], test[3],
						);

						indices.push(
							vertexCount, vertexCount + 1, vertexCount + 2,
							vertexCount, vertexCount + 2, vertexCount + 3,
						);

						// reset faceMask (skips area on next row)
						for(let j = 0; j < height; j++) {
							for(let i = 0; i < width; i++) {
								faceMask[maskIndex + i + j * dirWidth] = 0;
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

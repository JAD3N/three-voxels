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
	const color = 1 - (ao / 3) / 5;
	return [color, color, color];
}


export function calcAO(
	props: MesherProps,
	dir: number,
	colorIndex: number | null,
	neighbors: { [key: string]: number | null },
): number {
	let ao = 0;

	switch(dir) {
		case 0:
			if(colorIndex > 0) {
				ao += calcAOVertex(props, neighbors['1:-1:-1'], neighbors['1:-1:0'], neighbors['1:0:-1']) << 0;
				ao += calcAOVertex(props, neighbors['1:-1:1'], neighbors['1:-1:0'], neighbors['1:0:1']) << 6;
				ao += calcAOVertex(props, neighbors['1:1:1'], neighbors['1:1:0'], neighbors['1:0:1']) << 4;
				ao += calcAOVertex(props, neighbors['1:1:-1'], neighbors['1:0:-1'], neighbors['1:1:0']) << 2;
			} else {
				ao += calcAOVertex(props, neighbors['-1:-1:-1'], neighbors['-1:-1:0'], neighbors['-1:0:-1']) << 0;
				ao += calcAOVertex(props, neighbors['-1:-1:1'], neighbors['-1:-1:0'], neighbors['-1:0:1']) << 2;
				ao += calcAOVertex(props, neighbors['-1:1:1'], neighbors['-1:1:0'], neighbors['-1:0:1']) << 4;
				ao += calcAOVertex(props, neighbors['-1:1:-1'], neighbors['-1:0:-1'], neighbors['-1:1:0']) << 6;
			}
			break;
		case 1:
			if(colorIndex > 0) {
				ao += calcAOVertex(props, neighbors['-1:1:-1'], neighbors['-1:1:0'], neighbors['0:1:-1']) << 0;
				ao += calcAOVertex(props, neighbors['-1:1:1'], neighbors['-1:1:0'], neighbors['0:1:1']) << 2;
				ao += calcAOVertex(props, neighbors['1:1:1'], neighbors['1:1:0'], neighbors['0:1:1']) << 4;
				ao += calcAOVertex(props, neighbors['1:1:-1'], neighbors['0:1:-1'], neighbors['1:1:0']) << 6;
			} else {
				ao += calcAOVertex(props, neighbors['-1:-1:-1'], neighbors['-1:-1:0'], neighbors['0:-1:-1']) << 0;
				ao += calcAOVertex(props, neighbors['-1:-1:1'], neighbors['-1:-1:0'], neighbors['0:-1:1']) << 6;
				ao += calcAOVertex(props, neighbors['1:-1:1'], neighbors['1:-1:0'], neighbors['0:-1:1']) << 4;
				ao += calcAOVertex(props, neighbors['1:-1:-1'], neighbors['0:-1:-1'], neighbors['1:-1:0']) << 2;
			}
			break;
		case 2:
			if(colorIndex > 0) {
				ao += calcAOVertex(props, neighbors['-1:-1:1'], neighbors['0:-1:1'], neighbors['-1:0:1']) << 0;
				ao += calcAOVertex(props, neighbors['1:-1:1'], neighbors['0:-1:1'], neighbors['1:0:1']) << 2;
				ao += calcAOVertex(props, neighbors['1:1:1'], neighbors['0:1:1'], neighbors['1:0:1']) << 4;
				ao += calcAOVertex(props, neighbors['-1:1:1'], neighbors['-1:0:1'], neighbors['0:1:1']) << 6;
			} else {
				ao += calcAOVertex(props, neighbors['-1:-1:-1'], neighbors['0:-1:-1'], neighbors['-1:0:-1']) << 0;
				ao += calcAOVertex(props, neighbors['1:-1:-1'], neighbors['0:-1:-1'], neighbors['1:0:-1']) << 6;
				ao += calcAOVertex(props, neighbors['1:1:-1'], neighbors['0:1:-1'], neighbors['1:0:-1']) << 4;
				ao += calcAOVertex(props, neighbors['-1:1:-1'], neighbors['-1:0:-1'], neighbors['0:1:-1']) << 2;
			}
			break;
	}

	return ao;
}

export function calcAOVertex(
	_props: MesherProps,
	adjacent: number | null,
	side1: number | null,
	side2: number | null,
) {
	// TODO: passed props because it may be used for transparency

	adjacent = adjacent ? 1 : 0;
	side1 = side1 ? 1 : 0;
	side2 = side2 ? 1 : 0;

	if(side1 && side2) {
		return 3;
	} else {
		return adjacent + side1 + side2;
	}
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
						const neighbors: Record<string, number | null> = {};;

						for(let z = -1; z < 2; z++) {
							for(let y = -1; y < 2; y++) {
								for(let x = -1; x < 2; x++) {
									if(colorIndex > 0) {
										neighbors[`${x}:${y}:${z}`] = getRelative(x, y, z);
									} else {
										neighbors[`${x}:${y}:${z}`] = getRelative(x + offset[0], y + offset[1], z + offset[2]);
									}
								}
							}
						}

						faceMask[maskIndex] = colorIndex;
						aoMask[maskIndex] = calcAO(props, dir, colorIndex, neighbors);
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

						const color = props.getColor(colorIndex);

						// vertex colors are faster than textures
						colors.push(
							color[0] / 255, color[1] / 255, color[2] / 255,
							color[0] / 255, color[1] / 255, color[2] / 255,
							color[0] / 255, color[1] / 255, color[2] / 255,
							color[0] / 255, color[1] / 255, color[2] / 255,
						);

						const ao00 = (faceAO >> 0) & 3;
						const ao10 = (faceAO >> 2) & 3;
						const ao11 = (faceAO >> 4) & 3;
						const ao01 = (faceAO >> 6) & 3;

						ao.push(
							...aoColor(ao00),
							...aoColor(ao10),
							...aoColor(ao11),
							...aoColor(ao01),
						);

						if(ao00 + ao11 < ao01 + ao10) {
							indices.push(
								vertexCount, vertexCount + 1, vertexCount + 2,
								vertexCount, vertexCount + 2, vertexCount + 3,
							);
						} else {
							indices.push(
								vertexCount + 3, vertexCount, vertexCount + 1,
								vertexCount + 3, vertexCount + 1, vertexCount + 2,
							);
						}


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

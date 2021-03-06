import type { Color, Dimensions, Material, Position } from '.';
import type { MeshData } from './mesh-builder';

export interface MesherProps {
	position: Position;
	dimensions: Dimensions;
	getFaceMask: (len: number) => Uint16Array;
	getAOMask: (len: number) => Uint16Array;
	getVoxel: (x: number, y: number, z: number) => number | null;
	getColor: (colorIndex: number) => Color;
	getMaterial: (colorIndex: number) => Material;
}

export function aoColor(ao: number): number {
	return 1 - (ao / 3) / 4;
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
	const normals: number[] = [];
	const aos: number[] = [];

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

					const aFace = getRelative(0, 0, 0) || 0;
					const aMat = props.getMaterial(aFace);
					const aTrans = aMat?.transparency ? aMat.transparency < 1 : false;

					const bFace = getRelative(...offset) || 0;
					const bMat = props.getMaterial(bFace);
					const bTrans = bMat?.transparency ? bMat.transparency < 1 : false;

					if((!aFace && !bFace) || (!aTrans && !bTrans && !!aFace && !!bFace) || (aFace === bFace)) {
						faceMask[maskIndex] = 0;
						aoMask[maskIndex] = 0;
					} else {
						const neighbors: Record<string, number | null> = {};
						let ao = 0;
						let value = 0;

						if(aFace) {
							let aAO = 0;

							if(!aTrans) {
								for(let z = -1; z < 2; z++) {
									for(let y = -1; y < 2; y++) {
										for(let x = -1; x < 2; x++) {
											neighbors[`${x}:${y}:${z}`] = getRelative(x, y, z);
										}
									}
								}

								aAO = calcAO(props, dir, aFace, neighbors);
							}

							ao += aAO << 0;
							value += aFace << 0;
						}

						if(bFace) {
							let bAO = 0;

							if(!bTrans) {
								for(let z = -1; z < 2; z++) {
									for(let y = -1; y < 2; y++) {
										for(let x = -1; x < 2; x++) {
											neighbors[`${x}:${y}:${z}`] = getRelative(x + offset[0], y + offset[1], z + offset[2]);
										}
									}
								}

								bAO = calcAO(props, dir, -bFace, neighbors);
							}

							ao += bAO << 8;
							value += bFace << 8;
						}

						faceMask[maskIndex] = value;
						aoMask[maskIndex] = ao;
					}
				}
			}

			pos[dir]++;

			for(const shift of [0, 8]) {
				maskIndex = 0;

				for(pos[dirY] = 0; pos[dirY] < dirHeight; pos[dirY]++) {
					for(pos[dirX] = 0; pos[dirX] < dirWidth;) {
						let colorIndex = (faceMask[maskIndex] >> shift) & 0xff;
						let faceAO = (aoMask[maskIndex] >> shift) & 0xff;

						if(!!colorIndex) {
							let width = 1;

							// keep going until end of boundary or value changes
							while(colorIndex === ((faceMask[maskIndex + width] >> shift) & 0xff) && faceAO === ((aoMask[maskIndex + width] >> shift) & 0xff) && pos[dirX] + width < dirWidth) {
								width++;
							}

							let height = 1;
							let done = false;

							while(pos[dirY] + height < dirHeight) {
								// walk row below and check if value is same
								for(let i = 0; i < width; i++) {
									const index = maskIndex + i + height * props.dimensions[dirX];
									if(colorIndex !== ((faceMask[index] >> shift) & 0xff) || faceAO !== ((aoMask[index] >> shift) & 0xff)) {
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

							const normal = [0, 0, 0];
							const v2 = [0, 0, 0];
							const v3 = [0, 0, 0];

							if(shift === 0) {
								v2[dirX] = width;
								v3[dirY] = height;
								normal[dir] = 1;
							} else {
								v3[dirX] = width;
								v2[dirY] = height;
								normal[dir] = -1;
							}

							normals.push(
								...normal,
								...normal,
								...normal,
								...normal,
							);

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

							aos.push(
								aoColor(ao00),
								aoColor(ao10),
								aoColor(ao11),
								aoColor(ao01),
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
									const index = maskIndex + i + j * dirWidth;

									faceMask[index] &= ~(0xff << shift);
									faceMask[index] &= ~(0xff << shift);
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
	}

	return { indices, vertices, colors, normals, aos };
}

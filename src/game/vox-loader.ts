export interface VoxHeader {
	version: number;
}

export interface VoxChunk {
	index: number;
	chunkId: string;
	contentByteLength: number;
	childrenByteLength: number;
	children?: VoxChunk[];
}

export interface VoxPackChunk extends VoxChunk {
	numOfModels: number;
}

export interface VoxSizeChunk extends VoxChunk {
	x: number;
	y: number;
	z: number;
}

export interface VoxPaletteChunk extends VoxChunk {
	colors: Uint8Array;
}

export interface VoxVoxelsChunk extends VoxChunk {
	numOfVoxels: number;
	voxels: Uint8Array;
}

export interface VoxMaterialDictChunk extends VoxChunk {
	materialId: number;
	materialDict: VoxMaterialDict;
}

export interface VoxModel {
	dimensions: [number, number, number];
	voxels: Uint8Array;
}

export interface VoxDict {
	[key: string]: string;
}

export interface VoxMaterialDict extends VoxDict {
	_type?: '_diffuse' | '_metal' | '_glass' | '_emit';
	_weight?: string;
	_rough?: string;
	_spec?: string;
	_ior?: string;
	_att?: string;
	_flux?: string;
	_plastic?: string;
	_trans?: string;
}

export interface VoxPalette {
	colors: [number, number, number, number][];
	materials: VoxMaterial[];
}

export interface VoxMaterial {
	transparency?: number;
}

export const DEFAULT_PALETTE = [
	0x00000000, 0xffffffff, 0xffccffff, 0xff99ffff, 0xff66ffff, 0xff33ffff, 0xff00ffff, 0xffffccff, 0xffccccff, 0xff99ccff, 0xff66ccff, 0xff33ccff, 0xff00ccff, 0xffff99ff, 0xffcc99ff, 0xff9999ff,
	0xff6699ff, 0xff3399ff, 0xff0099ff, 0xffff66ff, 0xffcc66ff, 0xff9966ff, 0xff6666ff, 0xff3366ff, 0xff0066ff, 0xffff33ff, 0xffcc33ff, 0xff9933ff, 0xff6633ff, 0xff3333ff, 0xff0033ff, 0xffff00ff,
	0xffcc00ff, 0xff9900ff, 0xff6600ff, 0xff3300ff, 0xff0000ff, 0xffffffcc, 0xffccffcc, 0xff99ffcc, 0xff66ffcc, 0xff33ffcc, 0xff00ffcc, 0xffffcccc, 0xffcccccc, 0xff99cccc, 0xff66cccc, 0xff33cccc,
	0xff00cccc, 0xffff99cc, 0xffcc99cc, 0xff9999cc, 0xff6699cc, 0xff3399cc, 0xff0099cc, 0xffff66cc, 0xffcc66cc, 0xff9966cc, 0xff6666cc, 0xff3366cc, 0xff0066cc, 0xffff33cc, 0xffcc33cc, 0xff9933cc,
	0xff6633cc, 0xff3333cc, 0xff0033cc, 0xffff00cc, 0xffcc00cc, 0xff9900cc, 0xff6600cc, 0xff3300cc, 0xff0000cc, 0xffffff99, 0xffccff99, 0xff99ff99, 0xff66ff99, 0xff33ff99, 0xff00ff99, 0xffffcc99,
	0xffcccc99, 0xff99cc99, 0xff66cc99, 0xff33cc99, 0xff00cc99, 0xffff9999, 0xffcc9999, 0xff999999, 0xff669999, 0xff339999, 0xff009999, 0xffff6699, 0xffcc6699, 0xff996699, 0xff666699, 0xff336699,
	0xff006699, 0xffff3399, 0xffcc3399, 0xff993399, 0xff663399, 0xff333399, 0xff003399, 0xffff0099, 0xffcc0099, 0xff990099, 0xff660099, 0xff330099, 0xff000099, 0xffffff66, 0xffccff66, 0xff99ff66,
	0xff66ff66, 0xff33ff66, 0xff00ff66, 0xffffcc66, 0xffcccc66, 0xff99cc66, 0xff66cc66, 0xff33cc66, 0xff00cc66, 0xffff9966, 0xffcc9966, 0xff999966, 0xff669966, 0xff339966, 0xff009966, 0xffff6666,
	0xffcc6666, 0xff996666, 0xff666666, 0xff336666, 0xff006666, 0xffff3366, 0xffcc3366, 0xff993366, 0xff663366, 0xff333366, 0xff003366, 0xffff0066, 0xffcc0066, 0xff990066, 0xff660066, 0xff330066,
	0xff000066, 0xffffff33, 0xffccff33, 0xff99ff33, 0xff66ff33, 0xff33ff33, 0xff00ff33, 0xffffcc33, 0xffcccc33, 0xff99cc33, 0xff66cc33, 0xff33cc33, 0xff00cc33, 0xffff9933, 0xffcc9933, 0xff999933,
	0xff669933, 0xff339933, 0xff009933, 0xffff6633, 0xffcc6633, 0xff996633, 0xff666633, 0xff336633, 0xff006633, 0xffff3333, 0xffcc3333, 0xff993333, 0xff663333, 0xff333333, 0xff003333, 0xffff0033,
	0xffcc0033, 0xff990033, 0xff660033, 0xff330033, 0xff000033, 0xffffff00, 0xffccff00, 0xff99ff00, 0xff66ff00, 0xff33ff00, 0xff00ff00, 0xffffcc00, 0xffcccc00, 0xff99cc00, 0xff66cc00, 0xff33cc00,
	0xff00cc00, 0xffff9900, 0xffcc9900, 0xff999900, 0xff669900, 0xff339900, 0xff009900, 0xffff6600, 0xffcc6600, 0xff996600, 0xff666600, 0xff336600, 0xff006600, 0xffff3300, 0xffcc3300, 0xff993300,
	0xff663300, 0xff333300, 0xff003300, 0xffff0000, 0xffcc0000, 0xff990000, 0xff660000, 0xff330000, 0xff0000ee, 0xff0000dd, 0xff0000bb, 0xff0000aa, 0xff000088, 0xff000077, 0xff000055, 0xff000044,
	0xff000022, 0xff000011, 0xff00ee00, 0xff00dd00, 0xff00bb00, 0xff00aa00, 0xff008800, 0xff007700, 0xff005500, 0xff004400, 0xff002200, 0xff001100, 0xffee0000, 0xffdd0000, 0xffbb0000, 0xffaa0000,
	0xff880000, 0xff770000, 0xff550000, 0xff440000, 0xff220000, 0xff110000, 0xffeeeeee, 0xffdddddd, 0xffbbbbbb, 0xffaaaaaa, 0xff888888, 0xff777777, 0xff555555, 0xff444444, 0xff222222, 0xff111111,
];

export class VoxLoader {
	buffer: ArrayBuffer;
	data: Uint8Array;
	view: DataView;

	version?: number;
	models?: VoxModel[];
	palette?: VoxPalette;

	constructor(buffer: ArrayBuffer) {
		this.buffer = buffer;
		this.data = new Uint8Array(buffer);
		this.view = new DataView(buffer);
	}

	getStringAt(index: number, length: number): string {
		// get portion of data bytes
		const slice = this.data.slice(index, index + length);
		// convert into string
		return String.fromCharCode(...slice);
	}

	getPrefixedStringAt(index: number): string {
		const length = this.view.getInt32(index, true);
		return this.getStringAt(index + 4, length);
	}

	parseHeader(): VoxHeader {
		if(this.getStringAt(0, 4) !== 'VOX ') {
			throw new Error('Invalid header!');
		}

		const version = this.view.getInt32(4, true);
		return { version };
	}

	parseDict(index: number): VoxDict {
		const numOfPairs = this.view.getInt32(index, true);
		const dict: VoxDict = {};

		for(let i = 0, offset = 0; i < numOfPairs; i++) {
			const key = this.getPrefixedStringAt(index + 4 + offset);
			offset += key.length + 4;

			const value = this.getPrefixedStringAt(index + 4 + offset);
			offset += value.length + 4;

			dict[key] = value;
		}

		return dict;
	}

	parseChunk(index: number): VoxChunk {
		const chunkId = this.getStringAt(index, 4);
		const contentByteLength = this.view.getInt32(index + 4, true);
		const childrenByteLength = this.view.getInt32(index + 8, true);
		let children;

		if(childrenByteLength > 0) {
			children = [];

			for(let i = 0; i < childrenByteLength;) {
				const child = this.parseChunk(index + 12 + i);

				// add child to array
				children.push(child);

				// offset index by chunk size
				i += 12 + child.contentByteLength + child.childrenByteLength;
			}
		}

		let chunk: VoxChunk = {
			index,
			chunkId,
			contentByteLength,
			childrenByteLength,
			children,
		};

		switch(chunkId) {
			// ignore main
			case 'MAIN':
				break;
			case 'PACK':
				const numOfModels = this.view.getInt32(index + 12, true);

				chunk = {
					...chunk,
					numOfModels,
				} as VoxPackChunk;
				break;
			case 'SIZE':
				const x = this.view.getInt32(index + 12, true);
				const y = this.view.getInt32(index + 12 + 4, true);
				const z = this.view.getInt32(index + 12 + 8, true);

				chunk = {
					...chunk,
					// add dimensions
					x, y, z,
				} as VoxSizeChunk;
				break;
			case 'XYZI':
				const numOfVoxels = this.view.getInt32(index + 12, true);
				const voxels = new Uint8Array(this.buffer, index + 12 + 4, numOfVoxels * 4);

				chunk = {
					...chunk,
					numOfVoxels,
					voxels,
				} as VoxVoxelsChunk;
				break;
			case 'RGBA':
				const colors = new Uint8Array(this.buffer, index + 12, 256 * 4);
				chunk = {
					...chunk,
					colors,
				} as VoxPaletteChunk;
				break;
			case 'MATT':
				const id = this.view.getInt32(index + 12, true);
				const type = this.view.getInt32(index + 12 + 4, true);
				const weight = this.view.getFloat32(index + 12 + 8, true);
				const bits = this.view.getInt32(index + 12 + 12, true);
				const isTotalPower = !!(bits & (1 << 7));

				const map = new Map<string, number>();
				const keys = [
					'plastic',
					'roughness',
					'specular',
					'ior',
					'attenuation',
					'power',
					'glow',
				];

				for(const [i, key] of keys.entries()) {
					if(bits & (1 << i)) {
						// only set value in map if bit is set
						map.set(key, this.view.getFloat32(index + 12 + 16 + i * 4));
					}
				}

				console.log('MATT', {
					id,
					type,
					weight,
					...map.entries(),
					isTotalPower,
				});

				break;
			case 'MATL':
				const materialId = this.view.getInt32(index + 12, true);
				const materialDict: VoxMaterialDict = this.parseDict(index + 12 + 4);
				chunk = {
					...chunk,
					materialId,
					materialDict,
				} as VoxMaterialDictChunk;
				break;
			default:
				console.log('Unknown chunk id:', chunk.chunkId);
		}

		return chunk;
	}

	async parse(): Promise<void> {
		const header = this.parseHeader();
		const main = this.parseChunk(8);

		this.version = header.version;

		// check if this is valid
		if(main.chunkId !== 'MAIN') {
			throw new Error('Unexpected root chunk type!');
		}

		let numOfModels = 1;
		let modelOffset = 0;

		if(main.children[0].chunkId === 'PACK') {
			const packChunk = main.children[0] as VoxPackChunk;
			numOfModels = packChunk.numOfModels;
			modelOffset = 1;
		}

		this.models = [];

		for(let i = 0; i < numOfModels; i++) {
			const sizeChunk = main.children[modelOffset + i * 2] as VoxSizeChunk;
			const voxelsChunk = main.children[modelOffset + i * 2 + 1] as VoxVoxelsChunk;

			if(sizeChunk.chunkId !== 'SIZE' || voxelsChunk.chunkId !== 'XYZI') {
				throw new Error('Unexpected chunk type while reading models!');
			}

			// extract dimensions (z is up)
			const width = sizeChunk.x;
			const height = sizeChunk.z;
			const depth = sizeChunk.y;
			const dimensions = [width, height, depth] as VoxModel['dimensions'];

			const voxels = new Uint8Array(width * height * depth);

			for(let i = 0; i <= voxelsChunk.numOfVoxels; i++) {
				const [z, x, y, colorIndex] = voxelsChunk.voxels.slice(i * 4, i * 4 + 4);
				const index = x + width * (y + z * height);

				voxels[index] = colorIndex;
			}

			this.models.push({ dimensions, voxels });
		}

		for(const chunk of main.children.slice(modelOffset + numOfModels * 2)) {
			if(chunk?.chunkId === 'RGBA') {
				const paletteChunk = chunk as VoxPaletteChunk;

				this.palette = {
					materials: [],
					colors: [[0, 0, 0, 0]],
				};

				for(let i = 0; i < 255; i++) {
					const color = [
						paletteChunk.colors[i * 4],
						paletteChunk.colors[i * 4 + 1],
						paletteChunk.colors[i * 4 + 2],
						paletteChunk.colors[i * 4 + 3],
					];

					this.palette.colors.push(color as VoxPalette['colors'][0]);
				}
			} else if(chunk?.chunkId === 'MATL') {
				const matChunk = chunk as VoxMaterialDictChunk;
				const transparency = matChunk.materialDict?._trans
					? parseFloat(matChunk.materialDict._trans)
					: undefined;

				this.palette.materials[matChunk.materialId] = { transparency };
			}
		}

		if(!this.palette) {
			this.palette = {
				materials: [],
				colors: DEFAULT_PALETTE.map(color => [
					(color >>> 16) & 0xff,
					(color >>> 8) & 0xff,
					(color >>> 0) & 0xff,
					(color >>> 24) & 0xff,
				]),
			};
		}

		console.log(main);
	}
}

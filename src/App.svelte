<script lang="ts">
	import { onMount } from 'svelte';

	import { Game } from './game';
	import { VoxLoader } from './game/vox-loader';
	import { Voxels } from './game/voxels';
	import { MeshBuilder } from './game/voxels/mesh-builder';

	let canvas: HTMLCanvasElement | undefined;

	onMount(async () => {
		if(!canvas) {
			return;
		}

		const res = await fetch('samples/3x3x3.vox');
		const vox = new VoxLoader(await res.arrayBuffer());

		await vox.parse();

		const game = new Game(canvas);
		const meshBuilder = new MeshBuilder();

		for(const model of vox.models) {
			const voxels = new Voxels(model.dimensions, vox.palette, model.voxels);
			const mesh = meshBuilder.build(voxels, 32, game.camera.position);

			mesh.position.set(
				-voxels.dimensions[0] / 2,
				-voxels.dimensions[1] / 2,
				-voxels.dimensions[2] / 2,
			);

			game.scene.add(mesh);
		}

		game.start();
	});
</script>

<style>
	canvas {
		width: 100%;
		height: 100%;
		position: absolute;
	}
</style>

<canvas bind:this={canvas} />
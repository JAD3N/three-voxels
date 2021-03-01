<script lang="ts">
	import { onMount } from 'svelte';

	import { Game } from './game';
	import { VoxLoader } from './game/vox-loader';
	import { Voxels } from './game/voxels';

	let canvas: HTMLCanvasElement | undefined;

	onMount(async () => {
		if(!canvas) {
			return;
		}

		const res = await fetch('samples/monu10.vox');
		const vox = new VoxLoader(await res.arrayBuffer());

		await vox.parse();

		const game = new Game(canvas);

		for(const model of vox.models) {
			const voxels = new Voxels(model.dimensions, model.voxels, vox.palette);
			game.scene.add(voxels);

			// const wireframe = new THREE.WireframeGeometry( voxels.geometry );

			// const line = new THREE.LineSegments(wireframe);
			// const lineMaterial = line.material as THREE.Material;
			// lineMaterial.depthTest = false;

			// game.scene.add(new THREE.BoxHelper(line));
			// game.scene.add(line);
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
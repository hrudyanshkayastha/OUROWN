<template>
	<div ref="el" data-component="speed-card">
		<div class="rive-wrapper">
			<RiveAsset v-if="graph" :asset="graph" :autoplay="true" state-machine="State Machine 1" :width="552" :height="665" layout="cover" :use-fallback-image="isMobile" />
		</div>

		<div class="content">
			<p v-if="title" class="title -numbers-1">{{ title }}</p>
			<p v-if="description" class="description -text-1-cards">{{ description }}</p>
		</div>
	</div>
</template>

<script setup>
import { gsap } from 'gsap'
import { RiveAsset } from '~/components/core/RiveAsset'
import { useIsSafari } from '~/composables/core'
import { breakpoints } from '~/config'

const props = defineProps({
	graph: { type: Object, default: undefined },
	title: { type: String, default: undefined },
	description: { type: String, default: undefined },
})

const el = ref(null)
const context = inject('pageContext')
const isSafari = useIsSafari()
const isMobile = ref(true)
let mm = null

const setup = () => {
	if (isSafari) return

	mm = gsap.matchMedia()

	mm.add(`(min-width: ${breakpoints.small + 1}px)`, () => {
		isMobile.value = false
	})

	mm.add(`(max-width: ${breakpoints.small}px)`, () => {
		isMobile.value = true
	})
}

onBeforeUnmount(() => {
	if (mm) mm.revert()
})
onMounted(() => {
	context.$page.loader.loaded.then(() => setup())
})
</script>

<style lang="scss" scoped>
[data-component='speed-card'] {
	position: relative;
	width: 100%;
	height: 100%;

	border-radius: rs(24, 16);

	overflow: hidden;

	.rive-wrapper {
		position: relative;
		width: 100%;
		aspect-ratio: 552 / 665;
	}

	.content {
		position: absolute;
		inset: 0;

		z-index: 1;

		display: flex;
		flex-direction: column;
		align-items: center;

		text-align: center;

		pointer-events: none;

		color: var(--color-bright-green-500);

		display: flex;
		flex-direction: column;
		gap: rs(12, 12);

		.description {
			max-width: 40%;
		}

		.title {
			font-size: rs(170, 112);
			margin-top: rs(96, 64);
			margin-bottom: rs(36, 18);
		}
	}

	@supports (corner-shape: superellipse(1.5)) {
		& {
			border-radius: rs(28, 20);
			corner-shape: superellipse(1.5);
		}
	}
}
</style>

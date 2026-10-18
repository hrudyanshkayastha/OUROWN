<template>
	<div ref="el" data-component="stat-card" :class="{ '-big-text': bigText }" :style="{ '--aspect-ratio': aspectRatio }">
		<div class="rive-wrapper">
			<RiveAsset
				ref="riveRef"
				v-if="graph"
				:asset="graph"
				:autoplay="!enterOnScroll"
				state-machine="State Machine 1"
				layout="cover"
				:width="width"
				:height="height"
				:use-fallback-image="isMobile"
			/>
		</div>

		<div class="content">
			<p v-if="title" class="title -text-1-cards">{{ title }}</p>
			<div class="stat">
				<SanityContent v-if="stat" :blocks="stat" />
			</div>
		</div>
	</div>
</template>

<script setup>
import { RiveAsset } from '~/components/core/RiveAsset'
import { useIsSafari } from '~/composables/core'
import { gsap, ScrollTrigger } from 'gsap/all'
import { breakpoints } from '~/config'

import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	graph: { type: Object, default: undefined },
	title: { type: String, default: undefined },
	stat: { type: Array, default: undefined },
	aspectRatio: { type: String, default: undefined },
	width: { type: Number, default: 447 },
	height: { type: Number, default: 320 },
	bigText: { type: Boolean, default: false },
	enterOnScroll: { type: Boolean, default: false },
})

const el = ref(null)
const riveRef = ref(null)
const context = inject('pageContext')
const isSafari = useIsSafari()
const isMobile = ref(true)

let scrollTrigger
let mm

const setup = async () => {
	await riveRef.value?.loaded()

	if (!isSafari) {
		mm = gsap.matchMedia()

		mm.add(`(min-width: ${breakpoints.small + 1}px)`, () => {
			isMobile.value = false
		})

		mm.add(`(max-width: ${breakpoints.small}px)`, () => {
			isMobile.value = true
		})
	}

	if (!props.enterOnScroll) return

	scrollTrigger = ScrollTrigger.create({
		trigger: el.value,
		start: 'top 80%',
		once: true,
		onEnter: () => riveRef.value?.play(),
	})
}

onBeforeUnmount(() => {
	scrollTrigger?.kill()
	mm?.revert()
})
onMounted(() => {
	context.$page.loader.ready.then(() => setup())
})
</script>

<style lang="scss" scoped>
[data-component='stat-card'] {
	position: relative;

	width: 100%;
	height: fit-content;

	border-radius: rs(24, 16);
	overflow: hidden;

	.rive-wrapper {
		position: relative;
		aspect-ratio: var(--aspect-ratio);
	}

	.content {
		position: absolute;
		inset: 0;
		z-index: 1;

		pointer-events: none;

		padding: rs(24, 16) rs(32, 28);

		display: flex;
		flex-direction: column;
		justify-content: space-between;

		.title {
			width: 70%;

			@include max-width($xxs) {
				width: 100%;
			}
		}

		.stat {
			:deep(p) {
				@include numbers-1;
				font-size: rs(64, 64);

				em {
					position: relative;
					bottom: 0.25em;
					left: 0.05em;
					font-style: normal;

					@include numbers-2;
				}
			}
		}
	}

	&.-big-text {
		.content .stat {
			:deep(p) {
				font-size: rs(92, 64);
			}
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

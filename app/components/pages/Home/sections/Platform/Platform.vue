<template>
	<div ref="el" data-component="platform">
		<div ref="topRef" class="top" data-panel-shrink>
			<div class="content">
				<span class="top-note -upper-title -uppercase">{{ topNote }}</span>
				<h2 class="title -callout-3 -uppercase">{{ title }}</h2>
				<p class="description -text-2">{{ description }}</p>
				<ButtonList v-if="buttonCtaList" :buttons="buttonCtaList" theme="light" />
			</div>

			<!-- <ImageAsset v-if="!isMobile && background" :asset="background" /> -->
			<VideoAsset v-if="!isMobile && backgroundDesktop" ref="videoRef" :asset="backgroundDesktop" />
			<ImageAsset v-if="isMobile && backgroundMobile" :asset="backgroundMobile" />
		</div>

		<Solutions v-bind="solutions" />

		<div class="cta-wrapper" data-panel-shrink>
			<ButtonList v-if="solutions.buttonCtaList" :buttons="solutions.buttonCtaList" theme="light" />
		</div>
	</div>
</template>

<script setup>
import { Solutions } from '~/components/sections/Solutions'
import { ButtonList } from '~/components/fragments/ButtonList'
import { ImageAsset } from '~/components/core/ImageAsset'
import { VideoAsset } from '~/components/core/VideoAsset'
import { useClientOnlyComputed } from '~/composables/core'
import { useScreen } from 'vue-screen'
import { breakpoints } from '~/config'

import { gsap, ScrollTrigger } from 'gsap/all'
import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	topNote: { type: String, default: undefined },
	title: { type: String, default: undefined },
	description: { type: String, default: undefined },
	buttonCtaList: { type: Array, default: undefined },
	background: { type: Object, default: undefined },
	backgroundDesktop: { type: Object, default: undefined },
	backgroundMobile: { type: Object, default: undefined },
	solutions: { type: Object, default: undefined },
})

let t1 = null

const screen = useScreen()
const isMobile = useClientOnlyComputed(true, () => screen.width <= breakpoints.small, screen)

const el = ref(null)
const topRef = ref(null)
const videoRef = ref(null)

const context = inject('pageContext')

let pendingTime = null
let seekInFlight = false
let onSeeked = null

const setup = () => {
	if (!el.value || !videoRef.value) return

	const video = videoRef.value?.video

	// Safari can leave video.seeking stuck `true` after a stalled seek, which would
	// permanently block a naive `if (video.seeking) return` guard. Instead, always
	// keep the latest requested time queued and apply it as soon as the previous
	// seek actually resolves ΓÇö this guarantees the scrub can never get stuck, it
	// just skips stale intermediate frames.
	onSeeked = () => {
		seekInFlight = false
		if (pendingTime !== null) {
			const time = pendingTime
			pendingTime = null
			seekInFlight = true
			video.currentTime = time
		}
	}
	video.addEventListener('seeked', onSeeked)

	t1 = gsap.timeline({
		scrollTrigger: {
			trigger: topRef.value,
			start: 'top+=4% bottom',
			end: `bottom+=${screen.height} bottom`,
			scrub: 0.1,
			// markers: true,
			onUpdate: (self) => {
				if (!video.duration) return
				const time = self.progress * video.duration

				if (seekInFlight) {
					pendingTime = time
					return
				}

				seekInFlight = true
				video.currentTime = time
			},
		},
	})
}
const init = () => {}
const kill = () => {
	t1?.kill()

	const video = videoRef.value?.video
	if (video && onSeeked) video.removeEventListener('seeked', onSeeked)
}

onBeforeUnmount(() => {
	kill()
})
onMounted(() => {
	context.$page.loader.hydrationReady.then(() => setup())
})
</script>

<style lang="scss" scoped>
[data-component='platform'] {
	position: relative;

	.top {
		position: relative;
		width: 100%;

		padding-bottom: rs(120, 60);

		// @include max-width($sm) {
		// 	height: rs(700, 700);

		:deep(img) {
			width: 100%;
			// height: 100%;
			// object-fit: cover;
		}

		:deep(video) {
			width: 100%;
			// height: 100%;
			// object-fit: cover;
		}
		// }

		.content {
			position: absolute;

			top: 0;
			left: 0;

			width: 100%;

			padding: 0 var(--grid-margin);
			padding-top: rs(100, 64);

			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;

			color: var(--color-bright-green-200);
			text-align: center;

			.title {
				color: var(--color-bright-green-500);
				margin-top: rs(36, 24);
				width: column-width(12);

				@include max-width($md) {
					width: column-width(20);
				}

				@include max-width($xs) {
					width: 100%;
				}
			}

			.description {
				color: var(--color-deep-green-400);
				margin-top: rs(24, 16);
				width: column-width(9, true);
				margin-bottom: rs(48, 24);

				@include max-width($md) {
					width: column-width(16);
				}

				@include max-width($xs) {
					width: 100%;
				}
			}
		}
	}

	.cta-wrapper {
		width: 100%;
		display: flex;
		justify-content: center;
		padding: rs(60, 60) 0;
	}
}
</style>

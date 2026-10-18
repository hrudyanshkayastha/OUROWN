<template>
	<video
		ref="video"
		:type="asset.mediaType"
		:width="asset.width"
		:height="asset.height"
		:autoplay="autoplay"
		:controls="controls"
		:loop="loop"
		:muted="muted"
		:playsinline="playsinline"
		:preload="preload"
		data-component="video-asset"
	/>
</template>

<script>
function assetValidator(asset) {
	if (!Object.hasOwn(asset, 'sources') || !Array.isArray(asset.sources)) {
		console.error(`[primitives/VideoAsset] Missing required 'sources' array in 'asset' prop.`)
		return false
	}

	const defaultSourceIndex = asset.source.findIndex(({ breakpoint }) => breakpoint === 'default')
	if (defaultSourceIndex < 0) {
		console.error(`[primitives/VideoAsset] Missing required source item with 'default' breakpoint.`)
		return false
	}

	return true
}

function preloadValidator(preload) {
	return ['auto', 'metadata', 'none'].includes(preload)
}
</script>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useClientOnlyComputed } from '~/composables/core'
import { useScreen } from 'vue-screen'

import { useInViewport } from '~/composables/core'

const props = defineProps({
	asset: { type: Object, required: true, validation: assetValidator },
	autoplay: { type: Boolean, default: false },
	controls: { type: Boolean, default: false },
	loop: { type: Boolean, default: true },
	muted: { type: Boolean, default: true },
	playsinline: { type: Boolean, default: true },
	paused: { type: Boolean, default: false },
	preload: { type: String, default: 'auto', validator: preloadValidator },
	lazy: { type: Boolean, default: false },
})

const screen = useScreen()
const video = ref(null)
const { viewport } = useInViewport(video)

function calculateDifference(videoWidth, screenWidth) {
	let diff = screenWidth - videoWidth

	// multiply difference when video-width is big than screen-width
	// it results in a slight bias toward displaying a smaller video
	if (diff < 0) {
		diff *= 3
	}

	return Math.abs(diff)
}

function computeOptimalSource(sources, viewportWidth) {
	if (sources.length === 1) {
		return sources[0]
	}

	const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1
	const nonRetinaWidth = pixelRatio * viewportWidth

	const source = sources.sort((a, b) => {
		return calculateDifference(a.width, nonRetinaWidth) - calculateDifference(b.width, nonRetinaWidth)
	})[0]

	return source
}

const src = useClientOnlyComputed(
	props.asset.sources[0],
	() => {
		const screenWidth = screen.width
		return computeOptimalSource(props.asset.sources, screenWidth)
	},
	screen
)

const playVideo = () => {
	if (!video.value) return

	video.value.pause()
	video.value.currentTime = 0
	video.value.play().catch(() => {})
}

const pauseVideo = () => {
	if (!video.value) return

	video.value.pause()
	video.value.currentTime = 0
}

let wasPlayingBeforeScrollOut = false
let isSrcLoaded = false
let idleCallbackId = null

const requestIdle = typeof window !== 'undefined' && window.requestIdleCallback ? window.requestIdleCallback : (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 1)
const cancelIdle = typeof window !== 'undefined' && window.cancelIdleCallback ? window.cancelIdleCallback : clearTimeout

function loadSrc() {
	if (!video.value || isSrcLoaded) return

	video.value.setAttribute('src', src.value.url)
	video.value.load()
	isSrcLoaded = true
}

onMounted(() => {
	if (!props.lazy) {
		loadSrc()
	} else {
		console.warn('[VideoAsset] Lazy video loaded:', src.value?.url)
		idleCallbackId = requestIdle(() => loadSrc())
	}

	watch(
		viewport,
		(value) => {
			if (!value || !video.value) return

			if (value.inViewport) {
				if (props.lazy && !isSrcLoaded) {
					loadSrc()
				}

				if (props.autoplay || wasPlayingBeforeScrollOut) {
					video.value.play().catch(() => {})
					wasPlayingBeforeScrollOut = false
				}
			} else {
				wasPlayingBeforeScrollOut = !video.value.paused
				video.value.pause()
			}
		},
		{ immediate: true }
	)
})

onBeforeUnmount(() => {
	if (props.lazy && idleCallbackId !== null) {
		cancelIdle(idleCallbackId)
	}
})

defineExpose({ playVideo, pauseVideo, video })
</script>

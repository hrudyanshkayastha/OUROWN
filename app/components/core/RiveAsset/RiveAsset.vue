<template>
	<div ref="el" data-component="rive-asset" :class="`${asset?.file && !useFallbackImage ? 'canvas' : 'image'} ${layout}`" :style="ratioStyle">
		<ImageAsset v-if="useFallbackImage && asset?.fallbackImage" :asset="asset?.fallbackImage" :sizes="sizes" />

		<canvas v-else-if="asset?.file" :data-file="asset?.file" :width="props.width || undefined" :height="props.height || undefined" />
		<ImageAsset v-else-if="asset?.fallbackImage" :asset="asset?.fallbackImage" :sizes="sizes" />
	</div>
</template>

<script setup>
import { ImageAsset } from '~/components/core/ImageAsset'
import { getActiveContext } from '~/components/core/Page'
import { useInViewport } from '~/composables/core'
import { useScreen } from 'vue-screen'

const emit = defineEmits(['state-change', 'rive-event'])

const props = defineProps({
	asset: { type: [Boolean, Object], default: false },
	autoplay: { type: Boolean, default: false },
	layout: { type: String, default: 'contain' },
	stateMachine: { type: [Boolean, String], default: 'State Machine 1' },
	artboard: { type: [Boolean, String], default: false },
	width: { type: [Boolean, Number], default: false },
	height: { type: [Boolean, Number], default: false },
	loop: { type: Boolean, default: true },
	haveInteraction: { type: Boolean, default: false },
	dpr: { type: [Boolean, Number], default: false },
	useFallbackImage: { type: Boolean, default: false },
	sizes: {
		type: [Object, String],
		default: 'xsmall:400px medium:1200px xlarge:1700px',
	},
	lazy: { type: Boolean, default: true },
	timeout: { type: Number, default: 5000 },
})

const screen = useScreen()

const ratioStyle = computed(() => {
	return props.width && props.height ? `--ratio: ${props.width} / ${props.height}` : null
})

const getDpr = () => {
	if (props.dpr) {
		return props.dpr
	}
	return typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
}

const resizeSurface = () => {
	if (!animation || !canvasEl) return
	if (canvasEl.clientWidth === 0 || canvasEl.clientHeight === 0) {
		return
	}
	const dpr = getDpr()
	const targetWidth = Math.round(canvasEl.clientWidth * dpr)
	const targetHeight = Math.round(canvasEl.clientHeight * dpr)

	if (canvasEl.width !== targetWidth || canvasEl.height !== targetHeight) {
		animation.resizeDrawingSurfaceToCanvas(dpr)
	}
}

const el = ref(null)
const { viewport } = useInViewport(el)

let isMounted = false
let animation
let animationName = ''
let inputs
let viewModelInstance
let isPlaying = false
let stopViewportWatch = null
let canvasEl = null
let context = null
let isKilled = false
let idleCallbackId = null
let loadTimeout = null
let unwatchViewport = null

const handleRiveError = (event) => {
	const stack = event.error?.stack || ''
	const message = event.error?.message || ''
	if (stack.includes('webgl2_advanced') || stack.includes('rive.wasm') || message.includes('deleteTexture') || message.includes('deleteFramebuffer')) {
		event.preventDefault()
	}
}

let loadPromise
let resolveLoad

// Create a new promise
const createLoadPromise = () => {
	loadPromise = new Promise((resolve) => {
		resolveLoad = resolve
	})
}

const init = async () => {
	if (animation) return

	if (loadTimeout) {
		clearTimeout(loadTimeout)
		loadTimeout = null
	}
	if (idleCallbackId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
		window.cancelIdleCallback(idleCallbackId)
		idleCallbackId = null
	}

	const canvas = el.value?.querySelector('canvas')
	if (!canvas) {
		resolveLoad?.()
		return
	}
	canvasEl = canvas

	const file = canvas.dataset.file

	const { Rive, Layout, Fit, Alignment } = await import('@rive-app/webgl2')

	const fitType = props.layout === 'cover' ? Fit.Cover : Fit.Contain
	const fitAlignment = props.layout === 'cover' ? Alignment.Center : Alignment.Center
	const layout = props.layout ? new Layout({ fit: fitType, alignment: fitAlignment }) : null

	animation = new Rive({
		src: file,
		canvas,
		layout,
		stateMachines: props.stateMachine,
		artboard: props.artboard,
		autoBind: true,
		useOffscreenRenderer: true,
		isTouchScrollEnabled: props.haveInteraction,
		onLoad: () => {
			animationName = animation.animationNames[0]
			inputs = animation?.stateMachineInputs(props.stateMachine)
			viewModelInstance = animation?.viewModelInstance

			// Resolve the promise when loaded
			resolveLoad()

			resizeSurface()

			let wasPlayingBeforeScrollOut = false
			stopViewportWatch = watch(
				viewport,
				(value) => {
					if (!value) return
					if (value.inViewport) {
						if (props.autoplay || wasPlayingBeforeScrollOut) {
							play()
							wasPlayingBeforeScrollOut = false
						}
					} else {
						if (isPlaying) {
							wasPlayingBeforeScrollOut = true
						}
						pause()
					}
				},
				{ immediate: true }
			)
		},
		onStateChange: (event) => {
			emit('state-change', { event, inputs: getInputs() })
		},
		onRiveEvent: (event) => {
			emit('rive-event', event)
		},
	})
}

const play = () => {
	if (isPlaying) return
	animation?.play(props.stateMachine)
	isPlaying = true
}
const pause = () => {
	if (!isPlaying) return
	animation?.pause()
	isPlaying = false
}
const reset = () => {
	animation?.reset()
	isPlaying = false
}

const scrub = (value) => animation?.scrub(animationName, value)
const getInputs = () => {
	if (animation && props.stateMachine) {
		const currentInputs = animation.stateMachineInputs(props.stateMachine)
		if (currentInputs && currentInputs.length > 0) {
			inputs = currentInputs // Update cache
			return currentInputs
		}
	}
	return inputs || []
}
const getInput = (name) => {
	const allInputs = getInputs()
	return allInputs.find((input) => input.name === name)
}
const getViewModelInstance = () => viewModelInstance

const kill = () => {
	if (isKilled) return
	isKilled = true
	if (stopViewportWatch) {
		stopViewportWatch()
		stopViewportWatch = null
	}
	canvasEl = null
	if (animation) {
		try {
			animation.cleanup()
		} catch {
			// WebGL context may have already been lost/destroyed during unmount
		}
		animation = null
	}
}

watch(
	() => screen.width,
	() => {
		resizeSurface()
	}
)

watch(
	() => props.dpr,
	() => {
		resizeSurface()
	}
)

watch(
	() => props.useFallbackImage,
	(newValue) => {
		if (newValue) {
			kill()
		} else {
			isKilled = false
			createLoadPromise()
			nextTick().then(() => {
				if (isMounted) init()
			})
		}
	}
)

onBeforeUnmount(() => {
	isMounted = false
	window.removeEventListener('error', handleRiveError)

	if (loadTimeout) {
		clearTimeout(loadTimeout)
	}
	if (idleCallbackId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
		window.cancelIdleCallback(idleCallbackId)
	}
	if (unwatchViewport) {
		unwatchViewport()
	}

	if (context?.loader?.isDestroyed) {
		Promise.race([context.loader.transitionOut, new Promise((resolve) => setTimeout(resolve, 5000))]).then(() => {
			kill()
		})
	} else {
		kill()
	}
})

onMounted(() => {
	isMounted = true
	window.addEventListener('error', handleRiveError)
	createLoadPromise()

	context = getActiveContext()

	if (props.lazy) {
		if (typeof window !== 'undefined') {
			if ('requestIdleCallback' in window) {
				idleCallbackId = window.requestIdleCallback(() => init(), { timeout: props.timeout })
			} else {
				loadTimeout = setTimeout(init, props.timeout)
			}
		}
	} else {
		init()
	}

	unwatchViewport = watch(
		viewport,
		(value) => {
			if (!value) return
			if (value.inViewport) {
				if (!animation) {
					init()
				}
			}
		},
		{ immediate: true }
	)
})

const loaded = () => {
	return loadPromise
}

defineExpose({
	play,
	pause,
	reset,
	getAnimation: () => animation,
	scrub: scrub,
	getInput,
	getInputs,
	getViewModelInstance,
	kill: kill,
	loaded,
})
</script>

<style lang="scss" scoped>
[data-component='rive-asset'] {
	position: relative;

	&.contain {
		aspect-ratio: var(--ratio);
	}

	&.canvas {
		width: 100%;
		height: 100%;
	}

	canvas {
		width: 100%;
		height: 100%;

		object-fit: cover;
	}

	img {
		width: 100%;
	}
}
</style>

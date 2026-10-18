<template>
	<header ref="el" data-component="header">
		<span class="background-container" data-shader="bitmap" data-panel-translate="2" />

		<span ref="fadeOverlayEl" class="fade-overlay" />

		<span class="radial-overlay" />
		<span class="gradient-overlay" />

		<div class="content g-row">
			<div ref="titleRef" class="g-col xxl-12 lg-14 sm-32">
				<h1 class="title -title-1">{{ title }}</h1>
			</div>
			<div class="cta-block g-col xxl-7 xxl-offset-12 lg-9 lg-offset-8 sm-32 sm-offset-0" data-panel-translate="4">
				<div ref="ctaBlockRef" class="cta-block-inner">
					<p class="description -text-2">{{ ctaBlock.description }}</p>
					<div ref="ctaButtonRef" class="cta-button-wrap">
						<ButtonOutside v-if="ctaBlock.cta" v-bind="ctaBlock.cta" tone="transparent" icon="plus" />
					</div>
				</div>
			</div>
		</div>

		<div class="tags-wrapper" data-panel-translate="2">
			<InfectionTag
				v-for="(pos, i) in TAG_POSITIONS"
				:key="i"
				:visible="visibleStates[i]"
				:opened="openedIndex === i"
				:hoverable="hoverable"
				:x-position="pos.x"
				:y-position="pos.y"
				:state="activeStates[i]"
				:state-index="i"
				:clickable="clickable"
				:on-open="openTag"
				:on-advance="updateStates"
				:label="currentLabel(i)"
				@mouseenter="onTagMouseenter"
				@mouseleave="onTagMouseleave"
			/>
		</div>
	</header>
</template>

<script setup>
import { gsap } from 'gsap'

import { ButtonOutside } from '~/components/primitives/ButtonOutside'
import { InfectionTag } from '~/components/primitives/InfectionTag'
import { useEmitter, useClientOnlyComputed } from '~/composables/core'
import { useRightPanelMethods } from '~/composables'
import { useScreen } from 'vue-screen'
import { breakpoints } from '~/config'

const props = defineProps({
	title: { type: String, default: undefined },
	ctaBlock: { type: Object, default: undefined },
	background: { type: Object, default: undefined },
	infectionLabels: { type: Object, default: undefined },
	infectionSnippets: { type: Object, default: undefined },
})

const screen = useScreen()

const TAG_POSITIONS_DESKTOP = [
	{ x: 36.5, y: 45, t: 3.4 },
	{ x: 64, y: 36, t: 6 },
	{ x: 10.5, y: 58.5, t: 5.5 },
	{ x: 66, y: 52, t: 6.5 },
	{ x: 22, y: 78, t: 3.8 },
	{ x: 54, y: 69, t: 4.2 },
	{ x: 79, y: 65, t: 7.5 },
]

const TAG_POSITIONS_MOBILE = [
	{ x: 10, y: 28, t: 3.5 },
	{ x: 42, y: 50, t: 7.0 },
]

const TAG_POSITIONS = useClientOnlyComputed(TAG_POSITIONS_DESKTOP, () => (screen.width < breakpoints.small ? TAG_POSITIONS_MOBILE : TAG_POSITIONS_DESKTOP), screen)

const globalState = ref('detected')
const activeStates = ref(TAG_POSITIONS.value.map(() => 'detected'))
const visibleStates = ref(TAG_POSITIONS.value.map(() => false))
const openedIndex = ref(-1)
const allVisible = computed(() => visibleStates.value.length === TAG_POSITIONS.value.length && visibleStates.value.every((v) => v))
const hoverable = computed(() => allVisible.value && globalState.value !== 'solved')
const clickable = computed(() => allVisible.value && globalState.value !== 'solved')
const tagLabels = ref(TAG_POSITIONS.value.map(() => ({ detected: undefined, identified: undefined, solved: undefined })))

function currentLabel(i) {
	return tagLabels.value[i]?.[activeStates.value[i]]
}

let sequenceTl = null
let activeTweens = []
let viewportObserver = null
let sequenceStartPending = false
const isInViewport = ref(true)
// true only while the first-load boot intro (see onMounted) is still
// shrinking the console into its dock ΓÇö startSequence() defers itself
// until it flips back, the same way it already defers on !isInViewport
let bootIntroActive = false
const { appendCode, clearCode, playBootIntro, markBootIntroStarted, markBootIntroTranslateStart, markBootIntroSettled, hasBootIntroPlayed, markBootIntroPlayed, isCloseLocked } = useRightPanelMethods()

const SNIPPET_THEMES = {
	detected1: 'detected',
	detected2: 'detected',
	identified: 'identified',
	solved: 'solved',
}

function logSnippet(key) {
	const snippet = props.infectionSnippets?.[key]?.code
	if (snippet) appendCode(snippet, SNIPPET_THEMES[key])
}

const el = ref(null)
const fadeOverlayEl = ref(null)
const titleRef = ref(null)
const ctaBlockRef = ref(null)
const ctaButtonRef = ref(null)
const context = inject('pageContext')
const emitter = useEmitter()
const enterAnim = gsap.timeline({ paused: true })
const mm = gsap.matchMedia()
let hasInitialized = false

const hoveredTag = ref(false)

watch(allVisible, (val) => {
	if (!val) emitter.emit('CrtCanvas-bitmapTagHover', false)
	else if (hoveredTag.value) emitter.emit('CrtCanvas-bitmapTagHover', true)
})

function startSequence() {
	if (!isInViewport.value || bootIntroActive) {
		sequenceStartPending = true
		return
	}
	sequenceStartPending = false

	globalState.value = 'detected'
	openedIndex.value = -1
	emitter.emit('CrtCanvas-bitmapStartForward')
	emitter.emit('CrtCanvas-bitmapColorShift', true)
	const mosaicProxy = { v: 0.25 }

	activeTweens.push(
		gsap.to(mosaicProxy, {
			v: 0.7,
			duration: 7.5,
			ease: 'power4.in',
			onUpdate: () => emitter.emit('CrtCanvas-bitmapMosaicBlend', mosaicProxy.v),
		})
	)
	const mouseOpacityProxy = { v: 0 }
	activeTweens.push(
		gsap.to(mouseOpacityProxy, {
			v: 0.5,
			duration: 7.5,
			ease: 'power4.in',
			onUpdate: () => emitter.emit('CrtCanvas-bitmapMouseOpacity', mouseOpacityProxy.v),
		})
	)
	const lastT = Math.max(...TAG_POSITIONS.value.map((p) => p.t))
	const firstT = Math.min(...TAG_POSITIONS.value.map((p) => p.t))
	sequenceTl?.kill()
	sequenceTl = gsap.timeline()
	const tl = sequenceTl
	TAG_POSITIONS.value.forEach((pos, i) => {
		tl.call(
			() => {
				visibleStates.value[i] = true
				if (pos.t === firstT) logSnippet('detected1')
				if (pos.t === lastT) logSnippet('detected2')
			},
			null,
			pos.t
		)
	})
	tl.call(
		() => {
			openedIndex.value = 0
		},
		null,
		lastT + 0.5
	)
}

const canHover = import.meta.client ? window.matchMedia('(hover: hover)').matches : true

function onTagMouseenter() {
	if (!canHover) return
	hoveredTag.value = true
	if (allVisible.value && globalState.value !== 'solved') emitter.emit('CrtCanvas-bitmapTagHover', true)
}

function onTagMouseleave() {
	if (!canHover) return
	hoveredTag.value = false
	if (allVisible.value && globalState.value !== 'solved') emitter.emit('CrtCanvas-bitmapTagHover', false)
}

function openTag(stateIndex) {
	openedIndex.value = stateIndex
}

function updateStates(stateIndex) {
	openedIndex.value = -1
	if (globalState.value === 'detected') {
		globalState.value = 'identified'
		logSnippet('identified')
		const tl = gsap.timeline()

		TAG_POSITIONS.value.forEach((_, i) => {
			tl.call(
				() => {
					activeStates.value[i] = 'identified'
				},
				null,
				i * 0.1
			)
		})

		const otherIndices = TAG_POSITIONS.value.map((_, i) => i).filter((i) => i !== stateIndex)
		const randomIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)]
		tl.call(
			() => {
				openedIndex.value = randomIndex
			},
			null,
			TAG_POSITIONS.value.length * 0.1 + 0.2
		)
	} else if (globalState.value === 'identified') {
		globalState.value = 'solved'
		logSnippet('solved')
		const tl = gsap.timeline()

		TAG_POSITIONS.value.forEach((_, i) => {
			tl.call(
				() => {
					activeStates.value[i] = 'solved'
				},
				null,
				i * 0.1
			)
		})

		TAG_POSITIONS.value.forEach((_, i) => {
			tl.call(
				() => {
					visibleStates.value[i] = false
				},
				null,
				1.7 + i * 0.1
			)
			tl.call(
				() => {
					activeStates.value[i] = 'detected'
				},
				null,
				1.7 + i * 0.1 + 1.0
			)
		})

		tl.call(
			() => {
				emitter.emit('CrtCanvas-bitmapRewind')
				clearCode()
			},
			null,
			1.7
		)

		const mosaicProxy = { v: 0.7 }

		gsap.to(mosaicProxy, {
			v: 0.25,
			duration: 0.8,
			delay: 1.7,
			ease: 'power2.in',
			onUpdate: () => emitter.emit('CrtCanvas-bitmapMosaicBlend', mosaicProxy.v),
		})
		openedIndex.value = -1
		emitter.emit('CrtCanvas-bitmapMouseOpacity', 0)
		emitter.emit('CrtCanvas-bitmapColorShift', false)
	}
}

let offListeners = []

const kill = () => {
	sequenceTl?.kill()
	sequenceTl = null
	activeTweens.forEach((tween) => tween.kill())
	activeTweens = []
	sequenceStartPending = false
	activeStates.value = TAG_POSITIONS.value.map(() => 'detected')
	visibleStates.value = TAG_POSITIONS.value.map(() => false)
	tagLabels.value = TAG_POSITIONS.value.map(() => ({ detected: undefined, identified: undefined, solved: undefined }))
	globalState.value = 'detected'
	openedIndex.value = -1
	hoveredTag.value = false

	offListeners.forEach((off) => off())
	offListeners = []
}

const setupViewportObserver = () => {
	if (!el.value) return

	viewportObserver = new IntersectionObserver(
		([entry]) => {
			isInViewport.value = entry.isIntersecting

			if (entry.isIntersecting) {
				emitter.emit('CrtCanvas-bitmapSetPaused', false)

				if (sequenceStartPending) {
					startSequence()
				} else {
					sequenceTl?.paused() && sequenceTl.play()
					activeTweens.forEach((tween) => tween.paused() && tween.play())
				}
			} else {
				sequenceTl?.pause()
				activeTweens.forEach((tween) => tween.pause())
				emitter.emit('CrtCanvas-bitmapSetPaused', true)
			}
		},
		{ threshold: 0.0 }
	)
	viewportObserver.observe(el.value)
}

const isMobile = computed(() => screen.width < breakpoints.small)

const getProxied = (index) => {
	const url = props.background?.sources?.[index]?.url
	if (!url) return null
	return url.replace('https://burospaces1.fra1.cdn.digitaloceanspaces.com', '/media-proxy')
}

const setVideo = () => {
	const proxied = getProxied(isMobile.value ? 1 : 0)
	if (!proxied) return
	emitter.emit('CrtCanvas-setBitmapVideoTexture', proxied)
}

const setupVideoListeners = () => {
	const proxied = getProxied(isMobile.value ? 1 : 0)
	if (!proxied) return

	offListeners.push(emitter.on('CrtCanvas-ready', () => emitter.emit('CrtCanvas-setBitmapVideoTexture', proxied)))
	offListeners.push(
		emitter.on('CrtCanvas-bitmapVideoReady', () => {
			if (fadeOverlayEl.value) gsap.to(fadeOverlayEl.value, { opacity: 0, duration: 1, ease: 'power2.out', pointerEvents: 'none' })
			startSequence()
		})
	)
	offListeners.push(
		emitter.on('CrtCanvas-bitmapRewindComplete', () => {
			startSequence()
		})
	)
}

watch(TAG_POSITIONS, () => {
	kill()
	setVideo()
	setupVideoListeners()
	startSequence()
})

const setupEnterAnim = () => {
	mm.add(`(min-width: ${breakpoints.small + 1}px)`, () => {
		;[titleRef, ctaBlockRef].forEach((blockRef, index) => {
			enterAnim.fromTo(
				blockRef.value,
				{
					x: -20,
					opacity: 0,
				},
				{
					x: 0,
					opacity: 1,
					ease: 'power4.out',
					duration: 2,
				},
				index * 0.2
			)
		})

		if (ctaButtonRef.value) {
			enterAnim.fromTo(
				ctaButtonRef.value,
				{
					y: -10,
					opacity: 0,
				},
				{
					y: 0,
					opacity: 1,
					ease: 'power4.out',
					duration: 1,
				},
				0.35 + 0.1
			)
		}

		if (hasInitialized) enterAnim.restart()
	})
}

const initEnterAnim = () => {
	hasInitialized = true
	return enterAnim.restart()
}

onBeforeUnmount(() => {
	viewportObserver?.disconnect()
	viewportObserver = null
	kill()
})

onMounted(() => {
	const { detected, identified, solved } = props.infectionLabels || {}
	const pick = (arr) => (arr?.length ? arr[Math.floor(Math.random() * arr.length)] : undefined)

	tagLabels.value = TAG_POSITIONS.value.map(() => ({
		detected: pick(detected),
		identified: pick(identified),
		solved: pick(solved),
	}))

	setupViewportObserver()
	// registered immediately regardless of the boot intro below ΓÇö the
	// CrtCanvas-bitmapVideoReady event isn't buffered for late subscribers,
	// and the video can become ready before the intro finishes; startSequence()
	// itself defers via bootIntroActive when that happens
	setupVideoListeners()

	// The boot intro should play only on a genuine hard load of "/" itself ΓÇö
	// never on a client-side navigation, including the first-ever client-side
	// nav to Home when some other page was hard-loaded first. Two unreliable
	// signals were ruled out by logging them across hard-load vs. nav-back
	// scenarios: loader.isHydrationReady (Page.vue creates a fresh loader on
	// every mount, so it's false on every return trip too, not just the true
	// first load) and useNuxtApp().isHydrating (already false by the time this
	// onMounted runs, even on a hard load). What actually works:
	// useNuxtApp().payload.path is the URL that was server-rendered ΓÇö it only
	// equals the current route when this exact page was the one hard-loaded.
	// hasBootIntroPlayed() (module-scoped, see useRightPanelMethods) is kept
	// as a belt-and-suspenders guard against replaying within the same mount.
	const wasThisPageHardLoaded = useNuxtApp().payload?.path === useRoute().path
	const isFirstLoad = wasThisPageHardLoaded && !hasBootIntroPlayed()

	context.$page.loader.loaded.then(() => setupEnterAnim())

	if (isFirstLoad) {
		bootIntroActive = true
		markBootIntroStarted()
		markBootIntroPlayed()
		isCloseLocked.value = true

		context.$page.loader.ready.then(() => {
			emitter.emit('scroller-lock')

			playBootIntro(() => {
				// fires the instant the console starts shrinking into its dock ΓÇö
				// Anchors' page/section terminal typing, Menu's translate-in, and
				// this header's own title/CTA fade-in all start alongside that
				// translation instead of waiting for it to finish
				setTimeout(() => {
					markBootIntroTranslateStart()
					setTimeout(() => {
						initEnterAnim().then(() => {
							isCloseLocked.value = false
						})
					}, 200)
				}, 400)
			}).then(() => {
				emitter.emit('scroller-unlock')

				// only NOW is it safe for anything that writes into the console's
				// own content area (RightPanel's scroll-triggered snippets, this
				// header's infection-tag sequence below) to start ΓÇö the shrink
				// tween that markBootIntroTranslateStart fired at is still
				// occupying that area with the boot text until this resolves
				markBootIntroSettled()
				bootIntroActive = false
				if (sequenceStartPending) startSequence()
			})
		})
	} else {
		context.$page.loader.transitionReady.then(() => initEnterAnim())
	}
})
</script>

<style lang="scss" scoped>
[data-component='header'] {
	position: relative;

	height: 100svh;

	overflow-x: clip;

	.content {
		position: absolute;
		inset: 0;
		padding-top: rs(60, 60);
		z-index: 1;

		pointer-events: none;

		.title {
			color: var(--color-bright-green-500);
			white-space: pre-wrap;
		}

		.cta-block {
			height: fit-content;

			pointer-events: auto;

			.cta-block-inner {
				display: flex;
				flex-direction: column;
				gap: rs(24, 24);
			}

			.description {
				color: var(--color-bright-green-100);
			}
		}

		@include max-width($sm) {
			position: relative;
			height: 100%;
			align-content: space-between;
			padding: rs(90, 90) var(--grid-padding) rs(48, 48);

			.title {
				width: 60%;

				@include max-width($xs) {
					width: 100%;
				}
			}

			.cta-block {
				.description {
					width: 50%;

					@include max-width($xs) {
						width: 80%;
					}
				}
			}
		}
	}

	.background-container {
		position: absolute;
		inset: 0;
	}

	.fade-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		background-color: var(--color-deep-green-800);
		pointer-events: none;
	}

	.gradient-overlay {
		position: absolute;
		bottom: -1px;
		left: 0;
		width: 100%;
		height: 50%;
		background: linear-gradient(to top, var(--color-deep-green-800) 0%, transparent 20%);
		pointer-events: none;
		z-index: 1;
	}

	.radial-overlay {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, transparent 50%, var(--color-deep-green-800) 100%);
		pointer-events: none;
		z-index: 0;
	}

	.tags-wrapper {
		position: absolute;
		width: 100%;
		height: 100%;
		inset: 0;
	}
}
</style>

<template>
	<div ref="el" class="issues-touch">
		<span class="gradient-top" />
		<div class="shader-wrapper">
			<div class="shader-container">
				<span class="shader" data-shader="scan" />
				<div class="frame" ref="frameEl">
					<svg class="frame-svg" xmlns="http://www.w3.org/2000/svg">
						<rect ref="frameRect" class="frame-path" x="0" y="0" width="100%" height="100%" />
					</svg>
					<span class="icon-anchor top-left"><Icon slug="plus" size="s" class="icon" /></span>
					<span class="icon-anchor top-right"><Icon slug="plus" size="s" class="icon" /></span>
					<span class="icon-anchor bottom-left"><Icon slug="plus" size="s" class="icon" /></span>
					<span class="icon-anchor bottom-right"><Icon slug="plus" size="s" class="icon" /></span>
				</div>
				<p v-if="lastDescription" ref="descEl" class="last-description -callout-4 -uppercase">{{ lastDescription }}</p>
			</div>
		</div>

		<div ref="itemEl" class="item" :class="{ 'is-last': activeIndex === list?.length - 1 }">
			<div class="item-inner" :key="activeIndex" :style="{ '--item-max-width': itemMaxWidths[activeIndex] }">
				<SanityContent :blocks="activeTitleBlocks" />
			</div>
		</div>

		<StepSelector ref="stepSelectorEl" :steps="list?.length ?? 1" class="step-selector" />

		<div ref="closureDivRef" class="closure">
			<Icon slug="plus" size="s" />
			<span ref="closureLineEl" class="line" />
		</div>
	</div>
</template>

<script setup>
import { gsap, ScrollTrigger } from 'gsap/all'

import.meta.client && gsap.registerPlugin(ScrollTrigger)
import { useScreen } from 'vue-screen'
import { Icon } from '~/components/core/Icon'
import { StepSelector } from '~/components/primitives/StepSelector'
import { useEmitter, useSwipe } from '~/composables/core'
import { useLetterSwap } from '~/composables/useLetterSwap'

const props = defineProps({
	list: { type: Array, default: undefined },
})

const el = ref(null)
const itemEl = ref(null)
const frameRect = ref(null)
const frameEl = ref(null)
const descEl = ref(null)
const stepSelectorEl = ref(null)
const closureLineEl = ref(null)
const closureDivRef = ref(null)

let iconRotation = 0
let unmounted = false
let frameDrawn = false
let scanPosTween = null
let scanPosValue = { v: 0.25 }

const emitter = useEmitter()
const screen = useScreen()
const context = inject('pageContext')

const lastDescription = computed(() => props.list?.at(-1)?.description)
const itemMaxWidths = ['45%', '35%', '52%', '75%']
const FRAME_PADDING = 80

const activeIndex = ref(0)
const activeTitleBlocks = ref([])

useSwipe(el, {
	onSwipeLeft: () => {
		const stepSelector = stepSelectorEl.value
		if (stepSelector && stepSelector.currentStep < props.list.length - 1) stepSelector.currentStep++
	},
	onSwipeRight: () => {
		const stepSelector = stepSelectorEl.value
		if (stepSelector && stepSelector.currentStep > 0) stepSelector.currentStep--
	},
})

const {
	init: swapInit,
	start: swapStart,
	kill: swapKill,
} = useLetterSwap(itemEl, {
	simultaneous: true,
	swapsPerChar: 5,
	swapSpeed: 0.04,
	deceleration: 0.9,
	blink: true,
	blinkChance: 0.8,
	blinkMaxCount: 10,
	restoreOnKill: false,
})

const updateFrame = () => {
	const inner = itemEl.value?.querySelector('.item-inner')
	const frame = frameEl.value
	const rect = frameRect.value
	if (!inner || !frame || !rect) return

	const bounds = inner.getBoundingClientRect()
	const w = bounds.width + FRAME_PADDING * 2
	const h = bounds.height + FRAME_PADDING * 2

	if (!frameDrawn) {
		const initPad = FRAME_PADDING * 0.25
		const initW = bounds.width + initPad * 2
		const initH = bounds.height + initPad * 2
		const initP = 2 * (initW + initH)

		gsap.set(frame, { width: initW, height: initH })
		gsap.set(rect, { strokeDasharray: initP, strokeDashoffset: initP })

		let frameTween = null

		ScrollTrigger.create({
			trigger: el.value,
			start: 'top 50%',
			once: true,
			onEnter: () => {
				if (frameTween) frameTween.kill()
				emitter.emit('CrtCanvas-issueStep', 0)
				const anim = { progress: 0 }
				frameTween = gsap.to(anim, {
					progress: 1,
					duration: 0.8,
					ease: 'power2.inOut',
					onUpdate: () => {
						const pad = initPad + (FRAME_PADDING - initPad) * anim.progress
						const cw = bounds.width + pad * 2
						const ch = bounds.height + pad * 2
						const p = 2 * (cw + ch)
						gsap.set(frame, { width: cw, height: ch })
						gsap.set(rect, { strokeDasharray: p, strokeDashoffset: p * (1 - anim.progress) })
					},
				})
			},
		})
		frameDrawn = true
	} else {
		gsap.killTweensOf(frame)
		gsap.to(frame, {
			width: w,
			height: h,
			duration: 0.7,
			ease: 'power2.inOut',
			onUpdate: () => {
				if (!gsap.isTweening(rect)) {
					gsap.set(rect, { strokeDasharray: 2 * (frame.offsetWidth + frame.offsetHeight) })
				}
			},
		})
	}
}

let drawFrameRatio = 1
let drawFrameTween = null

const drawFrame = (visible) => {
	const frame = frameEl.value
	const rect = frameRect.value
	if (!frame || !rect) return

	if (drawFrameTween) drawFrameTween.kill()

	const obj = { ratio: drawFrameRatio }
	drawFrameTween = gsap.to(obj, {
		ratio: visible ? 1 : 0,
		duration: 0.8,
		ease: 'power2.inOut',
		onUpdate: () => {
			drawFrameRatio = obj.ratio
			const p = 2 * (frame.offsetWidth + frame.offsetHeight)
			gsap.set(rect, { strokeDasharray: p, strokeDashoffset: p * (1 - obj.ratio) })
		},
		onComplete: () => {
			drawFrameTween = null
		},
	})
}

const animateIcons = (index, prevIndex) => {
	const icons = Array.from(frameEl.value?.querySelectorAll('.icon') ?? [])
	if (!icons.length) return

	const lastIndex = props.list.length - 1
	if (index !== lastIndex && prevIndex !== lastIndex) {
		iconRotation += 180
		gsap.to([icons[1], icons[2]], { rotation: iconRotation, stagger: 0.3, duration: 0.5, ease: 'power2.inOut' })
	}

	const scanTargets = [0.25, 0.5, 0.75]
	if (index === 1) {
		gsap.to(icons[1], { '--icon-color': '#de2d3b', duration: 0.7, ease: 'power1.inOut' })
		gsap.to(icons[2], { '--icon-color': '#fbbf24', duration: 0.7, ease: 'power1.inOut' })
		emitter.emit('CrtCanvas-issueStep', 1)
		if (scanPosTween) scanPosTween.kill()
		scanPosTween = gsap.to(scanPosValue, { v: scanTargets[1], duration: 1.0, ease: 'power3.out', onUpdate: () => emitter.emit('CrtCanvas-scan', (scanPosValue.v - 0.25) * 2) })
	} else if (index === 2) {
		gsap.to([icons[1], icons[2]], { '--icon-color': '#5eff88', duration: 0.7, ease: 'power1.inOut' })
		emitter.emit('CrtCanvas-issueStep', 2)
		if (scanPosTween) scanPosTween.kill()
		scanPosTween = gsap.to(scanPosValue, { v: scanTargets[2], duration: 1.0, ease: 'power3.out', onUpdate: () => emitter.emit('CrtCanvas-scan', (scanPosValue.v - 0.25) * 2) })
	} else if (index === 0) {
		gsap.to([icons[1], icons[2]], { '--icon-color': '#5eff88', duration: 0.7, ease: 'power1.inOut' })
		emitter.emit('CrtCanvas-issueStep', 0)
		if (scanPosTween) scanPosTween.kill()
		scanPosTween = gsap.to(scanPosValue, { v: scanTargets[0], duration: 1.0, ease: 'power3.out', onUpdate: () => emitter.emit('CrtCanvas-scan', (scanPosValue.v - 0.25) * 2) })
	} else if (index === lastIndex) {
		gsap.to(icons, { '--icon-color': '#5eff88', duration: 0.7, ease: 'power1.inOut' })
		emitter.emit('CrtCanvas-issueStep', 3)
	}
}

watch(
	() => stepSelectorEl.value?.currentStep,
	(index) => {
		if (unmounted || index === undefined) return
		activeIndex.value = index
	}
)

watch(activeIndex, async (index, prevIndex) => {
	if (unmounted) return
	const lastIndex = props.list.length - 1
	swapKill()
	activeTitleBlocks.value = props.list[index]?.title ?? []
	await nextTick()
	if (unmounted) return
	swapInit()
	swapStart()

	const icons = Array.from(frameEl.value?.querySelectorAll('.icon') ?? [])
	const line = closureLineEl.value

	if (index === lastIndex) {
		updateFrame()
		drawFrame(false)
		gsap.fromTo(descEl.value, { opacity: 0, y: 12 }, { opacity: 1, delay: 0.3, y: 0, duration: 0.3, ease: 'power2.out' })
		const target = closureDivRef.value?.querySelector('[data-component="icon"]') ?? null
		gsap.killTweensOf(icons)
		gsap.killTweensOf(frameEl.value)
		if (target && icons.length) {
			const iconData = icons.map((icon) => ({
				icon,
				currentX: gsap.getProperty(icon, 'x'),
				currentY: gsap.getProperty(icon, 'y'),
				rect: icon.getBoundingClientRect(),
			}))
			const targetRect = target.getBoundingClientRect()
			const targetCX = targetRect.left + targetRect.width / 2
			const targetCY = targetRect.top + targetRect.height / 2
			iconData.forEach(({ icon, currentX, currentY, rect }, i) => {
				gsap.set(icon, { x: currentX, y: currentY })
				const iconCX = rect.left + rect.width / 2
				const iconCY = rect.top + rect.height / 2
				const delay = i * 0.05
				gsap.to(icon, { x: currentX + (targetCX - iconCX), y: currentY + (targetCY - iconCY), duration: 0.6, delay, ease: 'power2.inOut' })
				gsap.to(icon, { '--icon-color': 'var(--color-bright-green-50)', opacity: i === 0 ? 1 : 0, duration: 0.25, delay: delay + 0.2, ease: 'power2.in' })
			})
		}
		if (line) {
			gsap.killTweensOf(line)
			gsap.set(line, { transformOrigin: 'top center' })
			gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 1.8, delay: 0.7, ease: 'expo.out' })
		}
	} else {
		if (prevIndex === lastIndex) {
			gsap.to(descEl.value, { opacity: 0, y: 12, duration: 0.1, ease: 'power2.in' })
			updateFrame()
			drawFrame(true)
			gsap.killTweensOf(icons)
			icons.forEach((icon, i) => {
				const delay = i * 0.05
				gsap.to(icon, { opacity: 1, '--icon-color': 'var(--color-bright-green-500)', duration: 0.25, delay: delay + 0.1, ease: 'power2.out' })
				gsap.to(icon, { x: 0, y: 0, duration: 0.5, delay, ease: 'power2.inOut', onComplete: i === icons.length - 1 ? () => gsap.set(icons, { clearProps: 'x,y' }) : undefined })
			})
			if (line) {
				gsap.killTweensOf(line)
				gsap.to(line, { scaleY: 0, transformOrigin: 'top center', duration: 0.2, ease: 'power2.in' })
			}
		} else {
			updateFrame()
		}
	}

	animateIcons(index, prevIndex ?? 0)
})

watch(
	() => screen.width,
	() => {
		swapKill()
		swapInit()
		updateFrame()
	}
)

onMounted(() => {
	activeTitleBlocks.value = props.list?.[0]?.title ?? []
	context.$page.loader.hydrationReady.then(() => {
		nextTick().then(() => {
			updateFrame()
			swapInit()
			swapStart()
		})
	})
})

onBeforeUnmount(() => {
	unmounted = true
})
</script>

<style lang="scss" scoped>
.issues-touch {
	position: relative;
	width: 100%;
	height: 100vh;

	overflow: hidden;

	.gradient-top {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 30%;
		z-index: 3;
		pointer-events: none;
		background: linear-gradient(to bottom, var(--color-deep-green-800) 5%, transparent 100%);
	}

	.shader-wrapper {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;

		.shader-container {
			position: relative;
			width: 100%;
			height: 100%;

			.shader {
				width: 100%;
				height: 100%;
			}

			.frame {
				--icon-color: var(--color-bright-green-500);

				position: absolute;
				top: 50%;
				left: 50%;
				width: 0;
				height: 0;
				transform: translate(-50%, -50%);

				.frame-svg {
					position: absolute;
					inset: 0;
					width: 100%;
					height: 100%;
					overflow: visible;
					pointer-events: none;

					.frame-path {
						fill: none;
						stroke: var(--color-deep-green-400);
						stroke-width: 1;

						opacity: 0.5;
					}
				}

				.icon-anchor {
					position: absolute;

					&.top-left {
						top: 0;
						left: 0;
						transform: translate(calc(-50% - 0.5px), calc(-50% - 0.5px));
					}
					&.top-right {
						top: 0;
						right: 0;
						transform: translate(calc(50% + 0.5px), calc(-50% - 0.5px));
					}
					&.bottom-left {
						bottom: 0;
						left: 0;
						transform: translate(calc(-50% - 0.5px), calc(50% + 0.5px));
					}
					&.bottom-right {
						bottom: 0;
						right: 0;
						transform: translate(calc(50% + 0.5px), calc(50% + 0.5px));
					}
				}

				.icon {
					display: block;
				}
			}

			.last-description {
				position: absolute;
				top: 62%;
				left: 50%;
				transform: translateX(-50%);
				text-align: center;
				width: 80%;
				opacity: 0;
				color: var(--color-bright-green-100);
			}
		}
	}

	.item {
		position: absolute;
		inset: 0;

		display: flex;
		align-items: center;
		justify-content: center;

		@include numbers-1;
		font-size: rs(92, 48);
		text-align: center;

		color: var(--color-bright-green-100);

		.item-inner {
			display: flex;
			justify-content: center;
			max-width: var(--item-max-width, 80%);
		}

		&.is-last {
			color: var(--color-bright-green-500);

			:deep(p) {
				color: var(--color-bright-green-500);
			}
		}

		:deep(strong) {
			@include numbers-1;
			text-shadow: 0 0 10px var(--color-bright-green-100);

			font-size: rs(92, 42);
		}

		:deep(em) {
			@include numbers-1;
			font-style: normal;
			color: transparent;
			-webkit-text-stroke: 1px var(--color-bright-green-100);

			font-size: rs(92, 42);
		}
	}

	.step-selector {
		position: absolute;
		bottom: rs(96, 64);
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
	}

	.closure {
		--icon-color: var(--color-bright-green-50);

		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 1px;
		height: 25%;

		display: flex;
		flex-direction: column;
		align-items: center;

		gap: rs(12, 12);

		:deep([data-component='icon']) {
			opacity: 0;
		}

		.line {
			width: 1px;
			flex: 1;
			flex-shrink: 0;
			background-color: var(--color-bright-green-50);
			transform: scaleY(0);
			transform-origin: top center;
		}
	}
}
</style>

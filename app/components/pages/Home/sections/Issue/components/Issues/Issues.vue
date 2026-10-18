<template>
	<div ref="el" class="issues" :style="{ '--items-count': list?.length }">
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

		<div class="items-track">
			<div ref="itemEl" class="item" :class="{ 'is-last': activeTitle === list?.length - 1 }">
				<div class="item-inner" :key="activeTitle" :style="{ '--item-max-width': itemMaxWidths[activeTitle] }">
					<SanityContent :blocks="activeTitleBlocks" />
				</div>
			</div>
			<div v-if="visibleSlots.length" class="snippets-layer">
				<code v-for="(slot, i) in visibleSlots" :key="i" :ref="(el) => setSnippetRef(el, i)" class="snippet" :style="slot.position" />
			</div>
		</div>
	</div>
</template>

<script setup>
import { gsap, ScrollTrigger } from 'gsap/all'
import { useScreen } from 'vue-screen'
import { Icon } from '~/components/core/Icon'
import { useEmitter } from '~/composables/core'
import { useLetterSwap } from '~/composables/useLetterSwap'
import { useRightPanelMethods } from '~/composables/useRightPanelMethods'
import { useTerminalType } from '~/composables/useTerminalType'

import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	list: { type: Array, default: undefined },
	sectionEl: { type: Object, default: null },
	closureIconEl: { type: Object, default: null },
	closureLineEl: { type: Object, default: null },
})

const el = ref(null)
const itemEl = ref(null)
const frameRect = ref(null)
const frameEl = ref(null)
const descEl = ref(null)

let frameDrawn = false
let iconRotation = 0
let unmounted = false

const context = inject('pageContext')
const emitter = useEmitter()
const screen = useScreen()
const { isOpen: isPanelOpen } = useRightPanelMethods()

const lastDescription = computed(() => props.list?.at(-1)?.description)

const itemMaxWidths = ['40%', '30%', '45%', '75%']
const getFramePadding = () => (import.meta.client ? Math.round(window.innerWidth * 0.08) : 120)

// ---- Snippet system ----
const CYCLE_ANCHORS_BY_STEP = {
	default: [
		[
			{ top: 15, left: 8 },
			{ top: 25, left: 85 },
			{ top: 80, left: 35 },
		],
		[
			{ top: 10, left: 45 },
			{ top: 70, left: 74 },
			{ top: 60, left: 12 },
		],
	],
	// step index 1 (second step)
	1: [
		[
			{ top: 15, left: 30 },
			{ top: 35, left: 85 },
			{ top: 65, left: 15 },
			{ top: 85, left: 70 },
		],
		[
			{ top: 30, left: 10 },
			{ top: 10, left: 65 },
			{ top: 60, left: 80 },
			{ top: 82, left: 40 },
		],
	],
	// step index 2 (third / last visible step)
	3: [
		[
			{ top: 115, left: 15 },
			{ top: 105, left: 70 },
			{ top: 15, left: 60 },
		],
		[
			{ top: 60, left: 80 },
			{ top: 80, left: 20 },
			{ top: 25, left: 10 },
		],
	],
}

const TYPING_PARAMS_BY_STEP = {
	default: { typingSpeed: 0.02, typingVariance: 0.005, showCursor: true, multiline: true },
	1: {
		typingSpeed: 0.01,
		typingVariance: 0.002,
		showCursor: false,
		multiline: true,
		swapParams: {
			scatter: true,
			scatterDensity: 0.15,
			scatterStagger: 0.6,
			swapSpeed: 0.06,
			swapsPerChar: 2,
			loop: true,
			restoreOnKill: false,
			blink: true,
			blinkChance: 0.9,
			blinkMaxCount: 10,
		},
	},
}

const POSITION_MARGIN = 5

const randomPositionAnchored = (anchor) => ({
	top: `${anchor.top + (Math.random() * 2 - 1) * POSITION_MARGIN}%`,
	left: `${anchor.left + (Math.random() * 2 - 1) * POSITION_MARGIN}%`,
})

// Two independent cycles, each with own state. gen guards against overlapping
// initOneCycle() calls: rapid activeTitle changes can start a new init before an
// older one's pending awaits (nextTick, instance.start()) resolve ΓÇö without this,
// the older call resumes and mutates visibleSlots/instances out from under the
// newer one (or reads a visibleSlots the newer killCycle() already emptied).
const cycles = [
	{ visibleSlots: ref([]), instances: [], swapInsts: [], hiddenDataIndex: -1, active: false, slotIndex: 0, timer: null, typingParams: null, gen: 0 },
	{ visibleSlots: ref([]), instances: [], swapInsts: [], hiddenDataIndex: -1, active: false, slotIndex: 0, timer: null, typingParams: null, gen: 0 },
]

// Flatten slots from both cycles for the template
const visibleSlots = computed(() => [...cycles[0].visibleSlots.value, ...cycles[1].visibleSlots.value])

const snippetElRefs = ref([])

const setSnippetRef = (el, i) => {
	snippetElRefs.value[i] = el
}

const killCycle = (c) => {
	c.gen++
	c.active = false
	clearTimeout(c.timer)
	c.swapInsts.forEach((s) => s?.kill())
	c.swapInsts = []
	c.instances.forEach((inst) => inst?.kill())
	c.instances = []
	c.visibleSlots.value = []
}

const killSnippets = () => {
	cycles.forEach(killCycle)
	snippetElRefs.value = []
}

const deleteCycle = async (c) => {
	c.active = false
	clearTimeout(c.timer)
	c.swapInsts.forEach((s) => s?.kill())
	c.swapInsts = []
	c.instances.forEach((inst) => inst?.stopTyping())
	await Promise.all(c.instances.map((inst) => inst?.deleteCharByChar()))
	c.instances.forEach((inst) => inst?.kill())
	c.instances = []
	if (!unmounted) c.visibleSlots.value = []
}

const deleteAllSnippets = async () => {
	await Promise.all(cycles.map(deleteCycle))
	snippetElRefs.value = []
}

const startSwapLoop = (el, c, slotI) => {
	c.swapInsts[slotI]?.kill()
	const swap = useLetterSwap(ref(el), c.typingParams.swapParams)
	swap.init()
	swap.start()
	c.swapInsts[slotI] = swap
}

const runCycle = async (snippets, c, anchors, globalBase) => {
	if (!c.active) return

	const slotI = c.slotIndex % c.visibleSlots.value.length
	const inst = c.instances[slotI]
	const el = snippetElRefs.value[globalBase + slotI]
	if (!inst || !el) return

	c.swapInsts[slotI]?.kill()
	c.swapInsts[slotI] = null
	inst.stopTyping()
	await inst.deleteCharByChar()
	if (!c.active) return

	const oldDataIndex = c.visibleSlots.value[slotI].dataIndex
	c.visibleSlots.value[slotI].dataIndex = c.hiddenDataIndex
	c.visibleSlots.value[slotI].position = randomPositionAnchored(anchors[slotI % anchors.length])
	c.hiddenDataIndex = oldDataIndex

	await nextTick()
	if (!c.active) return

	const freshEl = snippetElRefs.value[globalBase + slotI]
	if (!freshEl) return
	freshEl.style.whiteSpace = 'pre-wrap'
	freshEl.innerHTML = snippets[c.visibleSlots.value[slotI].dataIndex]?.code ?? ''
	inst.kill()
	const newInst = useTerminalType(ref(freshEl), c.typingParams)
	c.instances[slotI] = newInst
	newInst.init()
	await newInst.start()
	if (!c.active) return

	if (c.useSwap) startSwapLoop(freshEl, c, slotI)

	c.slotIndex++
	c.timer = setTimeout(() => runCycle(snippets, c, anchors, globalBase), 400)
}

const initOneCycle = async (snippets, c, anchors, typingParams, useSwap, globalBase, startDelay = 600) => {
	const gen = c.gen
	const count = Math.min(anchors.length, snippets.length - 1)
	c.hiddenDataIndex = (snippets.length - 1 + globalBase) % snippets.length
	c.typingParams = typingParams
	c.useSwap = useSwap

	c.visibleSlots.value = Array.from({ length: count }, (_, i) => ({
		dataIndex: (i + globalBase) % snippets.length,
		position: randomPositionAnchored(anchors[i]),
	}))

	await nextTick()
	if (c.gen !== gen) return

	c.instances = Array.from({ length: count }, (_, i) => {
		const el = snippetElRefs.value[globalBase + i]
		if (!el) return null
		el.style.whiteSpace = 'pre-wrap'
		el.innerHTML = snippets[c.visibleSlots.value[i].dataIndex]?.code ?? ''
		const inst = useTerminalType(ref(el), typingParams)
		inst.init()
		return inst
	})

	await Promise.all(c.instances.map((inst) => inst?.start()))
	if (c.gen !== gen) return

	if (c.useSwap) {
		c.instances.forEach((_, i) => {
			const el = snippetElRefs.value[globalBase + i]
			if (el) startSwapLoop(el, c, i)
		})
	}

	c.active = true
	c.slotIndex = 0
	c.timer = setTimeout(() => runCycle(snippets, c, anchors, globalBase), startDelay)
}

const initSnippetsCycle = async (snippets, stepIndex) => {
	const anchors = CYCLE_ANCHORS_BY_STEP[stepIndex] ?? CYCLE_ANCHORS_BY_STEP.default
	const typingParams = TYPING_PARAMS_BY_STEP[stepIndex] ?? TYPING_PARAMS_BY_STEP.default
	const useSwap = stepIndex === 1
	const c0Count = Math.min(anchors[0].length, snippets.length - 1)
	await Promise.all([initOneCycle(snippets, cycles[0], anchors[0], typingParams, useSwap, 0, 600), initOneCycle(snippets, cycles[1], anchors[1], typingParams, useSwap, c0Count, 1000)])
}

const initSnippets = async (snippets, stepIndex) => {
	killSnippets()
	if (!snippets?.length || snippets.length < 2) return
	await initSnippetsCycle(snippets, stepIndex)
}
// ---- End snippet system ----

const scanProgress = ref(0)
const activeTitle = ref(0)
const activeTitleBlocks = ref([])
let scrollTrigger
let step4Trigger
let bgNoiseTrigger
let step4Active = false

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

// immediately on panel toggle, independent of scroll/swap timing.
watch(isPanelOpen, () => {
	if (!itemEl.value) return
	itemEl.value.style.minWidth = ''
	itemEl.value.style.minHeight = ''
})

watch(scanProgress, (v) => {
	if (step4Active) return
	emitter.emit('CrtCanvas-scan', v)
	const count = props.list.length - 1
	const next = Math.min(Math.floor(v * count), count - 1)
	if (next !== activeTitle.value) activeTitle.value = next
})

const updateFrame = () => {
	const inner = itemEl.value?.querySelector('.item-inner')
	const frame = frameEl.value
	const rect = frameRect.value
	if (!inner || !frame || !rect) return

	const FRAME_PADDING = getFramePadding()
	const bounds = inner.getBoundingClientRect()

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
			start: 'top top',
			onEnter: () => {
				if (frameTween) frameTween.kill()
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
			onLeaveBack: () => {
				if (frameTween) frameTween.kill()
				const anim = { progress: 0 }
				frameTween = gsap.to(anim, {
					progress: 1,
					duration: 0.5,
					ease: 'power2.inOut',
					onUpdate: () => {
						const pad = FRAME_PADDING + (initPad - FRAME_PADDING) * anim.progress
						const cw = bounds.width + pad * 2
						const ch = bounds.height + pad * 2
						const p = 2 * (cw + ch)
						gsap.set(frame, { width: cw, height: ch })
						gsap.set(rect, { strokeDasharray: p, strokeDashoffset: p * anim.progress })
					},
				})
			},
		})
		frameDrawn = true
	} else {
		const w = bounds.width + FRAME_PADDING * 2
		const h = bounds.height + FRAME_PADDING * 2
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

let drawFrameRatio = 1 // 1 = fully drawn, 0 = fully undrawn
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

	if (index === 1) {
		gsap.to(icons[1], { '--icon-color': '#de2d3b', duration: 0.7, ease: 'power1.inOut' })
		gsap.to(icons[2], { '--icon-color': '#fbbf24', duration: 0.7, ease: 'power1.inOut' })
		emitter.emit('CrtCanvas-issueStep', 1)
	} else if (index === 2) {
		gsap.to([icons[1], icons[2]], { '--icon-color': '#5eff88', duration: 0.7, ease: 'power1.inOut' })
		emitter.emit('CrtCanvas-issueStep', 2)
	} else if (index === 0) {
		gsap.to([icons[1], icons[2]], { '--icon-color': '#5eff88', duration: 0.7, ease: 'power1.inOut' })
		emitter.emit('CrtCanvas-issueStep', 0)
	} else if (index === props.list.length - 1) {
		gsap.to(icons, { '--icon-color': '#5eff88', duration: 0.7, ease: 'power1.inOut' })
		emitter.emit('CrtCanvas-issueStep', 3)
	}
}

watch(activeTitle, async (index, prevIndex) => {
	if (unmounted) return
	const lastIndex = props.list.length - 1
	swapKill()
	activeTitleBlocks.value = props.list[index]?.title ?? []
	deleteAllSnippets().then(() => !unmounted && initSnippets(props.list[index]?.snippets, index))
	await nextTick()
	if (unmounted || activeTitle.value !== index) return
	swapInit()
	swapStart()
	if (index === lastIndex) {
		updateFrame()
		drawFrame(false)
		gsap.fromTo(descEl.value, { opacity: 0, y: 12 }, { opacity: 1, delay: 0.3, y: 0, duration: 0.3, ease: 'power2.out' })
	} else {
		if (prevIndex === lastIndex) {
			gsap.to(descEl.value, { opacity: 0, y: 12, duration: 0.1, ease: 'power2.in' })
			updateFrame()
			drawFrame(true)
		} else {
			updateFrame()
		}
	}
	animateIcons(index, prevIndex)
})

const animateIconsToClosure = (towardsClosure) => {
	const icons = Array.from(frameEl.value?.querySelectorAll('.icon') ?? [])
	const target = props.closureIconEl
	const line = props.closureLineEl
	if (!icons.length || !target) return

	gsap.killTweensOf(icons)
	gsap.killTweensOf(frameEl.value)
	if (line) gsap.killTweensOf(line)

	if (towardsClosure) {
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
			const dx = currentX + (targetCX - iconCX)
			const dy = currentY + (targetCY - iconCY)
			// Arc outward: overshoot x away from center before pulling in
			const overshootX = currentX - (targetCX - iconCX) * 0.35
			const overshootY = currentY + Math.abs(targetCY - iconCY) * 0.2
			// Phase 1: swing outward
			gsap.to(icon, { x: overshootX, y: overshootY, duration: 0.4, delay: i * 0.05, ease: 'power4.out' })
			// Phase 2: pull to target
			gsap.to(icon, { x: dx, y: dy, duration: 0.5, delay: i * 0.1 + 0.25, ease: 'power2.inOut' })
			gsap.to(icon, {
				opacity: i == 0 ? 1 : 0,
				duration: 0.25,
				delay: i * 0.1 + 0.4,
				'--icon-color': 'var(--color-bright-green-50)',
				ease: 'power4.in',
			})
		})

		if (line) {
			gsap.fromTo(line, { scaleY: 0, transformOrigin: 'top center' }, { scaleY: 1, duration: 1.7, delay: 0.7, ease: 'expo.out' })
		}
	} else {
		icons.forEach((icon, i) => {
			gsap.to(icon, {
				opacity: 1,
				duration: 0.25,
				delay: i * 0.05,
				ease: 'power4.in',
			})
			gsap.to(icon, {
				x: 0,
				y: 0,
				'--icon-color': 'var(--color-bright-green-500)',
				duration: 0.7,
				delay: i * 0.05,
				ease: 'power4.inOut',
				onComplete: i === icons.length - 1 ? () => gsap.set(icons, { clearProps: 'x,y' }) : undefined,
			})
		})

		if (line) {
			gsap.to(line, { scaleY: 0, transformOrigin: 'top center', duration: 0.5 })
		}
	}
}

const init = () => {
	if (!el.value) return
	const lastIndex = props.list.length - 1
	const step123Distance = lastIndex * 1.5 * window.innerHeight
	const step4Distance = 0.5 * window.innerHeight
	const track = el.value.querySelector('.items-track')
	track.style.height = step123Distance + window.innerHeight + step4Distance + 'px'

	scrollTrigger = ScrollTrigger.create({
		trigger: el.value,
		start: 'top top',
		end: `+=${step123Distance}`,
		scrub: true,
		onEnter: () => {
			emitter.emit('CrtCanvas-issueStep', 0)
			initSnippets(props.list[activeTitle.value]?.snippets, activeTitle.value)
		},
		onLeaveBack: () => {
			emitter.emit('CrtCanvas-issueLeaveUp')
			deleteAllSnippets()
		},
		onUpdate: ({ progress }) => {
			if (unmounted) return
			scanProgress.value = progress
		},
	})

	step4Trigger = ScrollTrigger.create({
		trigger: el.value,
		start: `top+=${step123Distance} top`,
		onEnter: () => {
			step4Active = true
			activeTitle.value = lastIndex
		},
		onLeaveBack: () => {
			step4Active = false
			activeTitle.value = lastIndex - 1
		},
	})

	ScrollTrigger.create({
		trigger: el.value,
		start: `bottom bottom`,
		end: 'bottom bottom',
		onEnter: () => animateIconsToClosure(true),
		onLeaveBack: () => animateIconsToClosure(false),
	})

	const stepSize = step123Distance / lastIndex
	bgNoiseTrigger = ScrollTrigger.create({
		trigger: el.value,
		start: `top+=${stepSize} top`,
		end: `+=${stepSize}`,
		scrub: true,
		onUpdate: ({ progress }) => {
			emitter.emit('CrtCanvas-issueNoiseSize', progress)
		},
	})
}

const kill = () => {
	scrollTrigger?.kill()
	step4Trigger?.kill()
	bgNoiseTrigger?.kill()
	killSnippets()
}

onBeforeUnmount(() => {
	unmounted = true
	kill()
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
	activeTitleBlocks.value = props.list[0]?.title ?? []
	context.$page.loader.hydrationReady.then(() => {
		init()
		nextTick().then(() => {
			swapInit()
			swapStart()
			updateFrame()
		})
	})
})
</script>

<style lang="scss" scoped>
.issues {
	position: relative;

	.shader-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 2;

		.shader-container {
			position: sticky;
			top: 0;
			width: 100%;
			height: 100vh;

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
			}

			.last-description {
				position: absolute;

				bottom: 25%;
				left: 50%;
				transform: translateX(-50%);

				text-align: center;
				width: column-width(12);
				opacity: 0;
				color: var(--color-bright-green-100);
			}
		}
	}

	.items-track {
		height: calc(var(--items-count, 3) * 200vh);

		.item {
			position: sticky;
			top: 0;
			width: 100%;
			height: 100vh;

			display: flex;
			align-items: center;
			justify-content: center;

			@include numbers-1;
			text-align: center;
			text-wrap: balance;

			color: var(--color-bright-green-100);

			.item-inner {
				display: flex;
				justify-content: center;
				max-width: var(--item-max-width, 40%);
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
			}

			:deep(em) {
				@include numbers-1;
				font-style: normal;
				color: transparent;
				-webkit-text-stroke: 1px var(--color-bright-green-100);
			}
		}

		.snippets-layer {
			position: sticky;
			top: 0;
			width: 100%;
			height: 100vh;
			margin-top: -100vh;
			pointer-events: none;

			opacity: 0.5;

			.snippet {
				position: absolute;
				white-space: pre-wrap;
				@include mono-2;
				color: var(--color-deep-green-425);

				:deep(span),
				:deep(div) {
					@include mono-2;
					white-space: pre-wrap !important;
				}
			}
		}
	}
}
</style>

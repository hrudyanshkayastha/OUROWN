<template>
	<div
		v-if="!isMobile"
		ref="el"
		data-component="function-snippet"
		:class="{ 'has-shadow': shadow }"
		:style="{ '--x-offset': `${xOffset}px`, '--y-offset': `${yOffset}px` }"
	>
		<div class="container">
			<div class="snippet">
				<span class="bg" />
				<span ref="cursor" class="cursor" />

				<span ref="func" class="-mono-1 function-container">
					<span class="-mono-1 domain">{{ domain }}</span>
					<span v-if="domain" class="-mono-1 dot">.</span>
					<span class="-mono-1 function">{{ name }}</span>
					<span class="-mono-1 parenthesis">(</span>
					<span class="-mono-1 arguments">{{ args?.join(',') }}</span>
					<span class="-mono-1 parenthesis">)</span>
					<span class="-mono-1 semicolon">;</span>
				</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { gsap, ScrollTrigger } from 'gsap/all'
import { useScreen } from 'vue-screen'

import { useTerminalType } from '~/composables'
import { useClientOnlyComputed } from '~/composables/core'
import { breakpoints } from '~/config'

import { getRandom } from '~/utils/math'

import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	domain: { type: String, default: undefined },
	name: { type: String, default: undefined },
	args: { type: Array, default: undefined },
	xOffset: { type: Number, default: 0 },
	yOffset: { type: Number, default: 0 },
	shadow: { type: Boolean, default: false },
})

const el = ref(null)
const func = ref(null)
const cursor = ref(null)
const context = inject('pageContext')

const screen = useScreen()
const isMobile = useClientOnlyComputed(true, () => screen.width < breakpoints.xsmall, screen)

let blinkTimeline
let intersectionObserver

const snippetTerminal = useTerminalType(func, {
	typingSpeed: 0.06,
	typingVariance: 0.03,
	typoChance: 0.15,
})

const startCursorBlink = () => {
	if (blinkTimeline) blinkTimeline.resume()
	else {
		blinkTimeline = gsap.timeline({ repeat: -1 })
		blinkTimeline
			.to(cursor.value, {
				opacity: 0,
				duration: 0.3,
				ease: 'power2.inOut',
			})
			.to(cursor.value, {
				opacity: 1,
				duration: 0.3,
				ease: 'power2.inOut',
			})
	}
}

const setupViewportObserver = () => {
	intersectionObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					if (snippetTerminal.isTypingComplete.value) startCursorBlink()
				} else {
					if (blinkTimeline) blinkTimeline.pause()
				}
			})
		},
		{ threshold: 0.0 }
	)

	intersectionObserver.observe(cursor.value)
}

watch(
	() => snippetTerminal.isTypingComplete.value,
	(isComplete) => {
		if (isComplete) {
			// Only start blinking if element is in viewport
			const rect = el.value.getBoundingClientRect()
			const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
			if (isInViewport) {
				startCursorBlink()
			}
		}
	}
)

const setup = () => {}

const init = () => {
	snippetTerminal.init()

	nextTick(() => {
		const random = getRandom(10, 20)
		const direction = getRandom(0, 1) === 0 ? 1 : -1
		const halfHeight = (el.value?.offsetHeight ?? 0) / 2

		gsap.fromTo(
			el.value.querySelector('.snippet'),
			{
				y: halfHeight,
				rotation: random * direction,
			},
			{
				y: halfHeight * -1,
				rotation: random * direction * -1,
				ease: 'none',
				scrollTrigger: {
					trigger: el.value,
					start: 'top bottom',
					end: 'bottom top',
					scrub: true,
				},
			}
		)

		gsap.fromTo(
			cursor.value,
			{
				scale: 0.1,
				opacity: 0,
			},
			{
				scale: 1,
				opacity: 1,
				ease: 'power4.out',
				scrollTrigger: {
					trigger: el.value.querySelector('.snippet'),
					start: 'top bottom',
				},
			}
		)

		gsap.fromTo(
			[el.value.querySelector('.bg'), el.value.querySelector('.function-container')],
			{
				scale: 0.9,
				opacity: 0,
			},
			{
				scale: 1,
				opacity: 1,
				ease: 'power4.out',
				scrollTrigger: {
					trigger: el.value.querySelector('.container'),
					start: 'top bottom',
				},
				onComplete: () => {
					snippetTerminal.start()
				},
			}
		)

		setupViewportObserver()
	})
}

const kill = () => {
	//gsap.killTweensOf([el.value.querySelector('.snippet'), el.value.querySelector('.cursor'), el.value.querySelector('.function-container'), el.value.querySelector('.bg')])

	snippetTerminal.kill()
	blinkTimeline?.kill()
	blinkTimeline = null
	intersectionObserver?.disconnect()
	intersectionObserver = null
	ScrollTrigger.getAll().forEach((trigger) => {
		if (trigger.vars.trigger === el.value || el.value?.contains(trigger.vars.trigger)) {
			trigger.kill()
		}
	})
}

//onBeforeUnmount(() => kill())
onUnmounted(() => kill())

watch(isMobile, (mobile, wasMobile) => {
	if (mobile) {
		if (!wasMobile) kill()
		return
	}
	context.$page.loader.ready.then(() => nextTick(() => init()))
})
</script>

<style lang="scss" scoped>
[data-component='function-snippet'] {
	position: absolute;
	inset: 0;

	display: flex;
	align-items: center;
	justify-content: center;

	pointer-events: none;

	color: var(--color-bright-green-500); // define the cursor color

	.container {
		translate: var(--x-offset, 0px) var(--y-offset, 0px);
	}

	.snippet {
		position: relative;
		padding: rs(12, 8);

		display: flex;
		align-items: center;
		justify-content: center;
		gap: rs(6);
	}

	.bg {
		position: absolute;
		inset: 0;

		display: block;
		border-radius: 8px;
		background: var(--functionSnippet-color-bg, rgb(from var(--color-deep-green-500) r g b / 0.9));

		backdrop-filter: blur(4px);

		opacity: 0;

		.has-shadow & {
			box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.08);
		}

		@supports (corner-shape: superellipse(1.5)) {
			& {
				border-radius: 12px;
				corner-shape: superellipse(1.5);
			}
		}
	}

	.cursor {
		position: relative;

		display: block;
		width: rs(10, 10);
		height: rs(12, 12);

		background-color: var(--functionSnippet-color-0, var(--color-bright-green-500));
		opacity: 0;
	}

	.function-container {
		position: relative;

		opacity: 0;

		.domain,
		.dot {
			color: var(--functionSnippet-color-2, #569cd6);
		}

		.function {
			color: var(--functionSnippet-color-3, #4ec9b0);
		}

		.parenthesis {
			color: var(--functionSnippet-color-4, var(--color-bright-green-500));
		}

		.arguments {
			color: var(--functionSnippet-color-5, #b5cea8);
		}
	}
}
</style>

<template>
	<div ref="el" data-component="pre-footer" data-menu-theme="light" data-panel-shrink>
		<div class="shader-wrapper scene-container" :data-shader="isBars2 ? 'preFooterBars2' : 'preFooter'">
			<FunctionSnippet v-if="functionSnippet && functionSnippet.enabled" :domain="functionSnippet.domain" :name="functionSnippet.name" :args="functionSnippet.args" />
		</div>

		<div class="masked-content">
			<div class="sticky-viewport">
				<div class="parallax">
					<div class="parallax-inner">
						<div ref="containerRef" class="container">
							<div class="titles">
								<h2 class="title1 -uppercase -callout-2">{{ title[0] }}</h2>
								<h2 class="title2 -uppercase -callout-2">{{ title[1] }}</h2>
							</div>
							<ButtonList ref="buttonListRef" :buttons="buttonCtaList" theme="light" :center="true" />
							<p class="description -text-2">{{ description }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { gsap, ScrollTrigger } from 'gsap/all'
import { useEmitter } from '~/composables/core'
import { useScreen } from 'vue-screen'

import { FunctionSnippet } from '~/components/primitives/FunctionSnippet'
import { ButtonList } from '~/components/fragments/ButtonList'
import { useRightPanelMethods } from '~/composables'

import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	title: { type: Array, default: undefined },
	description: { type: String, default: '' },
	buttonCtaList: { type: Array, default: undefined },
	functionSnippet: { type: Object, default: undefined },
	consoleSnippet: { type: Object, default: undefined },
	barsVariant: { type: String, default: 'bars1' },
})

const el = ref(null)
const containerRef = ref(null)
const buttonListRef = ref(null)
const context = inject('pageContext')
const emitter = useEmitter()
const screen = useScreen()
const { appendCode } = useRightPanelMethods()

const isBars2 = computed(() => props.barsVariant === 'bars2')

let t1, t2, t3, t4, t5, t6, t7, consoleSnippetTrigger

const barsState = { bottom: 0, top: 0 }
const bars2State = { bottom: 0, top: 0, freqBottom: 6.0, freqTop: 4.0 }

const emitBars = () => emitter.emit('CrtCanvas-preFooter', { bottom: barsState.bottom, top: barsState.top, color: barsState.bottom })
const emitBars2 = () =>
	emitter.emit('CrtCanvas-preFooterBars2', {
		bottom: bars2State.bottom,
		top: bars2State.top,
		freqBottom: bars2State.freqBottom,
		freqTop: bars2State.freqTop,
	})

watch(screen, () => {
	kill()
	nextTick(() => init())
})

const syncContainerOpacity = () => {
	if (!containerRef.value) return

	const fadeOutTrigger = t6
	const fadeInTrigger = t2

	let opacity = 1
	if (fadeOutTrigger && fadeOutTrigger.progress > 0) {
		opacity = 1 - fadeOutTrigger.progress * (isBars2.value ? 3 : 2.5)
	} else if (fadeInTrigger) {
		const eased = fadeInTrigger.progress * fadeInTrigger.progress
		opacity = eased
	}

	gsap.set(containerRef.value, { opacity })
}

emitter.on('CrtCanvas-update', (options = {}) => {
	if (options.skipPreFooterRefresh) return

	ScrollTrigger.refresh()
	syncContainerOpacity()
})

const initBars1 = () => {
	t1 = ScrollTrigger.create({
		trigger: el.value,
		start: '45% top',
		end: '55% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			barsState.bottom = progress * 0.35
			emitBars()
		},
	})

	t3 = ScrollTrigger.create({
		trigger: el.value,
		start: '55% top',
		end: '90% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			barsState.bottom = 0.35 + progress * 0.65
		},
	})

	t5 = ScrollTrigger.create({
		trigger: el.value,
		start: '45% top',
		end: '55% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			barsState.top = progress * 0.35
			emitBars()
		},
	})

	t6 = ScrollTrigger.create({
		trigger: el.value,
		start: '55% top',
		end: '90% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			barsState.top = 0.35 + progress * 0.65
			emitBars()
			gsap.set(containerRef.value, { opacity: 1 - progress * 2.5 })
		},
	})
}

const initBars2 = () => {
	t4 = ScrollTrigger.create({
		trigger: el.value,
		start: '45% top',
		end: '90% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			bars2State.freqBottom = 6.0 + progress * 18.0
			bars2State.freqTop = 4.0 + progress * 14.0
			emitBars2()
		},
	})

	t1 = ScrollTrigger.create({
		trigger: el.value,
		start: '25% top',
		end: '70% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			bars2State.bottom = progress * 0.35
			emitBars2()
		},
	})

	t3 = ScrollTrigger.create({
		trigger: el.value,
		start: '70% top',
		end: '90% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			bars2State.bottom = 0.35 + progress * 0.4
		},
	})

	t5 = ScrollTrigger.create({
		trigger: el.value,
		start: '25% top',
		end: '70% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			bars2State.top = progress * 0.4
			emitBars2()
		},
	})

	t6 = ScrollTrigger.create({
		trigger: el.value,
		start: '70% top',
		end: '90% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			bars2State.top = 0.4 + progress * 0.4
			emitBars2()
			gsap.set(containerRef.value, { opacity: 1 - progress * 3 })
		},
	})
}

const init = () => {
	if (isBars2.value) initBars2()
	else initBars1()

	const buttonListEl = buttonListRef.value?.$el ?? buttonListRef.value

	gsap.set(containerRef.value, { scale: 0.9, opacity: 0 })
	gsap.set(buttonListEl, { pointerEvents: 'none' })
	t2 = ScrollTrigger.create({
		trigger: el.value,
		start: '20% top',
		end: '50% top',
		scrub: true,
		onUpdate: ({ progress }) => {
			const eased = progress * progress
			gsap.set(containerRef.value, { scale: 0.95 + eased * 0.05, opacity: eased })
		},
	})

	t7 = ScrollTrigger.create({
		trigger: el.value,
		start: '20% top',
		onEnter: () => gsap.set(buttonListEl, { pointerEvents: 'auto' }),
		onLeaveBack: () => gsap.set(buttonListEl, { pointerEvents: 'none' }),
	})

	const code = props.consoleSnippet?.code
	if (code) {
		const scrollYAtArm = window.scrollY

		consoleSnippetTrigger = ScrollTrigger.create({
			trigger: el.value,
			start: 'top center',
			onEnter: () => {
				if (window.scrollY === scrollYAtArm) return
				appendCode(code, props.consoleSnippet.theme)
				consoleSnippetTrigger?.kill()
				consoleSnippetTrigger = null
			},
		})
	}
}
const setup = () => {}
const kill = () => {
	t1?.kill()
	t2?.kill()
	t3?.kill()
	t4?.kill()
	t5?.kill()
	t6?.kill()
	t7?.kill()
	consoleSnippetTrigger?.kill()
	consoleSnippetTrigger = null
}

onMounted(() => {
	context.$page.loader.ready.then(() => init())
})
</script>

<style lang="scss" scoped>
[data-component='pre-footer'] {
	position: relative;
	pointer-events: none;

	z-index: 0;

	width: 100%;
	height: 200vh;

	margin-top: -100vh;

	.shader-wrapper {
		position: absolute;
		top: 100vh;
		left: 0;

		width: 100%;
		height: 100vh;

		z-index: 1;
	}

	.masked-content {
		width: 100%;
		height: 100%;

		mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="200" viewBox="0 0 100 200" preserveAspectRatio="none"><rect x="0" y="100" width="100" height="100" fill="white"/></svg>');
		mask-size: 100% 100%;
		mask-repeat: no-repeat;
	}

	.sticky-viewport {
		position: sticky;
		top: 0;

		width: 100%;
		height: 100vh;

		display: flex;
		align-items: center;
		justify-content: center;
	}

	.parallax {
		width: 100%;
	}

	.parallax-inner {
		width: 100%;
	}

	.container {
		display: flex;
		flex-direction: column;

		gap: rs(42);

		align-items: center;
		justify-content: center;

		p {
			text-align: center;
		}

		.titles {
			display: flex;
			flex-direction: column;

			align-items: center;

			gap: rs(12);

			h2 {
				text-align: center;
			}
		}

		.title1 {
			color: var(--color-bright-green-200);

			max-width: column-width(11);

			@include max-width($sm) {
				max-width: column-width(22);
			}

			@include max-width($xxs) {
				max-width: 80%;
			}
		}

		.title2 {
			color: var(--color-bright-green-500);

			max-width: column-width(11);

			@include max-width($sm) {
				max-width: column-width(22);
			}

			@include max-width($xxs) {
				max-width: 80%;
			}
		}

		.description {
			color: rgb(from var(--color-bright-green-200) r g b / 0.5);

			width: 100%;
			max-width: rs(460);
		}
	}
}
</style>

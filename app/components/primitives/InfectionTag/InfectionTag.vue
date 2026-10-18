<template>
	<div
		data-component="infection-tag"
		ref="el"
		:class="`${state} ${visible ? 'visible' : ''} ${opened ? 'opened' : ''} ${hoverable ? 'hoverable' : ''} ${justOpened ? 'just-opened' : ''} ${justUnhovered ? 'just-unhovered' : ''}`"
		:style="`left: ${xPosition}%; top: ${yPosition}%`"
		@click="onClick"
		@mouseenter="startScanBlink"
		@mouseleave="stopScanBlink"
	>
		<div ref="topContainerEl" class="top-container">
			<span class="bg"><span class="bg-scale" /></span>
			<span class="dot-wrapper">
				<span ref="dotEl" class="dot" />
			</span>
			<span ref="labelEl" class="label -uppercase -mono-2">{{ label }}</span>
		</div>

		<div class="bottom-container">
			<div class="button -callout-5 -uppercase">
				<span class="shadow" />
				<span ref="scanLabelEl" class="label">{{ scanLabel }}</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { gsap } from 'gsap'
import { useLetterSwap } from '~/composables'

const props = defineProps({
	label: { type: String, default: 'risk_detected!' },
	visible: { type: Boolean, default: false },
	opened: { type: Boolean, default: false },
	hoverable: { type: Boolean, default: false },
	xPosition: { type: Number, default: 0 },
	yPosition: { type: Number, default: 0 },
	state: { type: String, default: 'detected', validator: (v) => ['detected', 'identified', 'solved'].includes(v) },
	stateIndex: { type: Number, default: 0 },
	clickable: { type: Boolean, default: false },
	onOpen: { type: Function, default: undefined },
	onAdvance: { type: Function, default: undefined },
})

const el = ref(null)
const topContainerEl = ref(null)
const labelEl = ref(null)
const dotEl = ref(null)
const scanLabelEl = ref(null)
const justOpened = ref(false)
const justUnhovered = ref(false)
const scanLabel = ref(props.state === 'detected' ? 'test' : 'fix')
const context = inject('pageContext')

const BOTTOM_EXTRA_PX = 32
const BOTTOM_MIN_PX = 180
const BOTTOM_ASPECT_RATIO = 170 / 180

const updateBottomWidth = () => {
	if (!el.value || !topContainerEl.value) return
	const w = Math.max(topContainerEl.value.offsetWidth + BOTTOM_EXTRA_PX, BOTTOM_MIN_PX)
	const wHover = w + 16
	el.value.style.setProperty('--bottom-width', `${w}px`)
	el.value.style.setProperty('--bottom-width-hover', `${wHover}px`)
	el.value.style.setProperty('--bottom-height', `${w * BOTTOM_ASPECT_RATIO}px`)
	el.value.style.setProperty('--bottom-height-hover', `${wHover * BOTTOM_ASPECT_RATIO}px`)
}

let blinkTl
let scanBlinkTl
let intersectionObserver

const startBlink = () => {
	if (blinkTl) return
	dotEl.value.style.transition = 'none'
	dotEl.value.style.willChange = 'opacity'
	blinkTl = gsap.timeline({ repeat: -1 })
	blinkTl.to(dotEl.value, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }).to(dotEl.value, { opacity: 1, duration: 0.4, ease: 'power2.inOut' })
}

const stopBlink = () => {
	blinkTl?.kill()
	blinkTl = null
	if (dotEl.value) {
		dotEl.value.style.transition = ''
		dotEl.value.style.willChange = ''
		gsap.set(dotEl.value, { clearProps: 'opacity' })
	}
}

const startScanBlink = () => {
	scanBlinkTl?.kill()
	if (!scanLabelEl.value) return
	scanLabelEl.value.style.transition = 'none'
	scanBlinkTl = gsap.timeline({ repeat: -1 })
	scanBlinkTl.to(scanLabelEl.value, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }).to(scanLabelEl.value, { opacity: 1, duration: 0.4, ease: 'power2.inOut' })
}

const stopScanBlink = () => {
	scanBlinkTl?.kill()
	scanBlinkTl = null
	if (scanLabelEl.value) {
		scanLabelEl.value.style.transition = ''
		gsap.set(scanLabelEl.value, { clearProps: 'opacity' })
	}
	if (props.opened) {
		justUnhovered.value = true
		setTimeout(() => {
			justUnhovered.value = false
		}, 400)
	}
}

const setupViewportObserver = () => {
	if (!el.value) return
	intersectionObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					if (props.visible && props.state !== 'solved') startBlink()
				} else {
					blinkTl?.pause()
					blinkTl = null
				}
			})
		},
		{ threshold: 0.0 }
	)
	intersectionObserver.observe(el.value)
}

const {
	init: swapInit,
	start: swapStart,
	kill: swapKill,
} = useLetterSwap(labelEl, {
	swapSpeed: 0.01,
	windowSize: 10,
	swapsPerChar: 1,
	easeOut: true,
	blink: true,
	blinkChance: 0.75,
	restoreOnKill: false,
})

watch(
	() => props.label,
	async () => {
		const oldWidth = topContainerEl.value?.offsetWidth
		swapKill()
		await nextTick()
		const newWidth = topContainerEl.value?.offsetWidth
		swapInit()
		swapStart()
		if (topContainerEl.value && oldWidth !== newWidth) {
			gsap.fromTo(topContainerEl.value, { width: oldWidth }, { width: newWidth, duration: 0.5, ease: 'power4.out', clearProps: 'width' })
		}
		requestAnimationFrame(updateBottomWidth)
	}
)

watch(
	() => props.visible,
	(val) => {
		if (val) {
			setTimeout(() => {
				swapKill()
				swapInit()
				swapStart()
				if (props.state !== 'solved') startBlink()
			}, 200)
		} else {
			swapKill()
			stopBlink()
		}
	}
)

watch(
	() => props.state,
	(val) => {
		if (val !== 'solved' && props.visible) startBlink()
		else stopBlink()
		setTimeout(() => {
			scanLabel.value = val === 'detected' ? 'test' : 'fix'
		}, 500)
	}
)

watch(
	() => props.opened,
	(val) => {
		if (props.visible && props.state === 'detected') startBlink()
		if (val) updateBottomWidth()
	}
)

function onClick() {
	if (!props.clickable) return
	if (!props.opened) {
		justOpened.value = true
		setTimeout(() => {
			justOpened.value = false
		}, 800)
		props.onOpen?.(props.stateIndex)
	} else {
		props.onAdvance?.(props.stateIndex)
	}
}

const setup = () => {
	swapInit()
	setupViewportObserver()
}
const init = () => {}
const kill = () => {
	swapKill()
	stopBlink()
	intersectionObserver?.disconnect()
}

onBeforeUnmount(() => kill())
onMounted(() => {
	context.$page.loader.loaded.then(() => setup())
	context.$page.loader.ready.then(() => init())
})
</script>

<style lang="scss" scoped>
[data-component='infection-tag'] {
	position: absolute;
	transition: transform 0.3s ease(out-quint);
	z-index: 0;

	user-select: none;

	&.opened {
		z-index: 10;
	}

	&.hoverable {
		cursor: pointer;

		@media (hover: hover) {
			&:not(.opened):hover .top-container .bg-scale {
				inset: -4px;
				filter: brightness(0.85);
			}

			&.opened:hover {
				.button {
					transform: scale(1.15);
					transition: transform 1s ease(out-quint) 0.1s, background-color 0.5s ease(out-quint);

					.shadow {
						opacity: 0.5;
						transition: opacity 0.3s ease(out-quint) 0.3s, background-color 0.5s ease(out-quint);
					}
				}
			}
		}
	}

	@include extend_hitbox(20);

	&.identified {
		.top-container .bg-scale {
			background-color: var(--color-infection-identified);
		}

		.bottom-container {
			border-color: var(--color-infection-identified);

			.button {
				background-color: var(--color-infection-identified);

				.shadow {
					background-color: var(--color-infection-identified);
				}
			}
		}
	}

	&.solved {
		.top-container {
			color: var(--color-deep-green-500);

			.bg-scale {
				background-color: var(--color-bright-green-500);
			}

			.dot {
				background-color: var(--color-deep-green-500);
			}
		}

		.bottom-container {
			border-color: var(--color-bright-green-500);
			color: var(--color-deep-green-500);

			.button {
				background-color: var(--color-bright-green-500);

				.shadow {
					background-color: var(--color-bright-green-500);
				}
			}
		}
	}

	&.visible .top-container {
		.bg {
			transform: scaleX(1);
			transition-delay: 0s;
		}

		.dot {
			opacity: 1;
			transition-delay: 0.1s;
		}

		.label {
			opacity: 1;
			transition-delay: 0.2s;
		}
	}

	&.visible:not(.opened) {
		.top-container .bg-scale {
			transition: background-color 0.5s ease(out-quint), inset 0.5s ease(out-quint), filter 0.5s ease(out-quint), border-radius 0.3s ease(out-quint) 0.6s;
		}

		.bottom-container {
			transition: width 0.5s ease(out-quint) 0.25s, height 0.5s ease(out-quint), border-width 0s ease(out-quint) 0.6s, border-color 0.5s ease(out-quint), color 0.5s ease(out-quint);

			.button {
				transition: transform 0.3s ease(out-quint), background-color 0.5s ease(out-quint);
			}
		}
	}

	&.visible.opened {
		.top-container .bg-scale {
			border-radius: rs(5, 5) rs(5, 5) 0 0;

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(9, 9) rs(9, 9) 0 0;
					corner-shape: superellipse(1.5);
				}
			}
		}

		.bottom-container {
			border-width: 1px;
			width: var(--bottom-width, rs(180, 120));
			height: var(--bottom-height, rs(170, 110));
			transform: scale(1);
			transition: width 0.5s ease(out-quint) 0s, height 0.5s ease(out-quint) 0.25s, transform 0.5s ease(out-quint), border-color 0.5s ease(out-quint), color 0.5s ease(out-quint);
		}

		&.just-unhovered {
			.bottom-container {
				transition: width 0.3s ease(out-quint), height 0.3s ease(out-quint), transform 0.3s ease(out-quint), border-color 0.5s ease(out-quint), color 0.5s ease(out-quint);
			}
		}

		@media (hover: hover) {
			&.hoverable:not(.just-opened):hover {
				.bottom-container {
					width: var(--bottom-width-hover, rs(196, 136));
					height: var(--bottom-height-hover, rs(185, 128));
					transition: width 0.5s ease(out-quint), height 0.5s ease(out-quint), transform 0.5s ease(out-quint), border-color 0.5s ease(out-quint), color 0.5s ease(out-quint);
				}
			}
		}
	}

	.top-container {
		position: relative;

		display: flex;
		align-items: center;
		gap: rs(5, 5);

		padding: rs(5, 5) rs(7, 7);

		width: fit-content;

		color: white;
		background-color: transparent;
		transition: color 0.5s ease(out-quint);

		user-select: none;

		.bg {
			position: absolute;
			inset: 0;
			transform-origin: left center;
			transform: scaleX(0);
			transition: transform 0.5s ease(out-quint) 0.2s;
		}

		.bg-scale {
			position: absolute;
			inset: 0;
			border-radius: rs(5, 5);
			background-color: var(--color-infection-detected);
			transform-origin: center;
			transition: background-color 0.5s ease(out-quint), inset 0.5s ease(out-quint), filter 0.5s ease(out-quint), border-radius 0.3s ease(out-quint);

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(9, 9);
					corner-shape: superellipse(1.5);
				}
			}
		}

		.dot-wrapper {
			flex-shrink: 0;

			position: relative;

			width: rs(8, 8);
			height: rs(8, 8);
		}

		.dot {
			position: absolute;
			inset: 0;

			background-color: white;

			opacity: 0;

			transition: opacity 0.3s ease(out-quint) 0.05s;
		}

		.label {
			flex-shrink: 0;

			position: relative;

			opacity: 0;

			transition: opacity 0.3s ease(out-quint) 0s;
		}
	}

	.bottom-container {
		border: 0px solid var(--color-infection-detected);

		width: 0;
		height: 0;
		overflow: hidden;

		display: flex;
		justify-content: center;
		align-items: center;

		border-radius: 0 rs(12, 12) rs(12, 12) rs(12, 12);
		transform-origin: top left;

		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(4px);

		transition: width 0.3s ease(out-quint), height 0.35s ease(out-quint), border-color 0.5s ease(out-quint), color 0.5s ease(out-quint);

		.button {
			position: relative;

			padding: rs(16, 16) rs(18, 18);
			background-color: var(--color-infection-detected);

			border-radius: rs(12, 12);

			opacity: 1;
			transform: scale(1);
			transition: transform 0.3s ease(out-quint), background-color 0.5s ease(out-quint);

			.shadow {
				position: absolute;
				inset: 0;

				border-radius: rs(12, 12);
				background-color: var(--color-infection-detected);

				filter: blur(12px);

				opacity: 0;
				transition: opacity 0.3s ease(out-quint), background-color 0.5s ease(out-quint);

				z-index: -1;

				@supports (corner-shape: superellipse(1.5)) {
					& {
						border-radius: rs(16, 16);
						corner-shape: superellipse(1.5);
					}
				}
			}

			.label {
				position: relative;
				color: white;
				transition: color 0.5s ease(out-quint);
			}

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(16, 16);
					corner-shape: superellipse(1.5);
				}
			}
		}

		@supports (corner-shape: superellipse(1.5)) {
			& {
				border-radius: 0 rs(16, 16) rs(16, 16) rs(16, 16);
				corner-shape: superellipse(1.5);
			}
		}
	}
}
</style>

<template>
	<div ref="cardRef" data-component="accuracy-card" :style="{ '--aspect-ratio': aspectRatio }">
		<div class="text-container">
			<span v-if="label" class="label -text-1-cards">{{ label }}</span>
			<span v-if="sublabel" class="sublabel -text-1-cards">{{ sublabel }}</span>
		</div>

		<div class="stat">
			<div class="number -numbers-1">
				<div class="rolling-number">
					<div ref="rollingContainerRef" class="list-container">
						<div v-for="(item, i) in displayList" :ref="(el) => (itemRefs[i] = el)" :key="i" class="item">
							{{ formatNumber(item.val) }}
						</div>
					</div>
				</div>
			</div>
			<span class="-numbers-2">{{ unit }}</span>
		</div>

		<div class="ruler">
			<div ref="stripesRef" class="stripe-container">
				<div v-for="i in 40" :key="i" class="stripe" />
			</div>

			<div ref="cursorRef" class="cursor">
				<div class="cursor-stripe" />
				<div class="tip" />
			</div>
		</div>

		<div class="gradient-top" />
		<div class="gradient-bottom" />
	</div>
</template>

<script setup>
import { gsap, ScrollTrigger } from 'gsap/all'

import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	stat: { type: String, default: undefined },
	label: { type: String, default: undefined },
	sublabel: { type: String, default: undefined },
	aspectRatio: { type: String, default: undefined },
})

const context = inject('pageContext')

const cardRef = ref(null)
const stripesRef = ref(null)
const cursorRef = ref(null)
const rollingContainerRef = ref(null)
const itemRefs = ref([])

let scrollTrigger = null

// rolling params
const step = 0.1
const count = 10

const number = computed(() => {
	if (!props.stat) return 0
	const match = props.stat.match(/^([0-9.,]+)/)
	return match ? parseFloat(match[1].replace(',', '.')) : 0
})

const unit = computed(() => {
	if (!props.stat) return ''
	const match = props.stat.match(/[^0-9.,]+$/)
	return match ? match[0] : ''
})

const displayList = computed(() => {
	const list = []
	for (let i = -2; i < count; i++) {
		const val = number.value - i * step
		list.push({ val, isTarget: i === 0 })
	}
	return list
})

const formatNumber = (num) => {
	if (Number.isInteger(step)) {
		return Math.round(num).toString()
	}
	return num.toFixed(1)
}

onBeforeUpdate(() => {
	itemRefs.value = []
})

const setup = () => {
	const N = displayList.value.length
	const targetIndex = displayList.value.findIndex((x) => x.isTarget)
	const targetYPercent = -(targetIndex / N) * 100
	const startYPercent = -((N - 1) / N) * 100

	const validItems = itemRefs.value.filter(Boolean)

	// Static per-item setup, once: transform origin never changes during the animation.
	gsap.set(validItems, { transformOrigin: '50% 50%', z: 0 })

	// quickSetter compiles a direct setter per property, avoiding gsap.set()'s
	// per-call property parsing on every animation frame.
	// "scale" is a shorthand GSAP expands internally, which quickSetter can't
	// target directly ΓÇö drive scaleX/scaleY instead for the same uniform scale.
	const setters = validItems.map((el) => ({
		rotateX: gsap.quickSetter(el, 'rotateX', 'deg'),
		scaleX: gsap.quickSetter(el, 'scaleX'),
		scaleY: gsap.quickSetter(el, 'scaleY'),
		opacity: gsap.quickSetter(el, 'opacity'),
	}))

	const update3D = () => {
		const currentYPercent = gsap.getProperty(rollingContainerRef.value, 'yPercent') || 0
		const scrolledItems = (currentYPercent / 100) * N

		setters.forEach(({ rotateX, scaleX, scaleY, opacity }, index) => {
			const distanceFromCenter = index + scrolledItems
			const dist = Math.abs(distanceFromCenter)

			// Simple Rotation (X-axis for rolling effect) and Scale
			// "scale down a little" -> reducing scale for items further away
			// Non-linear curve for scaling: use power function for smoother falloff
			const normalizedDist = dist / N // Normalize to 0-1 range
			const curvedDist = Math.pow(normalizedDist, 1.5) * N
			const s = Math.max(0, 1 - curvedDist * 0.25)
			const angle = -distanceFromCenter * 12

			rotateX(angle)
			scaleX(s)
			scaleY(s)
			opacity(s) // Fade out as it scales down
		})
	}

	scrollTrigger = ScrollTrigger.create({
		trigger: cardRef.value,
		start: 'top 90%',
		once: true,
		onEnter: () => {
			gsap.fromTo(
				rollingContainerRef.value,
				{ yPercent: startYPercent },
				{
					yPercent: targetYPercent,
					ease: 'expo.out',
					duration: 5,
					onUpdate: update3D,
				}
			)

			gsap.fromTo(stripesRef.value, { yPercent: -50 }, { yPercent: 0, duration: 4, ease: 'power4.out' })

			gsap.fromTo(cursorRef.value, { yPercent: 0 }, { yPercent: 300, duration: 2, ease: 'elastic.out' })
			gsap.fromTo(cursorRef.value, { yPercent: 300 }, { yPercent: 0, delay: 1, duration: 7, ease: 'elastic.out(2,0.3)' })
		},
	})
}

onMounted(() => {
	if (!rollingContainerRef.value) return
	context.$page.loader.ready.then(() => setup())
})

onBeforeUnmount(() => {
	scrollTrigger?.kill()
})
</script>

<style lang="scss" scoped>
[data-component='accuracy-card'] {
	position: relative;
	width: 100%;
	height: 100%;
	background-color: var(--color-deep-green-600);

	display: flex;
	justify-content: center;
	align-items: center;

	border-radius: rs(24, 16);

	overflow: hidden;

	@include max-width($sm) {
		aspect-ratio: var(--aspect-ratio);
		height: fit-content;
	}

	.gradient-top,
	.gradient-bottom {
		position: absolute;
		width: 100%;
		height: rs(150, 150);
		z-index: 2;
		pointer-events: none;
	}

	.gradient-top {
		top: 0;
		background: linear-gradient(to bottom, var(--color-deep-green-600) 10%, transparent 90%);
	}

	.gradient-bottom {
		bottom: 0;
		background: linear-gradient(to top, var(--color-deep-green-600) 10%, transparent 90%);
	}

	.text-container {
		position: absolute;

		width: 90%;
		top: rs(24, 16);
		left: rs(32, 28);

		z-index: 3;

		display: flex;
		flex-direction: column;

		.label {
			color: var(--accuracyCard-label-color, var(--color-bright-green-50));
		}

		.sublabel {
			color: var(--accuracyCard-label-color, var(--color-bright-green-50));
			padding-top: rs(2, 2);
			opacity: 0.5;
		}
	}

	.stat {
		position: relative;
		text-align: center;

		user-select: none;

		display: flex;
		flex-direction: row;
		align-items: baseline;
		gap: rs(16, 16);

		color: var(--color-bright-green-500);

		.number {
			line-height: 1;
			display: inline-flex;
			align-items: center;

			font-size: rs(150, 180);

			@include max-width($sm) {
				font-size: rs(460, 140);
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

.rolling-number {
	display: inline-flex;
	flex-direction: column;
	height: 1em;
	vertical-align: middle;
	position: relative;

	// Add 3D perspective
	perspective: 500px;
}

.list-container {
	display: flex;
	flex-direction: column;
	will-change: transform;
	transform-style: preserve-3d;
}

.item {
	height: 1em;
	display: flex;
	align-items: center;
	justify-content: center;

	font-family: inherit;
	font-weight: inherit;
	font-size: inherit;
	font-feature-settings: inherit;
	color: inherit;
	white-space: nowrap;

	backface-visibility: hidden;

	@include numbers-1;
	font-size: rs(150, 180);

	@include max-width($sm) {
		font-size: rs(460, 140);
	}
}

.ruler {
	position: absolute;
	height: 100%;

	left: 0;

	.stripe-container {
		position: relative;
		height: 200%;

		display: flex;
		flex-direction: column;
		justify-content: space-between;

		.stripe {
			width: 12px;
			height: 1px;
			background-color: rgb(from var(--color-bright-green-100) r g b / 0.4);
		}
	}

	.cursor {
		position: absolute;

		top: calc(50% + 1px);

		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;

		.cursor-stripe {
			width: 25px;
			height: 1px;
			background-color: var(--color-bright-green-100);
		}

		.tip {
			width: 7px;
			height: 7px;
			border-radius: 100%;
			background-color: var(--color-bright-green-100);
		}
	}
}
</style>

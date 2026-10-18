<template>
	<div data-component="step-selector">
		<button :class="`button ${leftActive ? 'active' : ''}`" @click="debounceStep(() => currentStep > 0 && currentStep--)" aria-label="Previous step">
			<Icon slug="left-arrow" size="s" />
		</button>

		<div class="text-wrapper">
			<span class="text">{{ currentStepFormated }}</span>
			<span class="text">/</span>
			<span class="text">{{ stepsFormated }}</span>
		</div>

		<button :class="`button ${rightActive ? 'active' : ''}`" @click="debounceStep(() => currentStep < props.steps - 1 && currentStep++)" aria-label="Next step">
			<Icon slug="right-arrow" size="s" />
			<span ref="progress" class="progress" />
		</button>
	</div>
</template>

<script setup>
import { Icon } from '~/components/core/Icon'
import gsap from 'gsap'

const props = defineProps({
	steps: { type: Number, default: 1 },
})

const currentStep = ref(0)

let debounceTimer = null
function debounceStep(fn) {
	if (debounceTimer) return
	fn()
	debounceTimer = setTimeout(() => (debounceTimer = null), 250)
}
const currentStepFormated = computed(() => '0' + (currentStep.value + 1))
const stepsFormated = computed(() => '0' + props.steps)

const leftActive = computed(() => currentStep.value > 0)
const rightActive = computed(() => currentStep.value < props.steps - 1)

defineExpose({ currentStep })

const progress = ref(null)
const proxy = { angle: 0 }

function setMask(angle) {
	progress.value.style.mask = `conic-gradient(from 0deg, black ${angle}deg, transparent ${angle}deg)`
}

function animateTo(val) {
	const target = ((val + 1) / props.steps) * 360
	gsap.to(proxy, {
		angle: target,
		duration: 0.7,
		ease: 'power2.out',
		onUpdate: () => setMask(proxy.angle),
	})
}

onMounted(() => {
	proxy.angle = (1 / props.steps) * 360
	setMask(proxy.angle)
})

watch(currentStep, animateTo)
</script>

<style lang="scss" scoped>
[data-component='step-selector'] {
	display: flex;
	flex-direction: row;
	gap: rs(12, 12);

	padding: rs(4, 4);
	border-radius: rs(12, 12);

	background-color: var(--color-deep-green-500);

	.text-wrapper {
		user-select: none;

		display: flex;
		flex-direction: row;

		gap: rs(8, 8);

		align-items: center;

		.text {
			@include numbers-1;
			font-size: rs(12, 12);
			font-variant-numeric: tabular-nums;

			color: var(--color-bright-green-500);
		}
	}

	.button {
		@include extend-hitbox(20);

		position: relative;

		padding: rs(8, 8) rs(6, 6);
		border-radius: rs(8, 8);

		--icon-color: var(--color-deep-green-425);
		border: solid 1px var(--color-deep-green-425);

		:deep(path) {
			fill: var(--color-deep-green-425);
			transition: fill 0.5s ease(out-quint) 0.4s;
		}

		&.active {
			:deep(path) {
				fill: var(--color-bright-green-500);
				transition: fill 0.5s ease(out-quint);
			}
		}

		.progress {
			position: absolute;
			inset: 0;

			margin: -1px;

			border: solid 1px var(--color-deep-green-425);
			border-radius: rs(8, 8);

			transition: border-color 0.5s ease(out-quint) 0.4s;

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(12, 12);
					corner-shape: superellipse(1.5);
				}
			}
		}

		&.active .progress {
			border-color: var(--color-bright-green-500);
			transition: border-color 0.5s ease(out-quint);
		}

		@supports (corner-shape: superellipse(1.5)) {
			& {
				border-radius: rs(12, 12);
				corner-shape: superellipse(1.5);
			}
		}
	}

	@supports (corner-shape: superellipse(1.5)) {
		& {
			border-radius: rs(16, 16);
			corner-shape: superellipse(1.5);
		}
	}
}
</style>

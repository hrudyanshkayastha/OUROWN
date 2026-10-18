<template>
	<button ref="el" data-component="button-simple">
		<span class="bg" />
		<span class="-mono-1 label">{{ label }}</span>
	</button>
</template>

<script setup>
import { gsap } from 'gsap'

const props = defineProps({
	label: { type: String, default: 'Button' },
})

const el = ref(null)

const setup = () => {}
const init = () => {}
const kill = () => {}

onBeforeUnmount(() => {})
onMounted(() => {})
</script>

<style lang="scss" scoped>
[data-component='button-simple'] {
	position: relative;
	padding: 0 rs(14);

	display: flex;
	align-items: center;
	justify-content: center;
	height: rs(40, 40);

	color: var(--buttonSimple-color, var(--color-bright-green-100));

	@include hover {
		.bg {
			transform: scale(1.02, 1.05);
		}
	}

	.bg {
		position: absolute;
		inset: 0;

		display: block;

		background-color: var(--buttonSimple-backgroundColor, var(--color-deep-green-500));
		//backdrop-filter: blur(10px);
		border-radius: rs(12, 12);

		border: 1px solid var(--buttonSimple-borderColor, var(--color-deep-green-500));

		transition: transform 0.3s ease(out-quint);

		//transition: background-color 0.5s ease(out-quint);
		transition: all 0.3s ease(out-quint);

		@supports (corner-shape: superellipse(1.5)) {
			& {
				border-radius: rs(16, 16);
				corner-shape: superellipse(1.5);
			}
		}
	}

	.label {
		position: relative;
	}
}
</style>

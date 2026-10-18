<template>
	<button data-component="button-icon" :aria-label="ariaLabel">
		<Icon :slug="slug" :size="size" />
	</button>
</template>

<script setup>
import { Icon } from '~/components/core/Icon'

defineProps({
	slug: { type: String, default: 'right-arrow-3' },
	size: { type: String, default: 'm' },
	ariaLabel: { type: String, default: 'Learn more' },
})
</script>

<style lang="scss" scoped>
[data-component='button-icon'] {
	height: fit-content;

	padding: rs(7, 7);

	border-radius: rs(12, 12);
	border: 1px solid var(--buttonIcon-borderColor, var(--color-muted-green-400));

	background-color: var(--buttonIcon-backgroundColor, transparent);

	transition: background-color 0.3s ease(out-quint), border-color 0.3s ease(out-quint);

	:deep(svg) {
		path {
			fill: var(--buttonIcon-iconColor, var(--color-muted-green-400));
			transition: fill 0.3s ease(out-quint);
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

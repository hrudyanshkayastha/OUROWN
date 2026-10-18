<template>
	<div ref="el" data-component="button-list" :class="`${theme} ${center ? 'centered' : ''}`">
		<template v-if="buttons && buttons.length === 1">
			<ButtonOutside v-bind="buttons[0]" />
		</template>
		<template v-else-if="buttons && buttons.length === 2">
			<Button v-bind="buttons[0]" tone="filledOpaque" :shadow="shadow" />
			<ButtonOutside v-bind="buttons[1]" />
		</template>
	</div>
</template>

<script setup>
import { Button } from '~/components/primitives/Button'
import { ButtonOutside } from '~/components/primitives/ButtonOutside'

const props = defineProps({
	buttons: { type: Array, default: () => [] },
	theme: { type: String, default: 'dark', validator: (v) => ['light', 'dark', 'use-cases'].includes(v) },
	shadow: { type: Boolean, default: false },
	center: { type: Boolean, default: false },
})

const el = ref(null)
const context = inject('pageContext')

const setup = () => {}
const init = () => {}
const kill = () => {}

onBeforeUnmount(() => {})
onMounted(() => {
	context.$page.loader.loaded.then(() => setup())
})
</script>

<style lang="scss" scoped>
[data-component='button-list'] {
	position: relative;

	display: flex;
	flex-direction: row;
	gap: rs(12, 12);

	&.centered {
		justify-content: center;
	}

	[data-component='button'] {
		flex-shrink: 0;
	}

	[data-component='button-outside'] {
		flex-shrink: 0;
	}

	&.light {
		[data-component='button'] {
			--button-backgroundColor: var(--color-bright-green-500);
			--button-accentColor: var(--color-bright-green-500);
			--button-color: var(--color-deep-green-500);
		}

		[data-component='button-outside'] {
			--button-color: var(--color-bright-green-500);
			--button-accentColor: var(--color-deep-green-500);
		}
	}

	&.dark {
		[data-component='button'] {
			--button-backgroundColor: var(--color-deep-green-500);
			--button-accentColor: var(--color-deep-green-500);
			--button-color: var(--color-bright-green-500);
		}

		[data-component='button-outside'] {
			--button-color: var(--color-deep-green-500);
			--button-accentColor: var(--color-bright-green-500);
		}
	}

	&.use-cases {
		[data-component='button'] {
			--button-backgroundColor: var(--color-bright-green-500);
			--button-accentColor: var(--color-bright-green-500);
			--button-color: var(--color-deep-green-500);
			--button-shadowColor: rgb(from var(--color-bright-green-500) r g b / 0.7);
		}

		[data-component='button-outside'] {
			--button-color: var(--color-deep-green-500);
			--button-accentColor: var(--color-bright-green-200);
		}
	}
}
</style>

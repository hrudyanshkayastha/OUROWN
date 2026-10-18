<template>
	<div ref="el" data-component="title-with-snippet" :class="`${padded ? 'padded' : ''} ${align}`">
		<div :class="`content ${spaced ? 'spaced' : ''} ${constrain} ${align}`">
			<h1 v-if="applyH1">
				<span v-for="(item, index) in title" :key="index" class="-callout-2 -uppercase">{{ item }}</span>
			</h1>
			<template v-else>
				<span v-for="(item, index) in title" :key="index" class="-callout-2 -uppercase">{{ item }}</span>
			</template>
			<FunctionSnippet v-if="functionSnippet?.enabled" v-bind="functionSnippet" :x-offset="xOffset" :y-offset="yOffset" :shadow="shadow" />
		</div>
	</div>
</template>

<script setup>
import { FunctionSnippet } from '~/components/primitives/FunctionSnippet'

const props = defineProps({
	title: { type: Array, default: undefined },
	functionSnippet: { type: Object, default: undefined },
	applyH1: { type: Boolean, default: false },
	spaced: { type: Boolean, default: false },
	padded: { type: Boolean, default: true },
	constrain: { type: String, default: 'low' },
	align: { type: String, default: 'center' },
	xOffset: { type: Number, default: 0 },
	yOffset: { type: Number, default: 0 },
	shadow: { type: Boolean, default: false },
})

const el = ref(null)
const context = inject('pageContext')

const setup = () => {}
const init = () => {}
const kill = () => {}

onBeforeUnmount(() => {})
onMounted(() => {})
</script>

<style lang="scss" scoped>
[data-component='title-with-snippet'] {
	position: relative;

	display: flex;
	align-items: center;

	&.padded {
		padding: rs(60, 48) 0;
	}

	&.center {
		justify-content: center;
		width: 100%;
	}

	&.left {
		justify-content: start;
	}

	&.right {
		justify-content: end;
	}

	.content {
		display: flex;
		flex-direction: column;

		color: var(--titleWithSnippet-color-line-2, var(--color-bright-green-500));
		text-align: center;

		h1 {
			display: contents;
		}

		> span:first-child,
		h1 > span:first-child {
			color: var(--titleWithSnippet-color-line-1, var(--color-bright-green-100));
		}

		&.spaced {
			//gap: rs(24, 24);
			gap: rs(12);
		}

		&.low {
			max-width: column-width(11);

			@include max-width($sm) {
				max-width: column-width(22);
			}

			@include max-width($xxs) {
				max-width: 80%;
			}
		}

		&.high {
			max-width: column-width(8);

			@include max-width($sm) {
				max-width: column-width(22);
			}

			@include max-width($xxs) {
				max-width: 80%;
			}
		}

		&.center {
			text-align: center;
		}

		&.left {
			text-align: left;
		}

		&.right {
			text-align: right;
		}
	}
}
</style>

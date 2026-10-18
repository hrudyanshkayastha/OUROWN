<template>
	<div ref="el" data-component="use-cases" data-panel-translate="2">
		<div class="g-row title-row">
			<div class="g-col xxl-10 xxl-offset-8 md-12 md-offset-4 sm-14 xs-24 xs-offset-0 xxs-28">
				<h2 class="title -title-3">{{ title }}</h2>
			</div>
		</div>

		<div class="g-row" data-panel-shrink>
			<div class="g-col cards-wrapper xxl-32 xxl-offset-0 sm-24 sm-offset-4 xs-32 xs-offset-0">
				<FeaturedCards :organizations="organizations" theme="dark" />
				<ButtonOutside v-if="buttonCta" v-bind="buttonCta" :mirror="true" />
			</div>
		</div>
	</div>
</template>

<script setup>
import { FeaturedCards } from '~/components/fragments/FeaturedCards'
import { ButtonOutside } from '~/components/primitives/ButtonOutside'

const props = defineProps({
	title: { type: String, default: undefined },
	functionSnippet: { type: Object, default: undefined },
	organizations: { type: Array, default: undefined },
	buttonCta: { type: Object, default: undefined },
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
[data-component='use-cases'] {
	--featuredCards-page-bg-color: var(--color-deep-green-800);

	position: relative;

	display: flex;
	flex-direction: column;
	gap: rs(60, 60);

	padding: rs(120, 60) 0;

	overflow: hidden;

	.title-row {
		position: relative;

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			z-index: -1;

			background-color: var(--color-deep-green-800);
		}
	}

	.title {
		color: var(--color-bright-green-500);
		text-wrap: balance;
	}

	.cards-wrapper {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: rs(64, 60);
	}
}
</style>

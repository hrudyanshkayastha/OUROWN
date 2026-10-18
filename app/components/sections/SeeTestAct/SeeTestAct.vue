<template>
	<div ref="el" data-component="see-test-act" data-panel-translate="2">
		<TitleWithSnippet :title="title" :functionSnippet="functionSnippet" :spaced="true" />
		<div class="g-row">
			<div class="g-col xxl-24 xxl-offset-4 xs-32 xs-offset-0">
				<div class="steps-container">
					<StepCard v-for="(step, i) in steps" :key="i" v-bind="step" :index="i" :style="`--card-index: ${i}`" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { TitleWithSnippet } from '~/components/primitives/TitleWithSnippet'
import { StepCard } from '~/components/fragments/StepCard'

const props = defineProps({
	title: { type: Array, default: undefined },
	functionSnippet: { type: Object, default: undefined },
	steps: { type: Array, default: undefined },
})
</script>

<style lang="scss" scoped>
[data-component='see-test-act'] {
	position: relative;
	width: 100%;

	padding-top: rs(60, 0);

	.steps-container {
		padding-top: rs(60, 0);
		padding-bottom: rs(60, 60);

		display: flex;
		flex-direction: column;
	}
}
</style>

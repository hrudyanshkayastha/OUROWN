<template>
	<div ref="el" data-component="solutions" data-panel-translate="2">
		<TitleWithSnippet :title="title" :functionSnippet="functionSnippet" :spaced="true" />
		<div class="content">
			<ul class="g-row">
				<li class="solutions-container g-col xxl-offset-4 xxl-24 sm-28 sm-offset-2 xs-32 xs-offset-0">
					<SolutionCard v-for="solution in solutions" :key="solution._id" v-bind="solution" />
				</li>
			</ul>
		</div>
	</div>
</template>

<script setup>
import { TitleWithSnippet } from '~/components/primitives/TitleWithSnippet'
import { SolutionCard } from '~/components/primitives/SolutionCard'

const props = defineProps({
	title: { type: Array, default: undefined },
	functionSnippet: { type: Object, default: undefined },
	solutions: { type: Array, default: undefined },
})

const el = ref(null)
const context = inject('pageContext')

const setup = () => {}

onMounted(() => {
	//context.$page.loader.loaded.then(() => setup())
})
</script>

<style lang="scss" scoped>
[data-component='solutions'] {
	--SolutionCard-page-bg-color: var(--color-deep-green-800);

	position: relative;

	.content {
		width: 100%;

		.solutions-container {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: repeat(2, auto);

			gap: rs(4, 4);

			@include max-width($md) {
				grid-template-columns: repeat(2, 1fr);
				grid-template-rows: repeat(3, auto);
			}

			@include max-width($xs) {
				display: flex;
				flex-direction: column;

				gap: rs(12, 12);
			}
		}
	}
}
</style>

<template>
	<NuxtLink :to="computedSlug">
		<div ref="el" data-component="solution-card" v-bind="isTouch ? {} : { 'data-shader': 'spiralTriggered' }" :id="computedId" @mouseenter="handleMouseEnter">
			<div class="top-container">
				<div class="corner-overlay top-left"></div>
				<div class="corner-overlay top-right"></div>
				<div class="corner-overlay bottom-left"></div>
				<div class="corner-overlay bottom-right"></div>

				<SvgAsset :url="icon.url" />

				<ButtonIcon :aria-label="`Learn more about ${title}`" />
			</div>
			<div class="bottom-container">
				<div class="corner-overlay top-left"></div>
				<div class="corner-overlay top-right"></div>
				<div class="corner-overlay bottom-left"></div>
				<div class="corner-overlay bottom-right"></div>

				<div class="title-wrapper">
					<h2 class="title -subtitle-2">{{ title }}</h2>
				</div>
				<div class="description-wrapper">
					<div class="overflow-hidden">
						<p class="description -text-4">{{ description }}</p>
					</div>
				</div>
			</div>
		</div>
	</NuxtLink>
</template>

<script setup>
import { SvgAsset } from '~/components/core/SvgAsset'
import { ButtonIcon } from '~/components/primitives/ButtonIcon'
import { useEmitter } from '~/composables/core'
import { useScreen } from 'vue-screen'

const props = defineProps({
	description: { type: String, default: undefined },
	icon: { type: Object, default: undefined },
	title: { type: String, default: undefined },
	slug: { type: String, default: undefined },
	backgroundColor: { type: Object, default: undefined },
})

const computedSlug = computed(() => {
	return '/platform/' + props.slug
})

const computedId = computed(() => {
	return 'solutionCard-' + props.slug
})

const el = ref(null)
const isTouch = ref(true)

const context = inject('pageContext')
const emitter = useEmitter()
const screen = useScreen()

const handleMouseEnter = () => {
	emitter.emit('CrtCanvas-SolutionCardMouseEnter', computedId.value)
}

const emitSetColors = () => {
	emitter.emit('CrtCanvas-SolutionCardSetColors', computedId.value, props.backgroundColor)
}

emitter.on('CrtCanvas-ready', () => {
	emitSetColors()
})

const setup = () => {
	if (!screen.touch) isTouch.value = false
}
const init = () => {}
const kill = () => {}

onBeforeUnmount(() => {})
onMounted(() => {
	context.$page.loader.loaded.then(() => setup())
})
</script>

<style lang="scss" scoped>
[data-component='solution-card'] {
	position: relative;
	cursor: pointer;

	background-color: var(--color-deep-green-600);
	transition: background-color 0.5s ease(out-quint);

	//height: rs(340, 340);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	outline: 1px solid var(--SolutionCard-page-bg-color, var(--color-deep-green-700));

	aspect-ratio: 408 / 320;

	@include max-width($xs) {
		aspect-ratio: 366 / 227;
	}

	.top-container {
		position: relative;
		overflow: hidden;

		padding: rs(36, 24);

		flex: 1;
		min-height: 0;

		display: flex;
		flex-direction: row;
		justify-content: space-between;

		.corner-overlay {
			position: absolute;
			width: rs(18);
			height: rs(18);
			pointer-events: none;
		}

		.corner-overlay.top-left {
			top: 0;
			left: 0;
			margin-top: -2px;
			margin-left: -2px;
			background: radial-gradient(circle at 100% 100%, transparent rs(16), var(--SolutionCard-page-bg-color, var(--color-deep-green-700)) rs(16));
		}

		.corner-overlay.top-right {
			top: 0;
			right: 0;
			margin-top: -2px;
			margin-right: -2px;
			background: radial-gradient(circle at 0% 100%, transparent rs(16), var(--SolutionCard-page-bg-color, var(--color-deep-green-700)) rs(16));
		}

		.corner-overlay.bottom-left {
			bottom: 0;
			left: 0;
			margin-bottom: -2px;
			margin-left: -2px;
			background: radial-gradient(circle at 100% 0%, transparent rs(16), var(--SolutionCard-page-bg-color, var(--color-deep-green-700)) rs(16));
		}

		.corner-overlay.bottom-right {
			bottom: 0;
			right: 0;
			margin-bottom: -2px;
			margin-right: -2px;
			background: radial-gradient(circle at 0% 0%, transparent rs(16), var(--SolutionCard-page-bg-color, var(--color-deep-green-700)) rs(16));
		}

		:deep(svg) {
			width: rs(56, 56);
			height: rs(56, 56);
			position: relative;
			z-index: 5;
		}
	}

	.bottom-container {
		position: relative;
		overflow: hidden;

		padding: rs(36, 24);

		//background: linear-gradient(to top, var(--color-deep-green-600) 2%, transparent 100%);

		//maybe not necessary anymore, but just in case
		min-height: rs(130, 90);

		transition: all 0.3s ease(out-quint);

		@include max-width($xs) {
			min-height: fit-content;
		}

		.corner-overlay {
			position: absolute;
			width: rs(18);
			height: rs(18);
			pointer-events: none;
		}

		.corner-overlay.top-left {
			top: 0;
			left: 0;
			margin-top: -2px;
			margin-left: -2px;
			background: radial-gradient(circle at 100% 100%, transparent rs(16), var(--SolutionCard-page-bg-color, var(--color-deep-green-700)) rs(16));
		}

		.corner-overlay.top-right {
			top: 0;
			right: 0;
			margin-top: -2px;
			margin-right: -2px;
			background: radial-gradient(circle at 0% 100%, transparent rs(16), var(--SolutionCard-page-bg-color, var(--color-deep-green-700)) rs(16));
		}

		.corner-overlay.bottom-left {
			bottom: 0;
			left: 0;
			margin-bottom: -2px;
			margin-left: -2px;
			background: radial-gradient(circle at 100% 0%, transparent rs(16), var(--SolutionCard-page-bg-color, var(--color-deep-green-700)) rs(16));
		}

		.corner-overlay.bottom-right {
			bottom: 0;
			right: 0;
			margin-bottom: -2px;
			margin-right: -2px;
			background: radial-gradient(circle at 0% 0%, transparent rs(16), var(--SolutionCard-page-bg-color, var(--color-deep-green-700)) rs(16));
		}

		.title-wrapper {
			@include subtitle-2;

			display: flex;
			align-items: flex-end;

			min-height: calc(2 * 1.1em);

			width: 80%;

			@include max-width($xl) {
				width: 100%;
			}

			@include max-width($md) {
				width: 70%;
			}

			@include max-width($sm) {
				width: 100%;
			}
		}

		.title {
			color: var(--color-muted-green-400);
			transition: color 0.4s ease('in-out-cubic');
		}

		.description-wrapper {
			display: grid;
			grid-template-rows: 0fr;
			transition: grid-template-rows 0.3s ease('out-cubic'), padding-top 0.3s ease(out-quint);
			padding-top: 0;

			.overflow-hidden {
				overflow: hidden;
			}
		}

		.description {
			color: rgb(from var(--color-bright-green-100) r g b / 0.4);
			min-height: 0;
			opacity: 0;
			transition: opacity 0.5s ease('out-quint');

			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			overflow: hidden;
		}
	}

	@media (hover: hover) {
		&:hover {
			background-color: transparent;

			.top-container {
				--buttonIcon-borderColor: var(--color-bright-green-500);
				--buttonIcon-backgroundColor: var(--color-bright-green-500);
				--buttonIcon-iconColor: var(--color-deep-green-500);
			}

			.bottom-container {
				.title {
					color: var(--color-bright-green-500);
				}

				.description-wrapper {
					grid-template-rows: 1fr;
					padding-top: rs(12, 12);

					.description {
						opacity: 1;
						transition-delay: 0.2s;
					}
				}
			}
		}
	}
}
</style>

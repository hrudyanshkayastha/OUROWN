<template>
	<div ref="el" data-component="step-card">
		<div class="top-container">
			<span class="cover-layer" />

			<div class="icon-wrapper">
				<Icon :slug="icon" size="l" />
			</div>
			<h2 class="-callout-4 -uppercase">{{ title }}</h2>

			<div class="video-wrapper">
				<span class="blur-layer" />
				<span class="darker-layer" />
				<VideoAsset :asset="backgroundVideo" :autoplay="true" class="video" :lazy="true" />
			</div>
		</div>
		<div class="bottom-container" :data-shader="shaderName">
			<span class="blur-layer-bottom" />

			<div class="corner-overlay top-left"></div>
			<div class="corner-overlay top-right"></div>
			<div class="corner-overlay bottom-left"></div>
			<div class="corner-overlay bottom-right"></div>

			<div class="content">
				<div>
					<h3 class="-title-4 subtitle">{{ subtitle }}</h3>

					<div>
						<SanityContent v-if="content" :blocks="content" />
					</div>
				</div>
			</div>

			<ul class="list">
				<li v-for="item in list" :key="item._id">
					<Icon :slug="item.icon" size="m" class="icon" />
					<h4 class="-text-3">{{ item.label }}</h4>
				</li>
			</ul>
		</div>
	</div>
</template>

<script setup>
import { Icon } from '~/components/core/Icon'
import { VideoAsset } from '~/components/core/VideoAsset'

const props = defineProps({
	icon: { type: String, default: undefined },
	title: { type: String, default: '' },
	subtitle: { type: String, default: '' },
	content: { type: Array, default: undefined },
	list: { type: Array, default: undefined },
	backgroundVideo: { type: Object, default: undefined },
	index: { type: Number, default: 0 },
})

const shaders = ['see', 'test', 'act']
const shaderName = computed(() => shaders[props.index] || 'see')

const el = ref(null)
const context = inject('pageContext')

let resizeObserver = null

const setup = () => {
	const topContainer = el.value?.querySelector('.top-container')
	if (!topContainer) return

	resizeObserver = new ResizeObserver(() => {
		el.value?.style.setProperty('--top-container-height', `${topContainer.offsetHeight}px`)
	})
	resizeObserver.observe(topContainer)
}

const init = () => {}

const kill = () => {
	resizeObserver?.disconnect()
	resizeObserver = null
}

onBeforeUnmount(() => kill())
onMounted(() => setup())
</script>

<style lang="scss" scoped>
[data-component='step-card'] {
	position: relative;
	width: 100%;

	display: contents;

	--icon-color: white;

	.top-container {
		display: flex;
		align-items: center;
		gap: rs(12, 12);

		padding: rs(36, 24);

		position: sticky;
		top: calc(60px + var(--card-index, 0) * (var(--top-container-height)));
		z-index: calc(10 - var(--card-index, 0));

		.blur-layer {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 1;

			backdrop-filter: blur(20px);
			background-color: rgba(0, 0, 0, 0.25);
			-webkit-backface-visibility: hidden;
			transform: translateZ(0);

			mask: linear-gradient(80deg, rgba(0, 0, 0, 1) 75%, rgba(0, 0, 0, 0) 100%);
			//-webkit-mask: linear-gradient(90deg, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 90%);
		}

		.darker-layer {
			position: absolute;
			top: 0;
			right: 0;
			width: 50%;
			height: 100%;
			z-index: 2;

			opacity: 0.4;

			//background: linear-gradient(270deg, var(--color-deep-green-800) 0%, rgba(0, 0, 0, 0) 100%);
			background: linear-gradient(270deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);
		}

		.cover-layer {
			position: absolute;
			top: rs(-48, -24);
			left: -1%;
			width: 102%;
			height: calc(#{rs(48, 48)} + 100% - #{rs(24, 18)});
			z-index: -1;

			background-color: var(--color-deep-green-800);

			@include max-width($sm) {
				display: none;
			}
		}

		@include max-width($sm) {
			position: relative;

			top: 0;
		}

		.video-wrapper {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: -1;
			overflow: hidden;
			border-radius: rs(24, 18);

			.video {
				position: absolute;
				top: 50%;
				left: 0;
				width: 100%;
				transform: translateY(-50%);
			}

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(28, 22);
					corner-shape: superellipse(1.5);
				}
			}
		}
	}

	.bottom-container {
		--page-background-color: var(--color-deep-green-800);

		position: relative;

		min-height: 75vh;

		margin-bottom: rs(48, 24);

		padding: rs(64, 64) rs(80, 24);

		border-left: 1px solid var(--color-deep-green-800);
		border-right: 1px solid var(--color-deep-green-800);

		@include max-width($sm) {
			height: fit-content;
		}

		.blur-layer-bottom {
			position: absolute;
			top: 0;
			left: -1px;
			width: 80%;
			height: 100%;
			z-index: 0;

			backdrop-filter: blur(20px);
			background-color: rgba(0, 0, 0, 0.25);
			-webkit-backface-visibility: hidden;
			transform: translateZ(0);

			mask: linear-gradient(70deg, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 80%);
			//-webkit-mask: linear-gradient(90deg, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 90%);

			@include max-width($sm) {
				width: 100%;
			}
		}

		.corner-overlay {
			position: absolute;
			width: rs(25, 19);
			height: rs(25, 19);
			pointer-events: none;
		}

		.corner-overlay.top-left {
			top: 0;
			left: 0;
			margin-top: -2px;
			margin-left: -2px;
			background: radial-gradient(circle at 100% 100%, transparent rs(24, 18), var(--page-background-color, #ffffff) rs(24, 18));
		}

		.corner-overlay.top-right {
			top: 0;
			right: 0;
			margin-top: -2px;
			margin-right: -2px;
			background: radial-gradient(circle at 0% 100%, transparent rs(24, 18), var(--page-background-color, #ffffff) rs(24, 18));
		}

		.corner-overlay.bottom-left {
			bottom: 0;
			left: 0;
			margin-bottom: -2px;
			margin-left: -2px;
			background: radial-gradient(circle at 100% 0%, transparent rs(24, 18), var(--page-background-color, #ffffff) rs(24, 18));
		}

		.corner-overlay.bottom-right {
			bottom: 0;
			right: 0;
			margin-bottom: -2px;
			margin-right: -2px;
			background: radial-gradient(circle at 0% 0%, transparent rs(24, 18), var(--page-background-color, #ffffff) rs(24, 18));
		}

		.content {
			position: relative;
			z-index: 1;

			width: 50%;

			@include max-width($sm) {
				width: 100%;
			}

			:deep(p) {
				@include text-1;

				padding-bottom: rs(36, 36);

				white-space: pre-wrap;
				line-height: 1.3;

				color: rgba(255, 255, 255, 0.4);

				strong {
					@include callout-5;
					text-transform: uppercase;

					color: white;
				}
			}

			.subtitle {
				padding-bottom: rs(48, 48);
			}
		}

		.list {
			position: relative;
			z-index: 1;

			display: flex;
			flex-direction: row;

			max-width: 50%;

			gap: rs(64, 24);

			@include max-width($lg) {
				max-width: 70%;
			}

			@include max-width($sm) {
				display: grid;
				grid-template-columns: 1fr 1fr;

				max-width: 100%;

				padding-top: rs(24, 24);
			}

			li {
				@include max-width($sm) {
					max-width: unset;
				}
			}

			.icon {
				margin-bottom: rs(16, 16);
			}
		}
	}

	&:last-of-type .bottom-container {
		margin-bottom: 0;
	}
}
</style>

<template>
	<div ref="el" data-component="issue" data-panel-shrink>
		<div class="carousel-container">
			<Carousel v-bind="logoCarousel" :fade="true" />
		</div>

		<div v-if="newsletterCta" class="g-row align-center">
			<div class="g-col -text-center title-col">
				<div class="title-block">
					<p v-if="newsletterCta.title" class="title -title-2">{{ newsletterCta.title }}</p>
					<p v-if="newsletterCta.description" class="-text-2 description">{{ newsletterCta.description }}</p>
				</div>

				<ButtonOutside v-if="newsletterCta.to?.type !== 'hubspotForm'" v-bind="newsletterCta" />
			</div>
		</div>

		<div v-if="newsletterCta?.to?.type === 'hubspotForm'" class="g-row align-center">
			<div class="form-container">
				<NewsletterForm v-bind="newsletterCta.to.hubspotForm" :buttonLabel="newsletterCta.buttonLabel" />
			</div>
		</div>

		<IssuesTouch v-if="isTouch" :list="list" />
		<template v-else>
			<Issues :list="list" :closureIconEl="closureIconEl" :closureLineEl="closureLineEl" />
			<div class="closure">
				<Icon ref="closureIconRef" slug="plus" size="s" />
				<span ref="closureLineRef" class="line" />
			</div>
		</template>
	</div>
</template>

<script setup>
import { useScreen } from 'vue-screen'
import { breakpoints } from '~/config'
import { ButtonOutside } from '~/components/primitives/ButtonOutside'
import { Carousel } from '~/components/primitives/Carousel'
import { Icon } from '~/components/core/Icon'
import { NewsletterForm } from '~/components/forms/NewsletterForm'
import { Issues } from './components/Issues'
import { IssuesTouch } from './components/IssuesTouch'
import { useClientOnlyComputed } from '~/composables/core'

const props = defineProps({
	logoCarousel: { type: Object, default: undefined },
	newsletterCta: { type: Object, default: undefined },
	list: { type: Array, default: undefined },
})

const closureIconRef = ref(null)
const closureIconEl = computed(() => closureIconRef.value?.$el ?? null)
const closureLineRef = ref(null)
const closureLineEl = computed(() => closureLineRef.value ?? null)

const screen = useScreen()
const isTouch = useClientOnlyComputed(false, () => screen.touch || screen.width < breakpoints.small, screen)
</script>

<style lang="scss" scoped>
[data-component='issue'] {
	position: relative;

	width: 100%;

	color: var(--color-muted-green-500);

	display: flex;
	flex-direction: column;

	.carousel-container {
		--carousel-logo-color: var(--color-muted-green-600);
		--carousel-fade-color: var(--color-deep-green-800);

		padding: rs(120, 60) 0;
	}

	.title-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: rs(40);
	}

	.title-block {
		display: flex;
		flex-direction: column;

		align-items: center;

		gap: rs(24, 24);
		text-align: center;
		width: 100%;

		.title {
			color: var(--color-bright-green-200);

			width: column-width(16);

			@include max-width($md) {
				width: column-width(20);
			}

			@include max-width($xs) {
				width: 100%;
			}
		}

		.description {
			color: var(--color-muted-green-500);

			margin-bottom: rs(64, 64);

			width: column-width(8);

			@include max-width($md) {
				width: column-width(12);
			}

			@include max-width($sm) {
				width: column-width(16);
			}

			@include max-width($xs) {
				width: 100%;
			}
		}
	}

	.form-container {
		width: rs(500, 500);
		max-width: 100%;
	}

	.item--last {
		width: 100%;
		height: 100vh;

		display: flex;
		align-items: center;
		justify-content: center;

		:deep(p) {
			@include numbers-1;
			text-align: center;
			width: 30%;
		}

		:deep(strong) {
			@include numbers-1;
			font-weight: 600;
		}
	}

	.closure {
		--icon-color: var(--color-bright-green-50);

		width: 100%;
		height: rs(400, 400);

		display: flex;
		flex-direction: column;
		align-items: center;

		gap: rs(12, 12);

		margin-top: rs(-100, -100);

		:deep([data-component='icon']) {
			opacity: 0;
		}

		.line {
			width: 1px;
			flex: 1;
			transform: scaleY(0);
			transform-origin: top center;
			flex-shrink: 0;
			background-color: var(--color-bright-green-50);
		}
	}
}
</style>

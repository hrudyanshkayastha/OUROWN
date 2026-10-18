<template>
	<div ref="cardRef" data-component="featured-cards" :data-theme="theme">
		<div class="buttons-container">
			<DraggableList :have-handler="false">
				<ul class="buttons">
					<li v-for="(org, i) in organizations" :key="i">
						<button v-if="org.client" :class="`button ${activeButton == i ? 'active' : ''} -callout-5 -uppercase`" @click="goToSlide(i)">{{ org.client.name }}</button>
					</li>
				</ul>
			</DraggableList>
		</div>
		<div class="slides-wrapper">
			<div class="image" data-shader="featuredCards" :id="computedId">
				<div class="corner-overlay top-left"></div>
				<div class="corner-overlay top-right"></div>
				<div class="corner-overlay bottom-left"></div>
				<div class="corner-overlay bottom-right"></div>
			</div>

			<div v-for="(org, i) in organizations" :key="i" :ref="(el) => (slideRefs[i] = el)" :class="`slide ${activeSlide == i ? 'active' : ''}`">
				<div v-if="org.client" class="main">
					<div class="image-spacer" />

					<div class="content">
						<div class="text-wrapper">
							<div class="text">
								<div v-if="org.client.logo?.url" class="logo">
									<SvgAsset :url="org.client.logo.url" />
								</div>
								<SanityContent :blocks="org.description" />
							</div>

							<NuxtLink v-if="org.articleLink" :to="org.articleLink">
								<ButtonSimple label="Read more" />
								<span class="sr-only">&nbsp;about {{ org.client.name }}</span>
							</NuxtLink>
						</div>
					</div>
				</div>

				<ul class="stats">
					<li v-for="(stat, j) in org.stats" :key="j" class="stat">
						<SanityContent :blocks="stat.stat" />
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script setup>
import gsap from 'gsap'
import { ButtonSimple } from '@/components/primitives/ButtonSimple'
import { SvgAsset } from '@/components/core/SvgAsset'
import { DraggableList } from '@/components/core/DraggableList'
import { useTerminalType } from '~/composables'
import { useEmitter } from '~/composables/core'

const props = defineProps({
	organizations: { type: Array, default: undefined },
	theme: { type: String, default: 'light' },
})

const activeSlide = ref(0)
const activeButton = ref(0)
const slideRefs = ref([])

const instanceId = useId()
const computedId = computed(() => 'featuredCards-' + instanceId)

const emitter = useEmitter()

let currentTl = null
let currentStatTypers = []
let prevStatContents = []

const saveRestore = (el) => {
	if (!el.dataset.originalHtml) el.dataset.originalHtml = el.innerHTML
	else el.innerHTML = el.dataset.originalHtml
}

const createStatAnimators = (statEl) => {
	const labelEls = [...statEl.querySelectorAll('p')].filter((p) => !p.querySelector('strong'))
	const animators = [
		...labelEls.map((el) => {
			saveRestore(el)
			return useTerminalType({ value: el }, { typingSpeed: 0.03, typingVariance: 0.02, typoChance: 0, showCursor: true, cursorChar: 'Γöâ' })
		}),
		...[...statEl.querySelectorAll('strong')].map((el) => {
			saveRestore(el)
			return useTerminalType({ value: el }, { typingSpeed: 0.05, typingVariance: 0.01, typoChance: 0, showCursor: true, cursorChar: 'Γöâ' })
		}),
	]
	return {
		init: () => {
			animators.forEach((a) => a.init())
			// useTerminalType pins an inline min-height from a stale
			// pre-typing measurement ΓÇö drop it so the CSS min-height (which
			// keeps stat card height consistent across orgs) takes over
			labelEls.forEach((el) => {
				el.style.minWidth = ''
				el.style.minHeight = ''
			})
		},
		start: () => animators.forEach((a) => a.start()),
		kill: () => animators.forEach((a) => a.kill()),
	}
}

const clearSlide = (slide) => {
	gsap.set(slide, { clearProps: 'all' })
	gsap.set(slide.querySelector('.text-wrapper'), { clearProps: 'all' })
}

const goToSlide = (index) => {
	if (index === activeSlide.value) return

	// debounce
	if (activeButton.value !== activeSlide.value) return

	activeButton.value = index

	const prevSlide = slideRefs.value[activeSlide.value]
	const nextSlide = slideRefs.value[index]
	if (!prevSlide || !nextSlide) return

	if (currentTl) {
		currentTl.kill()
		currentStatTypers.forEach((t) => t.kill())
		currentStatTypers = []

		clearSlide(nextSlide)

		gsap.set(prevSlide.querySelector('.text-wrapper'), { clearProps: 'all' })
		prevStatContents.forEach((el) => gsap.set(el, { clearProps: 'opacity' }))
		prevStatContents = []
	}

	const { offsetLeft: slideLeft, offsetWidth: slideWidth, offsetHeight: slideHeight } = prevSlide
	const prevWrapper = prevSlide.querySelector('.text-wrapper')
	const nextWrapper = nextSlide.querySelector('.text-wrapper')
	const nextStats = [...nextSlide.querySelectorAll('.stat')]
	prevStatContents = [...prevSlide.querySelectorAll('.stat > *')]

	const nextOrg = props.organizations[index]
	if (nextOrg?.picture?.url) {
		emitter.emit('CrtCanvas-FeaturedCardsReveal', { id: computedId.value, url: nextOrg.picture.url, duration: 1.5 })
	}

	currentStatTypers = nextStats.map((el) => {
		const a = createStatAnimators(el)
		a.init()
		return a
	})

	const tl = (currentTl = gsap.timeline())

	tl.to(prevWrapper, { opacity: 0, x: 12, duration: 0.2, ease: 'power2.out' })
	tl.to(prevStatContents, { opacity: 0, duration: 0.25, ease: 'power2.out' }, '<')

	tl.call(() => {
		gsap.set(nextSlide, { position: 'absolute', left: slideLeft, top: 0, width: slideWidth, height: slideHeight, display: 'flex', zIndex: 2, opacity: 1 })
		gsap.set(nextWrapper, { opacity: 0, x: -12 })
	})

	tl.to(nextWrapper, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, '<0.25')

	nextStats.forEach((_, i) => tl.call(() => currentStatTypers[i]?.start(), null, i === 0 ? '<' : '<0.15'))

	tl.call(() => {
		activeSlide.value = index
		nextTick(() => {
			clearSlide(nextSlide)
			clearSlide(prevSlide)
			gsap.set(nextWrapper, { clearProps: 'all' })
			prevStatContents.forEach((el) => gsap.set(el, { clearProps: 'opacity' }))
			prevStatContents = []
			currentStatTypers = []
			currentTl = null
		})
	})
}

const setup = () => {
	const url = props.organizations?.[activeSlide.value]?.picture?.url
	if (url) emitter.emit('CrtCanvas-FeaturedCardsInit', { id: computedId.value, url })
}

onMounted(() => {
	emitter.on('CrtCanvas-ready', setup)
	setup()
})

onBeforeUnmount(() => {
	if (currentTl) currentTl.kill()
	currentStatTypers.forEach((t) => t.kill())
})
</script>

<style lang="scss" scoped>
[data-component='featured-cards'] {
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	--featuredCards-bg-idle: var(--color-light-grey-50);
	--featuredCards-bg-active: var(--color-light-grey-300);
	--featuredCards-text-idle: var(--color-deep-green-200);
	--featuredCards-text-hover: var(--color-deep-green-300);
	--featuredCards-text-active: var(--color-deep-green-500);
	--featuredCards-border: rgb(from white r g b / 0.7);
	--featuredCards-border-active: rgb(from var(--color-deep-green-500) r g b / 0.05);
	--featuredCards-card-border-left: 1px solid var(--featuredCards-border);
	--featuredCards-card-border-right: none;
	--featuredCards-svg-fill: var(--color-deep-green-500);
	--featuredCards-stat-bg: var(--color-light-grey-50);
	--featuredCards-stat-text: var(--color-deep-green-200);
	--featuredCards-stat-number: var(--color-deep-green-500);

	&[data-theme='dark'] {
		--featuredCards-bg-idle: var(--color-deep-green-800);
		--featuredCards-bg-active: var(--color-deep-green-600);
		--featuredCards-text-idle: var(--color-light-grey-800);
		--featuredCards-text-hover: var(--color-light-grey-600);
		--featuredCards-text-active: var(--color-light-grey-300);
		--featuredCards-border: rgb(from var(--color-light-grey-800) r g b / 0.2);
		--featuredCards-border-active: rgb(from var(--color-light-grey-800) r g b / 0.3);
		--featuredCards-svg-fill: var(--color-light-grey-300);
		--featuredCards-stat-bg: var(--color-deep-green-600);
		--featuredCards-stat-text: var(--color-light-grey-800);
		--featuredCards-stat-number: var(--color-light-grey-300);
		--featuredCards-card-border-left: none;
		--featuredCards-card-border-right: 1px solid var(--featuredCards-border);
	}

	position: relative;
	display: flex;
	flex-direction: row;

	height: rs(350, 350);

	@include max-width($sm) {
		flex-direction: column;
		height: fit-content;
		width: 100%;
	}

	.buttons-container {
		position: relative;
		width: rs(185, 185);
		flex-shrink: 0;
		height: 100%;
		z-index: 1;

		:deep([data-component='draggable-list']) {
			height: 100%;
		}

		@include max-width($sm) {
			width: calc(100% + var(--grid-padding) * 2);
			margin-left: calc(var(--grid-padding) * -1);
			padding-left: var(--grid-padding);
			padding-right: var(--grid-padding);
			height: unset;

			:deep([data-component='draggable-list']) {
				overflow: visible;
			}
		}
	}

	.buttons {
		display: flex;
		flex-direction: column;

		height: 100%;

		@include max-width($sm) {
			align-self: flex-start;
			width: max-content;
			height: fit-content;
		}

		li {
			flex: 1;
			display: flex;

			@include max-width($sm) {
				flex: unset;
			}
		}

		.button {
			flex: 1;
			display: flex;
			align-items: flex-start;
			background-color: var(--featuredCards-bg-idle);
			color: var(--featuredCards-text-idle);
			transition: all 0.3s ease(out-quint);

			border-radius: rs(24, 16);
			padding: rs(24, 24);

			text-align: left;
			text-wrap: balance;

			border-left: 1px solid var(--featuredCards-border);
			border-top: 1px solid var(--featuredCards-border);

			&:hover {
				color: var(--featuredCards-text-hover);
			}

			&.active {
				background-color: var(--featuredCards-bg-active);
				color: var(--featuredCards-text-active);

				border-left: 1px solid var(--featuredCards-border-active);
				border-top: 1px solid var(--featuredCards-border-active);
			}

			@include max-width($sm) {
				flex: unset;
				padding: rs(16, 16) rs(24, 24);
				max-width: rs(150, 150);
			}

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(28, 20);
					corner-shape: superellipse(1.5);
				}
			}
		}

		@include max-width($sm) {
			flex-direction: row;
		}
	}

	.slides-wrapper {
		position: relative;
		flex: 1;
		height: 100%;

		@include max-width($sm) {
			display: grid;
		}
	}

	.image {
		position: absolute;
		left: 0;
		top: 0;
		width: rs(225, 225);
		height: 100%;
		z-index: 0;

		border-radius: rs(24, 16);

		:deep(img) {
			object-fit: cover;

			width: 100%;
			height: 100%;
		}

		.corner-overlay {
			position: absolute;
			width: rs(24, 16);
			height: rs(24, 16);
			pointer-events: none;
		}

		.corner-overlay.top-left {
			top: 0;
			left: 0;
			margin-top: -2px;
			margin-left: -2px;
			background: radial-gradient(circle at 100% 100%, transparent rs(22, 14), var(--featuredCards-page-bg-color, var(--color-deep-green-800)) rs(22, 14));
		}

		.corner-overlay.top-right {
			top: 0;
			right: 0;
			margin-top: -2px;
			margin-right: -2px;
			background: radial-gradient(circle at 0% 100%, transparent rs(22, 14), var(--featuredCards-page-bg-color, var(--color-deep-green-800)) rs(22, 14));
		}

		.corner-overlay.bottom-left {
			bottom: 0;
			left: 0;
			margin-bottom: -2px;
			margin-left: -2px;
			background: radial-gradient(circle at 100% 0%, transparent rs(22, 14), var(--featuredCards-page-bg-color, var(--color-deep-green-800)) rs(22, 14));
		}

		.corner-overlay.bottom-right {
			bottom: 0;
			right: 0;
			margin-bottom: -2px;
			margin-right: -2px;
			background: radial-gradient(circle at 0% 0%, transparent rs(22, 14), var(--featuredCards-page-bg-color, var(--color-deep-green-800)) rs(22, 14));
		}

		@include max-width($sm) {
			position: relative;
			width: 100%;
			height: rs(230, 230);
			grid-row: 1;
			grid-column: 1;
		}

		@supports (corner-shape: superellipse(1.5)) {
			& {
				border-radius: rs(28, 20);
				corner-shape: superellipse(1.5);
			}
		}
	}

	.slide {
		position: relative;
		display: none;
		height: 100%;
		flex: 1;
		z-index: 1;

		&.active {
			display: flex;
		}

		@include max-width($sm) {
			flex-direction: column;
			grid-row: 2;
			grid-column: 1;

			// keep it "positioned" (not static) so the inline z-index GSAP
			// sets on nextSlide during the crossfade actually applies ΓÇö
			// static elements ignore z-index and fall back to DOM order,
			// which broke the crossfade specifically when going backwards
			position: relative !important;
			left: auto !important;
			top: auto !important;
			width: 100% !important;
			height: auto !important;
		}
	}

	.main {
		height: 100%;
		display: flex;
		flex-direction: row;

		.image-spacer {
			width: rs(225, 225);
			height: 100%;
			flex-shrink: 0;

			@include max-width($sm) {
				display: none;
			}
		}

		.content {
			--buttonSimple-color: var(--featuredCards-text-active);
			--buttonSimple-backgroundColor: none;
			--buttonSimple-borderColor: var(--featuredCards-text-active);

			display: flex;
			flex-direction: column;
			justify-content: space-between;

			border-radius: rs(24, 16);
			max-width: rs(420, 420);

			background-color: var(--featuredCards-bg-active);
			color: var(--featuredCards-text-active);

			border-left: var(--featuredCards-card-border-left);
			border-top: 1px solid var(--featuredCards-border);
			border-right: var(--featuredCards-card-border-right);

			padding: rs(32, 24);
			padding-top: rs(24, 16);

			.logo {
				display: flex;
				align-items: center;
				justify-content: flex-start;

				margin-top: rs(-18, -18);
				margin-bottom: rs(-10, -10);

				:deep(svg) {
					width: auto;
					height: rs(90, 90);

					path {
						fill: var(--featuredCards-svg-fill);
					}
				}
			}

			:deep(p) {
				@include subtitle-2;
			}

			:deep(strong) {
				@include subtitle-2-bold;
			}

			:deep([data-component='button-simple']) {
				align-self: flex-start;
			}

			.text-wrapper {
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				height: 100%;

				.text {
					max-width: 80%;

					@include max-width($sm) {
						max-width: 90%;
					}
				}
			}

			@include max-width($sm) {
				height: rs(260, 260);
				max-width: none;
			}

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(28, 20);
					corner-shape: superellipse(1.5);
				}
			}
		}

		@include max-width($sm) {
			flex-direction: column;
		}
	}

	.stats {
		height: 100%;
		width: rs(185, 185);

		display: flex;
		flex-direction: column;

		.stat {
			display: flex;
			flex-direction: column;

			flex: 1;

			background-color: var(--featuredCards-stat-bg);
			border-radius: rs(24, 16);

			border-left: var(--featuredCards-card-border-left);
			border-top: 1px solid var(--featuredCards-border);
			border-right: var(--featuredCards-card-border-right);

			padding: rs(28, 24);

			:deep(p) {
				color: var(--featuredCards-stat-text);
				@include upper-title;
				text-transform: uppercase;
				max-width: 80%;
			}

			:deep(p:not(:has(strong))) {
				margin-top: auto;
			}

			:deep(strong) {
				color: var(--featuredCards-stat-number);
				@include numbers-2;
				letter-spacing: -4.2px;
			}

			@include max-width($sm) {
				justify-content: start;
				height: rs(180, 180);
				flex: 1;

				gap: rs(64, 64);
			}

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(28, 20);
					corner-shape: superellipse(1.5);
				}
			}
		}

		@include max-width($sm) {
			flex-direction: row;
			width: 100%;
			height: fit-content;
		}
	}
}
</style>

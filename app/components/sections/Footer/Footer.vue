<template>
	<footer ref="el" data-component="footer" class="scene-container" data-shader="footer" data-menu-theme="dark" data-panel-shrink>
		<!-- fade overlay -->
		<span class="fade-overlay" />

		<!-- code snippets -->
		<div class="code-snippets -mono-2">
			<p
				v-for="(snippet, i) in snippets"
				:key="i"
				:ref="
					(el) => {
						snippetRefs[i] = el
					}
				"
				:class="['-mono-2', `snippet-${i + 1}`, snippetClasses[i]]"
			>
				{{ snippet }}
			</p>
		</div>

		<div v-if="gradient" class="gradient-overlay"></div>

		<div class="g-row top-row">
			<div class="g-col xxl-2">
				<LogoBig class="logo" />
			</div>
		</div>

		<div class="g-row align-center middle-row">
			<div class="g-col xxl-4">
				<div class="badge">
					<div class="list">
						<span v-for="(item, i) in compliant.items" :key="i" class="item -mono-1 -uppercase">{{ item }}</span>
					</div>
					<p class="label -mono-1">{{ compliant.label }}</p>
				</div>
			</div>

			<div class="g-col xxl-24 title-col -text-center title-col">
				<h2 class="-hero-title-2 -uppercase title">{{ title }}</h2>
				<ButtonList v-if="buttonCtaList" :buttons="buttonCtaList" :center="true" />
			</div>

			<div class="g-col xxl-4 social-col">
				<ul class="social-list">
					<li v-for="(item, i) in socials" :key="i" class="item">
						<nuxt-link :to="item.url" target="_blank" rel="external" :aria-label="item.network">
							<Icon :slug="item.network" size="m" />
						</nuxt-link>
					</li>
				</ul>
			</div>
		</div>

		<div class="g-row bottom-row">
			<div class="g-col xxl-12 xs-32 secondary-col secondary-col-1">
				<ul class="secondary-list">
					<li v-for="(item, i) in secondaryPagesGroups.left" :key="i" class="item">
						<HyperLink :to="item.to">
							<span class="-text-4">{{ item.label }}</span>
						</HyperLink>
					</li>
				</ul>
			</div>

			<div class="g-col xxl-8 xs-32 -text-center mid-col">
				<HyperLink :to="support.link.to" :aria-label="support.logo.alt">
					<SvgAsset :url="support.logo.url" />
				</HyperLink>

				<div class="mobile-extras">
					<div class="badge badge-mobile">
						<div class="list">
							<span v-for="(item, i) in compliant.items" :key="i" class="item -mono-1 -uppercase">{{ item }}</span>
						</div>
						<p class="label -mono-1">{{ compliant.label }}</p>
					</div>

					<ul class="social-list social-list-mobile">
						<li v-for="(item, i) in socials" :key="i" class="item">
							<nuxt-link :to="item.url" target="_blank" rel="external" :aria-label="item.network">
								<Icon :slug="item.network" size="m" />
							</nuxt-link>
						</li>
					</ul>
				</div>

				<nuxt-link to="https://burocratik.com" target="_blank" rel="external">
					<span class="-text-4">Made by B├╝ro</span>
				</nuxt-link>
			</div>

			<div class="g-col xxl-12 xs-32 secondary-col secondary-col-2">
				<ul class="secondary-list">
					<li v-for="(item, i) in secondaryPagesGroups.right" :key="i" class="item">
						<HyperLink :to="item.to">
							<span class="-text-4">{{ item.label }}</span>
						</HyperLink>
					</li>
				</ul>
			</div>
		</div>
	</footer>
</template>

<script setup>
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { LogoBig } from '~/components/primitives/LogoBig'
import { HyperLink } from '~/components/core/HyperLink'
import { SvgAsset } from '~/components/core/SvgAsset'
import { Icon } from '~/components/core/Icon'
import { ButtonList } from '~/components/fragments/ButtonList'

import { useTerminalType } from '~/composables/useTerminalType'
import { useRightPanelMethods } from '~/composables'

import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	title: { type: String, default: undefined },
	buttonCtaList: { type: Array, default: undefined },
	secondaryPages: { type: Array, default: undefined },
	socials: { type: Array, default: undefined },
	compliant: { type: Object, default: undefined },
	support: { type: Object, default: undefined },
	gradient: { type: Boolean, default: true },
	snippets: { type: Array, default: () => [] },
	consoleSnippet: { type: Object, default: undefined },
})

const el = ref(null)
const context = inject('pageContext')
const route = useRoute()
const { appendCode } = useRightPanelMethods()

const snippetRefs = ref([])

const snippetClasses = [
	'g-col xxl-18 xxl-offset-2 xs-offset-8 xxs-offset-6',
	'g-col xxl-20 xxl-offset-10 sm-offset-15 xs-offset-6 xxs-offset-4',
	'g-col xxl-7 lg-8 md-9 sm-10 xxl-offset-25 lg-offset-24 md-offset-23',
]

const typingInstances = ref([])
let observer
let consoleSnippetTrigger

const secondaryPagesGroups = computed(() => {
	const pages = props.secondaryPages || []
	const midpoint = Math.ceil(pages.length / 2)
	return {
		left: pages.slice(0, midpoint),
		right: pages.slice(midpoint),
	}
})

const startTypingAnimations = () => {
	typingInstances.value.forEach((instance) => {
		instance.start()
	})
}

const initTypingAnimations = () => {
	typingInstances.value.forEach((instance) => instance.kill())
	typingInstances.value = []

	snippetRefs.value.forEach((el, index) => {
		if (el) {
			const elRef = { value: el }
			const last = index === snippetRefs.value.length - 1
			const instance = useTerminalType(elRef, {
				typingSpeed: last ? 0.015 : 0.03,
				typingVariance: 0.02,
				typoChance: 0.05,
				deleteSpeed: 0.1,
				delay: last ? 0.1 : 0.2 * index,
				multiline: true,
				showCursor: true,
				cursorBlinkSpeed: 0.5,
			})

			instance.init()
			typingInstances.value.push(instance)
		}
	})

	observer = ScrollTrigger.create({
		trigger: el.value,
		start: 'top 75%',
		end: 'bottom top',
		once: true,
		onEnter: startTypingAnimations,
	})

	const code = props.consoleSnippet?.code
	if (code) {
		consoleSnippetTrigger = ScrollTrigger.create({
			trigger: el.value,
			start: 'top center',
			once: true,
			onEnter: () => appendCode(code, props.consoleSnippet.theme),
		})
	}
}

const setup = () => {}
const init = () => {}

const kill = () => {
	typingInstances.value.forEach((instance) => instance.kill())
	observer?.kill()
	consoleSnippetTrigger?.kill()
	consoleSnippetTrigger = null
	typingInstances.value = []
}

onBeforeUnmount(() => {
	kill()
})

onMounted(() => {
	context.$page.loader.ready.then(() => initTypingAnimations())
})
</script>

<style lang="scss" scoped>
[data-component='footer'] {
	--button-color: var(--color-deep-green-600);
	--button-accentColor: var(--color-bright-green-600);
	position: relative;

	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 100vh;

	color: var(--color-deep-green-500);

	overflow: hidden;

	.logo {
		@include max-width($xs) {
			display: none;
		}
	}

	.fade-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: var(--color-deep-green-700);
		pointer-events: none;
		animation: fadeOutOverlay 1s ease-out 2s forwards;
		z-index: 10;
	}

	.gradient-overlay {
		position: absolute;

		top: 0;
		left: 0;

		width: 100%;
		height: 50%;

		z-index: 0;

		background: linear-gradient(to bottom, var(--color-bright-green-500), rgba(0, 0, 0, 0));
		pointer-events: none;
	}

	.top-row {
		position: relative;
		padding-top: rs(62, 26);
		z-index: 2;

		.g-col {
			@include max-width($xs) {
				padding-left: rs(14, 14);
			}
		}
	}

	.middle-row {
		flex-grow: 1;
		z-index: 2;

		display: flex;
		align-items: center;
		justify-content: center;

		> .g-col:first-child {
			display: flex;
			align-items: center;

			@include max-width($xs) {
				display: none;
			}
		}

		.social-col {
			@include max-width($xs) {
				display: none;
			}
		}

		.badge {
			display: flex;
			flex-direction: row;
			align-items: center;

			width: fit-content;

			user-select: none;

			transform: rotate(-90deg) translate(-50%, 50%);
			transform-origin: left center;

			background-color: var(--color-deep-green-500);
			color: var(--color-bright-green-500);

			border-radius: rs(20, 20);
			padding: rs(2, 2);

			.list {
				display: flex;
				flex-direction: row;

				.item {
					background-color: var(--color-bright-green-500);
					color: var(--color-deep-green-500);

					text-wrap: nowrap;

					border-radius: rs(20, 20);
					padding: rs(6, 6) rs(10, 10);
					padding-top: rs(7, 7);

					font-size: rs(8, 8);
				}
			}

			.label {
				padding: 0 rs(14, 14);
				font-size: rs(8, 8);
			}
		}
	}

	.bottom-row {
		position: relative;
		padding-bottom: rs(34, 26);
		z-index: 2;

		@include max-width($xs) {
			gap: rs(20);

			.mid-col {
				width: 100%;
			}

			.secondary-col-1,
			.secondary-col-2 {
				display: none;
			}
		}

		.mid-col {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: rs(12, 12);

			:deep(svg) {
				height: rs(25, 22);

				path {
					fill: var(--color-deep-green-500);
				}
			}

			> a:first-child {
				&:after {
					display: none;
				}

				:deep(svg) {
					transition: opacity 0.3s ease(out-quint);
				}

				@include hover {
					:deep(svg) {
						opacity: 0.8;
					}
				}
			}

			> a:last-child {
				width: auto;
			}

			.mobile-extras {
				display: none;
				max-width: 500px;

				padding-top: rs(42, 42);
				padding-bottom: rs(24, 24);

				@include max-width($xs) {
					display: flex;
					flex-direction: row;
					justify-content: space-between;
					align-items: center;
					width: 100%;
				}

				@include max-width($xxs) {
					flex-direction: column;
					gap: rs(16, 16);
				}

				.badge-mobile {
					display: flex;
					flex-direction: row;
					align-items: center;

					width: fit-content;

					user-select: none;

					background-color: var(--color-deep-green-500);
					color: var(--color-bright-green-500);

					border-radius: rs(20, 20);
					padding: rs(2, 2);

					order: 2;

					.list {
						display: flex;
						flex-direction: row;

						.item {
							background-color: var(--color-bright-green-500);
							color: var(--color-deep-green-500);
							text-wrap: nowrap;
							border-radius: rs(20, 20);
							padding: rs(6, 6) rs(10, 10);
							padding-top: rs(7, 7);
							font-size: rs(8, 8);
						}
					}

					.label {
						padding: 0 rs(14, 14);
						font-size: rs(8, 8);
					}
				}

				.social-list-mobile {
					flex-direction: row;
					align-items: center;
					order: 1;
				}
			}
		}

		a {
			position: relative;

			@include extend_hitbox(3);

			@include hover {
				&:after {
					transform: translateY(0px);
					opacity: 1;
				}
			}

			&:after {
				content: '';
				position: absolute;
				bottom: -2px;
				left: 0;

				display: block;
				width: 100%;
				height: 1px;

				background-color: var(--color-deep-green-500);

				opacity: 0;
				transform: translateY(4px);
				transition: transform 0.5s ease(out-quint);

				will-change: transform, opacity;
			}
		}
	}

	.title-col {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: rs(48);
	}
	.title {
		white-space: pre-line;

		@include max-width($xs) {
			font-size: rs(120, 54);
		}
	}

	.social-list {
		display: flex;
		flex-direction: column;
		gap: rs(10);

		align-items: flex-end;

		li {
			position: relative;
		}

		a {
			position: relative;
			display: block;

			@include extend_hitbox(5);

			@include hover {
				transform: scale(1.1);
			}

			& {
				transition: transform 0.5s ease(out-quint);
			}

			&:after {
				display: none;
			}
		}
	}

	.secondary-col-1 {
		display: flex;
		justify-content: flex-start;

		.secondary-list {
			align-items: flex-start;
		}
	}

	.secondary-col-2 {
		display: flex;
		justify-content: flex-end;

		.secondary-list {
			align-items: flex-end;
		}
	}

	.secondary-list {
		display: flex;
		flex-direction: column;

		li {
			padding: rs(4, 4) 0;
		}
	}

	.code-snippets {
		pointer-events: none;
		position: absolute;
		width: 100%;
		height: 100%;
		font-variant-ligatures: none;
		padding: 0 var(--grid-margin);
		z-index: 1;

		p {
			position: absolute;
			white-space: pre-wrap;
			tab-size: 4;
			color: var(--color-bright-green-700);

			:deep(*) {
				@include mono-2;
			}
		}
	}

	.snippet-1 {
		padding-top: rs(56, 20);
		padding-left: var(--grid-margin);

		@include max-width($xs) {
			padding-left: 0;
			padding-top: 0;
			bottom: rs(300, 300);
		}

		@include max-width($xxs) {
			bottom: rs(250, 250);
		}
	}
	.snippet-2 {
		top: rs(130, 160);
		@include max-width($sm) {
			top: rs(90, 90);
		}
	}
	.snippet-3 {
		padding-top: rs(62, 26);

		@include max-width($sm) {
			display: none;
		}
	}

	@keyframes fadeOutOverlay {
		to {
			opacity: 0;
		}
	}
}
</style>

<template>
	<div ref="el" data-component="hackian" :class="{ '-ready': isReady, '-animated': hasAnimated }">
		<svg class="cell-outline-defs" width="0" height="0">
			<defs>
				<linearGradient id="cell-outline-gradient" x1="0" y1="0" x2="0" y2="1">
					<stop class="cell-outline-gradient-start" offset="50%" />
					<stop class="cell-outline-gradient-end" offset="50%" />
				</linearGradient>
			</defs>
		</svg>

		<div class="grid-container" data-panel-shrink>
			<div class="video-container">
				<VideoAsset v-if="backgroundVideo" :asset="backgroundVideo" :autoplay="true" :lazy="true" />
			</div>

			<div class="overlay">
				<p v-if="description" class="description -subtitle-2">{{ description }}</p>
			</div>

			<div class="snippet-overlay">
				<FunctionSnippet v-if="functionSnippet" v-bind="functionSnippet" :x-offset="snippetXOffset" />
			</div>

			<div class="grid" :style="{ '--grid-rows': rows }">
				<div v-if="block1" class="mobile-cell -cell-1" :style="cellStyle(mobilePositions.cell1)">
					<span class="block1-line -mono-2 -uppercase">{{ block1[0] }}</span>
					<span class="block1-line -mono-2 -uppercase">{{ block1[1] }}</span>
				</div>

				<div class="mobile-cell -subtitle" :style="cellStyle(mobilePositions.subtitleCell)">
					<div class="logo-container">
						<Icon slug="hackian" size="s" />
						<HackianTypeSVG class="hackian-type" />
					</div>

					<h2 v-if="subtitle" class="-text-2 subtitle">{{ subtitle }}</h2>
				</div>

				<span v-for="c in 8" :key="`seam-top-${c}`" class="col-seam -top" :style="{ left: `calc(100% / 7 * ${c - 1})` }" />
				<span v-for="c in 8" :key="`seam-bottom-${c}`" class="col-seam -bottom" :style="{ left: `calc(100% / 7 * ${c - 1})` }" />

				<!-- flip background: rendered outside cell-wrapper so its overflow:hidden crop doesn't clip the 3D flip -->
				<div class="bg-flip -cell-1" :style="cellStyle(gridConfig.contentCell)">
					<span class="bg-front" />
					<span class="bg-back" />
				</div>

				<template v-for="i in rows * 7" :key="i">
					<div class="cell-wrapper" :class="{ '-mobile-bg': mobileBgCells.has(i) }">
						<span class="cell-outline"> <CellSVG /></span>

						<span class="cell" :class="{ '-has-title': hasTitleChar(i) || i === gridConfig.subtitleCell }">
							<div v-if="i === gridConfig.contentCell" class="cell-content">
								<span class="foreground -cell-1" />
							</div>

							<span v-else-if="i >= gridConfig.titleWord0 && i < gridConfig.titleWord0 + COLS && titleWords[0]?.[i - gridConfig.titleWord0]" class="title-chars -numbers-1 -uppercase">
								{{ titleWords[0][i - gridConfig.titleWord0] }}
							</span>

							<div v-else-if="i === gridConfig.subtitleCell" class="cell-content subtitle-cell">
								<div class="logo-container">
									<Icon slug="hackian" size="m" />
									<HackianTypeSVG class="hackian-type" />
								</div>
								<h2 v-if="subtitle" class="-text-2 subtitle">{{ subtitle }}</h2>
							</div>

							<span
								v-else-if="
									i >= gridConfig.titleWord1 &&
									i < gridConfig.titleWord1 + COLS &&
									i - gridConfig.titleWord1 >= titleRow2Offset &&
									titleWords[1]?.[i - gridConfig.titleWord1 - titleRow2Offset]
								"
								class="title-chars -numbers-1 -uppercase"
							>
								{{ titleWords[1][i - gridConfig.titleWord1 - titleRow2Offset] }}
							</span>

							<span v-else-if="i >= gridConfig.titleWord2 && i < gridConfig.titleWord2 + COLS && titleWords[2]?.[i - gridConfig.titleWord2]" class="title-chars -numbers-1 -uppercase">
								{{ titleWords[2][i - gridConfig.titleWord2] }}
							</span>
						</span>

						<div v-if="i === gridConfig.contentCell && block1" class="cell-1-content">
							<span class="block1-line1 -mono-2 -uppercase">{{ block1[0] }}</span>
							<span class="block1-line2 -mono-2 -uppercase">{{ block1[1] }}</span>
						</div>
					</div>
				</template>
			</div>
		</div>

		<div v-if="ecosystem" class="ecosystem" data-panel-translate="2">
			<span class="gradient" />

			<div class="ecosystem-content">
				<div class="text-container">
					<span v-if="ecosystem.topNote" class="top-note -upper-title -uppercase">{{ ecosystem.topNote }}</span>
					<h2 v-if="ecosystem.title" class="title -callout-3 -uppercase">{{ ecosystem.title }}</h2>
					<p v-if="ecosystem.description" class="description -text-2">{{ ecosystem.description }}</p>
				</div>

				<div class="cards-container g-row">
					<div class="top-cards g-col xxl-20 xxl-offset-6 lg-24 lg-offset-4 md-32 md-offset-0 sm-24 sm-offset-4 xs-32 xs-offset-0">
						<div class="first-col">
							<RemediationCard v-if="ecosystem.remediationCard" v-bind="ecosystem.remediationCard" aspect-ratio="447 / 320" :dark-mode="false" />
							<AccuracyCard v-if="ecosystem.accuracyCard" :stat="ecosystem.accuracyCard.stat" :label="ecosystem.accuracyCard.label" aspect-ratio="447 / 320" />
						</div>

						<div class="second-col">
							<SpeedCard v-if="ecosystem.speedCard" v-bind="ecosystem.speedCard" />
						</div>
					</div>

					<div class="bottom-cards g-col xxl-20 xxl-offset-6 lg-24 lg-offset-4 md-32 md-offset-0 sm-24 sm-offset-4 xs-32 xs-offset-0">
						<StatCard v-if="ecosystem.saveCard" v-bind="ecosystem.saveCard" aspect-ratio="447 / 330" :width="447 * 2" :height="330 * 2" :big-text="true" :enterOnScroll="true" />
						<ExploitCard v-if="ecosystem.exploitCard" v-bind="ecosystem.exploitCard" :altLayout="true" />
					</div>
				</div>
				<div class="buttons-container">
					<ButtonList v-if="buttonCtaList" :buttons="buttonCtaList" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { gsap, ScrollTrigger } from 'gsap/all'
import { VideoAsset } from '~/components/core/VideoAsset'
import { Icon } from '~/components/core/Icon'
import CellSVG from '~/assets/icons/cell.svg'
import HackianTypeSVG from '~/assets/icons/hackian-type.svg'
import { FunctionSnippet } from '~/components/primitives/FunctionSnippet'
import { ButtonList } from '~/components/fragments/ButtonList'
import { AccuracyCard } from '~/components/fragments/AccuracyCard'
import { SpeedCard } from '~/components/fragments/SpeedCard'
import { StatCard } from '~/components/fragments/StatCard'
import { RemediationCard } from '~/components/fragments/RemediationCard'
import { ExploitCard } from '~/components/fragments/ExploitCard'
import { useTerminalType } from '~/composables'
import { useClientOnlyComputed } from '~/composables/core'
import { useScreen } from 'vue-screen'
import { breakpoints } from '~/config'

import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	title: { type: Array, default: undefined },
	subtitle: { type: String, default: undefined },
	description: { type: String, default: undefined },
	block1: { type: Array, default: undefined },
	backgroundVideo: { type: Object, default: undefined },
	functionSnippet: { type: Object, default: undefined },
	ecosystem: { type: Object, default: undefined },
	buttonCtaList: { type: Array, default: undefined },
})

const el = ref(null)
const context = inject('pageContext')
const isReady = ref(false)
const hasAnimated = ref(false)
const screen = useScreen()

const isMobile = useClientOnlyComputed(
	false,
	() => screen.width <= breakpoints.small,
	() => screen.width
)
const snippetXOffset = useClientOnlyComputed(
	0,
	() => (screen.width > breakpoints.small ? -250 : 0),
	() => screen.width
)

const COLS = 7

const GRID_CONFIG = {
	desktop: { rows: 8, titleWord0: 1, titleWord1: 15, titleWord2: 36, contentCell: 22, subtitleCell: 35, mobileCell1: null, mobileSubtitleCell: null },
	small: { rows: 10, titleWord0: 1, titleWord1: 22, titleWord2: 43, contentCell: null, subtitleCell: null, mobileCell1: 22, mobileSubtitleCell: 62 },
	xsmall: { rows: 12, titleWord0: 1, titleWord1: 29, titleWord2: 57, contentCell: null, subtitleCell: null, mobileCell1: 29, mobileSubtitleCell: 76 },
}

const gridConfig = ref(GRID_CONFIG.desktop)

const updateConfig = (width) => {
	if (width <= breakpoints.xsmall) gridConfig.value = GRID_CONFIG.xsmall
	else if (width <= breakpoints.small) gridConfig.value = GRID_CONFIG.small
	else gridConfig.value = GRID_CONFIG.desktop
}

const rows = computed(() => gridConfig.value.rows)

const mobilePositions = computed(() => ({
	cell1: gridConfig.value.mobileCell1,
	subtitleCell: gridConfig.value.mobileSubtitleCell,
}))

watch(() => screen.width, updateConfig)

const cellStyle = (cell) => ({
	'--cell-col': (cell - 1) % COLS,
	'--cell-row': Math.floor((cell - 1) / COLS),
})

const mobileBgCells = computed(() => {
	const c = gridConfig.value.mobileCell1
	if (!c) return new Set()
	return new Set([c, c + 1, c + COLS, c + COLS + 1])
})

const block1Line1Opts = { typingSpeed: 0.07, typoChance: 0.05 }
const block1Line2Opts = { typingSpeed: 0.07, typoChance: 0.05, delay: 0.5 }
let block1Type1, block1Type2, scrollTrigger

const titleWords = computed(() => (props.title ?? []).map((word) => word.split('')))
const titleRow2Offset = computed(() => COLS - (titleWords.value[1]?.length ?? 0))

const hasTitleChar = (i) => {
	const cfg = gridConfig.value
	if (i >= cfg.titleWord0 && i < cfg.titleWord0 + COLS && titleWords.value[0]?.[i - cfg.titleWord0]) return true
	if (i >= cfg.titleWord1 && i < cfg.titleWord1 + COLS && i - cfg.titleWord1 >= titleRow2Offset.value && titleWords.value[1]?.[i - cfg.titleWord1 - titleRow2Offset.value]) return true
	if (i >= cfg.titleWord2 && i < cfg.titleWord2 + COLS && titleWords.value[2]?.[i - cfg.titleWord2]) return true
	return false
}

const setup = () => {
	updateConfig(screen.width)

	const q = (s) => ref(el.value?.querySelector(s))
	block1Type1 = useTerminalType(q('.block1-line1'), block1Line1Opts)
	block1Type2 = useTerminalType(q('.block1-line2'), block1Line2Opts)

	block1Type1.init()
	block1Type2.init()
}
const kill = () => {
	block1Type1?.kill()
	block1Type2?.kill()
	scrollTrigger?.kill()
}

onBeforeUnmount(() => kill())
onMounted(() => {
	context.$page.loader.hydrationReady.then(() => {
		setup()
		scrollTrigger = ScrollTrigger.create({
			trigger: el.value,
			start: 'top 80%',
			once: true,
			onEnter: () => {
				isReady.value = true
				setTimeout(() => {
					block1Type1?.start()
					block1Type2?.start()
				}, 1250)
				setTimeout(() => {
					hasAnimated.value = true
				}, 2000)
			},
		})
	})
})
</script>

<style lang="scss" scoped>
[data-component='hackian'] {
	--icon-color: var(--color-deep-green-500);

	position: relative;
	isolation: isolate;

	.gradient {
		position: sticky;

		width: 100%;

		top: -10lvh;
		height: 120lvh;

		z-index: 0;

		background: linear-gradient(to top, var(--color-bright-green-500) 0%, var(--color-bright-green-50) 75%);
		pointer-events: none;
	}

	.grid-container {
		position: relative;
		background: transparent;
	}

	.overlay {
		position: absolute;
		left: 0;
		width: 100%;

		top: calc(100% / 8);
		height: calc(100% / 8);

		z-index: 2;
		pointer-events: none;

		display: flex;
		align-items: center;
		justify-content: center;

		@include max-width($sm) {
			top: calc(100% / 10 + 100% / 20);
			height: calc(100% / 10);
		}

		@include max-width($xs) {
			top: calc(100% / 12);
			height: calc(100% / 4);
		}

		.description {
			color: var(--color-deep-green-500);
			text-align: center;
			width: column-width(8);

			@include max-width($sm) {
				width: column-width(12);
			}

			@include max-width($xs) {
				width: column-width(16);
			}
		}
	}

	.snippet-overlay {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		left: 0;
		width: 100%;
		height: 25%;
		z-index: 3;
		pointer-events: none;
	}

	.video-container {
		z-index: 0;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		//margin: 1px;

		:deep(video) {
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
		}
	}

	.cell-outline-defs {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;

		.cell-outline-gradient-start {
			stop-color: var(--color-deep-green-800);
		}

		.cell-outline-gradient-end {
			stop-color: var(--color-bright-green-50);
		}
	}

	.grid {
		position: relative;

		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-template-rows: repeat(var(--grid-rows), 1fr);

		width: 100%;

		color: var(--color-deep-green-500);

		overflow: hidden;

		.col-seam {
			position: absolute;

			width: 1px;
			height: calc(100% / var(--grid-rows) * 0.15);

			z-index: 3;
			pointer-events: none;

			translate: -50% 0;

			@include max-width($xs) {
				width: 0.5px;
			}

			&.-top {
				top: -1px;
				background: linear-gradient(to bottom, var(--color-deep-green-800) 50%, var(--color-bright-green-50) 90%);
			}

			// &.-bottom {
			// 	bottom: -1px;
			// 	background: linear-gradient(to top, var(--color-bright-green-50) 50%, var(--color-deep-green-700));
			// }
		}

		.mobile-cell {
			display: none;
			position: absolute;

			z-index: -1;

			left: calc(100% / 7 * var(--cell-col));
			top: calc(100% / var(--grid-rows) * var(--cell-row));

			.subtitle {
				max-width: 1%;
			}

			// &.-subtitle {
			// 	--icon-color: white;
			// 	color: white;
			// }

			@include max-width($sm) {
				display: flex;
				flex-direction: column;
				justify-content: space-between;

				width: calc(100% / 7 * 2);
				height: calc(100% / var(--grid-rows) * 2);

				z-index: 2;
				padding: rs(20, 8);

				.block1-line {
					max-width: 50%;
				}
			}

			@include max-width($xxs) {
				.block1-line {
					max-width: 90%;
				}
			}

			.logo-container {
				display: flex;
				flex-direction: row;
				align-items: center;
				gap: rs(10, 8);

				.hackian-type {
					height: rs(12, 10);
					width: auto;

					:deep(path) {
						fill: currentColor;
					}
				}
			}

			&.-subtitle {
				color: #1d0c0c;
				mix-blend-mode: difference;
				filter: invert(1);
			}
		}

		// rendered outside .cell-wrapper so its overflow:hidden crop doesn't clip the 3D flip
		.bg-flip {
			position: absolute;

			left: calc(100% / 7 * var(--cell-col));
			top: calc(100% / var(--grid-rows) * var(--cell-row));
			width: calc(100% / 7);
			height: calc(100% / var(--grid-rows));
			z-index: 2;

			transform-style: preserve-3d;

			.bg-front,
			.bg-back {
				position: absolute;
				inset: 0;

				border-radius: rs(15, 4);
				backface-visibility: hidden;
			}

			.bg-front {
				background-color: var(--color-deep-green-600);
			}

			.bg-back {
				transform: rotateY(180deg);
			}

			&.-cell-1 {
				@include max-width($sm) {
					display: none;
				}
				.bg-back {
					background-color: var(--color-bright-green-500);
				}
			}

			&.-cell-3 {
				.bg-back {
					background-color: rgb(from var(--color-deep-green-700) r g b / 0.75);
					backdrop-filter: blur(12px);
				}
			}
		}

		.cell-wrapper {
			position: relative;
			overflow: hidden;

			border: 1px solid var(--color-bright-green-50);
			margin: -0.5px;

			@include max-width($xs) {
				border-width: 0.5px;
				margin: -0.25px;
			}

			&:nth-child(-n + 7 of .cell-wrapper) {
				border-top-color: var(--color-deep-green-700);
			}

			&:nth-last-child(-n + 7 of .cell-wrapper) {
				border-bottom-color: var(--color-bright-green-50);
			}

			&.-mobile-bg {
				@include max-width($sm) {
					.cell {
						border-radius: 0;
					}

					&::before {
						content: '';
						position: absolute;

						width: 100%;
						height: 100%;

						background-color: var(--color-bright-green-500);
					}
				}
			}

			.cell-outline {
				position: absolute;
				inset: rs(-1, -0.5);

				pointer-events: none;

				:deep(svg) {
					display: block;
					width: 100%;
					height: 100%;

					path {
						fill: var(--color-bright-green-50);
					}
				}
			}

			// first row only: fade the cell outline via gradient instead of a flat fill
			&:nth-child(-n + 7 of .cell-wrapper) {
				.cell-outline :deep(svg) path {
					fill: url(#cell-outline-gradient);
				}
			}

			.cell-1-content {
				position: absolute;
				inset: 0;

				z-index: 2;
				padding: rs(20, 20);

				display: flex;
				flex-direction: column;
				justify-content: space-between;

				color: var(--color-deep-green-500);

				> span:first-child {
					opacity: 0.5;
					max-width: rs(42, 42);
				}

				> span:last-child {
					max-width: rs(64, 64);
				}

				@include max-width($sm) {
					display: none;
				}
			}

			.cell-2-content {
				position: absolute;
				inset: 0;

				z-index: 2;
				padding: rs(10, 10);

				display: flex;
				flex-direction: column;
				justify-content: space-between;

				color: var(--color-deep-green-500);

				.function-bg {
					background-color: var(--color-bright-green-500);

					border-radius: rs(15, 4);
					padding: rs(5, 5);

					display: flex;
					justify-content: center;

					width: fit-content;
					opacity: 0;

					:deep(span) {
						font-size: rs(8, 8);
					}
				}

				.code-container {
					align-self: flex-end;

					:deep(span) {
						@include mono-2;
						font-size: rs(8, 8);
						color: var(--color-bright-green-500);
						white-space: pre-wrap;
						tab-size: 10;
						display: inline;
					}

					:deep(div) {
						@include mono-2;
						font-size: rs(8, 8);
						white-space: pre-wrap;
						tab-size: 10;
						margin: 0;
					}
				}
			}
		}

		.cell {
			position: relative;
			z-index: 1;
			aspect-ratio: 212 / 190;
			overflow: hidden;
			border-radius: rs(15, 4);

			display: flex;
			align-items: center;
			justify-content: center;

			&.-has-title {
				color: #1d0c0c;
				mix-blend-mode: difference;
				filter: invert(1);
			}

			.title-chars {
				text-align: center;
				font-size: rs(110, 40);

				margin-top: 5px;
				margin-right: 5px;
			}

			.subtitle-cell {
				padding: rs(20, 20);

				display: flex;
				flex-direction: column;
				justify-content: space-between;

				height: 100%;

				@include max-width($sm) {
					display: none;
				}

				.logo-container {
					display: flex;
					flex-direction: row;
					align-items: center;
					gap: rs(10, 8);

					.hackian-type {
						height: rs(12, 10);
						width: auto;

						:deep(path) {
							fill: currentColor;
						}
					}
				}

				.subtitle {
					max-width: 1%;
				}
			}

			.cell-content {
				.foreground {
					position: absolute;
					inset: 0;
					z-index: 0;

					background-color: var(--color-deep-green-500);
				}
			}
		}
	}

	&.-ready {
		.grid .bg-flip {
			animation: 1.5s forwards ease(out-quint) rotate-3d;

			&.-cell-1 {
				animation-delay: 0.25s;
			}
			&.-cell-3 {
				animation-delay: 0.45s;
			}
		}
		.grid .cell .cell-content .foreground {
			animation: 1s 1.1s both fade-out;
		}
		.grid .cell-wrapper .cell-2-content .function-bg {
			animation: 0.5s 1.2s both fade-in;
		}
	}

	&.-animated {
		.grid .bg-flip {
			animation: none;
			transform: perspective(1000px) rotateY(180deg);
		}
		.grid .cell .cell-content .foreground {
			animation: none;
			opacity: 0;
		}
		.grid .cell-wrapper .cell-2-content .function-bg {
			animation: none;
			opacity: 1;
		}
	}

	@keyframes rotate-3d {
		from {
			transform: perspective(1000px) rotateY(0deg);
		}

		to {
			transform: perspective(1000px) rotateY(180deg);
		}
	}

	@keyframes fade-out {
		from {
			opacity: 1;
		}

		to {
			opacity: 0;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	.ecosystem {
		position: relative;

		color: var(--color-deep-green-500);
		//isolation: isolate;
		//transform: translateZ(0);

		.ecosystem-content {
			position: relative;
			margin-top: -120vh;
		}

		.text-container {
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;

			padding: rs(60, 24) var(--grid-margin);
			padding-top: rs(120, 60);

			.top-note {
				z-index: 1;
			}

			.title {
				max-width: column-width(13);
				padding-top: rs(36, 24);
				padding-bottom: rs(24, 24);

				z-index: 1;

				@include max-width($md) {
					max-width: column-width(24);
				}

				@include max-width($xs) {
					max-width: 90%;
				}

				@include max-width($xxs) {
					max-width: 100%;
				}
			}

			.description {
				opacity: 0.5;
				white-space: pre-line;
				max-width: column-width(9);

				@include max-width($md) {
					max-width: column-width(16);
				}

				@include max-width($xs) {
					max-width: 90%;
				}

				@include max-width($xxs) {
					max-width: 100%;
				}
			}
		}

		.cards-container {
			padding-bottom: rs(120, 60);
			padding-top: rs(60, 24);
			will-change: transform;
			transform: translateZ(0);

			.top-cards {
				display: flex;
				flex-direction: row;
				gap: rs(24, 24);

				@include max-width($sm) {
					flex-direction: column;
				}

				.first-col {
					display: flex;
					flex-direction: column;
					gap: rs(24, 24);
					flex: 0 0 calc(44.69% - 24px / 2);

					:deep([data-component='remediation-card']) {
						flex: 1;
						aspect-ratio: unset;

						@include max-width($sm) {
							aspect-ratio: 447 / 320;
						}
					}

					:deep([data-component='accuracy-card']) {
						flex: 1;

						@include max-width($sm) {
							aspect-ratio: 447 / 320;
						}
					}
				}

				.second-col {
					flex: 1;
					overflow: hidden;
				}
			}

			.bottom-cards {
				display: flex;
				flex-direction: row;
				gap: rs(24, 24);
				padding-top: rs(24, 24);

				height: fit-content;

				:deep([data-component='stat-card']:first-child) {
					flex: 0 0 calc(44.69% - 24px / 2);
				}

				@include max-width($sm) {
					flex-direction: column;
					height: fit-content;
				}
			}
		}
	}

	.buttons-container {
		width: 100%;

		display: flex;
		justify-content: center;

		padding-bottom: rs(120, 60);
	}
}
</style>

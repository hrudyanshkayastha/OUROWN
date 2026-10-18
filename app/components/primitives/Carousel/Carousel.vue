<template>
	<div ref="el" data-component="carousel" :class="{ '-loaded': isLoaded, '-can-animate': canAnimate, '-static': isStatic }" :style="{ '--loop-duration': `${loopDuration}s` }">
		<p v-if="label" class="-upper-title -uppercase uppertitle">{{ label }}</p>

		<div class="carousel-container">
			<ul v-if="logos" ref="firstListEl" class="logos">
				<template v-for="(item, i) in logos" :key="i">
					<li v-if="item.url" class="item" :aria-label="item.alt">
						<SvgAsset ref="svgAssets" :url="item.url" />
					</li>
				</template>
			</ul>

			<ul v-if="logos && !isStatic" class="logos" aria-hidden="true">
				<template v-for="(item, i) in logos" :key="i">
					<li v-if="item.url" class="item">
						<SvgAsset ref="svgAssets" :url="item.url" />
					</li>
				</template>
			</ul>
		</div>

		<span v-if="fade && !isStatic" class="gradient left" />
		<span v-if="fade && !isStatic" class="gradient right" />
	</div>
</template>

<script setup>
import { useScreen } from 'vue-screen'
import { useInViewport, useClientOnlyComputed } from '~/composables/core'
import { SvgAsset } from '~/components/core/SvgAsset'
import { breakpoints } from '~/config'

const STATIC_THRESHOLD = 5
const STATIC_THRESHOLD_MOBILE = 1
const SPEED_PX_PER_SECOND = 40

const props = defineProps({
	label: { type: String, default: undefined },
	logos: { type: Array, default: undefined },
	fade: { type: Boolean, default: false },
})

const el = ref(null)
const firstListEl = ref(null)
const svgAssets = ref([])
const context = inject('pageContext')
const isLoaded = ref(false)
const canAnimate = ref(true)
const loopDuration = ref(60)
const { viewport } = useInViewport(el)

const screen = useScreen()
const isMobile = useClientOnlyComputed(true, () => screen.width <= breakpoints.small, screen)

const isStatic = computed(() => (props.logos?.length ?? 0) <= (isMobile.value ? STATIC_THRESHOLD_MOBILE : STATIC_THRESHOLD))

const updateLoopDuration = () => {
	const width = firstListEl.value?.offsetWidth
	if (width) loopDuration.value = width / SPEED_PX_PER_SECOND
}

const checkLoadedPromises = () => {
	nextTick(() => {
		const promises = svgAssets.value.map((item) => item?.loaded).filter(Boolean)

		if (promises.length > 0) {
			Promise.all(promises).then(() => {
				isLoaded.value = true
				nextTick(updateLoopDuration)
			})
		} else {
			isLoaded.value = true
			nextTick(updateLoopDuration)
		}
	})
}

const init = () => {
	watch(viewport, (newValue) => (canAnimate.value = newValue?.inViewport ?? false))
}

onMounted(() => {
	checkLoadedPromises()
	context.$page.loader.ready.then(() => init())
})

watch(
	() => screen.width,
	() => updateLoopDuration()
)

watch(
	() => props.logos,
	() => {
		isLoaded.value = false
		checkLoadedPromises()
	},
	{ deep: true }
)
</script>

<style lang="scss" scoped>
[data-component='carousel'] {
	position: relative;
	width: 100%;
	overflow: hidden;

	.uppertitle {
		position: relative;
		text-align: center;
		padding-bottom: rs(32, 16);
		color: var(--carousel-label-color, var(--color-deep-green-300));
		z-index: 2;
	}

	.carousel-container {
		display: flex;
		width: max-content;

		will-change: transform;
	}

	&.-loaded {
		&.-can-animate:not(.-static) {
			.carousel-container {
				animation: loop var(--loop-duration, 60s) linear infinite;
			}
		}
	}

	&.-static {
		.carousel-container {
			width: 100%;
			justify-content: center;
		}
	}

	@keyframes loop {
		from {
			transform: translateX(0%);
		}
		to {
			transform: translateX(-50%);
		}
	}

	.logos {
		position: relative;
		padding: 0 rs(60);

		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		height: rs(60, 60);
		gap: rs(90, 36);

		:deep(svg) {
			height: rs(110, 80);

			path {
				fill: var(--carousel-logo-color, var(--color-muted-green-600));
			}
		}
	}

	.gradient {
		position: absolute;
		top: 0;
		bottom: 0;
		width: column-width(8);
		pointer-events: none;
		z-index: 1;

		&.left {
			left: 0;
			background: linear-gradient(to right, var(--carousel-fade-color, var(--color-light-grey-200)) 25%, transparent 100%);
		}

		&.right {
			right: 0;
			background: linear-gradient(to left, var(--carousel-fade-color, var(--color-light-grey-200)) 25%, transparent 100%);
		}
	}
}
</style>

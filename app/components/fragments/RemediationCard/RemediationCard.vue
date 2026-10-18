<template>
	<div ref="el" data-component="remediation-card" :data-theme="darkMode ? 'dark' : 'light'">
		<div class="content">
			<div class="description -text-1-cards">{{ description }}</div>
			<div class="stat -numbers-2">{{ stat }}</div>
		</div>

		<div class="bars">
			<div />
			<div class="top-bar-container">
				<div class="top-bar" />
			</div>
			<div class="bar-1" />
			<div class="bar-2" />
			<div class="bar-1" />
			<div class="bar-2" />
			<div class="bar-1" />
		</div>

		<div ref="shadowBallRef" class="ball-anchor">
			<div class="ball-shadow" />
		</div>
		<div ref="ballRef" class="ball-anchor">
			<div class="ball" />
		</div>

		<div class="gradient-left" />
		<div class="gradient-right" />
	</div>
</template>

<script setup>
import { gsap, ScrollTrigger } from 'gsap/all'
import { useScreen } from 'vue-screen'
import.meta.client && gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
	stat: { type: String, default: undefined },
	description: { type: String, default: undefined },
	darkMode: { type: Boolean, default: true },
})

const el = ref(null)
const ballRef = ref(null)
const shadowBallRef = ref(null)
const context = inject('pageContext')
const screen = useScreen()

let xTo
let yTo
let xToShadow
let yToShadow

let leaveTween
let shadowLeaveTween

const setup = () => {
	gsap.set(shadowBallRef.value, { opacity: 0 })
	xTo = gsap.quickTo(ballRef.value, 'x', { duration: 0.5, ease: 'power3' })
	yTo = gsap.quickTo(ballRef.value, 'y', { duration: 0.5, ease: 'power3' })
	xToShadow = gsap.quickTo(shadowBallRef.value, 'x', { duration: 0.5, ease: 'power3' })
	yToShadow = gsap.quickTo(shadowBallRef.value, 'y', { duration: 0.5, ease: 'power3' })
}

const onEnter = () => {
	if (leaveTween) leaveTween.kill()
	if (shadowLeaveTween) shadowLeaveTween.kill()
	gsap.to(shadowBallRef.value, { opacity: 1, duration: 0.5, ease: 'power2.out', overwrite: true })
	setup()
}

const onMove = (e) => {
	const { clientX, clientY } = e
	const { left, top, width, height } = el.value.getBoundingClientRect()
	const x = clientX - (left + width / 2)
	const y = clientY - (top + height / 2)
	if (xTo) xTo(x * 0.08)
	if (yTo) yTo(y * 0.05)
	if (xToShadow) xToShadow(x * 0.08)
	if (yToShadow) yToShadow(y * 0.05)
}

const onLeave = () => {
	leaveTween = gsap.to([ballRef.value, shadowBallRef.value], {
		x: 0,
		y: 0,
		duration: 1.5,
		delay: 0.1,
		ease: 'elastic.out',
	})
	shadowLeaveTween = gsap.to(shadowBallRef.value, { opacity: 0, delay: 0.1, duration: 1.0, ease: 'power2.out' })
}

onMounted(() => {
	context.$page.loader.loaded.then(() => setup())
	if (screen.touch) return
	el.value.addEventListener('mouseenter', onEnter)
	el.value.addEventListener('mousemove', onMove)
	el.value.addEventListener('mouseleave', onLeave)
})
onBeforeUnmount(() => {
	if (screen.touch) return
	el.value.removeEventListener('mouseenter', onEnter)
	el.value.removeEventListener('mousemove', onMove)
	el.value.removeEventListener('mouseleave', onLeave)
})
</script>

<style lang="scss" scoped>
[data-component='remediation-card'] {
	--rc-bg: var(--color-deep-green-600);
	--rc-text: var(--color-bright-green-200);
	--rc-bar: var(--color-bright-green-500);
	--rc-ball: var(--color-bright-green-500);
	--rc-gradient: var(--color-deep-green-600);

	--rc-shadow-opacity: 0.5;

	&[data-theme='light'] {
		--rc-bg: var(--color-bright-green-25);
		--rc-text: var(--color-deep-green-500);
		--rc-bar: var(--color-bright-green-500);
		--rc-ball: var(--color-bright-green-500);
		--rc-gradient: var(--color-bright-green-25);
		--rc-shadow-opacity: 1;
	}

	position: relative;
	width: 100%;
	height: 100%;
	aspect-ratio: 446 / 320;
	background-color: var(--rc-bg);

	border-radius: rs(24, 16);

	overflow: hidden;

	.content {
		position: relative;
		z-index: 3;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;

		padding: rs(20, 20) rs(32, 32);

		color: var(--rc-text);

		.stat {
			text-align: right;
			letter-spacing: -0.1em;
		}
	}

	.bars {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;

		display: flex;
		flex-direction: column;

		padding: rs(24, 24) 0;

		> div {
			width: 100%;

			flex: 1;
		}

		.top-bar-container {
			padding: 0 rs(32, 32);
		}

		.top-bar {
			border-bottom: 1px solid var(--rc-bar);
			height: 100%;
		}

		.bar-1 {
			background-color: rgba(218, 237, 237, 0.01);
			backdrop-filter: blur(32px);
			-webkit-backface-visibility: hidden;
			transform: translateZ(0);
		}

		.bar-2 {
			background-color: rgba(218, 237, 237, 0.01);
			backdrop-filter: blur(20px);
			-webkit-backface-visibility: hidden;
			transform: translateZ(0);
		}
	}

	.ball-anchor {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100%;
		height: 100%;

		&:first-of-type {
			z-index: 0;
		}

		&:last-of-type {
			z-index: 1;
		}
	}

	.ball {
		transform: translate(-50%, -50%);

		height: 70%;
		aspect-ratio: 1 / 1;

		border-radius: 100%;
		background-color: var(--rc-ball);
	}

	.ball-shadow {
		transform: translate(-50%, -50%) translateZ(0);
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		will-change: transform;

		height: 70%;
		aspect-ratio: 1 / 1;

		border-radius: 100%;
		background-color: rgb(from var(--rc-ball) r g b / var(--rc-shadow-opacity));
		filter: blur(20px);
	}

	.gradient-left,
	.gradient-right {
		position: absolute;
		top: 0;
		width: rs(80, 80);
		height: 100%;
		z-index: 2;
		pointer-events: none;
	}

	.gradient-left {
		left: 0;
		background: linear-gradient(to right, var(--rc-gradient), transparent);
	}

	.gradient-right {
		right: 0;
		background: linear-gradient(to left, var(--rc-gradient), transparent);
	}

	@supports (corner-shape: superellipse(1.5)) {
		& {
			border-radius: rs(28, 20);
			corner-shape: superellipse(1.5);
		}
	}
}
</style>

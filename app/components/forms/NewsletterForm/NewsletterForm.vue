<template>
	<div ref="el" data-component="newsletter-form" :class="{ 'root-path': isRootPath }">
		<div :id="id" class="newsletter-target" />
	</div>
</template>

<script setup>
import { useHubspot } from '~/composables'

import { useEmitter } from '~/composables/core'

const props = defineProps({
	buttonLabel: { type: String, default: '' },
	region: { type: String, default: undefined },
	portalId: { type: String, default: undefined },
	formId: { type: String, default: undefined },
})

const el = ref(null)
const context = inject('pageContext')
const route = useRoute()
const emitter = useEmitter()

const isRootPath = computed(() => route.path === '/')
const hubspotFormLoaded = useHubspot()
const id = computed(() => `hubspot-form-${route.path.replace(/\//g, '-')}`)

const createForm = () => {
	window.hbspt.forms.create({
		portalId: props.portalId,
		formId: props.formId,
		region: props.region,
		target: `#${id.value}`,
		css: '',
		inlineMessage: 'You have successfully subscribed our newsletter! ',

		onFormReady: function ($form) {
			$form.querySelector('.hs-richtext').parentNode.remove()
			$form.querySelector('.hs-input').placeholder = 'Enter your e-mail'
			$form.querySelector('.hs-button').value = props.buttonLabel

			emitter.emit('CrtCanvas-update')
		},

		onFormSubmit: function ($form) {
			$form.querySelector('.hs-button').value = 'Submitting...'
		},
	})
}

const setup = () => {
	watch(
		hubspotFormLoaded,
		() => {
			if (window.hbspt?.forms) createForm()
		},
		{ immediate: true }
	)
}
const init = () => {}
const kill = () => {}

onUnmounted(() => {})

onMounted(() => {
	context.$page.loader.ready.then(() => setup())
})
</script>

<style lang="scss" scoped>
[data-component='newsletter-form'] {
	background-color: var(--newsletter-form-inputBgColor, rgb(from var(--color-bright-green-100) r g b / 0.8));
	border-radius: rs(14, 14);

	width: 100%;

	font-variant-ligatures: none;

	:has(.hs-error-msg) {
		background-color: var(--color-hubspot-error-bg);
		border-radius: rs(14, 14);

		@supports (corner-shape: superellipse(1.5)) {
			& {
				border-radius: rs(18, 18);
				corner-shape: superellipse(1.5);
			}
		}
	}

	&:focus-within {
		background-color: var(--newsletter-form-focusBgColor, rgb(from var(--color-bright-green-50) r g b / 0.8));
	}

	:deep(.newsletter-target) {
		form {
			position: relative;
			padding: rs(12, 12);

			display: flex;
			justify-content: space-between;
			align-items: center;
			flex-direction: row;
		}

		.hs-richtext {
			display: none;
		}

		.hs-email {
			width: 100%;

			label:first-of-type {
				span {
					display: none;
				}
			}

			input {
				@include mono-1;
				font-variant-ligatures: none;
				padding: 0 rs(16);

				color: var(--newsletter-form-inputColor, rgb(from var(--color-deep-green-500) r g b / 0.56));
				&::placeholder {
					color: var(--newsletter-form-inputColor, rgb(from var(--color-deep-green-500) r g b / 0.56));
				}
				cursor: text;
			}

			input:-webkit-autofill {
				-webkit-text-fill-color: var(--newsletter-form-inputColor, rgb(from var(--color-deep-green-500) r g b / 0.56));
				transition: background-color 9999s ease-in-out 0s;
			}

			ul {
				display: none;
			}

			ul:first-of-type {
				display: flex;

				label {
					display: none;
				}

				label:first-of-type {
					display: flex;

					@include mono-2;
					position: absolute;
					color: var(--color-hubspot-error-msg);
					top: 100%;
					left: 0;
					padding: rs(12) rs(14);
				}
			}
		}

		&:has(.hs-error-msg) .hs-email input {
			color: var(--newsletter-form-errorInputColor, rgb(from var(--color-deep-green-500) r g b / 0.56));

			&::placeholder {
				color: var(--newsletter-form-errorInputColor, rgb(from var(--color-deep-green-500) r g b / 0.56));
			}
		}

		&:has(.hs-error-msg) .hs-email input:-webkit-autofill {
			-webkit-text-fill-color: var(--newsletter-form-errorInputColor, rgb(from var(--color-deep-green-500) r g b / 0.56));
			transition: background-color 9999s ease-in-out 0s;
		}

		.hs-button {
			@include mono-1;
			color: var(--newsletter-form-buttonColor, rgb(from var(--color-bright-green-100) r g b / 0.8));
			background-color: var(--newsletter-form-buttonBgColor, var(--color-deep-green-500));
			height: rs(40, 40);
			border-radius: rs(12, 12);
			padding: 0 rs(14, 14);
			align-content: center;
			text-wrap: nowrap;

			transition: transform 0.5s ease(out-quint), opacity 0.5s ease(out-quint);

			@include hover {
				opacity: 0.85;
			}

			@supports (corner-shape: superellipse(1.5)) {
				& {
					border-radius: rs(16, 16);
					corner-shape: superellipse(1.5);
				}
			}
		}

		&:has(.hs-error-msg) .hs-button {
			background-color: var(--color-deep-green-500);

			color: var(--color-hubspot-error-bg);
		}

		.hs-error-msg {
			color: var(--color-hubspot-error-msg);
		}

		.hs_error_rollup {
			display: none;
		}

		.submitted-message {
			padding: 0 rs(20);
			height: rs(52, 52);
			align-content: center;
			@include mono-1;
		}
	}

	&.root-path {
		:deep(.newsletter-target) {
			form {
				padding: rs(6, 6);
			}
		}
	}

	@supports (corner-shape: superellipse(1.5)) {
		& {
			border-radius: rs(18, 18);
			corner-shape: superellipse(1.5);
		}
	}
}
</style>

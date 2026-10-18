<template>
	<Page v-if="data" ref="page" :slug="data.metadata.slug" :name="data.name" :metadata="data.metadata" :transition-enter="onEnter" :transition-leave="onLeave">
		<Home v-bind="data" />
	</Page>
</template>

<script setup>
import { Page } from '~/components/core/Page'
import { Home } from '~/components/pages/Home'
import { home } from '~/sanity/projections'
import { pageTransition } from '~/transitions/page'
import { useTransition } from '~/composables/core'

const query = home()
const page = ref(null)

const { onEnter, onLeave } = useTransition()

const { data, error } = await useSanityQuery(query)

if (error.value) {
	throw showError({
		statusCode: error.value?.statusCode || 500,
		statusMessage: error.value?.message || 'An error occurred',
	})
}

if (!data.value) {
	throw showError({
		statusCode: 404,
		statusMessage: 'Page not found',
	})
}

definePageMeta({
	pageTransition,
	robots: 'noindex, nofollow',
})
</script>

<template>
	<div ref="el" data-component="home" data-page="Index.page">
		<CrtCanvas>
			<Header v-bind="getSection('header')" data-menu-theme="light" />
			<LazyHomeIssue v-bind="getSection('issue')" data-menu-theme="light" data-section="Issue.section" :hydrate-after="hydrateDelays.issue" />

			<LazyHomeHackian v-bind="getSection('hackian')" data-menu-theme="dark" data-section="Hackian.section" :hydrate-after="hydrateDelays.hackian" />

			<LazySectionsSeeTestAct v-bind="getSection('seeTestAct')" data-menu-theme="light" class="see-test-act" data-section="SeeTestAct.section" :hydrate-after="hydrateDelays.seeTestAct" />
			<LazyHomePlatform v-bind="getSection('platform')" data-menu-theme="light" data-section="Platform.section" :hydrate-after="hydrateDelays.platform" />
			<LazyHomeUseCases v-bind="getSection('useCases')" data-menu-theme="light" data-section="UseCases.section" :hydrate-after="hydrateDelays.useCases" />

			<LazySectionsPreFooter v-if="preFooter" v-bind="preFooter" :hydrate-after="hydrateDelays.preFooter" />
			<LazySectionsFooter v-bind="footer" :hydrate-after="hydrateDelays.footer" />
		</CrtCanvas>
	</div>
</template>

<script setup>
import { Header } from './sections/Header'

import { CrtCanvas } from '~/components/primitives/CrtCanvas'
import { useSectionLookup } from '~/composables/useSectionLookup'
import { useHydrateStaggered } from '~/composables/core'

const props = defineProps({
	sections: { type: Array, default: undefined },
	footer: { type: Object, default: undefined },
	preFooter: { type: Object, default: undefined },
})

const { factor } = useHydrateStaggered()

const hydrateDelays = {
	issue: 500 * factor,
	hackian: 750 * factor,
	seeTestAct: 1000 * factor,
	platform: 1250 * factor,
	useCases: 1500 * factor,
	preFooter: 1750 * factor,
	footer: 2000 * factor,
}

const el = ref(null)
const context = inject('pageContext')

const { getSection: getSectionByType } = useSectionLookup(props)
const getSection = (section) => getSectionByType(section, { matchTitle: true })

const setup = () => {}
const init = () => {}
const kill = () => {}

onBeforeUnmount(() => {})
onMounted(() => {
	setTimeout(() => {
		context.$page.loader.dispatch('hydration-ready')
	}, hydrateDelays.footer + 50)
})
</script>

<style lang="scss" scoped>
[data-component='home'] {
	position: relative;

	background-color: var(--color-deep-green-800);

	.see-test-act {
		padding: rs(120, 60) 0;
	}
}
</style>

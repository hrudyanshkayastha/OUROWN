import { useDevice } from '#imports'

export function useHydrateStaggered() {
	const device = useDevice()
	const factor = device.isDesktop ? 0.1 : 1.0

	const registerHydration = (hydrateRef, baseDelay, debug = false) => {
		setTimeout(() => {
			hydrateRef.value = true
			if (debug) {
				const identifier = typeof debug === 'string' ? ` (${debug})` : ''
				console.warn(`[Hydration Debug] Hydrated${identifier} after ${baseDelay * factor}ms (factor: ${factor})`)
			}
		}, baseDelay * factor)
	}

	return {
		registerHydration,
		factor,
	}
}

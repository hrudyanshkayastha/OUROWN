import { isRef, watch, onBeforeUnmount, onMounted } from 'vue'

export function useSwipe(target, { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = {}) {
	let touchStartX = 0
	let touchStartY = 0
	let activeElement = null

	const handleTouchStart = (e) => {
		touchStartX = e.touches[0].clientX
		touchStartY = e.touches[0].clientY
	}

	const handleTouchEnd = (e) => {
		const dx = e.changedTouches[0].clientX - touchStartX
		const dy = e.changedTouches[0].clientY - touchStartY

		if (Math.abs(dx) > Math.abs(dy)) {
			// Ignore horizontal swipes if no horizontal handlers were provided (to avoid hijacking vertical page scroll)
			if (!onSwipeLeft && !onSwipeRight) return

			if (Math.abs(dx) > threshold) {
				if (dx < 0 && onSwipeLeft) {
					onSwipeLeft()
				} else if (dx > 0 && onSwipeRight) {
					onSwipeRight()
				}
			}
		} else {
			if (!onSwipeUp && !onSwipeDown) return

			if (Math.abs(dy) > threshold) {
				if (dy < 0 && onSwipeUp) {
					onSwipeUp()
				} else if (dy > 0 && onSwipeDown) {
					onSwipeDown()
				}
			}
		}
	}

	const cleanup = () => {
		if (activeElement) {
			activeElement.removeEventListener('touchstart', handleTouchStart)
			activeElement.removeEventListener('touchend', handleTouchEnd)
			activeElement = null
		}
	}

	const setup = (el) => {
		cleanup()
		if (el) {
			activeElement = el
			activeElement.addEventListener('touchstart', handleTouchStart, { passive: true })
			activeElement.addEventListener('touchend', handleTouchEnd, { passive: true })
		}
	}

	if (isRef(target)) {
		watch(target, (newVal) => {
			setup(newVal)
		}, { immediate: true })
	} else {
		onMounted(() => {
			setup(target)
		})
	}

	onBeforeUnmount(() => {
		cleanup()
	})
}

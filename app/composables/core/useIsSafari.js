export const useIsSafari = () => {
	if (typeof navigator === 'undefined') return false

	const ua = navigator.userAgent
	return /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua)
}

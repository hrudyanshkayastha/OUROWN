export function useSectionLookup(props) {
	const normalizeTitle = (title) => title.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, (m) => m.toLowerCase())

	const getSection = (section, { matchTitle = false } = {}) => {
		const match = props.sections?.find((el) => (matchTitle && el.internalTitle && normalizeTitle(el.internalTitle) === section) || el._type == section)
		if (!match) return match
		// shallow copy ΓÇö avoid mutating the reactive prop object itself
		if (match.consoleSnippet?.code) return { ...match, 'data-console-snippet': JSON.stringify(match.consoleSnippet) }
		return match
	}

	return { getSection }
}

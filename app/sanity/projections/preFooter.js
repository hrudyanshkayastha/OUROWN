import groq from 'groq'

import { buttonCta } from './buttonCta.js'

export function preFooter(pageType) {
	return groq`*[_type == "sharedContent"][0].preFooters[("${pageType}" in pageTypes)][0] {
     title,
     description,
     buttonCtaList[]{${buttonCta()}},
     barsVariant,
     functionSnippet,
     consoleSnippet
}`
}

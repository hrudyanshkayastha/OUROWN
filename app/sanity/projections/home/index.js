import groq from 'groq'

import { metadata } from '../core/metadata.js'
import { header } from './sections/header.js'
import { seeTestAct } from '../seeTestAct.js'
import { platform } from './sections/platform.js'
import { useCases } from './sections/useCases.js'
import { hackian } from './sections/hackian.js'
import { issue } from './sections/issue.js'

import { footer } from '../footer.js'
import { preFooter } from '../preFooter.js'

export function home() {
	return groq`*[_type == 'page.home'][0]{
    _type,
    "metadata": metadata{...${metadata()}},
    "footer":{...${footer()}},
    "preFooter": ${preFooter('page.home')},
    "sections": sections[] {
      _type,
      _type == 'header' => {${header}, consoleSnippet},
      _type == 'seeTestAct' => {${seeTestAct}, consoleSnippet},
      _type == 'platform' => {${platform}, consoleSnippet},
      _type == 'useCases' => {${useCases}, consoleSnippet},
      _type == 'hackian' => {${hackian}, consoleSnippet},
      _type == 'issue' => {${issue}, consoleSnippet},
     }
  }
`
}

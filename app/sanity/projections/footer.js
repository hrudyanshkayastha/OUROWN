import groq from 'groq'

import { callToAction } from './core/callToAction.js'
import { imageAsset } from './core/imageAsset.js'
import { buttonCta } from './buttonCta.js'
import { socials } from './socials.js'

export function footer() {
	return groq`
 *[_type == 'sharedContent'][0] {
   ...footer {
     title,
     buttonCtaList[]{${buttonCta()}},
     secondaryPages[]{${callToAction()}},
     support {
       logo {...${imageAsset()}},
       "link": {
         "to": link[0]{
           "type": _type,
           "url": url,
           "slug": select(
             ^.link[0]->._type == 'page.landing' => '',
             ^.link[0]->metadata.slug.current
           ),
           "document": ^.link[0]->._type,
         }
       }
     },
     compliant,
     "snippets": snippets[].code,
     consoleSnippet
   },
   ...${socials()}
},
`
}

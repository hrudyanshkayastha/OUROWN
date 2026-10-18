import groq from 'groq'

export function metadata() {
	return groq`
    {
			"slug": slug.current,
			title,
			keywords,
			...*[_type == 'settings'][0].metadata{
				sitename,
				"sitedescription": description,
				"description": coalesce(^.description, description),
				"image": coalesce(^.image, preview).asset->.url
			},
			"organization": *[_type == 'settings'][0].organizationSchema,
    }
  `
}

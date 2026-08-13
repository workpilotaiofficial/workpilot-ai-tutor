const imageFields = `{
  "url": asset->url,
  "alt": coalesce(alt, asset->altText, "")
}`

const authorFields = `{
  "name": name,
  "role": role,
  "bio": bio,
  "avatar": avatar${imageFields}
}`

const categoryFields = `{
  "title": title,
  "slug": slug.current,
  "description": description
}`

const seoFields = `{
  "title": coalesce(metaTitle, ^.title),
  "description": coalesce(metaDescription, ^.excerpt),
  "canonicalUrl": canonicalUrl,
  "focusKeyword": focusKeyword,
  "noIndex": coalesce(noIndex, false),
  "noFollow": coalesce(noFollow, false),
  "ogImage": select(defined(ogImage.asset) => ogImage${imageFields}, defined(^.coverImage.asset) => ^.coverImage${imageFields}, null)
}`

export const blogPostProjection = `{
  "_id": _id,
  "title": title,
  "slug": slug.current,
  "excerpt": excerpt,
  "publishedAt": publishedAt,
  "featured": coalesce(featured, false),
  "readingTime": readingTime,
  "coverImage": coverImage${imageFields},
  "author": author->${authorFields},
  "category": category->${categoryFields},
  "ctaLabel": ctaLabel,
  "ctaUrl": ctaUrl,
  "seo": seo${seoFields},
  "body": body[]{
    ...,
    markDefs[]{
      ...,
      _type == "link" => {
        ...,
        "href": href,
        "blank": blank
      }
    },
    _type == "image" => {
      ...,
      "asset": asset->{
        "url": url
      }
    }
  }
}`

export const allPostsQuery = `*[_type == "post" && defined(slug.current) && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc) ${blogPostProjection}`

export const postsByCategoryQuery = `*[_type == "post" && defined(slug.current) && defined(publishedAt) && publishedAt <= now() && category->slug.current == $category] | order(publishedAt desc) ${blogPostProjection}`

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug && defined(publishedAt) && publishedAt <= now()][0] ${blogPostProjection}`

export const relatedPostsQuery = `*[_type == "post" && slug.current != $slug && defined(slug.current) && defined(publishedAt) && publishedAt <= now() && category->slug.current == $category] | order(publishedAt desc)[0...3] ${blogPostProjection}`

export const fallbackRelatedPostsQuery = `*[_type == "post" && slug.current != $slug && defined(slug.current) && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc)[0...3] ${blogPostProjection}`

export const categoriesQuery = `*[_type == "category" && defined(slug.current)] | order(title asc) ${categoryFields}`

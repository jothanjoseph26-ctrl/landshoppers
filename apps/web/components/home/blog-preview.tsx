import Link from 'next/link'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const blogPosts = [
  {
    id: 1,
    title: 'Top 10 Lagos Neighborhoods for First-Time Buyers in 2026',
    excerpt:
      'Discover the most affordable and promising neighborhoods in Lagos for first-time property buyers, with insights on price trends and future growth potential.',
    slug: 'top-10-lagos-neighborhoods-first-time-buyers-2026',
    category: 'Buying Guide',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    date: '2026-05-05',
    readTime: '8 min read',
  },
  {
    id: 2,
    title: 'Understanding Property Documentation in Nigeria: A Complete Guide',
    excerpt:
      'Everything you need to know about C of O, Governor\'s Consent, Survey Plans, and other essential property documents before making a purchase.',
    slug: 'understanding-property-documentation-nigeria-guide',
    category: 'Legal',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    date: '2026-05-02',
    readTime: '12 min read',
  },
  {
    id: 3,
    title: 'Investing in Nigerian Real Estate from the Diaspora',
    excerpt:
      'A comprehensive guide for Nigerians abroad looking to invest in property back home, including tips on finding trusted agents and avoiding scams.',
    slug: 'investing-nigerian-real-estate-diaspora-guide',
    category: 'Investment',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    date: '2026-04-28',
    readTime: '10 min read',
  },
]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BlogPreview() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Real Estate Insights
            </h2>
            <p className="mt-2 text-muted-foreground">
              Expert guides, market trends, and property investment tips
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/blog" className="gap-2">
              View All Articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Blog Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Card
              key={post.id}
              className="group overflow-hidden border-0 shadow-md transition-shadow hover:shadow-xl"
            >
              {/* Image */}
              <Link href={`/blog/${post.slug}`}>
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>

              <CardContent className="p-5">
                {/* Category */}
                <Badge variant="secondary" className="mb-3">
                  {post.category}
                </Badge>

                {/* Title */}
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                </Link>

                {/* Excerpt */}
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

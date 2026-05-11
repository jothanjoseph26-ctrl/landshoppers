import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

type BlogPostPageProps = {
  params: Promise<{ slug: string }>
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-16 lg:px-8">
      <Button asChild variant="ghost" className="mb-8 px-0">
        <Link href="/blog" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>
      </Button>
      <article>
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          {titleFromSlug(slug)}
        </h1>
        <p className="mt-4 text-muted-foreground">
          This guide is being prepared by the LandShoppers editorial team.
        </p>
        <div className="mt-8 rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
          Browse verified listings or contact the team while this article is completed.
        </div>
      </article>
    </main>
  )
}

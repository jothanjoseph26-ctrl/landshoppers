import Link from "next/link"
import { ArrowRight, FileText } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const posts = [
  "How to verify land documents before payment",
  "What buyers should know about off-plan projects",
  "A practical checklist for first-time property investors",
]

export default function BlogPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-muted-foreground">Market guides and buyer education.</p>
        </div>
      </div>
      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post}>
            <CardHeader>
              <CardTitle>{post}</CardTitle>
              <CardDescription>Editorial content shell for the SEO/content phase.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                Browse listings <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

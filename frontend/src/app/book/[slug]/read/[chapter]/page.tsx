"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    // Redirect to main reading page with chapter parameter
    router.replace(`/book/${params.id}/read?chapter=${params.chapter}`)
  }, [params.id, params.chapter, router])

  return null
}

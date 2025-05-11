"use client"

import WikiArticle from "@/components/wiki-article"
import BraynrHeader from "@/components/braynr-header"

export default function LensesPage() {
    return (
        <>
            <BraynrHeader />
            <main className="min-h-screen bg-[#f8f9fa]">
                <WikiArticle />
            </main>
        </>
    )
}

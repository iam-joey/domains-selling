import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const CATEGORIES = ['all', 'tech', 'finance', 'health', 'ecommerce', 'other']

type SearchParams = { category?: string; search?: string; min?: string; max?: string }

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'verified')
    .order('created_at', { ascending: false })

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }
  if (params.search) {
    query = query.ilike('domain_name', `%${params.search}%`)
  }
  if (params.min) {
    query = query.gte('asking_price', parseInt(params.min) * 100)
  }
  if (params.max) {
    query = query.lte('asking_price', parseInt(params.max) * 100)
  }

  const { data: listings } = await query

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">DomainMarket</Link>
          <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">Sign in / List a Domain →</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Browse Domains</h1>

        {/* Filters */}
        <form className="flex flex-wrap gap-3 mb-8">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Search domain..."
            className="h-9 rounded-md border border-input bg-white px-3 text-sm outline-none w-48"
          />
          <select
            name="category"
            defaultValue={params.category ?? 'all'}
            className="h-9 rounded-md border border-input bg-white px-3 text-sm outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <input
            name="min"
            defaultValue={params.min}
            type="number"
            placeholder="Min $"
            className="h-9 rounded-md border border-input bg-white px-3 text-sm outline-none w-24"
          />
          <input
            name="max"
            defaultValue={params.max}
            type="number"
            placeholder="Max $"
            className="h-9 rounded-md border border-input bg-white px-3 text-sm outline-none w-24"
          />
          <button type="submit" className="h-9 px-4 rounded-md bg-black text-white text-sm">Filter</button>
          <Link href="/listings" className="h-9 px-4 rounded-md border text-sm flex items-center">Clear</Link>
        </form>

        {!listings?.length ? (
          <div className="text-center py-20 text-gray-400">
            <p>No verified listings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="pt-5 flex flex-col gap-2">
                    <p className="font-semibold text-base truncate">{listing.domain_name}</p>
                    <Badge variant="outline" className="w-fit text-xs">{listing.category}</Badge>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{listing.description || 'No description provided.'}</p>
                    <p className="font-bold text-lg mt-auto pt-2">
                      {listing.asking_price ? `$${(listing.asking_price / 100).toLocaleString()}` : 'Price on request'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

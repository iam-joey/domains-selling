import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'verified')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">DomainMarket</span>
          <div className="flex items-center gap-4">
            <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900">Browse</Link>
            <Link href="/sign-in">
              <Button size="sm">List a Domain</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Buy &amp; Sell Premium Domains
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">
          Every listing is verified. Discover domains that are actually available and reach sellers directly.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/listings">
            <Button size="lg">Browse Domains</Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">List Your Domain</Button>
          </Link>
        </div>
      </section>

      {/* Recent listings */}
      {listings && listings.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <h2 className="text-xl font-semibold mb-5">Recently Listed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="pt-5 flex flex-col gap-2">
                    <p className="font-semibold text-base truncate">{listing.domain_name}</p>
                    <Badge variant="outline" className="w-fit text-xs">{listing.category}</Badge>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {listing.description || 'No description provided.'}
                    </p>
                    <p className="font-bold text-lg mt-auto pt-2">
                      {listing.asking_price
                        ? `$${(listing.asking_price / 100).toLocaleString()}`
                        : 'Price on request'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/listings">
              <Button variant="outline">View All Listings →</Button>
            </Link>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-semibold mb-8 text-center">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl mb-3">1</div>
              <h3 className="font-medium mb-1">List your domain</h3>
              <p className="text-sm text-gray-500">Sign in with Google and create a listing in minutes.</p>
            </div>
            <div>
              <div className="text-3xl mb-3">2</div>
              <h3 className="font-medium mb-1">Verify ownership</h3>
              <p className="text-sm text-gray-500">Add a DNS TXT record to prove you own the domain. We check automatically.</p>
            </div>
            <div>
              <div className="text-3xl mb-3">3</div>
              <h3 className="font-medium mb-1">Get contacted by buyers</h3>
              <p className="text-sm text-gray-500">Buyers discover your listing and reach out directly via your contact email.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

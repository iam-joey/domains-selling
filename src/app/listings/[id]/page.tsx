import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('listings').select('domain_name, asking_price').eq('id', id).single()
  if (!data) return {}
  return {
    title: `${data.domain_name} for sale — DomainMarket`,
    description: `Buy ${data.domain_name}${data.asking_price ? ` for $${(data.asking_price / 100).toLocaleString()}` : ''}`,
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .eq('status', 'verified')
    .single()

  if (!listing) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">DomainMarket</Link>
          <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900">← Back to listings</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">
        <div>
          <p className="text-sm text-gray-400 mb-1">Domain for sale</p>
          <h1 className="text-3xl font-bold">{listing.domain_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{listing.category}</Badge>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-500 text-sm">Asking Price</span>
              <span className="text-2xl font-bold">
                {listing.asking_price ? `$${(listing.asking_price / 100).toLocaleString()}` : 'Price on request'}
              </span>
            </div>
            {listing.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-800">{listing.description}</p>
              </div>
            )}
            <hr />
            <div>
              <p className="text-sm text-gray-500 mb-2">Contact the seller to make an offer</p>
              <a href={`mailto:${listing.contact_email}?subject=Interested in ${listing.domain_name}`}>
                <Button className="w-full">Contact Seller — {listing.contact_email}</Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-gray-400 text-center">
          Domain ownership has been verified by DomainMarket. Transactions are handled directly between buyer and seller.
        </p>
      </main>
    </div>
  )
}

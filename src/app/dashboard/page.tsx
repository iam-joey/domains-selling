import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  sold: 'bg-blue-100 text-blue-800',
  removed: 'bg-gray-100 text-gray-600',
}

const statusLabels: Record<string, string> = {
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  sold: 'Sold',
  removed: 'Removed',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Link href="/dashboard/listings/new">
          <Button>+ List a Domain</Button>
        </Link>
      </div>

      {!listings?.length ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">No listings yet</p>
          <p className="text-sm mb-6">List your first domain to get started</p>
          <Link href="/dashboard/listings/new">
            <Button>List a Domain</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {listings.map((listing) => (
            <div key={listing.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{listing.domain_name}</p>
                <p className="text-sm text-gray-500">
                  {listing.asking_price
                    ? `$${(listing.asking_price / 100).toLocaleString()}`
                    : 'Price on request'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[listing.status]}`}>
                  {statusLabels[listing.status]}
                </span>
                <Link href={`/dashboard/listings/${listing.id}`}>
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

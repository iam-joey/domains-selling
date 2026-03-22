'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type Listing = {
  id: string
  domain_name: string
  asking_price: number | null
  description: string
  category: string
  contact_email: string
  verify_token: string
  status: string
}

const statusColors: Record<string, string> = {
  pending_verification: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  verified: 'text-green-700 bg-green-50 border-green-200',
  sold: 'text-blue-700 bg-blue-50 border-blue-200',
  removed: 'text-gray-600 bg-gray-50 border-gray-200',
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [listing, setListing] = useState<Listing | null>(null)
  const [checking, setChecking] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    supabase.from('listings').select('*').eq('id', id).single().then(({ data }) => {
      setListing(data)
    })
  }, [id])

  async function checkVerification() {
    setChecking(true)
    setVerifyMsg('')
    const res = await fetch(`/api/verify/${id}`, { method: 'POST' })
    const json = await res.json()
    if (json.verified) {
      setListing((l) => l ? { ...l, status: 'verified' } : l)
      setVerifyMsg('✓ Domain verified! Your listing is now live.')
    } else {
      setVerifyMsg('TXT record not found yet. DNS can take up to 48hrs to propagate. Try again soon.')
    }
    setChecking(false)
  }

  async function markAsSold() {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', id)
    setListing((l) => l ? { ...l, status: 'sold' } : l)
  }

  async function removeListing() {
    setRemoving(true)
    await supabase.from('listings').update({ status: 'removed' }).eq('id', id)
    router.push('/dashboard')
  }

  if (!listing) return <div className="text-gray-400 py-20 text-center">Loading...</div>

  return (
    <div className="max-w-xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{listing.domain_name}</h1>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[listing.status]}`}>
          {listing.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      </div>

      {/* Verification instructions */}
      {listing.status === 'pending_verification' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-yellow-900">Verify Domain Ownership</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-yellow-800">
              Add the following TXT record to your domain&apos;s DNS settings to prove ownership:
            </p>
            <div className="bg-white rounded border border-yellow-200 p-3">
              <p className="text-xs text-gray-500 mb-1">Type: TXT — Host: @ (or leave blank)</p>
              <code className="text-sm font-mono break-all select-all">{listing.verify_token}</code>
            </div>
            <p className="text-xs text-yellow-700">
              After adding the record, click below. DNS changes can take a few minutes to 48hrs.
            </p>
            <Button onClick={checkVerification} disabled={checking} size="sm">
              {checking ? 'Checking...' : 'Check Verification'}
            </Button>
            {verifyMsg && (
              <p className={`text-sm ${verifyMsg.startsWith('✓') ? 'text-green-700' : 'text-yellow-700'}`}>
                {verifyMsg}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {listing.status === 'verified' && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          Your listing is live on the public marketplace.{' '}
          <Link href={`/listings/${listing.id}`} className="underline">View public listing →</Link>
        </div>
      )}

      {/* Listing details */}
      <Card>
        <CardContent className="pt-5 flex flex-col gap-3 text-sm">
          <Row label="Price" value={listing.asking_price ? `$${(listing.asking_price / 100).toLocaleString()}` : 'Price on request'} />
          <Row label="Category" value={listing.category} />
          <Row label="Contact" value={listing.contact_email} />
          {listing.description && <Row label="Description" value={listing.description} />}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Link href={`/dashboard/listings/${listing.id}/edit`}>
          <Button variant="outline" size="sm">Edit Listing</Button>
        </Link>
        {listing.status === 'verified' && (
          <Button variant="outline" size="sm" onClick={markAsSold}>Mark as Sold</Button>
        )}
        {listing.status !== 'removed' && (
          <Button variant="outline" size="sm" onClick={removeListing} disabled={removing} className="text-red-600 hover:text-red-700">
            {removing ? 'Removing...' : 'Remove Listing'}
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}

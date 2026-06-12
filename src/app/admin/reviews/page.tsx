'use client'

import { useCallback, useEffect, useState } from 'react'
import { approveReview, deleteReview, getReviewsAdmin } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Check, Star, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { AdminTableSkeleton } from '@/components/admin/TableSkeleton'
import { toast } from 'sonner'

type AdminReview = Awaited<ReturnType<typeof getReviewsAdmin>>[number]

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      const data = await getReviewsAdmin()
      setReviews(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleApprove = async (id: string) => {
    try {
      await approveReview(id)
      toast.success('Review approved')
      fetchReviews()
    } catch {
      toast.error('Failed to approve review')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      await deleteReview(deleteTarget.id)
      toast.success('Review deleted')
      setDeleteTarget(null)
      fetchReviews()
    } catch {
      toast.error('Failed to delete review')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Reviews</h1>
          <p className="text-zinc-400">Moderate customer product reviews.</p>
        </div>
        <AdminTableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reviews</h1>
        <p className="text-zinc-400">Moderate customer product reviews.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg bg-zinc-900/50 py-12 text-center">
          <Star className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <h3 className="mb-2 text-lg font-medium text-white">No reviews yet</h3>
          <p className="text-zinc-400">Customer reviews will appear here.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Product</TableHead>
                <TableHead className="text-zinc-400">Customer</TableHead>
                <TableHead className="text-zinc-400">Rating</TableHead>
                <TableHead className="text-zinc-400">Comment</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-right text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell className="font-medium text-white">{review.product.name_en}</TableCell>
                  <TableCell className="text-zinc-300">
                    {review.user.full_name || review.user.email}
                  </TableCell>
                  <TableCell className="text-amber-400">{'★'.repeat(review.rating)}</TableCell>
                  <TableCell className="max-w-md text-zinc-300">
                    <span className="line-clamp-2">{review.comment || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      review.is_approved
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {!review.is_approved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-green-400"
                        aria-label={`Approve review for ${review.product.name_en}`}
                        onClick={() => handleApprove(review.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-red-400"
                      aria-label={`Delete review for ${review.product.name_en}`}
                      onClick={() => setDeleteTarget(review)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete review?"
        description={`The review for "${deleteTarget?.product.name_en ?? ''}" will be permanently removed.`}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}

import Image from 'next/image';
import { getAllGalleryImages } from '@/lib/queries';
import { deleteGalleryImage } from '../../actions';
import { DeleteButton } from '@/components/admin/delete-button';
import { GalleryUploader } from '@/components/admin/gallery-uploader';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function AdminGalleryPage() {
  const images = await getAllGalleryImages();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Photos appear on the site in the order shown here.
        </p>
      </div>

      <GalleryUploader nextSortOrder={images.length + 1} />

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No photos yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-lg border bg-background">
              <div className="relative aspect-[3/2]">
                <Image
                  src={image.image_url}
                  alt={image.alt_text}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {image.caption || image.alt_text}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={image.published ? 'default' : 'secondary'} className="text-xs">
                      {image.published ? 'Live' : 'Hidden'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{image.sort_order}</span>
                  </div>
                </div>
                <DeleteButton
                  action={deleteGalleryImage}
                  id={image.id}
                  confirmText="Delete this photo? This also removes the file from storage."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

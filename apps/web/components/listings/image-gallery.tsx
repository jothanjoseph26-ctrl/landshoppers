'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Expand, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: { url: string; alt?: string }[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-muted">
        <p className="text-muted-foreground">No images available</p>
      </div>
    )
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid gap-2 overflow-hidden rounded-xl">
        {images.length === 1 ? (
          // Single Image
          <button
            onClick={() => openLightbox(0)}
            className="relative aspect-[16/9] overflow-hidden"
          >
            <img
              src={images[0].url}
              alt={images[0].alt || title}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 backdrop-blur-sm">
              <Expand className="h-4 w-4" />
              <span className="text-sm font-medium">View Photo</span>
            </div>
          </button>
        ) : images.length === 2 ? (
          // Two Images
          <div className="grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => openLightbox(index)}
                className="relative aspect-[4/3] overflow-hidden"
              >
                <img
                  src={image.url}
                  alt={image.alt || `${title} - Image ${index + 1}`}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </button>
            ))}
          </div>
        ) : images.length === 3 ? (
          // Three Images
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openLightbox(0)}
              className="relative row-span-2 aspect-[3/4] overflow-hidden"
            >
              <img
                src={images[0].url}
                alt={images[0].alt || `${title} - Image 1`}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </button>
            {images.slice(1, 3).map((image, index) => (
              <button
                key={index}
                onClick={() => openLightbox(index + 1)}
                className="relative aspect-[4/3] overflow-hidden"
              >
                <img
                  src={image.url}
                  alt={image.alt || `${title} - Image ${index + 2}`}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </button>
            ))}
          </div>
        ) : (
          // Four or More Images
          <div className="grid grid-cols-4 grid-rows-2 gap-2">
            <button
              onClick={() => openLightbox(0)}
              className="relative col-span-2 row-span-2 overflow-hidden"
            >
              <img
                src={images[0].url}
                alt={images[0].alt || `${title} - Image 1`}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </button>
            {images.slice(1, 5).map((image, index) => (
              <button
                key={index}
                onClick={() => openLightbox(index + 1)}
                className="relative aspect-[4/3] overflow-hidden"
              >
                <img
                  src={image.url}
                  alt={image.alt || `${title} - Image ${index + 2}`}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
                {index === 3 && images.length > 5 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-lg font-semibold text-white">
                      +{images.length - 5} more
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
        {images.length > 1 && (
          <Button
            variant="outline"
            className="absolute bottom-4 right-4 gap-2 bg-background/90 backdrop-blur-sm"
            onClick={() => openLightbox(0)}
          >
            <Grid3X3 className="h-4 w-4" />
            View All {images.length} Photos
          </Button>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-0 bg-black/95 p-0">
          <DialogTitle className="sr-only">{title} - Image Gallery</DialogTitle>
          <div className="relative flex h-[85vh] items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span className="sr-only">Previous image</span>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                  <span className="sr-only">Next image</span>
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].alt || `${title} - Image ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 gap-2">
                {images.slice(0, 8).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'h-12 w-12 overflow-hidden rounded border-2 transition-all',
                      currentIndex === index
                        ? 'border-white'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

import Image, { type ImageProps } from 'next/image'
import { getSafeImageSrc } from '@/lib/storefront-media'

type SafeImageProps = Omit<ImageProps, 'src'> & {
  src: string | null | undefined
}

export function SafeImage({ src, alt, unoptimized, ...props }: SafeImageProps) {
  const safeSrc = getSafeImageSrc(src)

  if (!safeSrc) {
    return null
  }

  return (
    <Image
      {...props}
      src={safeSrc}
      alt={alt}
      unoptimized={unoptimized ?? safeSrc.startsWith('https://')}
    />
  )
}

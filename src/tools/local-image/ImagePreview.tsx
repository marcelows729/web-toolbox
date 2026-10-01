import { useBlobUrl } from './useBlobUrl'
export default function ImagePreview({ blob, alt, className = '' }: { blob: Blob; alt: string; className?: string }) {
  const url = useBlobUrl(blob)
  return url ? <img className={className} src={url} alt={alt} /> : null
}

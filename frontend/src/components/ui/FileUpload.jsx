import { Paperclip, UploadCloud, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'

export function FileUpload({
  value,
  onChange,
  progress = 0,
  accept = 'image/png,image/jpeg,application/pdf',
  maxSizeMb = 10,
}) {
  const [dragging, setDragging] = useState(false)

  const previewUrl = useMemo(() => {
    if (!value || value.type === 'application/pdf') return ''
    return URL.createObjectURL(value)
  }, [value])

  const handleFile = (file) => {
    if (!file) return
    if (file.size > maxSizeMb * 1024 * 1024) return
    onChange(file)
  }

  return (
    <div className="space-y-4">
      <label
        className={cn(
          'flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-primary/35 bg-primary/4 p-6 text-center transition-all',
          dragging && 'amber-glow border-primary/60 bg-primary/8',
        )}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          handleFile(event.dataTransfer.files?.[0])
        }}
      >
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <UploadCloud className="mb-3 h-9 w-9 text-primary" />
        <p className="font-medium text-foreground">Drop a receipt here or browse</p>
        <p className="mt-2 text-sm text-muted-foreground">JPEG, PNG, or PDF up to {maxSizeMb}MB.</p>
      </label>

      {value && (
        <div className="surface-card flex items-center gap-4 p-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-accent">
            {previewUrl ? (
              <img src={previewUrl} alt={value.name} className="h-full w-full object-cover" />
            ) : (
              <Paperclip className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-card-foreground">{value.name}</p>
            <p className="text-sm text-muted-foreground">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
            {progress > 0 && progress < 100 && (
              <div className="mt-3">
                <ProgressBar value={progress} />
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

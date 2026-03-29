import { motion } from 'framer-motion'
import { FileUpload } from '@/components/ui/FileUpload'

export function ReceiptUpload({ file, onFileChange, isScanning, progress, disabled = false }) {
  return (
    <div className="relative">
      <FileUpload value={file} onChange={onFileChange} progress={progress} disabled={disabled} />
      {isScanning && (
        <motion.div
          className="absolute left-4 right-4 top-4 h-0.5 bg-primary/70 blur-sm"
          animate={{ top: ['8%', '88%', '8%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  )
}

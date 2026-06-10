import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { MAX_UPLOAD_SIZE_MB, ALLOWED_FILE_EXTENSIONS } from '@/lib/constants'
import { useUploadDocument } from '@/hooks/useOther'
import { Upload, File, X } from 'lucide-react'

const documentTypeOptions = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'customs_declaration', label: 'Customs Declaration' },
  { value: 'bill_of_lading', label: 'Bill of Lading' },
]

interface DocumentUploadProps {
  cargoId: number
  onComplete?: () => void
}

export function DocumentUpload({ cargoId, onComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const upload = useUploadDocument(cargoId)

  const handleFile = (f: File) => {
    const maxBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if (f.size > maxBytes) {
      alert(`File exceeds ${MAX_UPLOAD_SIZE_MB}MB limit.`)
      return
    }
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!file || !docType) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('document_type', docType)
    await upload.mutateAsync({ formData: fd })
    setFile(null)
    setDocType('')
    onComplete?.()
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]) }}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        {file ? (
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <File className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">Click to upload</span>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {ALLOWED_FILE_EXTENSIONS} (max {MAX_UPLOAD_SIZE_MB}MB)
              </p>
            </div>
          </div>
        )}
        <input
          type="file"
          accept={ALLOWED_FILE_EXTENSIONS}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
          id="file-upload"
        />
      </div>
      {file && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              options={documentTypeOptions}
              placeholder="Select document type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} loading={upload.isPending} disabled={!docType} size="sm">
            <Upload className="w-3.5 h-3.5" />
            Upload
          </Button>
        </div>
      )}
      {upload.isPending && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  )
}

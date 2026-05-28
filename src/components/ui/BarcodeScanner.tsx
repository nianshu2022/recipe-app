import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera, RefreshCw } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

const SCANNER_ELEMENT_ID = 'barcode-scanner-container'

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(true)
  const hasCalledOnScan = useRef(false)

  useEffect(() => {
    const container = document.getElementById(SCANNER_ELEMENT_ID)
    if (!container) return

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
    scannerRef.current = scanner

    const startScanner = async () => {
      try {
        if (!window.isSecureContext) {
          setError('摄像头需要 HTTPS 环境，请通过 HTTPS 访问此页面')
          setIsStarting(false)
          return
        }

        const cameras = await Html5Qrcode.getCameras()
        if (cameras.length === 0) {
          setError('未检测到摄像头')
          setIsStarting(false)
          return
        }

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777,
          },
          (decodedText) => {
            if (hasCalledOnScan.current) return
            hasCalledOnScan.current = true
            scanner.stop().catch(() => {})
            onScan(decodedText)
          },
          () => {},
        )
        setIsStarting(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('Permission') || message.includes('NotAllowedError')) {
          setError('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头')
        } else if (message.includes('NotFound') || message.includes('NotFoundError')) {
          setError('未检测到摄像头')
        } else {
          setError(`摄像头启动失败: ${message}`)
        }
        setIsStarting(false)
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [onScan])

  const handleRetry = () => {
    setError(null)
    setIsStarting(true)
    hasCalledOnScan.current = false
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.777 },
        (decodedText) => {
          if (hasCalledOnScan.current) return
          hasCalledOnScan.current = true
          scannerRef.current?.stop().catch(() => {})
          onScan(decodedText)
        },
        () => {},
      ).then(() => setIsStarting(false))
        .catch((err) => {
          setError(err instanceof Error ? err.message : '重试失败')
          setIsStarting(false)
        })
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm"
        >
          <X size={20} />
        </button>
        <span className="text-sm font-medium text-white">扫描条形码</span>
        <div className="w-10" />
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <div id={SCANNER_ELEMENT_ID} className="absolute inset-0" />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[150px] w-[250px]">
            <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white" />
            <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white" />
          </div>
        </div>

        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center gap-3">
              <Camera size={32} className="animate-pulse text-white" />
              <span className="text-sm text-white/80">正在启动摄像头...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Camera size={48} className="text-white/40" />
              <p className="text-sm text-white/80">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm"
              >
                <RefreshCw size={14} />
                重试
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 text-center">
        <p className="text-sm text-white/60">将条形码对准扫描框</p>
      </div>
    </div>
  )
}

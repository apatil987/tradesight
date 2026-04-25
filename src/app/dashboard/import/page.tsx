import ScreenshotImporter from '@/components/trades/ScreenshotImporter'

export default function ImportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Import Screenshot</h1>
      <p className="text-sm text-gray-500 mb-8">
        Upload a broker order history screenshot. Claude will extract your filled trades automatically.
      </p>
      <ScreenshotImporter />
    </div>
  )
}

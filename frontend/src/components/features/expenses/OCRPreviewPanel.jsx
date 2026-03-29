import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function OCRPreviewPanel({ result, onApply }) {
  if (!result) return null

  const confidenceLow = result.confidence < 70

  return (
    <Card>
      <CardHeader>
        <CardTitle>OCR Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {confidenceLow && (
          <div className="rounded-2xl border border-warning/30 bg-warning/12 px-4 py-3 text-sm text-warning-foreground">
            OCR confidence is low. Please verify all fields before submitting.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {Object.entries(result.parsedFields).map(([key, value]) =>
            value ? (
              <Badge key={key} variant="outline">
                {key}: {String(value)}
              </Badge>
            ) : null,
          )}
        </div>
        <pre className="max-h-56 overflow-auto rounded-2xl bg-accent/70 p-4 text-xs text-accent-foreground">
          {result.text}
        </pre>
        <Button onClick={onApply}>Apply to Form</Button>
      </CardContent>
    </Card>
  )
}

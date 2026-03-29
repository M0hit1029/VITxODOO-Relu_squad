import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function Unauthorized() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div className="space-y-6">
        <p className="font-display text-8xl text-primary">403</p>
        <h1 className="text-4xl text-foreground">You don’t have permission to view this page.</h1>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  )
}

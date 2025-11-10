import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Company OS</CardTitle>
            <CardDescription>Internal platform for managing all departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Welcome to Company OS. This is a test component to verify TailwindCSS and Shadcn/ui
                are working correctly.
              </p>
              <div className="flex gap-2">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  ✅ TailwindCSS is working
                  <br />
                  ✅ Shadcn/ui components are loaded
                  <br />✅ Theme support is enabled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

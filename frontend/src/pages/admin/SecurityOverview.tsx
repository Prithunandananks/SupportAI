import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyIcon, LockIcon, ShieldAlertIcon, WebhookIcon } from 'lucide-react';

export default function SecurityOverview() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <ShieldAlertIcon className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold tracking-tight">Security & Governance Overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Security</CardTitle>
            <KeyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">4</div>
            <p className="text-xs text-muted-foreground">Active API Keys</p>
            <div className="mt-2 text-xs text-amber-600 font-medium">1 Key Expiring Soon</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook Health</CardTitle>
            <WebhookIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">99.8%</div>
            <p className="text-xs text-muted-foreground">Delivery Success Rate (30d)</p>
            <div className="mt-2 text-xs text-muted-foreground">2 Events in Dead Letter Queue</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Governance</CardTitle>
            <LockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
            <p className="text-xs text-muted-foreground">Active Members</p>
            <div className="mt-2 text-xs text-muted-foreground">3 Owners, 9 Agents</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Security Events</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="p-4 flex items-start space-x-4">
                <div className="mt-1 bg-amber-100 p-2 rounded-full">
                  <KeyIcon className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium">API Key Rotated</p>
                  <p className="text-sm text-gray-500">Key 'Production Auth' was rotated by admin@example.com (2 hours ago)</p>
                </div>
              </div>
              
              <div className="p-4 flex items-start space-x-4">
                <div className="mt-1 bg-red-100 p-2 rounded-full">
                  <WebhookIcon className="w-4 h-4 text-red-700" />
                </div>
                <div>
                  <p className="font-medium">Webhook Delivery Failed</p>
                  <p className="text-sm text-gray-500">Endpoint https://crm.example.com/webhook failed 5 times. Event moved to DLQ (5 hours ago)</p>
                </div>
              </div>
              
              <div className="p-4 flex items-start space-x-4">
                <div className="mt-1 bg-emerald-100 p-2 rounded-full">
                  <LockIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="font-medium">New Organization Member</p>
                  <p className="text-sm text-gray-500">john.doe@example.com accepted invite as AGENT (1 day ago)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

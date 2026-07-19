import { useState, useEffect, useCallback } from 'react';
import api from '@/api/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState('*');
  const [secret, setSecret] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await api.get('/webhooks');
      setWebhooks(response.data);
    } catch {
      toast.error('Failed to fetch webhooks');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = async () => {
    if (!newUrl) return;
    try {
      const eventsList = newEvents.split(',').map(e => e.trim());
      const response = await api.post('/webhooks', { url: newUrl, events: eventsList });
      setSecret(response.data.secret);
      fetchWebhooks();
    } catch {
      toast.error('Failed to create webhook');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await api.patch(`/webhooks/${id}`, { is_active: !current });
      toast.success(current ? 'Webhook disabled' : 'Webhook enabled');
      fetchWebhooks();
    } catch {
      toast.error('Failed to toggle webhook');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/webhooks/${id}`);
      toast.success('Webhook deleted');
      fetchWebhooks();
    } catch {
      toast.error('Failed to delete webhook');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSecret(null);
    setNewUrl('');
    setNewEvents('*');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Webhook</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {secret ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md text-sm">
                    Please copy your webhook secret now. It is used to verify signatures on incoming payloads!
                  </div>
                  <div className="flex items-center p-3 bg-gray-100 rounded-md">
                    <code className="flex-1 text-sm font-mono break-all">{secret}</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText(secret)}
                      className="ml-2 text-gray-500 hover:text-gray-700 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                  <Button className="w-full" onClick={handleCloseDialog}>Close</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Endpoint URL</label>
                    <Input 
                      value={newUrl} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)} 
                      placeholder="https://your-domain.com/webhook"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Events (comma separated, use * for all)</label>
                    <Input 
                      value={newEvents} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvents(e.target.value)} 
                      placeholder="*"
                    />
                  </div>
                  <Button onClick={handleCreate} disabled={!newUrl} className="w-full">
                    Create Webhook
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No Webhooks found</TableCell>
                </TableRow>
              ) : (
                webhooks.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium max-w-[300px] truncate" title={w.url}>
                      {w.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {w.events.map(e => (
                          <span key={e} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs">{e}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggle(w.id, w.is_active)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${w.is_active ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${w.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </TableCell>
                    <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDelete(w.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

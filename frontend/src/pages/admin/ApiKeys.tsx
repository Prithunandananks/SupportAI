import { useState, useEffect, useCallback } from 'react';
import api from '@/api/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ApiKey {
  id: string;
  name: string;
  scopes: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState('read,write');
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await api.get('/api-keys');
      setKeys(response.data);
    } catch {
      toast.error('Failed to fetch API keys');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newName) return;
    try {
      const response = await api.post('/api-keys', { name: newName, scopes: newScopes });
      setRawKey(response.data.raw_key);
      fetchKeys();
    } catch {
      toast.error('Failed to create API key');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success('API key revoked');
      fetchKeys();
    } catch {
      toast.error('Failed to revoke API key');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setRawKey(null);
    setNewName('');
    setNewScopes('read,write');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {rawKey ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md">
                    Please copy your API key now. You will not be able to see it again!
                  </div>
                  <div className="flex items-center p-3 bg-gray-100 rounded-md">
                    <code className="flex-1 text-sm font-mono">{rawKey}</code>
                    <button 
                      onClick={() => navigator.clipboard.writeText(rawKey)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      Copy
                    </button>
                  </div>
                  <Button className="w-full" onClick={handleCloseDialog}>Close</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key Name</label>
                    <Input 
                      value={newName} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} 
                      placeholder="e.g. Production Backend"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Scopes</label>
                    <Input 
                      value={newScopes} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewScopes(e.target.value)} 
                      placeholder="read,write"
                    />
                  </div>
                  <Button onClick={handleCreate} disabled={!newName} className="w-full">
                    Create Key
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
                <TableHead>Name</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">No API Keys found</TableCell>
                </TableRow>
              ) : (
                keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {k.scopes.split(',').map(s => (
                          <span key={s} className="px-2 py-1 bg-gray-100 rounded-md text-xs">{s.trim()}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {k.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Revoked</span>
                      )}
                    </TableCell>
                    <TableCell>{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</TableCell>
                    <TableCell>{new Date(k.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        disabled={!k.is_active}
                        onClick={() => handleRevoke(k.id)}
                      >
                        Revoke
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

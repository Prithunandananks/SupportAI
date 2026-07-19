import { useState, useEffect } from 'react';
import { X, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import api from '@/api/client';
import { toast } from 'sonner';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function OrganizationSettings() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('SUPPORT_AGENT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const membersPromise = api.get('/organization/members');
      const invitesPromise = api.get('/organization/invitations').catch((err) => {
        console.warn('Failed to load pending invitations:', err);
        return { data: [] }; // Gracefully fall back to empty invitations list on failure
      });

      const [membersRes, invitesRes] = await Promise.all([
        membersPromise,
        invitesPromise
      ]);
      setMembers(membersRes.data || []);
      setInvitations(invitesRes.data || []);
    } catch {
      setError('Failed to load organization settings. Please check your connection and try again.');
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleInvite = async () => {
    try {
      await api.post('/organization/invite', {
        email: inviteEmail,
        role: inviteRole
      });
      toast.success('Invitation sent successfully');
      setInviteEmail('');
      setIsInviteModalOpen(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to send invitation');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/organization/invitations/${id}`);
      toast.success('Invitation revoked successfully');
      fetchData();
    } catch {
      toast.error('Failed to revoke invitation');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await api.patch(`/organization/members/${memberId}/role`, { role: newRole });
      toast.success('Role updated successfully');
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to update role');
      fetchData(); // reset on error
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.delete(`/organization/members/${memberId}`);
      toast.success('Member removed successfully');
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Organization Settings">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-slate-400 animate-pulse text-lg">Loading organization data...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Organization Settings">
        <div className="space-y-6">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle size={24} className="text-red-500 shrink-0" />
            <p className="text-sm md:text-base">{error}</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Organization Settings">
      <div className="space-y-6">
        
        {/* Title and Top Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold hidden md:block">Organization Settings</h1>
            <p className="text-sm text-slate-400 mt-1 md:hidden">Manage members and invites</p>
          </div>
          
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-slate-950 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20"
          >
            <UserPlus size={16} className="mr-2" />
            Invite Member
          </button>
        </div>

        {/* Members Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-lg md:text-xl font-semibold text-white">Active Members</h2>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-medium">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 px-4 font-semibold">User</th>
                  <th className="pb-3 px-4 font-semibold">Role</th>
                  <th className="pb-3 px-4 font-semibold">Status</th>
                  <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{member.first_name || '—'} {member.last_name || ''}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{member.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer"
                      >
                        <option value="OWNER">Owner</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPPORT_AGENT">Support Agent</option>
                        <option value="KNOWLEDGE_MANAGER">Knowledge Manager</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        member.status === "ACTIVE" 
                          ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          member.status === "ACTIVE" ? "bg-green-400" : "bg-slate-400"
                        }`}></span>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                      No members in this organization
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Members List */}
          <div className="space-y-4 md:hidden">
            {members.map((member) => (
              <div key={member.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-white">{member.first_name || '—'} {member.last_name || ''}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{member.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.status === "ACTIVE" 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}>
                    {member.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Role</span>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPPORT_AGENT">Support Agent</option>
                    <option value="KNOWLEDGE_MANAGER">Knowledge Manager</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    Remove Member
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-xl">
                No members found
              </div>
            )}
          </div>
        </div>

        {/* Pending Invitations Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-lg md:text-xl font-semibold text-white">Pending Invitations</h2>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-medium">
              {invitations.length} {invitations.length === 1 ? 'invite' : 'invites'}
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 px-4 font-semibold">Email</th>
                  <th className="pb-3 px-4 font-semibold">Role</th>
                  <th className="pb-3 px-4 font-semibold">Sent</th>
                  <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invitations.map((invite) => (
                  <tr key={invite.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-white">{invite.email}</td>
                    <td className="py-4 px-4 text-sm">
                      <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {invite.role === "OWNER" ? "Owner" : invite.role === "ADMIN" ? "Admin" : invite.role === "SUPPORT_AGENT" ? "Support Agent" : invite.role === "KNOWLEDGE_MANAGER" ? "Knowledge Manager" : "Viewer"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-400">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleRevoke(invite.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-colors"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
                {invitations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                      No pending invitations
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Invitations List */}
          <div className="space-y-4 md:hidden">
            {invitations.map((invite) => (
              <div key={invite.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                <div>
                  <div className="font-semibold text-white break-all">{invite.email}</div>
                  <div className="text-xs text-slate-400 mt-1">Sent: {new Date(invite.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Role</span>
                  <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                    {invite.role === "OWNER" ? "Owner" : invite.role === "ADMIN" ? "Admin" : invite.role === "SUPPORT_AGENT" ? "Support Agent" : invite.role === "KNOWLEDGE_MANAGER" ? "Knowledge Manager" : "Viewer"}
                  </span>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => handleRevoke(invite.id)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm transition"
                  >
                    Revoke Invitation
                  </button>
                </div>
              </div>
            ))}
            {invitations.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-xl">
                No pending invitations
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Invite Member Custom Dialog (Dark Theme) */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsInviteModalOpen(false)}>
          <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col scale-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Invite new member</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-white transition p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition cursor-pointer"
                >
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPPORT_AGENT">Support Agent</option>
                  <option value="KNOWLEDGE_MANAGER">Knowledge Manager</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
            </div>
            <div className="p-4 md:p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/50">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition text-sm disabled:opacity-50"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

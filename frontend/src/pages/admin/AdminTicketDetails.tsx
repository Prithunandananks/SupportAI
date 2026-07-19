import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { type AdminTicketDetail, ticketService, TicketStatus } from '../../services/ticket.service';
import { authService, type User } from '../../services/auth.service';
import type { ChatSessionWithMessagesResponse, ChatMessageResponse } from '../../services/chat.service';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import AdminLayout from '@/components/admin/layout/AdminLayout';

const AdminTicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<AdminTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSessionWithMessagesResponse | null>(null);
  
  const [status, setStatus] = useState<TicketStatus>(TicketStatus.OPEN);
  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');

  const fetchTicket = async (ticketId: string) => {
    try {
      const data = await ticketService.getAdminTicket(ticketId);
      setTicket(data);
      setStatus(data.status);
      if (data.assigned_admin_id) {
        setSelectedAssignee(data.assigned_admin_id);
      }
      
      if (data.conversation_id) {
        import('../../services/chat.service').then(({ chatService }) => {
          chatService.getSession(data.conversation_id!).then(setChatSession).catch(console.error);
        });
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const adminList = await authService.getAdmins();
        setAdmins(adminList);
      } catch (error) {
        console.error('Failed to fetch admins:', error);
      }
    };
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTicket(id);
    }
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !id) return;
    
    setSubmitting(true);
    try {
      await ticketService.adminReplyToTicket(id, replyMessage);
      setReplyMessage('');
      await fetchTicket(id);
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim() || !id) return;
    
    setSubmittingNote(true);
    try {
      await ticketService.adminAddInternalNote(id, internalNote);
      setInternalNote('');
      await fetchTicket(id);
    } catch (error) {
      console.error('Failed to add internal note:', error);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!id || newStatus === ticket?.status) return;
    try {
      await ticketService.updateTicketStatus(id, newStatus);
      fetchTicket(id);
    } catch (error) {
      console.error('Failed to update status:', error);
      setStatus(ticket?.status || TicketStatus.OPEN);
    }
  };
  
  const handleAssign = async () => {
    if (!id || !selectedAssignee) return;
    try {
      await ticketService.assignTicket(id, selectedAssignee);
      await fetchTicket(id);
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const handleUnassign = async () => {
    if (!id) return;
    try {
      await ticketService.unassignTicket(id);
      setSelectedAssignee('');
      await fetchTicket(id);
    } catch (error) {
      console.error('Failed to unassign ticket:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!ticket) return <div className="p-8 text-center text-red-500">Ticket not found</div>;

  const timeline = [
    ...(ticket.messages.map(m => ({ ...m, type: 'message' as const }))),
    ...(ticket.internal_notes?.map(n => ({ ...n, type: 'internal_note' as const })) || [])
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <AdminLayout title="Flagged Question Details">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/admin/flagged" className="inline-flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300">
            <ArrowLeftIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 shadow sm:rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-white">
                  {ticket.ticket_number}: {ticket.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Created by Customer {ticket.customer_id} on {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              <div className="border-t border-slate-800 px-4 py-5 sm:p-6">
                {ticket.category === 'REPORT' && ticket.chat_message_id && chatSession ? (
                  <div className="space-y-6">
                    {(() => {
                      const aiMsgIdx = chatSession.messages.findIndex((m: ChatMessageResponse) => m.id === ticket.chat_message_id);
                      const userMsg = aiMsgIdx > 0 ? chatSession.messages[aiMsgIdx - 1] : null;
                      const aiMsg = aiMsgIdx >= 0 ? chatSession.messages[aiMsgIdx] : null;
                      
                      return (
                        <>
                          {userMsg && (
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer Question</h4>
                              <p className="text-sm text-slate-200 whitespace-pre-wrap">{userMsg.content}</p>
                            </div>
                          )}
                          {aiMsg && (
                            <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-800/50">
                              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">AI Response</h4>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">{aiMsg.content}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    <div className="border-t border-slate-800 pt-6">
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">Flag Reason</h4>
                        <p className="text-sm font-medium text-white">{ticket.report_reason || 'Unknown'}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">Customer Comment</h4>
                        <p className="text-sm text-slate-300 italic">
                          {ticket.customer_comment ? `"${ticket.customer_comment}"` : "No additional comments provided."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none text-slate-300">
                    <p className="whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-white mb-4">Conversation</h4>
              <div className="space-y-4">
                {timeline.map((item) => {
                  if (item.type === 'message') {
                    return (
                      <div key={`msg-${item.id}`} className={`flex ${item.sender_id === ticket.customer_id ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xl rounded-lg px-4 py-3 ${
                          item.sender_id === ticket.customer_id 
                            ? 'bg-slate-800 text-slate-200' 
                            : 'bg-cyan-600 text-white'
                        }`}>
                          <p className="whitespace-pre-wrap text-sm">{item.message}</p>
                          <div className={`text-xs mt-1 flex justify-between ${item.sender_id === ticket.customer_id ? 'text-slate-400' : 'text-cyan-200'}`}>
                            <span>{item.sender_id === ticket.customer_id ? 'Customer' : 'Agent'}</span>
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={`note-${item.id}`} className="flex justify-center my-4">
                        <div className="max-w-2xl w-full rounded-lg px-4 py-3 bg-amber-900/30 border border-amber-700/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Internal Note</span>
                            <span className="text-xs text-amber-600/70">{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-amber-100">{item.content}</p>
                          <div className="text-xs mt-2 text-amber-600/70">
                            Author: {admins.find(a => a.id === item.author_id)?.name || item.author_id}
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              <div className="mt-6 bg-slate-900 border border-slate-800 shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <form onSubmit={handleReply}>
                    <div>
                      <label htmlFor="reply" className="block text-sm font-medium text-slate-300 mb-2">Reply to Customer</label>
                      <textarea
                        id="reply"
                        rows={4}
                        className="shadow-sm block w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500 caret-cyan-500 sm:text-sm rounded-md p-2"
                        placeholder="Type your reply to the customer..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:text-sm disabled:opacity-50"
                      >
                        {submitting ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              
              <div className="mt-6 bg-slate-900 border border-amber-900/50 shadow sm:rounded-lg overflow-hidden">
                <div className="bg-amber-900/20 px-4 py-3 border-b border-amber-900/50">
                  <h3 className="text-sm font-medium text-amber-500">Add Internal Note</h3>
                  <p className="text-xs text-amber-600/70">Only visible to other admins and agents.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <form onSubmit={handleAddNote}>
                    <div>
                      <textarea
                        rows={3}
                        className="shadow-sm block w-full bg-slate-800 text-amber-100 placeholder-slate-500 border border-slate-700 focus:ring-amber-500 focus:border-amber-500 caret-amber-500 sm:text-sm rounded-md p-2"
                        placeholder="Type an internal note..."
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingNote}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-amber-900 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:text-sm disabled:opacity-50"
                      >
                        {submittingNote ? 'Saving...' : 'Save Note'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
                <h3 className="text-lg leading-6 font-medium text-white">SLA Status</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                {ticket.is_breached ? (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3 text-center">
                    <p className="text-red-400 font-bold uppercase tracking-wider text-sm">SLA Breached</p>
                  </div>
                ) : ticket.is_overdue ? (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3 text-center">
                    <p className="text-red-400 font-bold uppercase tracking-wider text-sm">Overdue</p>
                  </div>
                ) : ticket.is_due_soon ? (
                  <div className="bg-amber-900/20 border border-amber-500/50 rounded-md p-3 text-center">
                    <p className="text-amber-400 font-bold uppercase tracking-wider text-sm">Due Soon</p>
                  </div>
                ) : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                  <div className="bg-green-900/20 border border-green-500/50 rounded-md p-3 text-center">
                    <p className="text-green-400 font-bold uppercase tracking-wider text-sm">Resolved Within SLA</p>
                  </div>
                ) : (
                  <div className="bg-green-900/20 border border-green-500/50 rounded-md p-3 text-center">
                    <p className="text-green-400 font-bold uppercase tracking-wider text-sm">Within SLA</p>
                  </div>
                )}
                
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex flex-col text-sm mt-3 mb-2">
                    <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">First Response Due</span>
                    <span className="text-white">{ticket.first_response_due ? new Date(ticket.first_response_due).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Resolution Due</span>
                    <span className="text-white">{ticket.resolution_due ? new Date(ticket.resolution_due).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
                <h3 className="text-lg leading-6 font-medium text-white">Properties</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as TicketStatus);
                      handleStatusChange(e.target.value as TicketStatus);
                    }}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-800 text-white border-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                  >
                    {Object.values(TicketStatus).map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300">Priority</label>
                  <div className="mt-1 py-2 text-sm text-white">
                    {ticket.priority}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300">Category</label>
                  <div className="mt-1 py-2 text-sm text-white">
                    {ticket.category.replace(/_/g, ' ')}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300">Assignee</label>
                  <div className="mt-1 flex flex-col space-y-2">
                    {ticket.assigned_admin_id ? (
                      <div className="text-sm text-white">
                        <span className="block mb-1">
                          Assigned to: {admins.find(a => a.id === ticket.assigned_admin_id)?.name || ticket.assigned_admin_id}
                        </span>
                        {ticket.assigned_at && (
                          <span className="block text-xs text-slate-400">
                            Assigned on: {new Date(ticket.assigned_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 italic">Unassigned</div>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <select
                        value={selectedAssignee}
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                        className="block w-full pl-3 pr-10 py-1.5 text-sm bg-slate-800 text-white border-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md"
                      >
                        <option value="">Select an Admin...</option>
                        {admins.map(admin => (
                          <option key={admin.id} value={admin.id}>{admin.name}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={handleAssign}
                        disabled={!selectedAssignee || selectedAssignee === ticket.assigned_admin_id}
                        className="px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 whitespace-nowrap"
                      >
                        {ticket.assigned_admin_id ? 'Reassign' : 'Assign'}
                      </button>
                      
                      {ticket.assigned_admin_id && (
                        <button
                          onClick={handleUnassign}
                          className="px-3 py-1.5 border border-slate-600 text-xs font-medium rounded-md text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 whitespace-nowrap"
                        >
                          Unassign
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
                <h3 className="text-lg leading-6 font-medium text-white">Audit History</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {ticket.history.map((event, eventIdx) => (
                      <li key={event.id}>
                        <div className="relative pb-8">
                          {eventIdx !== ticket.history.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center ring-8 ring-slate-900 text-xs font-medium text-slate-400">
                                {event.event_type.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-slate-400">
                                  {event.event_type.replace(/_/g, ' ')} 
                                  {event.new_value ? ` to ${event.new_value}` : ''}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-slate-400">
                                {new Date(event.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTicketDetails;

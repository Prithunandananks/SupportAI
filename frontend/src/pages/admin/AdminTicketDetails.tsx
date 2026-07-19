import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { type AdminTicketDetail, ticketService, TicketStatus } from '../../services/ticket.service';
import type { ChatSessionWithMessagesResponse, ChatMessageResponse } from '../../services/chat.service';
import { ArrowLeft as ArrowLeftIcon, Check as CheckIcon } from 'lucide-react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useAuth } from '@/hooks/useAuthCore';

const AdminTicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<AdminTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSessionWithMessagesResponse | null>(null);
  
  const [status, setStatus] = useState<TicketStatus>(TicketStatus.OPEN);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchTicket = async (ticketId: string) => {
    try {
      const data = await ticketService.getAdminTicket(ticketId);
      setTicket(data);
      setStatus(data.status);
      
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

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!id || newStatus === ticket?.status) return;
    setStatusError(null);
    try {
      await ticketService.updateTicketStatus(id, newStatus);
      fetchTicket(id);
    } catch (error) {
      console.error('Failed to update status:', error);
      setStatusError('Invalid status transition. Please follow the correct workflow.');
      setStatus(ticket?.status || TicketStatus.OPEN);
      
      setTimeout(() => setStatusError(null), 3000);
    }
  };
  
  const handleAssignToMe = async () => {
    if (!id || !user?.id) return;
    try {
      await ticketService.assignTicket(id, user.id);
      await fetchTicket(id);
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!ticket) return <div className="p-8 text-center text-red-500">Ticket not found</div>;

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
              <h4 className="text-md font-medium text-white mb-4">AI Chat History</h4>
              <div className="space-y-4 mb-8">
                {chatSession ? chatSession.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xl rounded-lg px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-slate-800 text-slate-200' 
                        : 'bg-cyan-900/40 border border-cyan-800 text-slate-200'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      <div className={`text-xs mt-2 flex justify-between ${msg.role === 'user' ? 'text-slate-400' : 'text-cyan-400'}`}>
                        <span>{msg.role === 'user' ? 'Customer' : 'AI'}</span>
                        <span>{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 italic">No chat history available for this ticket.</p>
                )}
              </div>

              <h4 className="text-md font-medium text-white mb-4">Ticket Replies</h4>
              <div className="space-y-4">
                {ticket.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === ticket.customer_id ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xl rounded-lg px-4 py-3 ${
                      msg.sender_id === ticket.customer_id 
                        ? 'bg-slate-800 text-slate-200' 
                        : 'bg-cyan-600 text-white'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                      <div className={`text-xs mt-1 flex justify-between ${msg.sender_id === ticket.customer_id ? 'text-slate-400' : 'text-cyan-200'}`}>
                        <span>{msg.sender_id === ticket.customer_id ? 'Customer' : 'Agent'}</span>
                        <span>{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-slate-800">
                <h3 className="text-lg leading-6 font-medium text-white">Properties</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Status</label>
                  <select
                    value={status}
                    disabled={ticket?.status === TicketStatus.RESOLVED}
                    onChange={(e) => {
                      setStatus(e.target.value as TicketStatus);
                      handleStatusChange(e.target.value as TicketStatus);
                    }}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-800 text-white border-slate-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {Object.values(TicketStatus).map((s) => {
                      let isDisabled = false;
                      const current = ticket?.status;
                      
                      if (current === TicketStatus.OPEN && s === TicketStatus.RESOLVED) {
                        isDisabled = true;
                      } else if (current === TicketStatus.IN_PROGRESS && s === TicketStatus.OPEN) {
                        isDisabled = true;
                      } else if (current === TicketStatus.RESOLVED && s !== TicketStatus.RESOLVED) {
                        isDisabled = true;
                      }
                      
                      return (
                        <option key={s} value={s} disabled={isDisabled}>
                          {s.replace(/_/g, ' ')}
                        </option>
                      );
                    })}
                  </select>
                  {statusError && (
                    <p className="mt-2 text-sm text-red-400">{statusError}</p>
                  )}
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
                  <div className="mt-1 py-2 text-sm flex items-center justify-between">
                    <span className={ticket.assigned_admin_id ? 'text-white' : 'text-slate-400 italic'}>
                      {ticket.assigned_admin_id ? (ticket.assigned_admin_name || 'Assigned') : 'Unassigned'}
                    </span>
                    {!ticket.assigned_admin_id && (
                      <button
                        onClick={handleAssignToMe}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-medium"
                      >
                        Assign to me
                      </button>
                    )}
                    {ticket.assigned_admin_id === user?.id && (
                      <span className="text-cyan-400 text-xs font-medium flex items-center">
                        <CheckIcon size={14} className="mr-1" /> Assigned to you
                      </span>
                    )}
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
                                  {event.event_type === 'ASSIGNMENT_CHANGED'
                                    ? `ASSIGNED: ${event.new_value} assigned this report to themselves.`
                                    : `${event.event_type.replace(/_/g, ' ')} ${event.new_value ? ` to ${event.new_value}` : ''}`}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-slate-400 font-mono">
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

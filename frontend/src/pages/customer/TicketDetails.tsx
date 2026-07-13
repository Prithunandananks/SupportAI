import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { type TicketDetail, ticketService, TicketStatus } from '../../services/ticket.service';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTicket = async (ticketId: string) => {
    try {
      const data = await ticketService.getTicket(ticketId);
      setTicket(data);
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
      await ticketService.replyToTicket(id, replyMessage);
      setReplyMessage('');
      await fetchTicket(id);
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!id || !window.confirm('Are you sure you want to close this ticket?')) return;
    try {
      await ticketService.closeTicket(id);
      await fetchTicket(id);
    } catch (error) {
      console.error('Failed to close ticket:', error);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    const styles = {
      [TicketStatus.OPEN]: 'bg-blue-100 text-blue-800 border-blue-200',
      [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [TicketStatus.WAITING_FOR_CUSTOMER]: 'bg-purple-100 text-purple-800 border-purple-200',
      [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
      [TicketStatus.CLOSED]: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!ticket) return <div className="p-8 text-center text-red-500">Ticket not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link to="/customer/tickets" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
              <ArrowLeftIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Tickets
            </Link>
          </div>
          
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {ticket.ticket_number}: {ticket.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Created on {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-3 items-center">
                {getStatusBadge(ticket.status)}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {ticket.priority} Priority
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="prose max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-md font-medium text-gray-900 mb-4">Conversation</h4>
            
            <div className="space-y-4">
              {ticket.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === ticket.customer_id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl rounded-lg px-4 py-3 ${
                    msg.sender_id === ticket.customer_id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === ticket.customer_id ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {ticket.history && ticket.history.length > 0 && (
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Ticket Timeline</h4>
                <div className="space-y-3">
                  {ticket.history.map((h) => (
                    <div key={h.id} className="text-sm text-gray-600 bg-gray-50 rounded p-3 border border-gray-100">
                      <span className="font-medium text-gray-800">{new Date(h.created_at).toLocaleString()}</span>
                      {' - '}
                      {h.event_type === 'CREATED' && <span>Ticket was created.</span>}
                      {h.event_type === 'STATUS_CHANGED' && <span>Status changed from {h.old_value} to {h.new_value}.</span>}
                      {h.event_type === 'CUSTOMER_CLOSED' && <span>Ticket was closed by you.</span>}
                      {h.event_type === 'ASSIGNMENT_CHANGED' && <span>Ticket assignment was updated.</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ticket.status !== TicketStatus.CLOSED && (
              <div className="mt-6 bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <form onSubmit={handleReply}>
                    <div>
                      <label htmlFor="reply" className="sr-only">Reply</label>
                      <textarea
                        id="reply"
                        rows={3}
                        className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md p-2"
                        placeholder="Type your reply..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Close Ticket
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                      >
                        {submitting ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {ticket.status === TicketStatus.CLOSED && (
              <div className="mt-6 bg-gray-50 rounded-md p-4 text-center">
                <p className="text-sm text-gray-500">This ticket has been closed and can no longer be replied to.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TicketDetails;

import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { Mail, Search, Trash2, Send, CheckCircle2, Clock, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: any;
  reply?: string;
  repliedAt?: any;
}

const Inbox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, []);

  const handleSelectMessage = async (msg: Message) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      try {
        await updateDoc(doc(db, 'messages', msg.id), {
          status: 'read'
        });
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setSendingReply(true);
    try {
      await updateDoc(doc(db, 'messages', selectedMessage.id), {
        reply: replyText,
        repliedAt: serverTimestamp(),
        status: 'replied'
      });
      toast.success('Reply logged successfully');
      setReplyText('');
      // In a real app, this would also trigger an email sending service
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `messages/${selectedMessage.id}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Permanently delete this message?')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
        toast.success('Message deleted');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `messages/${id}`);
      }
    }
  };

  const filteredMessages = messages.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex bg-luxury-cream min-h-screen">
      <AdminSidebar />
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-white flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl text-brand-dark">Guest Communications</h1>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-1">Manage inquiries and outreach</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-luxury-cream border-none py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand-light outline-none"
            />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* List Section */}
          <div className="w-1/3 border-r border-gray-100 bg-white overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center italic text-gray-300">Retrieving messages...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic">No messages found.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-6 cursor-pointer transition-all hover:bg-luxury-cream relative ${
                      selectedMessage?.id === msg.id ? 'bg-luxury-cream' : ''
                    }`}
                  >
                    {msg.status === 'unread' && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-light rounded-full ml-1" />
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`text-sm ${msg.status === 'unread' ? 'font-bold' : 'font-medium'} text-brand-dark truncate pr-4`}>
                        {msg.name}
                      </h4>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {msg.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                      </span>
                    </div>
                    <p className={`text-xs ${msg.status === 'unread' ? 'text-brand-dark font-medium' : 'text-gray-500'} truncate mb-1`}>
                      {msg.subject}
                    </p>
                    <p className="text-[10px] text-gray-400 line-clamp-1 italic">
                      {msg.message}
                    </p>
                    <button 
                      onClick={(e) => handleDelete(msg.id, e)}
                      className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* detail Section */}
          <div className="flex-1 bg-luxury-cream overflow-y-auto p-12">
            <AnimatePresence mode="wait">
              {selectedMessage ? (
                <motion.div
                  key={selectedMessage.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto space-y-10"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-brand-dark text-white flex items-center justify-center font-display text-xl">
                        {selectedMessage.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl font-display text-brand-dark">{selectedMessage.name}</h2>
                        <p className="text-xs text-gray-400">{selectedMessage.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-light mb-1">
                        {selectedMessage.status}
                      </p>
                      <p className="text-xs text-gray-400 font-light flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedMessage.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-10 luxury-shadow">
                    <h3 className="font-display text-2xl text-brand-dark mb-6 border-b border-gray-50 pb-4">
                      {selectedMessage.subject}
                    </h3>
                    <div className="text-gray-600 leading-relaxed font-light whitespace-pre-wrap italic">
                      "{selectedMessage.message}"
                    </div>
                  </div>

                  {selectedMessage.reply ? (
                    <div className="bg-brand-dark/5 p-10 border-l-4 border-brand-light space-y-4">
                      <div className="flex justify-between items-center bg-transparent">
                        <h4 className="text-[10px] uppercase font-bold tracking-widest text-brand-dark flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-light" />
                          System Reply
                        </h4>
                        <span className="text-[10px] text-gray-400 uppercase font-mono italic">
                          Replied: {selectedMessage.repliedAt?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700 italic font-medium">
                        {selectedMessage.reply}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-brand-dark">
                        <Send className="w-4 h-4" />
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[10px]">Compose Reply</h4>
                      </div>
                      <div className="relative">
                        <textarea 
                          rows={6}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your response to the guest..."
                          className="w-full bg-white p-6 luxury-shadow outline-none focus:ring-1 focus:ring-brand-light text-sm resize-none"
                        />
                        <button 
                          onClick={handleSendReply}
                          disabled={sendingReply || !replyText.trim()}
                          className="absolute right-4 bottom-4 bg-brand-dark text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-brand-light transition-all disabled:opacity-50"
                        >
                          {sendingReply ? 'Logging...' : 'Log Reply'}
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 font-light italic">
                        Note: Replying here marks the message as completed and logs the response in the system audit trail.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-white luxury-shadow rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-gray-200" />
                  </div>
                  <h3 className="font-display text-2xl text-brand-dark mb-2">Select a Message</h3>
                  <p className="text-gray-400 text-sm font-light max-w-xs mx-auto">
                    Choose a conversation from the sidebar to view details and managed guest relations.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inbox;

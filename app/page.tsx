'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Calendar, Mail, User, Hash, AtSign, Clock, MapPin,
  BookOpen, GraduationCap, AlertCircle, CheckCircle2, X,
  ChevronRight, Sparkles, Maximize2, Minimize2,
  Sun, Moon, Calculator, Lightbulb, History, Award, TrendingUp,
  Menu, Plus, MessageSquare, Settings, ChevronLeft
} from 'lucide-react';

/* ======== TYPES ======== */
type Module = { id: string; name: string; semester: string; lecturer: string; office: string; email: string };
type TimeSlot = { id: string; day: string; startTime: string; endTime: string; date: string };
type MsgType = 'text' | 'modules' | 'module-info' | 'actions' | 'time-slots' | 'student-form' | 'enquiry-form' | 'confirmation' | 'error' | 'grade-calc' | 'grade-result' | 'study-tips' | 'history';
type ChatMessage = { id: string; role: 'assistant' | 'user'; content: string; type: MsgType; data?: any; ts: Date };
type StudentInfo = { name: string; studentNumber: string; email: string };
type Booking = { moduleId: string; slotId: string; student: StudentInfo; date: string; time: string; moduleName: string; lecturer: string; office: string };

/* ======== DATA ======== */
const MODULES: Module[] = [
  { id: 'info_sys_11', name: 'Information Systems 1.1', semester: '1.1', lecturer: 'R Ndlovu', office: 'P112', email: 'ndlovu18@edu.vut.ac.za' },
  { id: 'dev_soft_11', name: 'Development Software 1.1', semester: '1.1', lecturer: 'P Brown', office: 'P113', email: 'PBrown21@edu.vut.ac.za' },
  { id: 'acc_it_11', name: 'Accounting for IT 1.1', semester: '1.1', lecturer: 'R Thandanani', office: 'P114', email: 'Thandanani25@edu.vut.ac.za' },
  { id: 'sys_soft_11', name: 'System Software 1.1', semester: '1.1', lecturer: 'Prof Dzuni', office: 'P115', email: 'DzuniProfessor@edu.vut.ac.za' },
  { id: 'info_sys_12', name: 'Information Systems 1.2', semester: '1.2', lecturer: 'R Ndlovu', office: 'P112', email: 'ndlovu18@edu.vut.ac.za' },
  { id: 'dev_soft_12', name: 'Development Software 1.2', semester: '1.2', lecturer: 'P Brown', office: 'P113', email: 'PBrown21@edu.vut.ac.za' },
  { id: 'acc_it_12', name: 'Accounting for IT 1.2', semester: '1.2', lecturer: 'R Thandanani', office: 'P114', email: 'Thandanani25@edu.vut.ac.za' },
  { id: 'sys_soft_12', name: 'System Software 1.2', semester: '1.2', lecturer: 'Prof Dzuni', office: 'P115', email: 'DzuniProfessor@edu.vut.ac.za' },
];

function genSlots(): TimeSlot[] {
  const slots: TimeSlot[] = []; const today = new Date();
  const tpl: Record<number, { s: string; e: string }[]> = {
    1: [{ s: '09:00', e: '09:30' }, { s: '09:30', e: '10:00' }, { s: '14:00', e: '14:30' }, { s: '14:30', e: '15:00' }],
    2: [{ s: '10:00', e: '10:30' }, { s: '10:30', e: '11:00' }, { s: '15:00', e: '15:30' }, { s: '15:30', e: '16:00' }],
    3: [{ s: '09:00', e: '09:30' }, { s: '09:30', e: '10:00' }, { s: '13:00', e: '13:30' }, { s: '13:30', e: '14:00' }],
    4: [{ s: '11:00', e: '11:30' }, { s: '11:30', e: '12:00' }, { s: '14:00', e: '14:30' }, { s: '14:30', e: '15:00' }],
    5: [{ s: '09:00', e: '09:30' }, { s: '09:30', e: '10:00' }, { s: '11:00', e: '11:30' }],
  };
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i); const dow = d.getDay();
    if (dow >= 1 && dow <= 5 && tpl[dow]) {
      const ds = d.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' });
      for (const t of tpl[dow]) slots.push({ id: `${ds}-${t.s}`, day: ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][dow], startTime: t.s, endTime: t.e, date: ds });
    }
  }
  return slots;
}

/* ======== MAIN ======== */
export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [selModule, setSelModule] = useState<Module | null>(null);
  const [selSlot, setSelSlot] = useState<TimeSlot | null>(null);
  const [student, setStudent] = useState<StudentInfo>({ name: '', studentNumber: '', email: '' });
  const [enquiryText, setEnquiryText] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [flow, setFlow] = useState('idle');
  const [action, setAction] = useState<string | null>(null);
  const [sem, setSem] = useState<'1.1' | '1.2'>('1.1');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [splash, setSplash] = useState(true);
  const [grades, setGrades] = useState({ test1: '', test2: '', assign1: '', assign2: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const dk = theme === 'dark';

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  useEffect(() => { const s = localStorage.getItem('edu-bookings'); if (s) setBookings(JSON.parse(s)); }, []);
  useEffect(() => { localStorage.setItem('edu-bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { const s = localStorage.getItem('edu-theme'); if (s) setTheme(s as 'dark' | 'light'); }, []);
  useEffect(() => { localStorage.setItem('edu-theme', theme); }, [theme]);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 2500); return () => clearTimeout(t); }, []);
  useEffect(() => { if (!splash) setMessages([{ id: 'w1', role: 'assistant', content: 'Hey! 👋 How can I help you today?', type: 'text', ts: new Date() }, { id: 'w2', role: 'assistant', content: 'Choose a module to get started, or type your question below.', type: 'modules', ts: new Date() }]); }, [splash]);

  const addBot = useCallback((content: string, type: MsgType = 'text', data?: any, delay = 600) => {
    setTyping(true);
    return new Promise<void>(resolve => { setTimeout(() => { setTyping(false); setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), role: 'assistant', content, type, data, ts: new Date() }]); resolve(); }, delay); });
  }, []);
  const addUser = useCallback((content: string) => { setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), role: 'user', content, type: 'text', ts: new Date() }]); }, []);
  const resetFlow = useCallback(() => { setFlow('idle'); setSelModule(null); setSelSlot(null); setAction(null); setStudent({ name: '', studentNumber: '', email: '' }); setEnquiryText(''); setGrades({ test1: '', test2: '', assign1: '', assign2: '' }); }, []);

  const handleModuleSelect = useCallback(async (mod: Module) => {
    setSelModule(mod); setFlow('action'); addUser(`I'd like help with ${mod.name}`);
    await addBot(`Here are the details for **${mod.name}**:`, 'module-info', mod);
    await addBot('What would you like to do?', 'actions', mod);
  }, [addBot, addUser]);

  const handleAction = useCallback(async (act: string) => {
    setAction(act);
    if (act === 'book') { addUser('📅 Book Appointment'); setFlow('book-info'); await addBot('Please fill in your details to book an appointment.', 'student-form', { action: 'book' }); }
    else if (act === 'enquiry') { addUser('✉️ Send Enquiry'); setFlow('enq-info'); await addBot('Please fill in your details to send an enquiry.', 'student-form', { action: 'enquiry' }); }
    else if (act === 'tips') {
      addUser('💡 Study Tips'); setFlow('tips-loading'); setTyping(true);
      try { const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'study_tips', moduleName: selModule?.name }) }); const data = await res.json(); setTyping(false); await addBot(`Here are some study tips for ${selModule?.name}:`, 'study-tips', { tips: data.tips || [], module: selModule }, 300); }
      catch { setTyping(false); await addBot('Sorry, could not generate tips right now.', 'error'); }
      setFlow('idle'); setSelModule(null); setAction(null); setTimeout(() => addBot('Need anything else?', 'modules'), 1000);
    } else if (act === 'grades') { addUser('🧮 Grade Calculator'); setFlow('grade-calc'); await addBot(`Enter your marks for ${selModule?.name} to calculate your grade.`, 'grade-calc', { module: selModule }); }
  }, [addBot, addUser, selModule]);

  const handleStudentSubmit = useCallback(async () => {
    if (!student.name || !student.studentNumber || !student.email) return;
    addUser(`${student.name} | ${student.studentNumber} | ${student.email}`);
    if (action === 'book') { setFlow('book-time'); await addBot(`Great, ${student.name}! Select a time slot.`, 'time-slots'); }
    else { setFlow('enq-text'); await addBot(`Thanks, ${student.name}! Type your enquiry below.`, 'enquiry-form'); }
  }, [student, action, addBot, addUser]);

  const handleSlotSelect = useCallback(async (slot: TimeSlot) => { setSelSlot(slot); setFlow('book-confirm'); addUser(`${slot.date} at ${slot.startTime} - ${slot.endTime}`); await addBot('Please confirm your booking:', 'confirmation', { type: 'booking', module: selModule, slot, student }); }, [selModule, student, addBot, addUser]);
  const handleEnquirySubmit = useCallback(async () => { if (!enquiryText.trim()) return; setFlow('enq-confirm'); addUser(enquiryText); await addBot('Please confirm your enquiry:', 'confirmation', { type: 'enquiry', module: selModule, text: enquiryText, student }); }, [enquiryText, selModule, student, addBot, addUser]);

  const handleGradeCalc = useCallback(async () => {
    const t1 = parseFloat(grades.test1) || 0, t2 = parseFloat(grades.test2) || 0, a1 = parseFloat(grades.assign1) || 0, a2 = parseFloat(grades.assign2) || 0;
    const ym = (t1 + t2 + a1 + a2) / 4; const np = Math.max(0, Math.ceil((50 - ym * 0.4) / 0.6)); const nd = Math.max(0, Math.ceil((75 - ym * 0.4) / 0.6));
    addUser(`T1: ${t1}% | T2: ${t2}% | A1: ${a1}% | A2: ${a2}%`);
    await addBot('Here are your grade results:', 'grade-result', { yearMark: ym.toFixed(1), neededForPass: np, neededForDist: nd, module: selModule });
    resetFlow(); setTimeout(() => addBot('Need anything else?', 'modules'), 1000);
  }, [grades, selModule, addBot, addUser, resetFlow]);

  const handleConfirm = useCallback(async (confirmed: boolean) => {
    if (confirmed && action === 'book' && selModule && selSlot) {
      setBookings(prev => [...prev, { moduleId: selModule.id, slotId: selSlot.id, student, date: selSlot.date, time: `${selSlot.startTime} - ${selSlot.endTime}`, moduleName: selModule.name, lecturer: selModule.lecturer, office: selModule.office }]);
      addUser('✅ Confirm'); await addBot(`Booking confirmed! ✅\n\n📅 ${selSlot.date} at ${selSlot.startTime}\n📍 Office ${selModule.office} with ${selModule.lecturer}\n\nDon't forget! 👋`);
    } else if (confirmed && action === 'enquiry' && selModule) { addUser('✅ Send'); await addBot(`Enquiry sent! ✅\n\n📧 To: ${selModule.lecturer} (${selModule.email})`); }
    else { addUser('❌ Cancel'); await addBot('Request cancelled.'); }
    resetFlow(); setTimeout(() => addBot('Modules:', 'modules'), 1200);
  }, [action, selModule, selSlot, student, addBot, addUser, resetFlow]);

  const showHistory = useCallback(async () => { addUser('📜 My Appointments'); await addBot(bookings.length > 0 ? `You have ${bookings.length} appointment(s):` : 'No appointments booked yet.', 'history', { bookings }); }, [bookings, addBot, addUser]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim(); setInput(''); resetFlow(); addUser(msg); setSending(true); setTyping(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await res.json(); setTyping(false);
      if (data.intent === 'select_module' && data.module_id) { const mod = MODULES.find(m => m.id === data.module_id); if (mod) { setSending(false); handleModuleSelect(mod); return; } }
      if (data.intent === 'book_appointment' && data.module_id) { const mod = MODULES.find(m => m.id === data.module_id); if (mod) { setSelModule(mod); setSending(false); handleAction('book'); return; } }
      if (data.intent === 'send_enquiry' && data.module_id) { const mod = MODULES.find(m => m.id === data.module_id); if (mod) { setSelModule(mod); setSending(false); handleAction('enquiry'); return; } }
      if (data.intent === 'study_tips' && data.module_id) { const mod = MODULES.find(m => m.id === data.module_id); if (mod) { setSelModule(mod); setSending(false); handleAction('tips'); return; } }
      if (data.intent === 'greeting' || data.intent === 'help') { await addBot(data.message || 'I can help you book, enquire, get tips, or calculate grades!'); await addBot('Select a module:', 'modules'); }
      else if (data.intent === 'info_answer') { await addBot(data.message); await addBot('Need anything else?', 'modules'); }
      else if (data.intent === 'unknown') { await addBot(data.message || "Sorry, I can't help with that. For more info, visit the VUT official website: https://www.vut.ac.za", 'error'); await addBot('Or pick a module below:', 'modules'); }
      else { await addBot(data.message, 'text'); await addBot('Modules:', 'modules'); }
    } catch { setTyping(false); await addBot('Something went wrong.', 'error'); await addBot('Modules:', 'modules'); }
    setSending(false);
  }, [input, sending, addBot, addUser, handleModuleSelect, handleAction]);

  const clearChat = () => { resetFlow(); setMessages([{ id: 'r1', role: 'assistant', content: 'Hey! 👋 How can I help you today?', type: 'text', ts: new Date() }, { id: 'r2', role: 'assistant', content: 'Choose a module.', type: 'modules', ts: new Date() }]); };

  const sidebarAction = (act: string) => {
    setSidebarOpen(false);
    if (act === 'new') clearChat();
    else if (act === 'history') showHistory();
    else if (act === 'modules') { resetFlow(); addBot('Here are all modules:', 'modules'); }
    else { resetFlow(); addBot('Please select a module first:', 'modules'); }
  };

  const bookedIds = new Set(bookings.filter(b => b.moduleId === selModule?.id).map(b => b.slotId));
  const slots = genSlots();
  const filtMods = MODULES.filter(m => m.semester === sem);
  const isLast = (id: string) => messages.length > 0 && messages[messages.length - 1].id === id;

  /* ======== SPLASH ======== */
  if (splash) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} className="text-center">
        <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 1.5 }} className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-500/20 flex items-center justify-center"><GraduationCap className="w-10 h-10 text-blue-400" /></motion.div>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-white mb-2">Edu AI Assistant</motion.h1>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-gray-400 text-sm">VUT First Year Support</motion.p>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 1.5 }} className="mt-6 h-1 w-48 mx-auto bg-blue-500/30 rounded-full overflow-hidden"><motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1 }} className="h-full w-1/2 bg-blue-400 rounded-full" /></motion.div>
      </motion.div>
    </div>
  );

  const sidebarItems = [
    { icon: Plus, label: 'New Chat', act: 'new', color: 'text-blue-400' },
    { icon: BookOpen, label: 'Browse Modules', act: 'modules', color: 'text-blue-400' },
    { icon: Calendar, label: 'Book Appointment', act: 'book', color: 'text-green-400' },
    { icon: Mail, label: 'Send Enquiry', act: 'enquiry', color: 'text-purple-400' },
    { icon: Lightbulb, label: 'Study Tips', act: 'tips', color: 'text-amber-400' },
    { icon: Calculator, label: 'Grade Calculator', act: 'grades', color: 'text-emerald-400' },
    { icon: History, label: 'My Appointments', act: 'history', color: 'text-cyan-400' },
  ];

  /* ======== RENDER ======== */
  return (
    <div className={`min-h-screen ${dk ? 'bg-gray-900' : 'bg-gray-100'} flex`}>


      {/* Sidebar */}
      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`${sidebarOpen ? 'fixed z-40' : 'hidden'} md:relative md:flex w-[240px] shrink-0 h-screen ${dk ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col transition-all`}>
            <div className={`px-4 py-5 border-b ${dk ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-blue-400" /></div>
                <span className={`font-bold ${dk ? 'text-white' : 'text-gray-900'}`}>Edu AI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className={`p-1.5 rounded-lg md:hidden ${dk ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><ChevronLeft className="w-5 h-5" /></button>
            </div>

            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => (
                <button key={item.act} onClick={() => sidebarAction(item.act)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${dk ? 'hover:bg-gray-800 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className={`px-3 py-4 border-t ${dk ? 'border-gray-800' : 'border-gray-200'} space-y-1`}>
              <button onClick={() => setTheme(dk ? 'light' : 'dark')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${dk ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
                {dk ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                <span className="text-sm font-medium">{dk ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <div className={`px-3 py-2 text-[10px] ${dk ? 'text-gray-600' : 'text-gray-400'}`}><span className="hidden md:inline">Edu AI Assistant v2.0<br />VUT First Year Support</span></div>
            </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <header className={`${dk ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b px-4 py-3`}>
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-xl md:hidden ${dk ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}><Menu className="w-5 h-5" /></button>

              <div>
                <h1 className={`text-base font-bold ${dk ? 'text-white' : 'text-gray-900'} tracking-tight`}>Edu AI Assistant</h1>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className={`text-[11px] ${dk ? 'text-gray-500' : 'text-gray-400'}`}>Online</span></div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`flex rounded-lg ${dk ? 'bg-gray-800' : 'bg-gray-100'} p-0.5 mr-2`}>
                {(['1.1', '1.2'] as const).map(s => <button key={s} onClick={() => setSem(s)} className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${sem === s ? 'bg-blue-500 text-white' : dk ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Sem {s}</button>)}
              </div>
              <button onClick={() => setTheme(dk ? 'light' : 'dark')} className={`p-2 rounded-xl ${dk ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}>{dk ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
              <button onClick={() => setExpanded(!expanded)} className={`p-2 rounded-xl ${dk ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors hidden md:flex`}>{expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <main className={`flex-1 overflow-y-auto chat-scrollbar`} style={{ backgroundColor: dk ? '#374151' : '#f3f4f6' }}>
          <div className="w-full px-4 md:px-8 py-5 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'user' ? <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-blue-500 text-white text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</div> : renderBot(m)}
                </motion.div>
              ))}
            </AnimatePresence>
            {typing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start"><div className={`${dk ? 'bg-gray-600' : 'bg-white border border-gray-200'} rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5`}><span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" /><span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" /><span className="w-2 h-2 bg-gray-400 rounded-full typing-dot" /></div></motion.div>}
            <div ref={endRef} />
          </div>
        </main>



        {/* Input */}
        <footer className={`${dk ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t px-4 py-3`}>
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="w-full flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..."
              className={`flex-1 px-4 py-3 rounded-xl ${dk ? 'bg-gray-800 text-white placeholder:text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-900 placeholder:text-gray-400 border-gray-200'} border text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all`} />
            <button type="submit" disabled={!input.trim() || sending} className="px-4 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><Send className="w-5 h-5" /></button>
          </form>
        </footer>
      </div>
    </div>
  );

  /* ======== RENDERERS ======== */
  function renderBot(m: ChatMessage) {
    const a = isLast(m.id);
    const mb = dk ? 'bg-gray-600 text-gray-100' : 'bg-white text-gray-800 border border-gray-200';
    const fb = dk ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';
    const ib = dk ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
    const ts = dk ? 'text-gray-300' : 'text-gray-600';
    const tm = dk ? 'text-gray-400' : 'text-gray-500';

    switch (m.type) {
      case 'error': return <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md bg-red-900/40 border border-red-700/30 text-red-200 text-[15px] flex items-start gap-2"><AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-400" /><span dangerouslySetInnerHTML={{__html: m.content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="underline text-blue-300 hover:text-blue-200">$1</a>')}} /></div>;
      case 'modules': return <div className="max-w-[92%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{filtMods.map(mod => <button key={mod.id} onClick={() => a && flow === 'idle' && handleModuleSelect(mod)} disabled={!a || flow !== 'idle'} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-default text-left transition-all group"><BookOpen className="w-5 h-5 text-blue-300 shrink-0" /><div><p className="text-sm font-semibold text-white">{mod.name}</p><p className="text-xs text-blue-300">{mod.lecturer} · {mod.office}</p></div><ChevronRight className="w-4 h-4 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" /></button>)}</div></div>;
      case 'module-info': { const mod = m.data as Module; return <div className="max-w-[88%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div><div className={`rounded-xl ${fb} border p-4 space-y-3`}><div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-400" /><span className={`font-bold text-lg ${dk ? 'text-white' : 'text-gray-900'}`}>{mod.name}</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm"><div className={`flex items-center gap-2 ${ts}`}><User className="w-4 h-4 text-blue-400" />{mod.lecturer}</div><div className={`flex items-center gap-2 ${ts}`}><MapPin className="w-4 h-4 text-blue-400" />Office {mod.office}</div><div className={`flex items-center gap-2 ${ts} sm:col-span-2`}><AtSign className="w-4 h-4 text-blue-400" /><span className="break-all">{mod.email}</span></div></div></div></div>; }
      case 'actions': return <div className="max-w-[92%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div><div className="grid grid-cols-2 gap-2"><button onClick={() => a && handleAction('book')} disabled={!a} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold disabled:opacity-50 transition-all text-sm"><Calendar className="w-4 h-4" />Book</button><button onClick={() => a && handleAction('enquiry')} disabled={!a} className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl ${fb} border ${dk ? 'text-white' : 'text-gray-800'} font-semibold disabled:opacity-50 transition-all text-sm hover:opacity-80`}><Mail className="w-4 h-4" />Enquiry</button><button onClick={() => a && handleAction('tips')} disabled={!a} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50 transition-all text-sm"><Lightbulb className="w-4 h-4" />Study Tips</button><button onClick={() => a && handleAction('grades')} disabled={!a} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 transition-all text-sm"><Calculator className="w-4 h-4" />Grades</button></div></div>;
      case 'student-form': return <div className="max-w-[88%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div>{a && <div className={`rounded-xl ${fb} border p-4 space-y-3`}><div className="space-y-2"><label className={`flex items-center gap-2 text-sm ${ts}`}><User className="w-4 h-4" />Full Name</label><input value={student.name} onChange={e => setStudent(p => ({ ...p, name: e.target.value }))} placeholder="e.g. John Doe" className={`w-full px-3 py-2.5 rounded-lg ${ib} border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]`} /></div><div className="space-y-2"><label className={`flex items-center gap-2 text-sm ${ts}`}><Hash className="w-4 h-4" />Student Number</label><input value={student.studentNumber} onChange={e => setStudent(p => ({ ...p, studentNumber: e.target.value }))} placeholder="e.g. 220012345" className={`w-full px-3 py-2.5 rounded-lg ${ib} border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]`} /></div><div className="space-y-2"><label className={`flex items-center gap-2 text-sm ${ts}`}><AtSign className="w-4 h-4" />Email</label><input type="email" value={student.email} onChange={e => setStudent(p => ({ ...p, email: e.target.value }))} placeholder="student@edu.vut.ac.za" className={`w-full px-3 py-2.5 rounded-lg ${ib} border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px]`} /></div><button onClick={handleStudentSubmit} disabled={!student.name || !student.studentNumber || !student.email} className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-40 transition-all">Continue <ChevronRight className="w-4 h-4 inline ml-1" /></button></div>}</div>;
      case 'time-slots': { const grouped: Record<string, (TimeSlot & { isBooked: boolean })[]> = {}; for (const s of slots) { if (!grouped[s.date]) grouped[s.date] = []; grouped[s.date].push({ ...s, isBooked: bookedIds.has(s.id) }); } return <div className="max-w-[92%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div>{a && <div className={`rounded-xl ${fb} border p-4 space-y-3`}>{Object.entries(grouped).map(([date, ds]) => <div key={date}><p className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-1"><Calendar className="w-4 h-4" />{date}</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{ds.map(s => <button key={s.id} onClick={() => !s.isBooked && handleSlotSelect(s)} disabled={s.isBooked} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${s.isBooked ? `${ib} text-gray-500 cursor-not-allowed line-through` : `${ib} hover:bg-blue-900 hover:text-blue-200 hover:border-blue-500`}`}><Clock className="w-3.5 h-3.5 inline mr-1" />{s.startTime}-{s.endTime}</button>)}</div></div>)}</div>}</div>; }
      case 'enquiry-form': return <div className="max-w-[88%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div>{a && <div className={`rounded-xl ${fb} border p-4 space-y-3`}><textarea value={enquiryText} onChange={e => setEnquiryText(e.target.value)} placeholder="Type your enquiry..." rows={4} className={`w-full px-3 py-2.5 rounded-lg ${ib} border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-[15px]`} /><div className={`flex items-center gap-2 text-xs ${tm}`}><AtSign className="w-3.5 h-3.5" />To: {selModule?.lecturer} ({selModule?.email})</div><button onClick={handleEnquirySubmit} disabled={!enquiryText.trim()} className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-40 transition-all">Send <Send className="w-4 h-4 inline ml-1" /></button></div>}</div>;
      case 'confirmation': { const d = m.data; return <div className="max-w-[88%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div><div className={`rounded-xl ${fb} border border-blue-500/30 p-4 space-y-3`}>{d.type === 'booking' ? <div className={`space-y-2 text-sm ${ts}`}><p className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /><strong>{d.module.name}</strong></p><p className="flex items-center gap-2"><User className="w-4 h-4 text-blue-400" />{d.module.lecturer}</p><p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-400" />Office {d.module.office}</p><p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" />{d.slot.date} · {d.slot.startTime}-{d.slot.endTime}</p></div> : <div className={`space-y-2 text-sm ${ts}`}><p className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /><strong>{d.module.name}</strong></p><p className="flex items-center gap-2"><User className="w-4 h-4 text-blue-400" />To: {d.module.lecturer}</p><p className={`italic mt-2 ${tm}`}>"{d.text}"</p></div>}{a && <div className="flex gap-2 pt-2"><button onClick={() => handleConfirm(true)} className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Confirm</button><button onClick={() => handleConfirm(false)} className={`flex-1 py-2.5 rounded-lg ${dk ? 'bg-gray-600' : 'bg-gray-200 text-gray-800'} hover:opacity-80 ${dk ? 'text-white' : ''} font-semibold transition-all flex items-center justify-center gap-2`}><X className="w-4 h-4" />Cancel</button></div>}</div></div>; }
      case 'grade-calc': return <div className="max-w-[88%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div>{a && <div className={`rounded-xl ${fb} border p-4 space-y-3`}><div className="grid grid-cols-2 gap-3">{[{ k: 'test1' as const, l: 'Test 1 (%)' }, { k: 'test2' as const, l: 'Test 2 (%)' }, { k: 'assign1' as const, l: 'Assignment 1 (%)' }, { k: 'assign2' as const, l: 'Assignment 2 (%)' }].map(f => <div key={f.k} className="space-y-1"><label className={`text-xs font-medium ${tm}`}>{f.l}</label><input type="number" min="0" max="100" value={grades[f.k]} onChange={e => setGrades(p => ({ ...p, [f.k]: e.target.value }))} placeholder="0-100" className={`w-full px-3 py-2 rounded-lg ${ib} border placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-[15px]`} /></div>)}</div><button onClick={handleGradeCalc} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all"><Calculator className="w-4 h-4 inline mr-2" />Calculate</button></div>}</div>;
      case 'grade-result': { const d = m.data; const ym = parseFloat(d.yearMark); const clr = ym >= 75 ? 'text-yellow-400' : ym >= 50 ? 'text-green-400' : 'text-red-400'; const badge = ym >= 75 ? 'bg-yellow-500/20 text-yellow-400' : ym >= 50 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'; return <div className="max-w-[88%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div><div className={`rounded-xl ${fb} border p-4 space-y-4`}><div className="text-center"><p className={`text-4xl font-bold ${clr}`}>{d.yearMark}%</p><p className={`text-sm ${tm} mt-1`}>Year Mark</p><div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-semibold ${badge}`}><Award className="w-4 h-4" />{ym >= 75 ? 'Distinction' : ym >= 50 ? 'Passing' : 'Below Pass'}</div></div><div className={`border-t ${dk ? 'border-gray-600' : 'border-gray-200'} pt-3 space-y-2 text-sm`}><p className={`flex items-center justify-between ${ts}`}><span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" />Need for 50%</span><span className="font-bold">{d.neededForPass > 100 ? 'Not possible' : `${d.neededForPass}%`}</span></p><p className={`flex items-center justify-between ${ts}`}><span className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" />Need for 75%</span><span className="font-bold">{d.neededForDist > 100 ? 'Not possible' : `${d.neededForDist}%`}</span></p></div><div className={`w-full ${dk ? 'bg-gray-800' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}><div className={`h-full rounded-full transition-all ${ym >= 75 ? 'bg-yellow-400' : ym >= 50 ? 'bg-green-400' : 'bg-red-400'}`} style={{ width: `${Math.min(ym, 100)}%` }} /></div></div></div>; }
      case 'study-tips': { const tips = m.data?.tips || []; return <div className="max-w-[88%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div><div className={`rounded-xl ${fb} border p-4 space-y-2`}>{tips.map((tip: string, i: number) => <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`flex items-start gap-3 p-3 rounded-lg ${ib} border`}><span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span><p className={`text-sm ${ts} leading-relaxed`}>{tip}</p></motion.div>)}</div></div>; }
      case 'history': { const bk = m.data?.bookings as Booking[] || []; if (!bk.length) return <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div>; return <div className="max-w-[88%] space-y-2"><div className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px]`}>{m.content}</div><div className={`rounded-xl ${fb} border p-4 space-y-2`}>{bk.map((b, i) => <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${ib} border`}><div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-blue-400" /></div><div className="flex-1 min-w-0"><p className={`text-sm font-semibold ${dk ? 'text-white' : 'text-gray-900'} truncate`}>{b.moduleName}</p><p className={`text-xs ${tm}`}>{b.date} · {b.time} · {b.lecturer}</p></div></div>)}</div></div>; }
      default: return <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md ${mb} text-[15px] leading-relaxed whitespace-pre-wrap`} dangerouslySetInnerHTML={{__html: m.content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="underline text-blue-400 hover:text-blue-300">$1</a>')}} />;
    }
  }
}




































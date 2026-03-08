'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperPlaneRight, Robot, UserCircle, Warning, ShieldCheck, Siren, WifiSlash, ArrowCounterClockwise, Heartbeat } from '@phosphor-icons/react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type DiseaseMatch = {
    name: string;
    matchPercentage: number;
    matchedSymptoms: string[];
    unmatchedSymptoms: string[];
    recommendation: string;
};

export type AssessmentData = {
    summary: string;
    diseases: DiseaseMatch[];
    disclaimer: string;
};

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isTyping?: boolean;
    urgencyLevel?: 'Routine' | 'Urgent' | 'Emergency' | 'Pending Sync' | 'Error/Pending';
    recommendedAction?: string;
    assessment?: AssessmentData;
};

function RichText({ text }: { text: string }) {
    return (
        <div className="text-sm leading-relaxed text-zinc-800 space-y-4 font-sans">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ node, ...props }) => <p className="leading-7" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-black bg-zinc-100 px-1 py-0.5 rounded" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 space-y-1 my-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 space-y-1 my-2" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold text-black mt-4 mb-2" {...props} />,
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4 w-full brutal-shadow-sm border border-black">
                            <table className="w-full text-left text-sm" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-black text-white" {...props} />,
                    th: ({ node, ...props }) => <th className="px-4 py-2 font-semibold" {...props} />,
                    td: ({ node, ...props }) => <td className="px-4 py-2 border-t border-zinc-200" {...props} />,
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}

import Link from 'next/link';
import { VideoCamera } from '@phosphor-icons/react';

function UrgencyCard({ level, assessment, triageId }: { level: string; assessment: AssessmentData; triageId?: string }) {
    const config: Record<string, { bg: string; border: string; headerBg: string; icon: React.ReactNode; label: string }> = {
        Emergency: {
            bg: 'bg-red-50', border: 'border-red-600', headerBg: 'bg-red-600 text-white',
            icon: <Siren size={16} weight="bold" />, label: 'EMERGENCY',
        },
        Urgent: {
            bg: 'bg-amber-50', border: 'border-amber-600', headerBg: 'bg-amber-600 text-white',
            icon: <Warning size={16} weight="bold" />, label: 'URGENT',
        },
        Routine: {
            bg: 'bg-emerald-50', border: 'border-emerald-600', headerBg: 'bg-emerald-600 text-white',
            icon: <ShieldCheck size={16} weight="bold" />, label: 'ROUTINE',
        },
    };
    const c = config[level] || config.Urgent;

    return (
        <div className={`mt-4 border-4 border-black overflow-hidden brutal-shadow-sm`}>
            <div className={`${c.headerBg} border-b-2 border-black px-4 py-2.5 flex items-center gap-2 font-mono text-[10px] font-black tracking-widest`}>
                {c.icon}
                {c.label} ANALYSIS
            </div>

            <div className="bg-white p-4 space-y-4">
                {assessment.summary && (
                    <div className="text-sm font-medium border-l-4 border-black pl-3 py-1 bg-zinc-50">
                        {assessment.summary}
                    </div>
                )}

                <div className="space-y-3">
                    {assessment.diseases.slice(0, 2).map((d, i) => (
                        <div key={i} className="border-2 border-zinc-200 p-3 bg-white">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-extrabold text-sm uppercase">{d.name}</span>
                                <span className="text-[10px] font-mono font-bold bg-zinc-100 px-2 py-0.5">{d.matchPercentage}% Match</span>
                            </div>

                            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full ${i === 0 ? 'bg-black' : 'bg-zinc-400'}`}
                                    style={{ width: `${d.matchPercentage}%` }}
                                />
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {d.matchedSymptoms.slice(0, 3).map((s, j) => (
                                    <span key={j} className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {(level === 'Emergency' || level === 'Urgent') && triageId && (
                    <div className="pt-2">
                        <Link
                            href={`/patient/consult?room=${triageId}`}
                            className="w-full inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-3 font-bold text-xs border-2 border-black hover:bg-zinc-800 transition-all uppercase tracking-widest"
                        >
                            <VideoCamera size={16} weight="fill" className="animate-pulse" />
                            Join Video Consultation
                        </Link>
                    </div>
                )}
                <div className="pt-2 italic text-[10px] text-zinc-400 border-t border-zinc-100">
                    {assessment.disclaimer}
                </div>
            </div>
        </div>
    );
}

export default function ConversationalTriage() {
    const { isOnline } = useOfflineSync();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello. I am **Dr. Aura**, your medical intelligence assistant.\n\nDescribe your symptoms in simple words and I will analyze them against our medical database.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleReset = () => {
        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Session reset. Describe your symptoms to begin.'
        }]);
        setInput('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        const typingId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '', isTyping: true }]);

        try {
            if (!isOnline) {
                setMessages(prev => prev.filter(m => m.id !== typingId));
                setMessages(prev => [...prev, {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: 'Offline. Symptoms saved locally.',
                    urgencyLevel: 'Pending Sync'
                }]);
                return;
            }

            const history = messages
                .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.isTyping && !m.urgencyLevel))
                .map(m => ({ role: m.role, content: m.content }));

            const response = await fetch('/api/triage/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content, history })
            });

            const data = await response.json();
            setMessages(prev => prev.filter(m => m.id !== typingId));

            if (data.triageResult) {
                const botId = data.triageResult?.id || String(Date.now() + 1);
                const botMessage: Message = {
                    id: botId,
                    role: 'assistant',
                    content: data.triageResult?.recommendedAction || "I've analyzed your symptoms.",
                    urgencyLevel: data.triageResult?.urgencyLevel,
                    assessment: data.triageResult?.assessment
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: data.reply
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => prev.filter(m => m.id !== typingId));
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Connection error. Seek help if this is an emergency.',
                urgencyLevel: 'Error/Pending'
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full border-2 border-black brutal-shadow bg-white flex flex-col h-[620px] overflow-hidden">

            
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Robot size={20} weight="bold" />
                    <div>
                        <h3 className="text-sm font-bold tracking-tight">Dr. Aura</h3>
                        <p className="text-[9px] font-mono-ui text-zinc-400 tracking-wider">RAG MODEL • ACTIVE</p>
                    </div>
                </div>
                <button onClick={handleReset} className="text-zinc-400 hover:text-white p-1.5 transition-colors" title="Reset">
                    <ArrowCounterClockwise size={16} weight="bold" />
                </button>
            </div>

            
            {!isOnline && (
                <div className="bg-amber-100 border-b-2 border-black px-4 py-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
                    <WifiSlash size={14} weight="bold" />
                    Offline — data will sync when connected
                </div>
            )}

            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50 font-sans">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>

                            
                            <div className={`w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'assistant' ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                                {msg.role === 'assistant' ? <Robot size={14} weight="bold" /> : <UserCircle size={14} weight="bold" />}
                            </div>

                            
                            <div className={`px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-white border-2 border-zinc-200'}`}>
                                {msg.isTyping ? (
                                    <div className="flex space-x-1 h-5 items-center">
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                                    </div>
                                ) : (
                                    <>
                                        {msg.content && (
                                            msg.role === 'user'
                                                ? <p className="text-sm leading-relaxed">{msg.content}</p>
                                                : <RichText text={msg.content} />
                                        )}

                                        {msg.assessment && (
                                            <UrgencyCard
                                                level={msg.urgencyLevel || 'Urgent'}
                                                assessment={msg.assessment}
                                                triageId={msg.id}
                                            />
                                        )}

                                        {msg.urgencyLevel === 'Pending Sync' && (
                                            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-amber-700">
                                                <WifiSlash size={14} weight="bold" />
                                                Saved offline
                                            </div>
                                        )}
                                        {msg.urgencyLevel === 'Error/Pending' && (
                                            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-600">
                                                <Warning size={14} weight="bold" />
                                                Connection error
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            
            <div className="p-4 bg-white border-t-2 border-black">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe your symptoms..."
                            disabled={isProcessing}
                            className="w-full px-4 py-3 text-sm border-2 border-black font-sans focus:outline-none focus:ring-0 placeholder:text-zinc-400 disabled:bg-zinc-50"
                        />
                        <Heartbeat size={14} weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300" />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim() || isProcessing}
                        className="px-5 py-3 bg-black text-white text-sm font-bold border-2 border-black hover:bg-zinc-800 disabled:bg-zinc-300 disabled:border-zinc-300 transition-colors flex items-center gap-2"
                    >
                        <PaperPlaneRight size={14} weight="bold" />
                        <span className="hidden sm:inline uppercase tracking-tighter">Send</span>
                    </button>
                </form>
                <p className="text-center font-mono text-[9px] text-zinc-400 mt-2 tracking-wider uppercase">Not a substitute for professional medical advice</p>
            </div>
        </div>
    );
}

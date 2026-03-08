'use client';

import { useState } from 'react';
import SymptomTriage from '@/components/triage/SymptomTriage';
import ConversationalTriage from '@/components/triage/ConversationalTriage';
import { ChatCircleDots, ListChecks } from '@phosphor-icons/react';

export default function TriagePage() {
    const [mode, setMode] = useState<'form' | 'chat'>('chat');

    return (
        <div className="min-h-screen bg-[#fafafa] pt-16">

            
            <div className="border-b-2 border-black bg-white px-8 md:px-16 py-12">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div>
                        <p className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400 mb-3">Module / Triage</p>
                        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                            AI Health <span className="font-serif-accent italic font-normal text-zinc-400">Assistant</span>
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2">Preliminary medical advice powered by your custom RAG model.</p>
                    </div>

                    
                    <div className="flex border-2 border-black w-fit shrink-0">
                        <button
                            onClick={() => setMode('chat')}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-colors ${mode === 'chat' ? 'bg-black text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
                                }`}
                        >
                            <ChatCircleDots size={16} weight={mode === 'chat' ? 'fill' : 'bold'} />
                            Chat
                        </button>
                        <button
                            onClick={() => setMode('form')}
                            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-l-2 border-black transition-colors ${mode === 'form' ? 'bg-black text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
                                }`}
                        >
                            <ListChecks size={16} weight={mode === 'form' ? 'fill' : 'bold'} />
                            Form
                        </button>
                    </div>
                </div>
            </div>

            
            <div className="px-8 md:px-16 py-12">
                {mode === 'chat' ? <ConversationalTriage /> : <SymptomTriage />}
            </div>
        </div>
    );
}

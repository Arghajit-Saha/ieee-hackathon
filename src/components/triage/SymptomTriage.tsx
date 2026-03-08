'use client';

import { useState, useEffect } from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { addOfflineTriageLog } from '@/lib/offline/idb';
import {
    ArrowRight, ArrowLeft, ArrowCounterClockwise, CheckCircle,
    Warning, Siren, ShieldCheck, SpinnerGap, WifiSlash,
    FirstAid, Hospital, Phone, ClipboardText, Heartbeat, SmileyXEyes,
    VideoCamera
} from '@phosphor-icons/react';
import Link from 'next/link';
import haptic from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';


type BodyRegion = {
    id: string;
    label: string;
    emoji: string;
    color: string;
    followUpQuestions: Question[];
};

type Question = {
    id: string;
    text: string;
    type: 'yesno' | 'scale' | 'duration';
    scaleLabels?: [string, string];
};

type Answer = {
    questionId: string;
    questionText: string;
    value: string | number;
};


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


const BODY_REGIONS: BodyRegion[] = [
    { id: 'head', label: 'Head & Neck', emoji: '🧠', color: '#6366f1', followUpQuestions: [] },
    { id: 'chest', label: 'Chest & Heart', emoji: '❤️', color: '#ef4444', followUpQuestions: [] },
    { id: 'abdomen', label: 'Abdomen & Gut', emoji: '🫁', color: '#f59e0b', followUpQuestions: [] },
    { id: 'limbs', label: 'Arms & Legs', emoji: '🦵', color: '#10b981', followUpQuestions: [] },
    { id: 'skin', label: 'Skin & Rash', emoji: '🩺', color: '#8b5cf6', followUpQuestions: [] },
    { id: 'general', label: 'General / Fever', emoji: '🌡️', color: '#0ea5e9', followUpQuestions: [] },
];

const DURATIONS = ['Less than 1 day', '1–3 days', '4–7 days', '1–2 weeks', 'More than 2 weeks'];
const SCALE_COLORS = ['#22c55e', '#4ade80', '#86efac', '#fde047', '#fbbf24', '#fb923c', '#f97316', '#ef4444', '#dc2626', '#b91c1c'];


function ProgressBar({ current, total }: { current: number; total: number }) {
    const pct = Math.min(100, Math.round((current / total) * 100));
    return (
        <div className="mb-8">
            <div className="flex justify-between text-[11px] font-mono-ui text-zinc-400 mb-2 tracking-wider uppercase">
                <span>Step {current} of {total}</span>
                <span>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 border border-zinc-200">
                <div className="h-full bg-black transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function YesNoCard({ question, value, onChange }: { question: Question; value: string | null; onChange: (v: string) => void }) {
    return (
        <div>
            <p className="text-lg font-extrabold text-zinc-900 mb-6 leading-snug">{question.text}</p>
            <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Yes', emoji: '✓', selected: 'bg-black text-white border-black' }, { label: 'No', emoji: '✗', selected: 'bg-zinc-800 text-white border-zinc-800' }].map(opt => (
                    <motion.button
                        key={opt.label}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            haptic.selection();
                            onChange(opt.label);
                        }}
                        className={`py-6 border-2 text-sm font-bold transition-all duration-150 ${value === opt.label ? opt.selected + ' scale-[0.98] shadow-inner' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>
                        <span className="block text-3xl mb-2">{opt.emoji}</span>
                        {opt.label}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

function ScaleCard({ question, value, onChange }: { question: Question; value: number | null; onChange: (v: number) => void }) {
    return (
        <div>
            <p className="text-lg font-extrabold text-zinc-900 mb-6 leading-snug">{question.text}</p>
            <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <motion.button
                        key={n}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            haptic.light();
                            onChange(n);
                        }}
                        className={`flex-1 h-14 flex items-center justify-center text-sm font-bold border-2 transition-all duration-150 ${value === n ? 'text-white border-transparent scale-110 shadow-md' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}
                        style={value === n ? { backgroundColor: SCALE_COLORS[n - 1], borderColor: SCALE_COLORS[n - 1] } : {}}>
                        {n}
                    </motion.button>
                ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-400 font-mono-ui mb-4">
                <span>{question.scaleLabels?.[0] ?? 'None'}</span>
                <span>{question.scaleLabels?.[1] ?? 'Severe'}</span>
            </div>

            <div className="h-2 w-full rounded-full" style={{ background: 'linear-gradient(to right, #22c55e, #fbbf24, #ef4444)' }} />
            {value !== null && (
                <div className="flex items-center gap-2 mt-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SCALE_COLORS[value - 1] }} />
                    <span className="text-xs font-bold" style={{ color: SCALE_COLORS[value - 1] }}>Selected: {value}/10</span>
                </div>
            )}
        </div>
    );
}

function DurationCard({ question, value, onChange }: { question: Question; value: string | null; onChange: (v: string) => void }) {
    return (
        <div>
            <p className="text-lg font-extrabold text-zinc-900 mb-6 leading-snug">{question.text}</p>
            <div className="space-y-2">
                {DURATIONS.map((d, i) => (
                    <motion.button
                        key={d}
                        type="button"
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            haptic.selection();
                            onChange(d);
                        }}
                        className={`w-full px-5 py-3.5 text-left text-sm font-medium border-2 transition-all duration-150 flex items-center gap-3 ${value === d ? 'bg-black text-white border-black' : 'bg-white text-zinc-700 border-zinc-200 hover:border-black hover:bg-zinc-50'}`}>
                        <span className={`text-xs font-mono-ui font-bold ${value === d ? 'text-zinc-400' : 'text-zinc-300'}`}>0{i + 1}</span>
                        {d}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}


function RichResultView({
    result, answers, region, onReset
}: {

    result: any;
    answers: Answer[];
    region: BodyRegion;
    onReset: () => void;
}) {
    const urgencyConfig: Record<string, { bg: string; text: string; border: string; bar: string; icon: React.ReactNode; label: string; desc: string }> = {
        Emergency: {
            bg: 'bg-red-600', text: 'text-white', border: 'border-red-600', bar: 'bg-red-600',
            icon: <Siren size={28} weight="fill" />, label: 'EMERGENCY', desc: 'Seek immediate medical attention.',
        },
        Urgent: {
            bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500', bar: 'bg-amber-500',
            icon: <Warning size={28} weight="fill" />, label: 'URGENT', desc: 'See a doctor as soon as possible.',
        },
        Routine: {
            bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-600', bar: 'bg-emerald-600',
            icon: <ShieldCheck size={28} weight="fill" />, label: 'ROUTINE', desc: 'Schedule a regular appointment.',
        },
        Error: {
            bg: 'bg-zinc-700', text: 'text-white', border: 'border-zinc-700', bar: 'bg-zinc-700',
            icon: <SmileyXEyes size={28} weight="fill" />, label: 'ERROR', desc: 'Could not analyze. Consult a doctor.',
        },
    };

    const cfg = urgencyConfig[result.urgencyLevel] ?? urgencyConfig.Urgent;
    const isStringFallback = typeof result.recommendedAction === 'string';
    const assessment: AssessmentData | null = !isStringFallback ? result.recommendedAction : null;

    const yesAnswers = answers.filter(a => a.value === 'Yes');
    const scaleAnswers = answers.filter(a => typeof a.value === 'number');
    const maxScale = scaleAnswers.length ? Math.max(...scaleAnswers.map(a => a.value as number)) : null;

    const actionCards = [
        { icon: <FirstAid size={20} weight="bold" />, title: 'First Aid', body: result.urgencyLevel === 'Emergency' ? 'Call emergency services immediately. Do not wait.' : 'Rest and stay hydrated until you see a doctor.' },
        { icon: <Hospital size={20} weight="bold" />, title: 'Where to Go', body: result.urgencyLevel === 'Emergency' ? 'Nearest Emergency Room (ER)' : result.urgencyLevel === 'Urgent' ? 'Urgent Care Clinic or Doctor' : 'Primary Care Physician' },
        { icon: <Phone size={20} weight="bold" />, title: 'Emergency Contact', body: 'India Emergency: 112\nAmbulance: 108\nPoison Control: 1800-116-117' },
        { icon: <ClipboardText size={20} weight="bold" />, title: 'Before Your Visit', body: 'Note your symptoms, duration, and any medications you are currently taking.' },
    ];

    return (
        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">


            <div className={`${cfg.bg} ${cfg.text} border-2 ${cfg.border} p-6 flex flex-col sm:flex-row sm:items-center gap-4 brutal-shadow`}>
                <div className="flex items-center gap-4">
                    {cfg.icon}
                    <div>
                        <p className="font-mono-ui text-[10px] tracking-widest opacity-70 uppercase">Triage Assessment</p>
                        <h2 className="text-2xl font-extrabold tracking-tight">{cfg.label}</h2>
                    </div>
                </div>

                {(result.urgencyLevel === 'Emergency' || result.urgencyLevel === 'Urgent') && result.id && (
                    <div className="sm:ml-8 flex-1">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href={`/patient/consult?room=${result.id}`}
                                onClick={() => haptic.success()}
                                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 font-bold text-sm border-2 border-black brutal-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                            >
                                <VideoCamera size={20} weight="fill" className="animate-pulse text-red-600" />
                                JOIN EMERGENCY VIDEO CONSULT
                            </Link>
                        </motion.div>
                    </div>
                )}

                <div className="sm:ml-auto flex items-center gap-3 flex-wrap">
                    <div className="bg-white/20 px-3 py-1.5 text-xs font-bold tracking-wider flex items-center gap-1.5">
                        <span>{region.emoji}</span> {region.label}
                    </div>
                    {maxScale !== null && (
                        <div className="bg-white/20 px-3 py-1.5 text-xs font-bold tracking-wider flex items-center gap-1.5">
                            <Heartbeat size={12} weight="bold" /> Pain: {maxScale}/10
                        </div>
                    )}
                    <div className="bg-white/20 px-3 py-1.5 text-xs font-bold tracking-wider">
                        {yesAnswers.length} symptoms confirmed
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">


                <div className="lg:col-span-2 space-y-4">
                    {assessment?.summary && (
                        <div className="bg-zinc-50 border-l-4 border-black p-4 text-zinc-800 font-medium text-sm leading-relaxed">
                            {assessment.summary}
                        </div>
                    )}

                    <p className="font-mono-ui text-[10px] text-zinc-400 tracking-widest uppercase mt-4">Top Condition Matches</p>

                    {assessment && assessment.diseases && assessment.diseases.length > 0 ? (
                        assessment.diseases.map((d, i) => (
                            <div key={i} className={`border-2 ${i === 0 ? 'border-black' : 'border-zinc-200'} bg-white overflow-hidden brutal-shadow-sm`}>

                                <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${i === 0 ? 'bg-black text-white' : 'bg-zinc-50 border-b border-zinc-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-mono-ui font-bold ${i === 0 ? 'text-zinc-400' : 'text-zinc-400'}`}>#{i + 1}</span>
                                        <h3 className={`font-extrabold text-base tracking-tight ${i === 0 ? 'text-white' : 'text-zinc-900'}`}>{d.name}</h3>
                                        {i === 0 && <span className="ml-2 text-[9px] font-mono-ui bg-white/20 px-2 py-0.5 tracking-wider">PRIMARY</span>}
                                    </div>

                                    <div className="sm:ml-auto flex items-center gap-2 w-full sm:w-1/3">
                                        <span className="text-xs font-bold font-mono-ui">{d.matchPercentage}%</span>
                                        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div className={`h-full ${i === 0 ? 'bg-emerald-400' : 'bg-zinc-400'}`} style={{ width: `${d.matchPercentage}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 space-y-5">

                                    {d.matchedSymptoms && d.matchedSymptoms.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-mono-ui text-emerald-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <CheckCircle size={14} weight="bold" /> Confirmed Match
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {d.matchedSymptoms.map((m, j) => (
                                                    <span key={j} className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}


                                    {d.unmatchedSymptoms && d.unmatchedSymptoms.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-mono-ui text-zinc-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <Siren size={14} weight="bold" /> Unmatched (Expected for this condition)
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {d.unmatchedSymptoms.map((m, j) => (
                                                    <span key={j} className="px-2.5 py-1 text-xs font-medium bg-zinc-50 text-zinc-500 border border-zinc-200 rounded-sm">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}


                                    {d.recommendation && (
                                        <div className="bg-zinc-50 p-3 border-l-2 border-black">
                                            <p className="text-[10px] font-mono-ui text-black font-bold uppercase tracking-wider mb-1">Recommendation</p>
                                            <p className="text-sm text-zinc-700 leading-relaxed font-medium">{d.recommendation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="border-2 border-black bg-white p-6">
                            <p className="font-mono-ui text-[10px] text-zinc-400 uppercase tracking-wider mb-4">Analysis</p>
                            <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
                                {isStringFallback ? (
                                    (result.recommendedAction as string).split('\n').filter(Boolean).map((line: string, i: number) => {
                                        if (/^\d+[.)]\s/.test(line.trim())) return <p key={i} className="font-semibold text-zinc-900">{line.trim()}</p>;
                                        if (/^[-•]\s/.test(line.trim())) return <p key={i} className="pl-4 text-zinc-600">• {line.trim().replace(/^[-•]\s*/, '')}</p>;
                                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                                        return <p key={i}>{parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j} className="font-bold text-zinc-900">{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>)}</p>;
                                    })
                                ) : (
                                    <p>Could not parse the assessment.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>


                <div className="space-y-4">

                    <div className="border-2 border-zinc-200 bg-white p-5">
                        <p className="font-mono-ui text-[10px] text-zinc-400 uppercase tracking-wider mb-3">Your Responses</p>
                        <div className="space-y-2">
                            {answers.map((a, i) => {
                                const isYes = a.value === 'Yes';
                                const isNo = a.value === 'No';
                                const isScale = typeof a.value === 'number';
                                return (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <span className={`mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center text-[10px] font-bold ${isYes ? 'bg-red-100 text-red-700' : isNo ? 'bg-green-100 text-green-700' : isScale ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                            {isYes ? '!' : isNo ? '✓' : isScale ? a.value : '~'}
                                        </span>
                                        <span className="text-zinc-600 leading-tight">{a.questionText.replace('?', '')}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    {actionCards.map((card, i) => (
                        <div key={i} className="border-2 border-zinc-200 bg-white p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="text-zinc-400">{card.icon}</div>
                                <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono-ui">{card.title}</p>
                            </div>
                            <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">{card.body}</p>
                        </div>
                    ))}


                    <div className="border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                            ⚠️ {assessment?.disclaimer || 'This is an Aura-powered assessment for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.'}
                        </p>
                    </div>
                </div>
            </div>


            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    haptic.warning();
                    onReset();
                }}
                className="w-full py-3.5 border-2 border-black bg-white text-black font-bold text-sm hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
            >
                <ArrowCounterClockwise size={14} weight="bold" /> Start New Assessment
            </motion.button>
        </div>
    );
}


type Step = 'region' | 'questions' | 'loading' | 'result';

export default function SymptomTriage() {
    const { isOnline } = useOfflineSync();
    const [step, setStep] = useState<Step>('region');
    const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [currentDynamicQuestion, setCurrentDynamicQuestion] = useState<Question | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState<string | number | null>(null);
    const [isFetchingNext, setIsFetchingNext] = useState(false);

    const [result, setResult] = useState<any>(null);


    const MAX_QUESTIONS = 6;


    const totalSteps = questionIndex < MAX_QUESTIONS ? MAX_QUESTIONS + 1 : questionIndex + 1;
    const currentStep = step === 'region' ? 1 : questionIndex + 2;

    useEffect(() => { setCurrentAnswer(null); }, [questionIndex]);

    const fetchNextStep = async (history: { role: string; content: string }[], regionName: string) => {
        setIsFetchingNext(true);
        try {
            const reachedLimit = history.length >= (MAX_QUESTIONS * 2);

            const res = await fetch('/api/triage/dynamic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region: regionName, history, forceAssessment: reachedLimit }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            if (data.isComplete || reachedLimit) {

                setResult({
                    id: data.triageId,
                    urgencyLevel: data.urgencyLevel || 'Routine',
                    recommendedAction: data.assessment || { summary: 'Assessment interrupted or failed to generate JSON.', diseases: [], disclaimer: 'Please consult a healthcare professional for a formal evaluation.' }
                });
                setStep('result');
            } else {

                setCurrentDynamicQuestion({
                    id: `dq-${history.length}`,
                    text: data.question || 'Please provide more details about your symptoms.',
                    type: data.questionType as 'yesno' | 'scale' | 'duration' || 'yesno',

                    scaleLabels: data.questionType === 'scale' ? ['None', 'Severe'] : undefined
                });
                setStep('questions');
                setQuestionIndex(Math.floor(history.length / 2));
            }
        } catch (err) {
            console.error('Dynamic fetch error:', err);
            setResult({ urgencyLevel: 'Error', recommendedAction: 'Server error retrieving questions. Please try again or consult a doctor.' });
            setStep('result');
        } finally {
            setIsFetchingNext(false);
        }
    };

    const handleRegionSelect = async (region: BodyRegion) => {
        if (!isOnline) {
            haptic.warning();
            setStep('loading');
            await addOfflineTriageLog({ symptoms: [`Region: ${region.label}`], rawInput: `Region: ${region.label}` });
            setResult({ urgencyLevel: 'Pending Sync', recommendedAction: 'Offline. Dynamic questionnaire requires internet. Your selection was saved and will sync later.', isOfflineSaved: true });
            setStep('result');
            return;
        }

        haptic.selection();
        setSelectedRegion(region);
        setAnswers([]);
        setStep('loading');


        await fetchNextStep([], region.label);
    };

    const handleAnswerNext = async () => {
        if (currentAnswer === null || !currentDynamicQuestion || !selectedRegion) return;


        const newAnswer: Answer = {
            questionId: currentDynamicQuestion.id,
            questionText: currentDynamicQuestion.text,
            value: currentAnswer
        };
        const newAnswersList = [...answers, newAnswer];
        setAnswers(newAnswersList);



        const history: { role: string; content: string }[] = [];
        for (const a of newAnswersList) {
            history.push({ role: 'assistant', content: a.questionText });
            history.push({ role: 'user', content: String(a.value) });
        }

        setStep('loading');
        await fetchNextStep(history, selectedRegion.label);
    };

    const handleBack = () => {
        haptic.light();
        if (answers.length > 0) {
            const prevAnswers = answers.slice(0, -1);
            setAnswers(prevAnswers);
            setQuestionIndex(questionIndex - 1);


            const history: { role: string; content: string }[] = [];
            for (const a of prevAnswers) {
                history.push({ role: 'assistant', content: a.questionText });
                history.push({ role: 'user', content: String(a.value) });
            }
            setStep('loading');
            fetchNextStep(history, selectedRegion!.label);

        } else {
            setStep('region');
        }
    };

    const reset = () => {
        setStep('region');
        setSelectedRegion(null);
        setQuestionIndex(0);
        setAnswers([]);
        setCurrentAnswer(null);
        setCurrentDynamicQuestion(null);
        setResult(null);
    };


    if (step === 'region') {
        return (
            <div className="w-full max-w-5xl mx-auto">
                <div className="bg-white border-2 border-black brutal-shadow p-6 sm:p-10">
                    <div className="mb-8">
                        <div className="w-full h-1.5 bg-zinc-100 border border-zinc-200">
                            <div className="h-full bg-black" style={{ width: '2%' }} />
                        </div>
                        <p className="font-mono-ui text-[10px] text-zinc-400 tracking-widest uppercase mt-2">Step 1 — Select affected area</p>
                    </div>

                    {!isOnline && (
                        <div className="mb-5 bg-amber-50 border-2 border-amber-200 p-3 flex items-center gap-2 text-xs font-semibold text-amber-800">
                            <WifiSlash size={14} weight="bold" /> Offline — data will sync when connected.
                        </div>
                    )}

                    <h2 className="text-2xl font-extrabold text-zinc-900 mb-1">Where is your discomfort?</h2>
                    <p className="text-sm text-zinc-500 mb-7">Select the area closest to your primary symptom.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {BODY_REGIONS.map(region => (
                            <motion.button
                                key={region.id}
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRegionSelect(region)}
                                className="group relative border-2 border-zinc-200 p-5 text-left hover:border-black transition-all duration-150 bg-white hover:bg-zinc-50 hover:shadow-md"
                            >
                                <div className="w-11 h-11 flex items-center justify-center text-2xl mb-3 border-2 rounded-sm"
                                    style={{ backgroundColor: region.color + '18', borderColor: region.color + '50' }}>
                                    {region.emoji}
                                </div>
                                <p className="text-sm font-bold text-zinc-800 leading-tight">{region.label}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{region.followUpQuestions.length} questions</p>
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: region.color }} />
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }


    if (step === 'questions' && currentDynamicQuestion) {
        const q = currentDynamicQuestion;
        return (
            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-white border-2 border-black brutal-shadow p-6 sm:p-10">
                    <ProgressBar current={currentStep} total={totalSteps} />

                    <div className="flex items-center gap-2 mb-8">
                        <div className="px-3 py-1 border text-xs font-bold tracking-wider uppercase flex items-center gap-1.5"
                            style={{ color: selectedRegion!.color, borderColor: selectedRegion!.color, backgroundColor: selectedRegion!.color + '12' }}>
                            <span>{selectedRegion!.emoji}</span> {selectedRegion!.label}
                        </div>
                        <span className="text-xs text-zinc-400 font-mono-ui">Q{questionIndex + 1}/{totalSteps}</span>
                    </div>

                    <div className="min-h-[220px]">
                        {q.type === 'yesno' && <YesNoCard question={q} value={currentAnswer as string | null} onChange={v => setCurrentAnswer(v)} />}
                        {q.type === 'scale' && <ScaleCard question={q} value={currentAnswer as number | null} onChange={v => setCurrentAnswer(v)} />}
                        {q.type === 'duration' && <DurationCard question={q} value={currentAnswer as string | null} onChange={v => setCurrentAnswer(v)} />}
                    </div>

                    <div className="flex gap-3 mt-10">
                        <motion.button
                            type="button"
                            whileHover={{ backgroundColor: '#f9fafb' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBack}
                            disabled={isFetchingNext}
                            className="flex items-center gap-2 px-5 py-3.5 border-2 border-black text-sm font-bold hover:bg-zinc-50 transition-colors disabled:opacity-50"
                        >
                            <ArrowLeft size={14} weight="bold" /> Back
                        </motion.button>
                        <motion.button
                            type="button"
                            whileHover={{ backgroundColor: '#18181b' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAnswerNext}
                            disabled={currentAnswer === null || isFetchingNext}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-black text-white text-sm font-bold border-2 border-black hover:bg-zinc-800 disabled:bg-zinc-200 disabled:border-zinc-200 disabled:text-zinc-400 transition-colors"
                        >
                            {isFetchingNext ? (
                                <><SpinnerGap size={14} weight="bold" className="animate-spin" /> Evaluating...</>
                            ) : (
                                <>Next <ArrowRight size={14} weight="bold" /></>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>
        );
    }


    if (step === 'loading') {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <div className="bg-white border-2 border-black brutal-shadow p-12 text-center">
                    <SpinnerGap size={44} weight="bold" className="animate-spin mx-auto mb-5 text-zinc-300" />
                    <h3 className="font-extrabold text-xl mb-2">Analyzing your symptoms…</h3>
                    <p className="text-sm text-zinc-500">Searching across 773 disease profiles in our RAG database.</p>
                    <div className="mt-6 h-1 w-48 mx-auto bg-zinc-100 overflow-hidden">
                        <div className="h-full bg-black animate-pulse" style={{ width: '60%' }} />
                    </div>
                </div>
            </div>
        );
    }


    if (step === 'result' && result) {
        return <RichResultView result={result} answers={answers} region={selectedRegion!} onReset={reset} />;
    }

    return null;
}

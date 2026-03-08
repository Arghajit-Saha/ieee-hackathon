'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Video, Mic, MicOff, VideoOff, MessageSquare, PhoneOff, Wifi, Loader2 } from 'lucide-react';

interface TeleconsultationProps {
    roomId: string;
    userId: string;
    isDoctor: boolean;
}

export default function TeleconsultationRoom({ roomId, userId, isDoctor }: TeleconsultationProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    
    const [peers, setPeers] = useState<any>({});

    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [mode, setMode] = useState<'video' | 'audio-only' | 'text-only'>('video');
    const [networkQuality, setNetworkQuality] = useState<'good' | 'poor' | 'bad'>('good');

    const myVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        
        const s = io('http://localhost:3001'); 
        setSocket(s);

        s.emit('join-room', roomId, userId);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = currentStream;
                }

                s.on('user-connected', (newUserId) => {
                    connectToNewUser(newUserId, currentStream, s);
                });

                
                s.on('webrtc-signal', (data) => {
                    
                    console.log("Received signal from", data.from);
                });

            })
            .catch(err => {
                console.error("Failed to get media devices. Degrading to text-only mode.", err);
                setMode('text-only');
                s.emit('bandwidth-degrade', { roomId, userId, type: 'text-only' });
            });

        s.on('peer-degraded', (data) => {
            console.log(`Peer ${data.userId} degraded to ${data.type}`);
            if (data.type === 'audio-only') {
                
            }
        });

        
        const interval = setInterval(() => {
            if (!navigator.onLine) {
                setNetworkQuality('bad');
                degradeConnection('text-only', s);
            } else {
                
                const mockPing = Math.random() * 500;
                if (mockPing > 400 && mode === 'video') {
                    setNetworkQuality('poor');
                    degradeConnection('audio-only', s);
                } else if (mockPing < 100 && mode !== 'video') {
                    setNetworkQuality('good');
                }
            }
        }, 5000);

        return () => {
            s.disconnect();
            clearInterval(interval);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        
    }, [roomId, userId]);

    function connectToNewUser(userId: string, _stream: MediaStream, _s: Socket) {
        console.log(`Connecting to ${userId} via WebRTC Placeholder...`);
        
    }

    function degradeConnection(newMode: 'audio-only' | 'text-only', s: Socket | null) {
        setMode(newMode);
        if (newMode === 'audio-only' || newMode === 'text-only') {
            toggleVideo(false);
        }
        if (newMode === 'text-only') {
            toggleAudio(false);
        }
        if (s) {
            s.emit('bandwidth-degrade', { roomId, userId, type: newMode });
        }
    }

    function toggleVideo(forceState?: boolean) {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = forceState !== undefined ? forceState : !videoTrack.enabled;
                setIsVideoOn(videoTrack.enabled);
            }
        }
    }

    function toggleAudio(forceState?: boolean) {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = forceState !== undefined ? forceState : !audioTrack.enabled;
                setIsAudioOn(audioTrack.enabled);
            }
        }
    }

    return (
        <div className="flex flex-col h-[80vh] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative">

            
            <div className={`absolute top-0 w-full p-2 text-center text-xs font-semibold z-10 text-white ${networkQuality === 'good' ? 'bg-green-600/80' : networkQuality === 'poor' ? 'bg-orange-600/80' : 'bg-red-600/80'}`}>
                <div className="flex justify-center items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    {networkQuality === 'good' ? 'Connection Stable' : networkQuality === 'poor' ? 'Weak Connection - Switched to Audio' : 'No Connection - Offline Text Mode'}
                </div>
            </div>

            <div className="flex-1 relative flex bg-black">
                
                {mode !== 'text-only' ? (
                    <div className="w-full h-full flex items-center justify-center">
                        {remoteStream ? (
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin mb-2 text-gray-500" />
                                <p>Waiting for Doctor...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white p-8 text-center">
                        <p>Experiencing severe network issues. Video and audio are disabled. Please use the text chat below.</p>
                    </div>
                )}

                
                {mode === 'video' && (
                    <div className="absolute bottom-24 right-6 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2 border-gray-700">
                        <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                )}
            </div>

            
            <div className="bg-gray-900 p-6 flex justify-center items-center gap-6 pb-8">
                <button
                    onClick={() => toggleAudio()}
                    disabled={mode === 'text-only'}
                    className={`p-4 rounded-full transition-all ${isAudioOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} disabled:opacity-50`}
                >
                    {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>

                <button
                    onClick={() => toggleVideo()}
                    disabled={mode !== 'video'}
                    className={`p-4 rounded-full transition-all ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} disabled:opacity-50`}
                >
                    {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>

                <button className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all transform hover:scale-105">
                    <PhoneOff className="w-6 h-6" />
                </button>
            </div>

        </div>
    );
}


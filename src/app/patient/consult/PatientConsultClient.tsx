'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { VideoCamera, Microphone, MicrophoneSlash, PhoneX, ChatCircle, PaperPlaneRight } from '@phosphor-icons/react';
import haptic from '@/lib/haptics';

export default function PatientConsultClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('room');

    const [hasJoined, setHasJoined] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [userId] = useState(`patient-${Math.floor(Math.random() * 10000)}`);
    const [messages, setMessages] = useState<{ senderId: string, message: string }[]>([]);
    const [messageInput, setMessageInput] = useState('');

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (roomId) return;
        fetch('/api/teleconsultation', { method: 'POST' })
            .then(res => {
                if (!res.ok) {
                    const fallbackId = `anon-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                    router.replace(`/patient/consult?room=${fallbackId}`);
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data?.roomId) {
                    router.replace(`/patient/consult?room=${data.roomId}`);
                }
            })
            .catch(() => {
                const fallbackId = `anon-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                router.replace(`/patient/consult?room=${fallbackId}`);
            });
    }, [roomId, router]);

    useEffect(() => {
        if (!roomId || !hasJoined) return;

        const SOCKET_URL = `http://${window.location.hostname}:3001`;
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        const initWebRTC = async () => {
            let stream: MediaStream | undefined;

            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });

                    localStreamRef.current = stream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } else {
                    console.error("navigator.mediaDevices.getUserMedia is not supported on this browser.");
                    alert("Camera access is not supported by your browser or device.");
                }
            } catch (err: any) {
                console.error("Detailed Media access error:", err);
                if (err.name === 'NotAllowedError') {
                    alert("Camera access was denied. Please allow camera permissions in your browser settings to join the call.");
                } else if (err.name === 'NotFoundError') {
                    alert("No camera or microphone found on your device.");
                } else {
                    alert("Failed to access camera: " + err.message);
                }
            }


            newSocket.on('user-connected', async (connectedUserId) => {
                const peer = createPeerConnection(newSocket, connectedUserId);
                if (stream) {
                    stream.getTracks().forEach(track => {
                        const alreadyAdded = peer?.getSenders().some(s => s.track === track);
                        if (!alreadyAdded) peer?.addTrack(track, stream!);
                    });
                }

                const offer = await peer?.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                if (offer) await peer?.setLocalDescription(offer);
                newSocket.emit('webrtc-signal', { to: connectedUserId, from: userId, signal: offer });
            });

            newSocket.on('webrtc-signal', async (data) => {
                const { from, signal } = data;
                let peer = peerConnectionRef.current;

                if (!peer) {
                    peer = createPeerConnection(newSocket, from);
                }
                if (stream) {
                    stream.getTracks().forEach(track => {
                        const alreadyAdded = peer?.getSenders().some(s => s.track === track);
                        if (!alreadyAdded) peer?.addTrack(track, stream!);
                    });
                }

                try {
                    if (signal.type === 'offer') {
                        await peer?.setRemoteDescription(new RTCSessionDescription(signal));
                        const answer = await peer?.createAnswer();
                        if (answer) await peer?.setLocalDescription(answer);
                        newSocket.emit('webrtc-signal', { to: from, from: userId, signal: answer });
                    } else if (signal.type === 'answer') {
                        await peer?.setRemoteDescription(new RTCSessionDescription(signal));
                    } else if (signal.candidate) {
                        await peer?.addIceCandidate(new RTCIceCandidate(signal));
                    }
                } catch (e) {
                    console.error("WebRTC Signal Error:", e);
                }
            });

            newSocket.on('receive-message', (data) => {
                setMessages(prev => [...prev, data]);
            });

            newSocket.on('end-call', () => {
                alert("The doctor has ended the call.");
                window.location.href = '/';
            });


            if (newSocket.connected) {
                newSocket.emit('join-room', roomId, userId);
            } else {
                newSocket.on('connect', () => {
                    newSocket.emit('join-room', roomId, userId);
                });
            }
        };


        initWebRTC();

        return () => {
            newSocket.disconnect();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, [roomId, userId, hasJoined]);

    const createPeerConnection = (socketInstance: Socket, targetUser: string) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ]
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketInstance.emit('webrtc-signal', { to: targetUser, from: userId, signal: event.candidate });
            }
        };

        peer.onnegotiationneeded = async () => {
            try {
                const offer = await peer.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await peer.setLocalDescription(offer);
                socketInstance.emit('webrtc-signal', { to: targetUser, from: userId, signal: peer.localDescription });
            } catch (err) {
                console.error("Negotiation error:", err);
            }
        };

        peer.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
                remoteVideoRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
            }
        };

        peerConnectionRef.current = peer;
        return peer;
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const handleEndCall = async () => {
        haptic.heavy();

        // Mark as completed in DB
        if (roomId && !roomId.startsWith('anon')) {
            try {
                await fetch('/api/teleconsultation', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: roomId, status: 'completed' }),
                });
            } catch (e) {
                console.error("Failed to mark consult as completed:", e);
            }
        }

        if (socket) {
            socket.emit('end-call', { roomId });
            socket.disconnect();
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        window.location.href = '/';
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim() && socket) {
            socket.emit('send-message', { roomId, message: messageInput, senderId: userId });
            setMessages(prev => [...prev, { senderId: userId, message: messageInput }]);
            setMessageInput('');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
            <div className="lg:col-span-2 bg-black border-2 border-black flex flex-col brutal-shadow overflow-hidden relative">
                <div className="flex-1 relative bg-zinc-900 border-b-2 border-black flex items-center justify-center">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    {!remoteVideoRef.current?.srcObject && (
                        <p className="absolute uppercase font-bold text-zinc-600 font-mono-ui tracking-widest text-xs">Waiting for doctor...</p>
                    )}

                    <div className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video bg-black border-2 border-zinc-500 brutal-shadow overflow-hidden">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                                <VideoCamera size={20} className="text-zinc-500 line-through" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-20 bg-white flex items-center justify-center gap-6">
                    <button
                        onClick={toggleMute}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-black transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white hover:bg-zinc-100 text-zinc-800'}`}
                    >
                        {isMuted ? <MicrophoneSlash size={24} weight="fill" /> : <Microphone size={24} weight="fill" />}
                    </button>
                    <button
                        onClick={handleEndCall}
                        className="w-16 h-12 rounded-full flex items-center justify-center border-2 border-black bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                        <PhoneX size={24} weight="fill" />
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-black transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white hover:bg-zinc-100 text-zinc-800'}`}
                    >
                        <VideoCamera size={24} weight="fill" className={isVideoOff ? 'opacity-50' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-white border-2 border-black brutal-shadow flex flex-col h-full">
                <div className="p-4 border-b-2 border-black flex items-center gap-2 bg-zinc-50">
                    <ChatCircle size={18} weight="bold" />
                    <h2 className="font-bold text-sm tracking-wider uppercase">Messages</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <p className="text-xs text-center text-zinc-400 font-mono-ui mt-10">No messages yet.</p>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.senderId === userId ? 'items-end' : 'items-start'} max-w-full`}>
                                <span className="text-[9px] uppercase font-mono-ui text-zinc-400 mb-1">{msg.senderId === userId ? 'You' : 'Doctor'}</span>
                                <div className={`p-3 text-sm border-2 border-black break-words whitespace-pre-wrap ${msg.senderId === userId ? 'bg-black text-white' : 'bg-zinc-100 text-black'}`}>
                                    {msg.message}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={sendMessage} className="p-3 border-t-2 border-black bg-zinc-50 flex gap-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border-2 border-black text-sm outline-none focus:bg-white"
                    />
                    <button type="submit" className="px-4 bg-black text-white border-2 border-black hover:bg-zinc-800 transition-colors">
                        <PaperPlaneRight size={18} weight="bold" />
                    </button>
                </form>
            </div>

            {/* Join Overlay */}
            {!hasJoined && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white border-4 border-black p-8 md:p-12 brutal-shadow max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-zinc-100 border-2 border-black flex items-center justify-center mx-auto mb-6">
                            <VideoCamera size={40} weight="bold" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-4 uppercase">Direct Consultation</h2>
                        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                            A doctor is ready to assist you. Please click the button below to grant camera access and enter the consultation room.
                        </p>
                        <button
                            onClick={() => setHasJoined(true)}
                            className="w-full bg-black text-white py-5 px-8 font-bold text-lg border-2 border-black brutal-shadow brutal-shadow-hover transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                            JOIN CONSULTATION
                        </button>
                        <p className="mt-6 text-[10px] font-mono-ui text-zinc-400 tracking-widest uppercase">
                            Secure • Verified • encrypted
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

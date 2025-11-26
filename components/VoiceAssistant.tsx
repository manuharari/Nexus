
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { processVoiceCommand } from '../services/geminiService';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

const VoiceAssistant: React.FC = () => {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [show, setShow] = useState(false);

  // Simple Speech Recognition implementation using Web API
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Browser does not support speech recognition.");
        return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        setListening(true);
        setTranscript('');
        setResponse('');
        setShow(true);
    };

    recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleCommand(text);
    };

    recognition.onend = () => {
        setListening(false);
    };

    recognition.start();
  };

  const handleCommand = async (text: string) => {
      setProcessing(true);
      const reply = await processVoiceCommand(text);
      setResponse(reply);
      setProcessing(false);
      
      // Text to Speech
      const utterance = new SpeechSynthesisUtterance(reply);
      window.speechSynthesis.speak(utterance);
  };

  return (
    <>
        {/* Floating Trigger Button */}
        <button 
            onClick={startListening}
            className="fixed bottom-24 right-6 z-40 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
            <Mic className="w-6 h-6 text-white" />
        </button>

        {/* Interaction Panel */}
        {show && (
            <div className="fixed bottom-40 right-6 z-50 w-80 bg-slate-900/90 backdrop-blur-md border border-indigo-500/50 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Nexus Voice</span>
                    <button onClick={() => setShow(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                
                {listening ? (
                    <div className="flex items-center gap-3 text-white animate-pulse">
                        <div className="w-3 h-3 bg-rose-500 rounded-full" />
                        Listening...
                    </div>
                ) : transcript ? (
                    <div className="mb-3">
                        <p className="text-sm text-slate-400 italic">"{transcript}"</p>
                    </div>
                ) : null}

                {processing && (
                    <div className="flex items-center gap-2 text-indigo-300 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </div>
                )}

                {response && (
                    <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-lg">
                        <p className="text-sm text-white">{response}</p>
                    </div>
                )}
            </div>
        )}
    </>
  );
};

export default VoiceAssistant;

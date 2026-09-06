import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { Home } from './pages/Home.js';
import { OnlineGame } from './pages/OnlineGame.js';
import { PassAndPlay } from './pages/PassAndPlay.js';
import { RulesModal } from './components/RulesModal.js';
import { Header } from './components/Header.js';

export function App() {
  const [view, setView] = useState<'home' | 'online' | 'pass_and_play'>('home');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [urlRoomCode, setUrlRoomCode] = useState('');

  const socketHook = useSocket();

  // Check URL parameters on mount: ?room=WORD-XXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setUrlRoomCode(roomParam.toUpperCase());
    }
  }, []);

  const handleCreateRoom = async (name: string, avatar: string, color: string) => {
    try {
      await socketHook.createRoom(name, avatar, color);
      setView('online');
    } catch {
      // Error handled by socket hook
    }
  };

  const handleJoinRoom = async (code: string, name: string, avatar: string, color: string) => {
    try {
      await socketHook.joinRoom(code, name, avatar, color);
      setView('online');
    } catch {
      // Error handled by socket hook
    }
  };

  const handleLeaveOnline = () => {
    socketHook.leaveRoom();
    setView('home');
    // Clear query param
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="min-h-screen flex flex-col bg-beige text-darkgreen font-sans selection:bg-midnight selection:text-beige relative overflow-x-hidden">
      {/* Subtle editorial watermark / fine background motif */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#0A3323_1px,transparent_1px)] [background-size:24px_24px] z-0" />

      <div className="relative z-10 flex-1 flex flex-col">
        {view === 'home' && (
          <>
            <Header
              isConnected={socketHook.isConnected}
              onOpenRules={() => setIsRulesOpen(true)}
            />
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
              <Home
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                onStartPassAndPlay={() => setView('pass_and_play')}
                onOpenRules={() => setIsRulesOpen(true)}
                initialRoomCode={urlRoomCode}
              />
            </main>
          </>
        )}

        {view === 'online' && (
          <OnlineGame
            socketHook={socketHook}
            onLeave={handleLeaveOnline}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        )}

        {view === 'pass_and_play' && (
          <PassAndPlay
            onBackToHome={() => setView('home')}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        )}
      </div>

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}

export default App;

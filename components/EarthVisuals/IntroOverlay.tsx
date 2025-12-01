// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

interface IntroOverlayProps {
  onComplete: () => void;
}

// Utility for the scramble text effect
const useScrambleText = (targetText: string, speed: number = 30) => {
  const [display, setDisplay] = useState(targetText);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';

  useEffect(() => {
    let iteration = 0;
    let interval: any = null;

    iteration = 0;

    interval = setInterval(() => {
      setDisplay(prev => 
        targetText
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return targetText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= targetText.length) {
        clearInterval(interval);
        setDisplay(targetText); 
      }

      iteration += 1 / 2;
    }, speed);

    return () => clearInterval(interval);
  }, [targetText]);

  return display;
};

// Component for the Scramble Text
const ScrambleText: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
    const scrambled = useScrambleText(text, 40);
    return <span className={className}>{scrambled}</span>;
};

export default function IntroOverlay({ onComplete }: IntroOverlayProps) {
    const [progress, setProgress] = useState(0);
    const [showComplete, setShowComplete] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    // UI Refs & State
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isClicking, setIsClicking] = useState(false);

    // Messages tailored to "Orbital/Satellite" theme
    const messages = [
        { threshold: 0, text: 'INITIALIZING UPLINK...' },
        { threshold: 15, text: 'CALIBRATING VISUAL SENSORS...' },
        { threshold: 35, text: 'RETRIEVING PROFILE DATA...' },
        { threshold: 55, text: 'SYNCHRONIZING ORBITAL PARAMETERS...' },
        { threshold: 75, text: 'RENDERING ATMOSPHERIC LAYERS...' },
        { threshold: 90, text: 'ESTABLISHING NEURAL HANDSHAKE...' },
        { threshold: 100, text: 'SYSTEM ONLINE. READY.' }
    ];

    useEffect(() => {
        setIsMounted(true);
        
        // Progress simulation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setShowComplete(true);
                    return 100;
                }
                const jump = Math.random() > 0.8 ? 2 : 0.5;
                return Math.min(prev + jump, 100);
            });
        }, 30);

        // Autoplay Audio
        setTimeout(() => {
             const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
             if (audio && audio.paused) {
                 audio.volume = 0.4;
                 audio.play().catch(() => console.log('Autoplay blocked'));
             }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Custom Cursor Logic
    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }
        };
        const handleDown = () => setIsClicking(true);
        const handleUp = () => setIsClicking(false);

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mouseup', handleUp);
        };
    }, []);

    const enterPortfolio = () => {
        const container = document.getElementById('hud-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'scale(1.1)';
            container.style.filter = 'blur(20px)';
        }
        
        // Audio fade out
        const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
        if(audio) {
            let vol = audio.volume;
            const fade = setInterval(() => {
                if(vol > 0.05) {
                    vol -= 0.05;
                    audio.volume = vol;
                } else {
                    clearInterval(fade);
                    audio.pause();
                }
            }, 100);
        }

        setTimeout(onComplete, 800);
    };

    const toggleMute = () => {
        const audio = document.getElementById('backgroundMusic') as HTMLAudioElement;
        if (audio) {
            audio.muted = !audio.muted;
            setIsMuted(audio.muted);
        }
    };

    const currentMessage = messages.slice().reverse().find(m => progress >= m.threshold)?.text || messages[0].text;

    if (!isMounted) return null;

    return (
        <div className="intro-overlay-wrapper">
            <style>{`
                /* Import Font directly here for portability */
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600&display=swap');

                .intro-overlay-wrapper {
                    font-family: 'Space Grotesk', sans-serif;
                    width: 100%;
                    height: 100%;
                    position: relative;
                    color: white;
                    overflow: hidden;
                    pointer-events: none; /* Let clicks pass to Earth */
                    user-select: none;
                }

                #hud-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .name-container {
                    position: relative;
                    margin-bottom: 0.5rem;
                    z-index: 10;
                }

                .name-title {
                    font-size: clamp(2.5rem, 6vw, 5rem);
                    font-weight: 600;
                    letter-spacing: -0.02em;
                    line-height: 1;
                    background: linear-gradient(180deg, #ffffff 0%, #94a3b8 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    /* Cinematic reveal animation */
                    animation: cinematicFadeIn 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                    transform: translateY(20px);
                }

                .role-subtitle {
                    font-family: 'Inter', sans-serif;
                    font-size: clamp(0.8rem, 1.5vw, 1rem);
                    letter-spacing: 0.4em;
                    text-transform: uppercase;
                    color: #0ea5e9;
                    margin-top: 1rem;
                    text-align: center;
                    opacity: 0;
                    animation: trackingExpand 2s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
                }

                @keyframes cinematicFadeIn {
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes trackingExpand {
                    from { opacity: 0; letter-spacing: 0em; }
                    to { opacity: 0.8; letter-spacing: 0.4em; }
                }

                .hud-section {
                    margin-top: 3rem;
                    width: 100%;
                    max-width: 400px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    transition: opacity 0.8s ease;
                }
                
                .fade-out {
                    opacity: 0;
                    pointer-events: none;
                }

                .progress-msg-container {
                    height: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .progress-msg {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    letter-spacing: 0.1em;
                }

                .progress-bar-track {
                    width: 100%;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.1);
                    position: relative;
                    overflow: hidden;
                }

                .progress-bar-fill {
                    height: 100%;
                    background: #0ea5e9;
                    box-shadow: 0 0 10px #0ea5e9;
                    transition: width 0.1s linear;
                }

                .progress-stats {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.7rem;
                    color: rgba(14, 165, 233, 0.8);
                }

                .enter-btn-wrapper {
                    margin-top: 2rem;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.5s ease;
                    pointer-events: auto;
                }

                .enter-btn-wrapper.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .enter-btn {
                    background: rgba(14, 165, 233, 0.1);
                    border: 1px solid rgba(14, 165, 233, 0.3);
                    color: #0ea5e9;
                    padding: 0.8rem 2.5rem;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.9rem;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    cursor: pointer;
                    backdrop-filter: blur(5px);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .enter-btn:hover {
                    background: rgba(14, 165, 233, 0.2);
                    border-color: #0ea5e9;
                    box-shadow: 0 0 20px rgba(14, 165, 233, 0.2);
                    letter-spacing: 0.3em;
                }
                
                .enter-btn::before {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 100%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s ease;
                }
                
                .enter-btn:hover::before {
                    left: 100%;
                }

                .custom-cursor {
                    position: fixed;
                    top: 0; left: 0;
                    width: 20px; height: 20px;
                    pointer-events: none;
                    z-index: 9999;
                    mix-blend-mode: difference;
                }
                
                .cursor-dot {
                    width: 4px; height: 4px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                }
                
                .cursor-ring {
                    width: 100%; height: 100%;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    transition: all 0.15s ease;
                }
                
                .clicking .cursor-ring {
                    transform: scale(0.5);
                    border-color: #0ea5e9;
                }

                .audio-fab {
                    position: fixed;
                    bottom: 2rem; right: 2rem;
                    width: 3rem; height: 3rem;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.3);
                    color: rgba(255, 255, 255, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    pointer-events: auto;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(4px);
                    z-index: 50;
                }
                
                .audio-fab:hover {
                    background: rgba(14, 165, 233, 0.2);
                    color: #0ea5e9;
                    border-color: #0ea5e9;
                }

                @media (max-width: 768px) {
                    .name-title { font-size: 2.5rem; }
                    .role-subtitle { font-size: 0.7rem; letter-spacing: 0.2em; }
                    .hud-section { padding: 0 2rem; }
                }
            `}</style>

            <audio id="backgroundMusic" loop>
                <source src="/electronic-game2-332868.mp3" type="audio/mpeg" />
            </audio>
            
            <button className="audio-fab" onClick={toggleMute}>
                {isMuted ? '✕' : '♪'}
            </button>

            <div id="hud-container">
                <div className={`name-container ${showComplete ? 'fade-out' : ''}`}>
                    <h1 className="name-title">Laurence De Guzman</h1>
                    <div className="role-subtitle">FULL STACK DEVELOPER</div>
                </div>

                <div className={`hud-section ${showComplete ? 'fade-out' : ''}`}>
                    <div className="progress-msg-container">
                        <span className="progress-msg">
                            <span style={{ color: '#0ea5e9', marginRight: '8px' }}>{'>'}</span>
                            <ScrambleText text={currentMessage} />
                        </span>
                    </div>

                    <div className="progress-bar-track">
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="progress-stats">
                        <span>SYS.VER.2.4</span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                </div>

                <div className={`enter-btn-wrapper ${showComplete ? 'show' : ''}`}>
                    <button className="enter-btn" onClick={enterPortfolio}>
                        Initialize Interface
                    </button>
                </div>
            </div>

            <div className={`custom-cursor ${isClicking ? 'clicking' : ''}`} ref={cursorRef}>
                <div className="cursor-dot"></div>
                <div className="cursor-ring"></div>
            </div>
        </div>
    );
}
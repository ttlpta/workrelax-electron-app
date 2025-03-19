import React, { useState, useEffect, useRef } from 'react';
import './Timer.css';

declare global {
  interface Window {
    api: {
      send: (channel: string, data?: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    }
  }
}

type TimerMode = 'work' | 'relax';

const Timer: React.FC = () => {
  // Work time state
  const [workMinutes, setWorkMinutes] = useState<number>(25);
  const [workSeconds, setWorkSeconds] = useState<number>(0);
  const [workMinutesInput, setWorkMinutesInput] = useState<string>('25');
  const [workSecondsInput, setWorkSecondsInput] = useState<string>('0');
  
  // Relax time state
  const [relaxMinutes, setRelaxMinutes] = useState<number>(5);
  const [relaxSeconds, setRelaxSeconds] = useState<number>(0);
  const [relaxMinutesInput, setRelaxMinutesInput] = useState<string>('5');
  const [relaxSecondsInput, setRelaxSecondsInput] = useState<string>('0');
  
  // Current timer state
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(workMinutes * 60 + workSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [alertShowing, setAlertShowing] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timeLeft when active time settings change or mode changes
  useEffect(() => {
    if (mode === 'work') {
      setTimeLeft(workMinutes * 60 + workSeconds);
    } else {
      setTimeLeft(relaxMinutes * 60 + relaxSeconds);
    }
  }, [workMinutes, workSeconds, relaxMinutes, relaxSeconds, mode]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    // Show alert
    setAlertShowing(true);
    
    // Play sound
    if (audioRef.current) {
      audioRef.current.play();
    }
    
    // Focus app window
    try {
      if (window.api && typeof window.api.send === 'function') {
        window.api.send('focus-window');
      } else {
        // Fallback for browser environment
        let originalTitle = document.title;
        const titleInterval = setInterval(() => {
          document.title = document.title === originalTitle 
            ? `⏰ ${mode === 'work' ? "Work Time's Up!" : "Break Time's Up!"} ⏰` 
            : originalTitle;
        }, 1000);
        
        setTimeout(() => clearInterval(titleInterval), 10000);
        
        window.focus();
        
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(
            mode === 'work' ? 'Work Time Complete' : 'Break Time Complete', {
            body: mode === 'work' ? 'Time to take a break!' : 'Time to get back to work!',
            icon: '/favicon.ico'
          });
          
          notification.onclick = () => {
            window.focus();
          };
        }
      }
    } catch (error) {
      console.error("Failed to focus window:", error);
    }
  };

  const handleDismissAlert = () => {
    setAlertShowing(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const switchToRelaxMode = () => {
    setMode('relax');
    setTimeLeft(relaxMinutes * 60 + relaxSeconds);
    setAlertShowing(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRunning(true); // Auto-start the relax timer
  };

  const switchToWorkMode = () => {
    setMode('work');
    setTimeLeft(workMinutes * 60 + workSeconds);
    setAlertShowing(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRunning(true); // Auto-start the work timer
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleRestart = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setTimeLeft(workMinutes * 60 + workSeconds);
    } else {
      setTimeLeft(relaxMinutes * 60 + relaxSeconds);
    }
    setAlertShowing(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    switch (id) {
      case "work-minutes":
        setWorkMinutesInput(value);
        const parsedWorkMin = parseFloat(value);
        if (!isNaN(parsedWorkMin) && parsedWorkMin >= 0) {
          setWorkMinutes(parsedWorkMin);
        }
        break;
      
      case "work-seconds":
        setWorkSecondsInput(value);
        const parsedWorkSec = parseInt(value);
        if (!isNaN(parsedWorkSec) && parsedWorkSec >= 0 && parsedWorkSec < 60) {
          setWorkSeconds(parsedWorkSec);
        }
        break;
      
      case "relax-minutes":
        setRelaxMinutesInput(value);
        const parsedRelaxMin = parseFloat(value);
        if (!isNaN(parsedRelaxMin) && parsedRelaxMin >= 0) {
          setRelaxMinutes(parsedRelaxMin);
        }
        break;
      
      case "relax-seconds":
        setRelaxSecondsInput(value);
        const parsedRelaxSec = parseInt(value);
        if (!isNaN(parsedRelaxSec) && parsedRelaxSec >= 0 && parsedRelaxSec < 60) {
          setRelaxSeconds(parsedRelaxSec);
        }
        break;
    }
  };

  // Format time to display
  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-container">
      <h1>{mode === 'work' ? 'Work Timer' : 'Break Timer'}</h1>
      
      <div className="display">
        <div className="time">{formatTime()}</div>
        <div className="mode-indicator">{mode === 'work' ? '💼 Working' : '☕ Relaxing'}</div>
      </div>
      
      <div className="controls">
        <div className="time-inputs">
          <div className="input-section">
            <h3>Work Time</h3>
            <div className="input-group">
              <label htmlFor="work-minutes">Minutes:</label>
              <input
                type="number"
                id="work-minutes"
                value={workMinutesInput}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                disabled={isRunning}
              />
              
              <label htmlFor="work-seconds">Seconds:</label>
              <input
                type="number"
                id="work-seconds"
                value={workSecondsInput}
                onChange={handleInputChange}
                min="0"
                max="59"
                disabled={isRunning}
              />
            </div>
          </div>
          
          <div className="input-section">
            <h3>Break Time</h3>
            <div className="input-group">
              <label htmlFor="relax-minutes">Minutes:</label>
              <input
                type="number"
                id="relax-minutes"
                value={relaxMinutesInput}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                disabled={isRunning}
              />
              
              <label htmlFor="relax-seconds">Seconds:</label>
              <input
                type="number"
                id="relax-seconds"
                value={relaxSecondsInput}
                onChange={handleInputChange}
                min="0"
                max="59"
                disabled={isRunning}
              />
            </div>
          </div>
        </div>
        
        <div className="buttons">
          <button onClick={handleStart} disabled={isRunning}>
            Start
          </button>
          <button onClick={handlePause} disabled={!isRunning}>
            Pause
          </button>
          <button onClick={handleRestart}>
            Restart
          </button>
          {!isRunning && (
            <button 
              onClick={mode === 'work' ? switchToRelaxMode : switchToWorkMode} 
              className="mode-switch-btn"
            >
              Switch to {mode === 'work' ? 'Break' : 'Work'} Mode
            </button>
          )}
        </div>
      </div>

      {/* Alert overlay */}
      {alertShowing && (
        <div className="alert-overlay">
          <div className="alert-box">
            <h2>{mode === 'work' ? 'Work Time Complete!' : 'Break Time Complete!'}</h2>
            <p>{mode === 'work' ? 'Time to take a break.' : 'Time to get back to work.'}</p>
            <div className="alert-buttons">
              <button 
                onClick={mode === 'work' ? switchToRelaxMode : switchToWorkMode} 
                className="alert-action"
              >
                {mode === 'work' ? 'Start Break' : 'Start Working'}
              </button>
              <button onClick={handleDismissAlert} className="alert-dismiss">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      <audio ref={audioRef} 
        src={`${import.meta.env.BASE_URL}alarm.mp3`} 
        preload="auto" loop
      ></audio>
    </div>
  );
};

export default Timer;

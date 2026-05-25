import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../localization';
import type { Language } from '../localization';
import { StudentCard } from '../components/StudentCard';
import { EventPopup } from '../components/EventPopup';
import { Blackboard } from '../components/Blackboard';
import { API_BASE_URL } from '../config';


interface ClassroomProps {
  sessionId: number;
  language: Language;
  onEndSession: (sessionId: number) => void;
  onExit: () => void;
}

interface Student {
  name: string;
  personality: string;
  avatar_style: string;
}

interface Message {
  id?: number;
  sender_type: 'teacher' | 'student' | 'system';
  sender_name: string;
  message_text: string;
  student_personality?: string;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  severity: string;
  instructions: string;
  affected_students: string[];
}

export const Classroom: React.FC<ClassroomProps> = ({
  sessionId,
  language,
  onEndSession,
  onExit,
}) => {
  const t = TRANSLATIONS[language];
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Classroom States
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Track emotional/focus state of each student by name
  const [studentEmotions, setStudentEmotions] = useState<Record<string, any>>({});
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [activeSpeakerText, setActiveSpeakerText] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventDetail | null>(null);
  
  // Input and API status states
  const [teacherInput, setTeacherInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [pendingStudent, setPendingStudent] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default in seconds
  const [timerActive, setTimerActive] = useState(true);

  // Speech Recognition reference
  const recognitionRef = useRef<any>(null);

  // 1. Fetch Session Info & Students list
  useEffect(() => {
    // Get students list
    fetch(`${API_BASE_URL}/api/students`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data);
        // Initialize all student emotions to normal
        const emotions: Record<string, string> = {};
        data.forEach((s: Student) => {
          emotions[s.name] = 'normal';
        });
        setStudentEmotions(emotions);
      });

    // Get specific session configuration
    fetch(`${API_BASE_URL}/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setSessionDetails(data);
        setMessages(data.messages || []);
        setTimeLeft(data.duration_minutes * 60);
      });
  }, [sessionId]);

  // 2. Ticking Countdown Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  // 3. Scroll to bottom of chat transcript
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  // 4. Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      // Select correct BLocale lang for recognition
      if (language === 'Hindi') {
        rec.lang = 'hi-IN';
      } else if (language === 'Bengali') {
        rec.lang = 'bn-IN';
      } else {
        rec.lang = 'en-US';
      }

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcriptText = event.results[0][0].transcript;
        setTeacherInput(transcriptText);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  // 5. Text-To-Speech (TTS) Voice Handler
  const speakStudentResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel previous speakings
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find matching system voices
      const voices = window.speechSynthesis.getVoices();
      let targetVoice = null;

      if (language === 'Hindi') {
        targetVoice = voices.find((v) => v.lang.startsWith('hi'));
        utterance.rate = 0.9;
      } else if (language === 'Bengali') {
        targetVoice = voices.find((v) => v.lang.startsWith('bn'));
        utterance.rate = 0.9;
      } else {
        targetVoice = voices.find((v) => v.lang.startsWith('en'));
        utterance.rate = 1.0;
      }

      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  // 6. Handle sending dialogue (turns) to backend
  const handleSendTurn = async (messageText: string, addressedStudent?: string, actionType?: string) => {
    if (!messageText.trim() && !actionType) return;
    
    setIsPending(true);
    if (addressedStudent) {
      setPendingStudent(addressedStudent);
    } else {
      setPendingStudent(null);
    }
    setTeacherInput('');
    if (isListening) {
      recognitionRef.current?.stop();
    }

    // Add local optimistic teacher message to transcripts
    const tempTeacherMsg: Message = {
      sender_type: 'teacher',
      sender_name: 'Teacher',
      message_text: messageText || `[${actionType} student ${addressedStudent}]`,
    };
    setMessages((prev) => [...prev, tempTeacherMsg]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText || `Addressing ${addressedStudent}`,
          addressed_student: addressedStudent || null,
          action: actionType || null,
        }),
      });

      if (!response.ok) throw new Error('Turn processing failed');

      const data = await response.json();

      // If a system event was triggered, append to messages
      if (data.triggered_event) {
        setMessages((prev) => [
          ...prev,
          {
            sender_type: 'system',
            sender_name: `Event: ${data.triggered_event.title}`,
            message_text: data.triggered_event.description,
          },
        ]);
        setActiveEvent(data.triggered_event);

        // Update affected students emotions based on event
        setStudentEmotions((prev) => {
          const updated = { ...prev };
          data.triggered_event.affected_students.forEach((name: string) => {
            if (data.triggered_event.id === 'attention_drop') {
              updated[name] = 'sleeping';
            } else if (data.triggered_event.id === 'confusion') {
              updated[name] = 'confused';
            } else if (data.triggered_event.id === 'whispering') {
              updated[name] = 'distracted';
            } else if (data.triggered_event.id === 'interruption') {
              updated[name] = 'talking';
            } else {
              updated[name] = 'distracted';
            }
          });
          return updated;
        });
      }

      // If action resolved an event, clear event popup
      if (!data.active_event_id) {
        setActiveEvent(null);
      }

      // Handle student reply
      if (data.student_message) {
        const reply = data.student_message;
        
        // Append student reply to transcripts
        setMessages((prev) => [
          ...prev,
          {
            sender_type: 'student',
            sender_name: reply.sender_name,
            message_text: reply.message_text,
            student_personality: reply.student_personality,
          },
        ]);

        // Update speaker state & trigger bubble text above avatar
        setActiveSpeaker(reply.sender_name);
        setActiveSpeakerText(reply.message_text);

        // Update emotions
        setStudentEmotions((prev) => {
          const updated = { ...prev };
          // The active speaker gets the custom emotion from LLM
          updated[reply.sender_name] = reply.emotion;
          
          // If action was taken, return student to normal state
          if (addressedStudent && actionType) {
            updated[addressedStudent] = 'normal';
          }
          return updated;
        });

        // Trigger TTS to voice the student response
        speakStudentResponse(reply.message_text);

        // Clear active speaker bubble text after 5 seconds
        setTimeout(() => {
          setActiveSpeakerText((prevText) => {
            if (prevText === reply.message_text) {
              setActiveSpeaker(null);
              return null;
            }
            return prevText;
          });
        }, 5000);
      }

    } catch (error) {
      console.error('Error submitting teacher input:', error);
    } finally {
      setIsPending(false);
      setPendingStudent(null);
    }
  };

  // 7. Micro-interactions: clicking button overlay on student card
  const handleStudentAction = (studentName: string, actionType: string) => {
    let actionLogText = '';
    if (actionType === 'focus') {
      actionLogText = t.refocusAction.replace('{name}', studentName);
    } else if (actionType === 're-engage') {
      actionLogText = t.wakeAction.replace('{name}', studentName);
    } else if (actionType === 'explain_basic') {
      actionLogText = t.explainAction.replace('{name}', studentName);
    } else {
      actionLogText = t.callingOn.replace('{name}', studentName);
    }

    // Trigger backend event processing
    handleSendTurn(actionLogText, studentName, actionType);
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari, or type in the input box.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Format timer text
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}${t.minutes} : ${seconds < 10 ? '0' : ''}${seconds}${t.seconds}`;
  };

  return (
    <div className={`classroom-container ${isInputFocused ? 'classroom-dimmed' : ''}`}>
      <div className="classroom-dimmed-layer" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Top Header */}
        <div className="classroom-header glass">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {t.classroomStatus}: <span className="gradient-text">{sessionDetails?.subject}</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t.topic}: <strong>{sessionDetails?.topic}</strong> | {t.classLevel}: {sessionDetails?.class_level}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Countdown Clock */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontWeight: 700,
                fontSize: '1rem',
                color: timeLeft < 60 ? 'var(--color-danger)' : 'var(--text-primary)'
              }}
            >
              ⏱️ {formatTime(timeLeft)}
            </div>

            <button 
              className="btn-secondary" 
              onClick={() => {
                setTimerActive(false);
                onExit();
              }}
              id="classroom-btn-exit"
            >
              {t.backBtn}
            </button>

            <button 
              className="btn-primary" 
              style={{ background: 'linear-gradient(135deg, var(--color-success) 0%, #059669 100%)' }}
              onClick={() => {
                setTimerActive(false);
                onEndSession(sessionId);
              }}
              id="classroom-btn-end"
            >
              {t.endBtn}
            </button>
          </div>
        </div>

        {/* Main Grid: Desks vs Chat Transcript */}
        <div className="classroom-grid-layout">
          
          {/* Left Side: Classroom seats & Events banner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
            
            {/* Active Event Banner */}
            <EventPopup event={activeEvent} />

            {/* Virtual Blackboard Illustration Board */}
            <Blackboard 
              onShare={(desc) => handleSendTurn(`[Illustrated ${desc} on Blackboard]`, undefined, 'blackboard_share')}
              subject={sessionDetails?.subject || ''}
              topic={sessionDetails?.topic || ''}
            />

             {/* Student Grid */}
            <div className="desks-grid glass">
              {students.map((s) => (
                <StudentCard
                  key={s.name}
                  student={s}
                  emotion={studentEmotions[s.name] || 'normal'}
                  isActiveSpeaker={activeSpeaker === s.name}
                  bubbleText={
                    activeSpeaker === s.name 
                      ? activeSpeakerText 
                      : (isPending && pendingStudent === s.name) 
                        ? '...' 
                        : null
                  }
                  onAction={handleStudentAction}
                />
              ))}
            </div>
          </div>

          {/* Right Side: Chat Transcript Panel */}
          <div className="chat-panel glass">
            <div className="transcript-header">
              📜 {t.recentTranscript}
            </div>
            
            <div className="transcript-body">
              {messages.map((m, idx) => {
                const isAction = m.message_text.startsWith('[') && m.message_text.endsWith(']');
                return (
                  <div 
                    key={idx} 
                    className={`chat-bubble ${m.sender_type} ${isAction ? 'action' : ''}`}
                    id={`chat-bubble-${idx}`}
                  >
                    {m.sender_type !== 'system' && !isAction && (
                      <div className="chat-name">
                        {m.sender_name} {m.student_personality ? `(${m.student_personality})` : ''}
                      </div>
                    )}
                    <div>{m.message_text}</div>
                  </div>
                );
              })}
              
              {isPending && (
                <div className="chat-bubble student" style={{ fontStyle: 'italic', opacity: 0.6 }}>
                  ✍️ Student responding...
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Dock centered at bottom center */}
      <div className="floating-action-dock">
        {/* STT Mic trigger */}
        <button 
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title={isListening ? t.micListening : t.micIdle}
          id="classroom-btn-mic"
          type="button"
        >
          🎤
        </button>

        {/* Input field */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTurn(teacherInput);
          }}
          className="text-input-container"
          style={{ flex: 1, display: 'flex', position: 'relative' }}
        >
          <input
            type="text"
            className="text-input-field"
            value={teacherInput}
            onChange={(e) => setTeacherInput(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={isListening ? t.micListening : t.typePlaceholder}
            disabled={isPending}
            id="classroom-input-text"
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={isPending || !teacherInput.trim()}
            id="classroom-btn-send"
          >
            ➔
          </button>
        </form>
      </div>
    </div>
  );
};

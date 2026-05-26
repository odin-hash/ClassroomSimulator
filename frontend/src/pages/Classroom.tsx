import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../localization';
import type { Language } from '../localization';
import { StudentCard } from '../components/StudentCard';
import { EventPopup } from '../components/EventPopup';
import { Blackboard } from '../components/Blackboard';
import { API_BASE_URL } from '../config';
import { SYLLABUS } from '../syllabus';


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
  const [viewMode, setViewMode] = useState<'gallery' | 'whiteboard'>('gallery');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState<false | 'exit' | 'end' | 'logo'>(false);

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

  // Fetch active syllabus topics
  const getSyllabusTopics = (): string[] => {
    if (!sessionDetails) return [];
    const subj = sessionDetails.subject;
    const grade = sessionDetails.class_level;
    
    // Find matching subject key case-insensitively
    const syllabusSubjects = Object.keys(SYLLABUS);
    const matchedSubjectKey = syllabusSubjects.find(
      (s) => s.toLowerCase() === (subj || '').toLowerCase()
    );
    
    if (!matchedSubjectKey) return ["General Syllabus Guideline & Classroom Micro-Teaching Guidelines"];
    
    const gradesMap = SYLLABUS[matchedSubjectKey];
    const matchedGradeKey = Object.keys(gradesMap).find(
      (g) => g.toLowerCase() === (grade || '').toLowerCase()
    );
    
    return matchedGradeKey ? gradesMap[matchedGradeKey] : ["General course milestones for " + grade];
  };

  // Format timer text
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}${t.minutes} : ${seconds < 10 ? '0' : ''}${seconds}${t.seconds}`;
  };

  return (
    <div className={`classroom-container ${isInputFocused ? 'classroom-dimmed' : ''} ${isChatOpen ? 'chat-open' : ''}`}>
      {/* Left Collapsing Navigation Rail */}
      <div className="left-nav-rail">
        <div className="nav-rail-logo" onClick={() => setShowExitWarning('logo')} style={{ cursor: 'pointer' }}>
          <span style={{ display: 'inline-flex', color: 'var(--text-primary)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-10 9h3v8h14v-8h3L12 3z"/><path d="M12 18H12.01"/></svg>
          </span>
          <span className="nav-rail-label">Future Classroom</span>
        </div>
        
        <button className="nav-rail-item active" title={t.classroomStatus} type="button">
          <span style={{ display: 'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
          </span>
          <span className="nav-rail-label">{t.classroomStatus}</span>
        </button>

        <button 
          className={`nav-rail-item ${showSyllabus ? 'active' : ''}`}
          title={`${t.topic}: ${sessionDetails?.topic || ''}`}
          onClick={() => setShowSyllabus(true)}
          type="button"
        >
          <span style={{ display: 'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
          </span>
          <span className="nav-rail-label">{sessionDetails?.subject || 'Subject'}</span>
        </button>

        <div style={{ flex: 1 }} />

        <button 
          className="nav-rail-item" 
          onClick={() => setShowExitWarning('exit')}
          title={t.backBtn}
          id="classroom-btn-exit"
          type="button"
        >
          <span style={{ display: 'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </span>
          <span className="nav-rail-label">{t.backBtn}</span>
        </button>

        <button 
          className="nav-rail-item" 
          style={{ color: 'var(--color-danger)' }}
          onClick={() => setShowExitWarning('end')}
          title={t.endBtn}
          id="classroom-btn-end"
          type="button"
        >
          <span style={{ display: 'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><rect width="6" height="6" x="9" y="9"/></svg>
          </span>
          <span className="nav-rail-label">{t.endBtn}</span>
        </button>
      </div>

      {/* Top Header Navbar */}
      <div className="classroom-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', boxSizing: 'border-box' }}>
        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
            {sessionDetails?.subject}: <span className="gradient-text">{sessionDetails?.topic}</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
            {t.classLevel}: {sessionDetails?.class_level}
          </p>
        </div>

        {/* Segmented View Toggles */}
        <div className="view-toggle-bar">
          <button 
            className={`view-toggle-btn ${viewMode === 'gallery' ? 'active' : ''}`}
            onClick={() => setViewMode('gallery')}
            type="button"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Gallery
            </span>
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'whiteboard' ? 'active' : ''}`}
            onClick={() => setViewMode('whiteboard')}
            type="button"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              Whiteboard
            </span>
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Countdown Clock */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(239, 68, 68, 0.08)', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: timeLeft < 60 ? 'var(--color-danger)' : 'var(--text-primary)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {formatTime(timeLeft)}
          </div>

          {/* Toggle Chat Drawer Button */}
          <button
            className={`btn-secondary ${isChatOpen ? 'active' : ''}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            type="button"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Transcript
            </span>
          </button>
        </div>
      </div>

      <div className="classroom-dimmed-layer" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0, padding: '1.5rem 2.5rem 1.5rem 1.5rem' }}>
        {/* Main Grid View */}
        <div className="classroom-grid-layout" style={{ gridTemplateColumns: '1fr' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
            {/* Active Event Banner */}
            <EventPopup event={activeEvent} />

            {viewMode === 'gallery' ? (
              /* Gallery View: Render student grid at full size */
              <div className="desks-grid" style={{ flex: 1, minHeight: 0 }}>
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
            ) : (
              /* Whiteboard View: Render Blackboard canvas and scaled student filmstrip */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  <Blackboard 
                    onShare={(desc) => handleSendTurn(`[Illustrated ${desc} on Blackboard]`, undefined, 'blackboard_share')}
                    subject={sessionDetails?.subject || ''}
                    topic={sessionDetails?.topic || ''}
                  />
                </div>
                
                {/* Horizontal Filmstrip of Student Desks */}
                <div className="student-filmstrip">
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
            )}
          </div>
        </div>
      </div>

      {/* Right Side Sliding Chat Drawer */}
      <div className={`chat-drawer ${isChatOpen ? 'open' : ''}`}>
        <div className="transcript-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-card)' }}>
          <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            {t.recentTranscript}
          </span>
          <button 
            className="btn-icon" 
            onClick={() => setIsChatOpen(false)}
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        
        <div className="transcript-body" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {messages.map((m, idx) => {
            const isAction = m.message_text.startsWith('[') && m.message_text.endsWith(']');
            return (
              <div 
                key={idx} 
                className={`chat-bubble ${m.sender_type} ${isAction ? 'action' : ''}`}
                id={`chat-bubble-${idx}`}
              >
                {m.sender_type !== 'system' && !isAction && (
                  <div className="chat-name" style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.15rem' }}>
                    {m.sender_name} {m.student_personality ? `(${m.student_personality})` : ''}
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>{m.message_text}</div>
              </div>
            );
          })}
          
          {isPending && (
            <div className="chat-bubble student" style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.85rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Student responding...
              </span>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Floating Action Dock centered at bottom center */}
      <div className="floating-action-dock">
        {/* Input form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTurn(teacherInput);
          }}
          className="text-input-container"
          style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}
        >
          <input
            type="text"
            className="dock-input"
            value={teacherInput}
            onChange={(e) => setTeacherInput(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={isListening ? t.micListening : t.typePlaceholder}
            disabled={isPending}
            id="classroom-input-text"
            style={{ 
              flex: 1, 
              border: 'none', 
              background: 'transparent', 
              outline: 'none', 
              padding: '0.6rem 0',
              fontSize: '0.95rem',
              color: 'var(--text-primary)'
            }}
          />
          
          <div className="dock-action-buttons">
            {/* STT Mic trigger */}
             <button 
              className={`dock-mic-button ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? t.micListening : t.micIdle}
              id="classroom-btn-mic"
              type="button"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </button>

            {/* Send button */}
            <button 
              type="submit" 
              className="dock-send-button"
              disabled={isPending || !teacherInput.trim()}
              id="classroom-btn-send"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </form>
      </div>

      {showSyllabus && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowSyllabus(false)}
        >
          <div 
            className="saas-card"
            style={{
              width: '90%',
              maxWidth: '480px',
              padding: '2rem',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', textAlign: 'left' }}>
                  Syllabus Guideline
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem', textAlign: 'left' }}>
                  {sessionDetails?.subject}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem', textAlign: 'left' }}>
                  Grade Level: {sessionDetails?.class_level}
                </p>
              </div>
              <button 
                className="btn-icon"
                onClick={() => setShowSyllabus(false)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-card)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>
                Required Course Modules:
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '1.25rem', margin: 0 }}>
                {getSyllabusTopics().map((topicItem, index) => (
                  <li 
                    key={index} 
                    style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      textAlign: 'left'
                    }}
                  >
                    {topicItem}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.1)', padding: '1rem', borderRadius: '12px', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '0.25rem', textAlign: 'left' }}>
                Trainee Guideline:
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0, textAlign: 'left' }}>
                Design your lessons, blackboard illustrations, and student questions around these core curricular milestones to maximize your Pedagogical Assessment score.
              </p>
            </div>
          </div>
        </div>
      )}

      {showExitWarning && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowExitWarning(false)}
        >
          <div 
            className="saas-card"
            style={{
              width: '90%',
              maxWidth: '480px',
              padding: '2rem',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', textAlign: 'left' }}>
                  {showExitWarning === 'logo' ? 'Platform Overview' : showExitWarning === 'exit' ? 'Exit to Dashboard' : 'End Class Session'}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem', textAlign: 'left' }}>
                  {showExitWarning === 'logo' ? 'Future Classroom Simulator' : 'Conclude active training?'}
                </h3>
              </div>
              <button 
                className="btn-icon"
                onClick={() => setShowExitWarning(false)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-card)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {showExitWarning === 'logo' ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left', margin: 0 }}>
                    This high-fidelity interactive training environment allows teacher trainees to practice real-time classroom orchestration, lesson execution, and proactive student behavior management.
                  </p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left', margin: 0 }}>
                    Utilize the interactive whiteboard, observe active emotional responses from your 6 AI student personas, and use speech or text controls to lead your lesson plan.
                  </p>
                </>
              ) : showExitWarning === 'exit' ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left', margin: 0 }}>
                  Are you sure you want to exit the active classroom session and return to the dashboard? Your current session progress will be preserved.
                </p>
              ) : (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left', margin: 0 }}>
                  Are you sure you want to end this class? This will immediately conclude the teaching session, stop the timer, and generate your micro-teaching evaluation report.
                </p>
              )}
            </div>

            <div style={{ background: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.1)', padding: '1rem', borderRadius: '12px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Time Remaining:
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                Session In Progress
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem' }}
                onClick={() => setShowExitWarning(false)}
                type="button"
              >
                Keep Teaching
              </button>
              {showExitWarning === 'exit' ? (
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem', background: 'var(--color-danger)', border: 'none' }}
                  onClick={() => {
                    setShowExitWarning(false);
                    setTimerActive(false);
                    onExit();
                  }}
                  type="button"
                >
                  Exit Session
                </button>
              ) : (
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem', background: 'var(--color-danger)', border: 'none' }}
                  onClick={() => {
                    setShowExitWarning(false);
                    setTimerActive(false);
                    onEndSession(sessionId);
                  }}
                  type="button"
                >
                  End Class
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

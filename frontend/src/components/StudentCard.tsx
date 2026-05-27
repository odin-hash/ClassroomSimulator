import React from 'react';
import { Avatar } from './Avatar';

interface Student {
  name: string;
  personality: string;
  avatar_style: string;
}

interface StudentCardProps {
  student: Student;
  emotion: 'normal' | 'confused' | 'questioning' | 'sleeping' | 'distracted' | 'talking';
  isActiveSpeaker: boolean;
  bubbleText: string | null;
  onAction: (studentName: string, actionType: string) => void;
  provider?: string | null;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  emotion,
  isActiveSpeaker,
  bubbleText,
  onAction,
  provider,
}) => {
  const [showTouchActions, setShowTouchActions] = React.useState(false);

  // Translate emotion to human-readable attention state badge
  const getStatusBadge = (style?: React.CSSProperties) => {
    switch (emotion) {
      case 'confused':
        return <span className="status-badge confused" style={style}>Confused</span>;
      case 'sleeping':
        return <span className="status-badge sleeping" style={style}>Dozing Off</span>;
      case 'distracted':
        return <span className="status-badge distracted" style={style}>Distracted</span>;
      case 'questioning':
        return <span className="status-badge focused" style={style}>Questioning</span>;
      default:
        return <span className="status-badge focused" style={style}>Focused</span>;
    }
  };

  return (
    <div 
      className={`student-desk saas-card ${isActiveSpeaker ? 'active-speaker' : ''} ${
        emotion === 'sleeping' ? 'sleeping' : emotion === 'distracted' ? 'distracted' : ''
      } ${showTouchActions ? 'show-touch-actions' : ''}`}
      onClick={(e) => {
        // Toggle action overlay on click/tap, but ignore if tapping an active action button inside the overlay
        if ((e.target as HTMLElement).closest('.student-action-overlay button')) {
          setShowTouchActions(false);
          return;
        }
        setShowTouchActions(!showTouchActions);
      }}
      onMouseLeave={() => setShowTouchActions(false)}
      id={`student-desk-${student.name.toLowerCase()}`}
    >
      {/* Floating Status Indicator Pill */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 15 }}>
        {getStatusBadge({ margin: 0 })}
      </div>

      {/* Speech bubble overlay when student speaks or is typing */}
      {bubbleText && (
        <div className="student-bubble">
          {bubbleText === '...' ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <>
              {bubbleText}
              {provider && (
                <div 
                  className="bubble-provider" 
                  style={{ 
                    fontSize: '0.58rem', 
                    fontWeight: 700, 
                    marginTop: '6px', 
                    color: provider === 'gemini' ? '#3b82f6' : provider === 'groq' ? '#a855f7' : '#71717a',
                    borderTop: '1px solid var(--border-card)',
                    paddingTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'flex-end',
                    opacity: 0.85
                  }}
                >
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: provider === 'gemini' ? '#3b82f6' : provider === 'groq' ? '#a855f7' : '#71717a' }}></span>
                  via {provider === 'gemini' ? 'Gemini 2.0' : provider === 'groq' ? 'Groq (Llama)' : provider === 'template' ? 'Template' : provider}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Animated SVG Avatar with Active Speaker Ring */}
      <div className={`student-avatar-wrapper ${isActiveSpeaker ? 'active-speaker-ring' : ''}`}>
        <Avatar style={student.avatar_style} emotion={emotion} name={student.name} />
      </div>

      {/* Name and Personality */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{student.name}</h3>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0.5rem' }}>
        {student.personality}
      </p>

      {/* Interactive Teacher Actions Hover Overlay (Lower Half) */}
      <div className="student-action-overlay">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
          {emotion === 'distracted' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.35rem', fontSize: '0.7rem', background: 'var(--color-warning)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onAction(student.name, 'focus')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              Remind
            </button>
          )}
          
          {emotion === 'sleeping' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.35rem', fontSize: '0.7rem', background: 'var(--color-info)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onAction(student.name, 're-engage')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
              Wake Up
            </button>
          )}

          {emotion === 'confused' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.35rem', fontSize: '0.7rem', background: 'var(--color-danger)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => onAction(student.name, 'explain_basic')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              Scaffold
            </button>
          )}
          
          <button 
            className="btn-secondary" 
            style={{ width: '100%', padding: '0.35rem', fontSize: '0.7rem', border: '1px solid var(--border-card)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => onAction(student.name, 'prompt')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            Call On
          </button>
        </div>
      </div>
    </div>
  );
};

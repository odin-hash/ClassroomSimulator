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
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  emotion,
  isActiveSpeaker,
  bubbleText,
  onAction,
}) => {
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
      }`}
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
            bubbleText
          )}
        </div>
      )}

      {/* Animated SVG Avatar with Active Speaker Ring */}
      <div className={`student-avatar-wrapper ${isActiveSpeaker ? 'active-speaker-ring' : ''}`}>
        <Avatar style={student.avatar_style} emotion={emotion} />
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
              style={{ width: '100%', padding: '0.35rem', fontSize: '0.7rem', background: 'var(--color-warning)', border: 'none' }}
              onClick={() => onAction(student.name, 'focus')}
            >
              ⚠️ Remind
            </button>
          )}
          
          {emotion === 'sleeping' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.35rem', fontSize: '0.7rem', background: 'var(--color-info)', border: 'none' }}
              onClick={() => onAction(student.name, 're-engage')}
            >
              💡 Wake Up
            </button>
          )}

          {emotion === 'confused' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.35rem', fontSize: '0.7rem', background: 'var(--color-danger)', border: 'none' }}
              onClick={() => onAction(student.name, 'explain_basic')}
            >
              📖 Scaffold
            </button>
          )}
          
          <button 
            className="btn-secondary" 
            style={{ width: '100%', padding: '0.35rem', fontSize: '0.7rem', border: '1px solid var(--border-card)', background: 'var(--bg-secondary)' }}
            onClick={() => onAction(student.name, 'prompt')}
          >
            ❓ Call On
          </button>
        </div>
      </div>
    </div>
  );
};

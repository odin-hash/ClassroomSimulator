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
  const getStatusBadge = () => {
    switch (emotion) {
      case 'confused':
        return <span className="status-badge confused">Confused</span>;
      case 'sleeping':
        return <span className="status-badge sleeping">Dozing Off</span>;
      case 'distracted':
        return <span className="status-badge distracted">Distracted</span>;
      case 'questioning':
        return <span className="status-badge focused">Questioning</span>;
      default:
        return <span className="status-badge focused">Focused</span>;
    }
  };

  return (
    <div 
      className={`student-desk glass ${isActiveSpeaker ? 'active-speaker' : ''} ${
        emotion === 'sleeping' ? 'sleeping' : emotion === 'distracted' ? 'distracted' : ''
      }`}
      id={`student-desk-${student.name.toLowerCase()}`}
    >
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

      {/* Animated SVG Avatar */}
      <Avatar style={student.avatar_style} emotion={emotion} />

      {/* Name and Personality */}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>{student.name}</h3>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        {student.personality}
      </p>
      
      {/* Status indicator */}
      {getStatusBadge()}

      {/* Interactive Teacher Actions Hover Overlay */}
      <div className="student-action-overlay">
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.15rem' }}>
          {student.name}
        </h4>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', textAlign: 'center' }}>
          Select Actions:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
          {emotion === 'distracted' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.3rem', fontSize: '0.7rem', background: 'var(--color-warning)', border: 'none' }}
              onClick={() => onAction(student.name, 'focus')}
            >
              ⚠️ Remind
            </button>
          )}
          
          {emotion === 'sleeping' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.3rem', fontSize: '0.7rem', background: 'var(--color-info)', border: 'none' }}
              onClick={() => onAction(student.name, 're-engage')}
            >
              💡 Wake Up
            </button>
          )}

          {emotion === 'confused' && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.3rem', fontSize: '0.7rem', background: 'var(--color-danger)', border: 'none' }}
              onClick={() => onAction(student.name, 'explain_basic')}
            >
              📖 Scaffold
            </button>
          )}
          
          <button 
            className="btn-secondary" 
            style={{ width: '100%', padding: '0.3rem', fontSize: '0.7rem', border: '1px solid var(--border-card)' }}
            onClick={() => onAction(student.name, 'prompt')}
          >
            ❓ Call On
          </button>
        </div>
      </div>
    </div>
  );
};

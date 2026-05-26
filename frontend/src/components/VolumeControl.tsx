import React from 'react';

interface VolumeControlProps {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  isMuted,
  setIsMuted,
  volume,
  setVolume,
}) => {
  const [showSlider, setShowSlider] = React.useState(false);

  return (
    <div 
      className="volume-hud-container"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-card)',
        borderRadius: '9999px',
        padding: '0.35rem 0.5rem',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '38px',
        zIndex: 50,
      }}
    >
      {/* 1. Mute/Unmute Interactive Button */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isMuted ? 'var(--color-danger)' : 'var(--text-primary)',
          transition: 'color 0.2s ease',
          outline: 'none',
        }}
        title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        type="button"
        id="classroom-btn-mute"
      >
        {isMuted ? (
          /* Muted Speaker Icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : volume < 0.35 ? (
          /* Low Volume Speaker Icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          /* High Volume Speaker Icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* 2. Slide-out Volume Controller */}
      <div
        className="volume-slider-wrapper"
        style={{
          width: showSlider ? '90px' : '0px',
          opacity: showSlider ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          marginLeft: showSlider ? '0.35rem' : '0px',
          paddingRight: showSlider ? '0.25rem' : '0px',
        }}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setVolume(val);
            if (val > 0 && isMuted) {
              setIsMuted(false);
            } else if (val === 0 && !isMuted) {
              setIsMuted(true);
            }
          }}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: 'var(--primary)',
            height: '4px',
            borderRadius: '2px',
            background: 'var(--border-card)',
            outline: 'none',
          }}
          title={`Volume: ${Math.round(volume * 100)}%`}
          id="classroom-volume-slider"
        />
      </div>
    </div>
  );
};

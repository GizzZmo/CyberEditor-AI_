
import React, { useState } from 'react';
import { EditorSettings, AccentTheme } from '../types';
import { verifyToken } from '../services/githubService';

interface SettingsPanelProps {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
}

const themes: { name: AccentTheme, label: string, color: string }[] = [
    { name: 'cyan', label: 'Cyber Cyan', color: '#00f6ff' },
    { name: 'green', label: 'Hacker Green', color: '#00ff87' },
    { name: 'magenta', label: 'Synth Magenta', color: '#ff00c1' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
  const [localToken, setLocalToken] = useState(settings.githubToken || '');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleThemeChange = (theme: AccentTheme) => {
    onSettingsChange({ ...settings, theme });
  };

  const handleTokenSave = () => {
    // Saving a new token invalidates the previously fetched user.
    onSettingsChange({ ...settings, githubToken: localToken, githubUser: null });
    setSaveStatus('saved');
    setVerificationStatus('idle');
    setVerificationMessage('');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };
  
  const handleTokenInputChange = (value: string) => {
    setLocalToken(value);
    setVerificationStatus('idle');
    setVerificationMessage('');
    if (saveStatus === 'saved') {
        setSaveStatus('idle');
    }
  };

  const handleVerifyToken = async () => {
    setVerificationStatus('verifying');
    setVerificationMessage('');
    const result = await verifyToken(localToken);
    setVerificationMessage(result.message);
    if (result.success && result.user) {
        setVerificationStatus('success');
        // On successful verification, save both the token and the user info.
        onSettingsChange({ ...settings, githubToken: localToken, githubUser: result.user });
    } else {
        setVerificationStatus('error');
    }
  };

  const getVerificationMessageColor = () => {
    switch(verificationStatus) {
        case 'success': return 'text-green-400';
        case 'error': return 'text-red-400';
        default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full bg-black/30 border-2 border-[var(--accent-color)] rounded-lg p-3 flex flex-col cyber-glow">
      <h2 className="text-[var(--accent-color)] text-sm font-bold tracking-widest mb-4 px-1">// EDITOR_SETTINGS</h2>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        <div className="mb-6">
            <h3 className="text-[var(--accent-color-secondary)] font-bold mb-3">// Accent_Theme</h3>
            <div className="space-y-2">
                {themes.map(theme => (
                    <button
                        key={theme.name}
                        onClick={() => handleThemeChange(theme.name)}
                        className={`w-full text-left p-3 rounded-md transition-all duration-200 border-2 flex items-center justify-between
                            ${settings.theme === theme.name 
                                ? 'border-[var(--accent-color)] text-white'
                                : 'border-transparent text-gray-400 hover:bg-white/10'
                            }`
                        }
                    >
                       <span>{theme.label}</span>
                       <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.color }}></div>
                    </button>
                ))}
            </div>
        </div>

        <div className="mb-6">
            <h3 className="text-[var(--accent-color-secondary)] font-bold mb-3">// GitHub_Integration</h3>
            <div className="space-y-3">
                <label htmlFor="github-token" className="text-sm text-gray-300">Personal Access Token (with 'repo' scope)</label>
                 <input
                    id="github-token"
                    type="password"
                    value={localToken}
                    onChange={e => handleTokenInputChange(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full bg-black/50 border border-white/20 rounded-md p-2 text-white focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                />
                {verificationMessage && (
                    <p className={`text-xs px-1 ${getVerificationMessageColor()}`}>{verificationMessage}</p>
                )}
                <div className="flex gap-2">
                    <button
                        onClick={handleTokenSave}
                        disabled={saveStatus === 'saved' || !localToken}
                        className="flex-1 p-2 bg-black/30 border border-[var(--accent-color-secondary)] rounded-md text-[var(--accent-color-secondary)] hover:bg-[var(--accent-color-secondary)]/20 hover:text-white transition-colors disabled:opacity-50"
                    >
                        {saveStatus === 'saved' ? 'Saved!' : 'Save Token'}
                    </button>
                    <button
                        onClick={handleVerifyToken}
                        disabled={!localToken || verificationStatus === 'verifying'}
                        className="flex-1 p-2 bg-black/30 border border-[var(--accent-color)] rounded-md text-[var(--accent-color)] hover:bg-[var(--accent-color)]/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {verificationStatus === 'verifying' ? 'Verifying...' : 'Verify Token'}
                    </button>
                </div>
                <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[var(--accent-color)] transition-colors block text-center mt-2">
                    How to create a token?
                </a>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPanel;
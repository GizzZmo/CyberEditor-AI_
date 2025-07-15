
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-3xl lg:text-4xl font-bold text-[var(--text-accent)] drop-shadow-[0_0_10px_var(--accent-glow)] animate-pulse">
        &gt;&gt; CyberEditor AI_
      </h1>
      <p className="text-sm text-[var(--accent-color-secondary)] mt-1">Powered by Gemini</p>
    </header>
  );
};

export default Header;
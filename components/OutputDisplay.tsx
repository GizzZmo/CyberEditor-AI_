
import React from 'react';

interface OutputDisplayProps {
  output: string;
  isLoading: boolean;
  error: string | null;
}

const LoadingIndicator: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-[var(--accent-color)]">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[var(--accent-color-secondary)]"></div>
        <p className="mt-4 text-lg tracking-widest">AWAITING RESPONSE...</p>
    </div>
);

const OutputDisplay: React.FC<OutputDisplayProps> = ({ output, isLoading, error }) => {
  return (
    <div className="h-full bg-black/30 border-2 border-[var(--accent-color)] rounded-lg p-4 cyber-glow relative overflow-hidden">
      <div className="absolute top-2 left-3 text-[var(--accent-color-secondary)] text-xs">// OUTPUT_CONSOLE</div>
      <div className="h-full w-full pt-6 overflow-y-auto custom-scrollbar">
        {isLoading && <LoadingIndicator />}
        {error && !isLoading && (
            <div className="text-red-500">
                <p className="font-bold text-xl mb-2">&gt; TRANSMISSION ERROR</p>
                <pre className="whitespace-pre-wrap text-red-400">{error}</pre>
            </div>
        )}
        {!isLoading && !error && output && (
            <pre className="whitespace-pre-wrap text-gray-200 text-sm">
                <code>{output}</code>
            </pre>
        )}
         {!isLoading && !error && !output && (
            <div className="text-gray-500 h-full flex items-center justify-center">
                <p>&gt; AI output will appear here...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default OutputDisplay;
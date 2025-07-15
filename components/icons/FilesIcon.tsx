import React from 'react';

export const FilesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V14c0 .8.6 1.4 1.4 1.4h9.8c.8 0 1.4-.6 1.4-1.4V6.9c0-.4-.2-.8-.5-1.1L16.6 2.5c-.3-.3-.7-.5-1.1-.5z"></path>
    <path d="M3 7.6v12.8c0 .8.6 1.4 1.4 1.4h9.8"></path>
    <path d="M15 2v5h5"></path>
  </svg>
);

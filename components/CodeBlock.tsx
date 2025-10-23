import React, { useEffect, useRef } from 'react';

// Prism is expected on the window object from the CDN script
declare const Prism: any;

interface CodeBlockProps {
    className?: string;
    children?: React.ReactNode;
    inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className, inline }) => {
    const codeRef = useRef<HTMLElement>(null);
    const language = (className || '').replace('language-', '');

    useEffect(() => {
        if (codeRef.current && !inline) {
            Prism.highlightElement(codeRef.current);
        }
    }, [children, language, inline]);
    
    if (inline) {
        return <code className={className}>{children}</code>;
    }
    
    return (
        <div className="code-block bg-gray-950 rounded-md my-4 overflow-hidden border border-gray-800">
            <div className="flex justify-between items-center bg-gray-800 px-4 py-1.5 text-xs text-gray-400">
                <span>{language}</span>
                {/* Could add a copy button here */}
            </div>
            <pre className="!bg-transparent !p-4 !m-0 overflow-x-auto">
                <code ref={codeRef} className={`language-${language}`}>
                    {String(children).replace(/\n$/, '')}
                </code>
            </pre>
        </div>
    );
};

export default CodeBlock;
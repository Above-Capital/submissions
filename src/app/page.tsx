'use client';

import { useState, useCallback, useEffect } from 'react';

type Template = {
  id: string;
  name: string;
  description: string;
};

const templates: Template[] = [
  { id: 'modern', name: 'Modern', description: 'Clean and professional' },
  { id: 'classic', name: 'Classic', description: 'Traditional resume style' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
];

const defaultMarkdown = `# John Doe
**Software Engineer**

john.doe@email.com | (555) 123-4567 | github.com/johndoe | linkedin.com/in/johndoe

---

## Summary
Experienced software engineer with 5+ years of experience building scalable web applications. Passionate about clean code, performance optimization, and user experience.

## Experience

### Senior Software Engineer
**Tech Company Inc.** | 2022 - Present
- Led development of customer-facing dashboard serving 100K+ users
- Improved application performance by 40% through code optimization
- Mentored junior developers and established coding standards

### Software Engineer
**StartupXYZ** | 2020 - 2022
- Built full-stack features using React, Node.js, and PostgreSQL
- Implemented real-time collaboration features
- Reduced deployment time by 50% with CI/CD pipeline improvements

## Education

### Bachelor of Science in Computer Science
**University of Technology** | 2016 - 2020
- GPA: 3.8/4.0
- Dean's List all semesters

## Skills
- **Languages:** TypeScript, JavaScript, Python, Go
- **Frontend:** React, Next.js, Vue.js, Tailwind CSS
- **Backend:** Node.js, Express, PostgreSQL, MongoDB
- **DevOps:** Docker, Kubernetes, AWS, CI/CD

## Projects

### E-commerce Platform
Built a full-featured e-commerce platform with payment integration, inventory management, and admin dashboard.

### Task Management App
Real-time collaboration tool with team features, notifications, and analytics.

---

*References available upon request*
`;

// Simple markdown parser
function parseMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold/Italic
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.*?)~~/gim, '<del>$1</del>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gim, '<hr>')
    // Unordered lists
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    // Paragraphs (split by double newline)
    .split('\n\n')
    .map(p => {
      if (p.startsWith('<h') || p.startsWith('<hr') || p.startsWith('<blockquote') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<li')) {
        return p;
      }
      if (p.trim()) {
        return `<p>${p.replace(/\n/g, ' ')}</p>`;
      }
      return '';
    })
    .join('\n');
}

export default function ResumeBuilder() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [parsedHtml, setParsedHtml] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const html = parseMarkdown(markdown);
    setParsedHtml(html);
  }, [markdown]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [markdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportHTML = useCallback(() => {
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    ${getTemplateStyles('modern')}
  </style>
</head>
<body>
  ${parsedHtml}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [parsedHtml]);

  const getTemplateStyles = (templateId: string): string => {
    switch (templateId) {
      case 'modern':
        return `
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 0.5rem; }
          h2 { color: #1e40af; margin-top: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; }
          h3 { color: #374151; }
          blockquote { border-left-color: #2563eb; font-style: italic; color: #6b7280; }
          code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
          pre { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
          li { margin-bottom: 0.25rem; }
        `;
      case 'classic':
        return `
          body { font-family: 'Times New Roman', serif; }
          h1 { text-align: center; text-transform: uppercase; letter-spacing: 2px; }
          h2 { font-size: 1.2rem; margin-top: 1.25rem; }
          h3 { font-style: italic; font-size: 1rem; }
          blockquote { border-left: 2px solid #666; font-style: italic; color: #666; }
          pre { font-family: 'Courier New', monospace; }
          hr { border: none; border-top: 1px solid #000; margin: 1.5rem 0; }
        `;
      case 'minimal':
        return `
          body { font-weight: 300; }
          h1 { font-weight: 200; letter-spacing: 4px; text-transform: uppercase; }
          h2 { font-weight: 400; font-size: 1.1rem; margin-top: 1rem; }
          h3 { font-weight: 400; color: #666; }
          blockquote { border-left: 1px solid #999; }
          code { font-size: 0.85em; }
          pre { font-size: 0.85em; background: transparent !important; padding: 0.5rem 0; }
        `;
      default:
        return '';
    }
  };

  const renderWithTemplate = (html: string, templateId: string): React.ReactNode => {
    const templateStyles = getTemplateStyles(templateId);
    
    return (
      <div 
        className="resume-preview-content"
        style={{ fontSize: `${fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">📄 Markdown Resume Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Template Selector */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-1.5 bg-secondary rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
            >
              <span>🎨</span>
              {templates.find(t => t.id === selectedTemplate)?.name}
              <svg className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showTemplates && (
              <div className="absolute right-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-10 fade-in">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setShowTemplates(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedTemplate === template.id ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-1 bg-secondary rounded-md px-2">
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="px-2 py-1 text-sm hover:bg-secondary/50 rounded"
            >
              A-
            </button>
            <span className="text-xs text-muted-foreground min-w-[2ch] text-center">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(20, fontSize + 1))}
              className="px-2 py-1 text-sm hover:bg-secondary/50 rounded"
            >
              A+
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-secondary rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-secondary rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
          >
            💾 Download MD
          </button>
          <button
            onClick={handleExportHTML}
            className="px-3 py-1.5 bg-secondary rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
          >
            🌐 Export HTML
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            🖨️ Print/PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor */}
        <div className="w-1/2 flex flex-col border-r no-print">
          <div className="bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground border-b flex items-center gap-2">
            <span>📝</span> Markdown Editor
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 p-4 resize-none focus:outline-none editor-textarea"
            placeholder="Write your resume in Markdown..."
          />
        </div>

        {/* Preview */}
        <div className="w-1/2 flex flex-col bg-muted/30">
          <div className="bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground border-b flex items-center gap-2 no-print">
            <span>👁️</span> Live Preview
          </div>
          <div className="flex-1 overflow-auto p-8">
            <div 
              className={`resume-paper max-w-[210mm] mx-auto min-h-[297mm] p-[20mm] transition-all ${
                isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const text = e.dataTransfer.getData('text');
                if (text) {
                  setMarkdown(prev => prev + '\n' + text);
                }
              }}
            >
              <style>{getTemplateStyles(selectedTemplate)}</style>
              {renderWithTemplate(parsedHtml, selectedTemplate)}
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <div className="fixed bottom-4 right-4 no-print">
        <div className="group relative">
          <button className="w-10 h-10 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-card border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <h3 className="font-semibold mb-2">Markdown Tips</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li><code>#</code> Title / Name</li>
              <li><code>##</code> Section headers</li>
              <li><code>**text**</code> Bold</li>
              <li><code>*text*</code> Italic</li>
              <li><code>- item</code> Bullet points</li>
              <li><span>&gt;</span> quote Blockquotes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .resume-paper {
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

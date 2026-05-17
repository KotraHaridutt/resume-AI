"use client";
import { useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { DiffViewer } from '@/components/DiffViewer';
import { UploadCloud, Download } from 'lucide-react';
import { z } from 'zod';
import { pdf } from '@react-pdf/renderer';
import { ResumeDocument } from '@/components/ResumeDocument';

export default function ResumeTailor() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [jd, setJd] = useState('');
  const [rawResumeText, setRawResumeText] = useState(''); // NEW: Real user data state
  const [finalizedBullets, setFinalizedBullets] = useState<Record<number, string>>({});
  const [isExporting, setIsExporting] = useState(false);

  const { object, submit, isLoading, error } = useObject({
    api: '/api/generate',
    schema: z.object({
      bullets: z.array(
        z.object({
          originalText: z.string(),
          currentText: z.string(),
        })
      ),
    }),
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show the visual PDF in the iframe
    setPdfUrl(URL.createObjectURL(file));

    // 2. Add a temporary loading state for the text box (optional but good UX)
    setRawResumeText("Extracting text from PDF, please wait...");

    try {
      // 3. Send the file to our new extraction API
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (data.text) {
        // 4. Magically populate the text box!
        setRawResumeText(data.text);
      } else {
        setRawResumeText("Could not extract text. Please paste manually.");
      }
    } catch (error) {
      setRawResumeText("Error extracting text. Please paste manually.");
    }
  };

  const handleTailor = () => {
    setFinalizedBullets({}); // Clear previous decisions
    submit({ jd, rawResumeText });
  };

  const displayBullets = object?.bullets || [];
  const errorMessage = error instanceof Error
    ? error.message
    : error
      ? 'An unexpected error occurred while generating bullet points.'
      : null;

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // 1. Gather the text for the PDF
      const finalBulletsToExport = displayBullets.map((bullet, idx) => {
        // If they clicked accept/reject, use that specific text. 
        // Otherwise, safely fallback to the original bullet text.
        return finalizedBullets[idx] || bullet?.originalText || "";
      }).filter(text => text.trim() !== ""); // Remove empty ones

      // 2. Generate the PDF Blob locally in the browser
      const blob = await pdf(<ResumeDocument bullets={finalBulletsToExport} />).toBlob();

      // 3. Trigger the browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Tailored_Resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-gray-100 overflow-hidden text-sm">
      
      {/* LEFT PANE: PDF Viewer & Raw Text */}
      <div className="w-1/3 border-r border-gray-300 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 font-semibold flex justify-between items-center bg-gray-50">
          Your Resume
          <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md flex items-center gap-2 hover:bg-gray-100 transition shadow-sm">
            <UploadCloud size={16} /> Upload PDF
            <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
          </label>
        </div>
        
        {/* NEW: Textarea to hold the actual resume text for the AI */}
        <div className="p-4 border-b border-gray-200 h-1/3 flex flex-col gap-2">
          <label className="font-medium text-gray-600">Paste Resume Text Here (For AI)</label>
          <textarea 
            className="w-full flex-1 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Paste your current resume bullet points here..."
            value={rawResumeText}
            onChange={(e) => setRawResumeText(e.target.value)}
          />
        </div>

        <div className="flex-1 bg-gray-100 p-4">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-full rounded shadow-sm border border-gray-300 bg-white" />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 bg-white border border-gray-200 rounded">Upload a PDF to view it here</div>
          )}
        </div>
      </div>

      {/* MIDDLE PANE: Job Description */}
      <div className="w-1/3 border-r border-gray-300 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 font-semibold bg-gray-50">Job Description</div>
        <div className="p-4 flex-1 flex flex-col gap-4">
          <textarea 
            className="w-full flex-1 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Paste the target Job Description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <button 
            onClick={handleTailor}
            disabled={isLoading || !jd || !rawResumeText}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
          >
            {isLoading ? 'Tailoring Resume...' : 'Tailor to JD'}
          </button>
        </div>
      </div>

      {/* RIGHT PANE: A4 Preview & Diff */}
      <div className="w-1/3 bg-gray-200 overflow-auto flex flex-col py-8 px-4 items-start">
        <div className="w-full flex justify-end mb-4 min-w-[210mm] mx-auto">
           <button className="bg-white text-gray-700 px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-gray-50 transition">
             <Download size={16} /> Export PDF
           </button>
        </div>
        
        <div className="w-full flex justify-end mb-4 min-w-[210mm] mx-auto">
           <button 
             onClick={handleExportPdf}
             disabled={isExporting || displayBullets.length === 0}
             className="bg-white text-gray-700 px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-gray-50 transition disabled:opacity-50"
           >
             <Download size={16} /> 
             {isExporting ? 'Generating...' : 'Export PDF'}
           </button>
        </div>
        
        <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] flex flex-col gap-4 mx-auto shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">AI Changes</h1>
          
          {errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 mb-4">
              <strong>AI Error:</strong> {errorMessage}
            </div>
          )}
          
          {displayBullets.length === 0 && (
            <p className="text-gray-400 italic">Your tailored bullets will stream here...</p>
          )}

          {displayBullets.map((bullet, idx) => {
            // Check if user has accepted/rejected this specific bullet
            const isFinalized = finalizedBullets[idx] !== undefined;
            const finalText = finalizedBullets[idx];

            return (
              <div key={`bullet-${idx}`} className="mb-3 group relative">
                <div className="flex gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <div className="flex-1">
                    {isFinalized ? (
                      // If a decision was made, show plain text (no diffs)
                      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                        {finalText}
                      </div>
                    ) : (
                      // Otherwise, show the live streaming diff
                      <DiffViewer 
                        original={bullet?.originalText || ""} 
                        current={bullet?.currentText || ""} 
                      />
                    )}
                  </div>
                </div>
                
                {/* Only show buttons if NOT finalized, and wait until streaming is finished (!isLoading) so they don't accept half a sentence */}
                {!isFinalized && !isLoading && bullet?.currentText && (
                  <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border shadow-sm rounded flex text-xs">
                    <button 
                      onClick={() => setFinalizedBullets(prev => ({ ...prev, [idx]: bullet.currentText || "" }))}
                      className="px-2 py-1 text-green-600 hover:bg-green-50 border-r transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => setFinalizedBullets(prev => ({ ...prev, [idx]: bullet.originalText || "" }))}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
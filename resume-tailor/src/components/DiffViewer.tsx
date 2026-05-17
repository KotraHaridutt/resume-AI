import React, { useMemo } from 'react';
import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch.diff_match_patch();

export const DiffViewer = ({ original = "", current = "" }: { original: string; current: string }) => {
  const diffs = useMemo(() => {
    // Safely fallback to empty strings if the stream hasn't sent the text yet
    const safeOriginal = original || '';
    const safeCurrent = current || '';
    
    // diff_main is much safer for streaming text than diff_linesToChars_
    const diff = dmp.diff_main(safeOriginal, safeCurrent);
    dmp.diff_cleanupSemantic(diff);
    
    return diff;
  }, [original, current]);

  // If both strings are entirely empty, don't try to render
  if (!original && !current) return null;

  return (
    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
      {diffs.map((part, index) => {
        const [operation, text] = part;
        if (operation === 1) {
          // Added text (Green)
          return <span key={index} className="bg-green-100 text-green-800 rounded px-1">{text}</span>;
        }
        if (operation === -1) {
          // Removed text (Red Strikethrough)
          return <span key={index} className="bg-red-50 text-red-400 line-through px-1">{text}</span>;
        }
        // Unchanged text
        return <span key={index}>{text}</span>;
      })}
    </div>
  );
};
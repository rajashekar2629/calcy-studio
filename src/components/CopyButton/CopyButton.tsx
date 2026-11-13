import { Check, Copy } from 'lucide-react';
import { useCopy } from '../../hooks/useCopy';

interface CopyButtonProps {
  /** Plain text placed on the clipboard when clicked. */
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const { status, copy } = useCopy();
  return (
    <div className="copy">
      <button type="button" className="btn btn--secondary" onClick={() => void copy(text)}>
        {status === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        {status === 'copied' ? 'Copied' : label}
      </button>
      <span className="copy__status" role="status">
        {status === 'copied' && 'Copied to clipboard.'}
        {status === 'failed' && 'Copy failed. Select the text and copy it manually.'}
      </span>
    </div>
  );
}

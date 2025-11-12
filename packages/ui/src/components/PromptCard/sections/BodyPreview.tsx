import * as React from 'react';
import { cn } from '../../../lib/utils';
import styles from '../PromptCard.module.css';
import { TruncatedText } from '../utils/TruncatedText';

export interface BodyPreviewProps {
  text: string;
  isXL: boolean;
  maxLines?: number;
  className?: string;
}

export function BodyPreview(props: BodyPreviewProps) {
  const { text, isXL, maxLines, className } = props;

  const lineCount = maxLines || (isXL ? 4 : 3);

  return (
    <div className={cn(styles.bodyPreview, className)}>
      <TruncatedText
        text={text}
        maxLines={lineCount}
        className={cn('text-sm leading-relaxed', styles.bodyText)}
        showTooltip={true}
      />
    </div>
  );
}

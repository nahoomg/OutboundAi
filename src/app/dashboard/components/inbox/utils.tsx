import { cn } from '@/lib/utils';

export function getInitials(name: string): string {
  const words = name.split(' ').filter(word => word.length > 0);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.slice(0, 2).map(word => word[0].toUpperCase()).join('');
}

export function getSentimentBadge(status: string) {
  const sentiment = status === 'REPLIED' || status === 'INTERESTED' ? 'positive' :
    status === 'NOT_INTERESTED' ? 'negative' : 'neutral';

  const styles = {
    positive: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    negative: 'bg-red-500/20 text-red-400 border-red-500/30',
    neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels = { positive: 'Positive', negative: 'Negative', neutral: 'Neutral' };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', styles[sentiment])}>
      {labels[sentiment]}
    </span>
  );
}

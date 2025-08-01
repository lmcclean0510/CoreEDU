
// src/lib/flashcard-system/utils.tsx

import { ThumbsDown, ThumbsUp, Meh, HelpCircle } from 'lucide-react';
import type { Flashcard, GroupedTopics, ConfidenceMapping, ConfidenceLevel } from '@/lib/types';

export const confidenceMapping: ConfidenceMapping[] = [
  { name: 'Confident', value: 3, icon: <ThumbsUp className="w-4 h-4 text-success" /> },
  { name: 'A Little Unsure', value: 2, icon: <Meh className="w-4 h-4 text-accent" /> },
  { name: 'Not Confident', value: 1, icon: <ThumbsDown className="w-4 h-4 text-destructive" /> },
  { name: 'Not Yet Rated', value: null, icon: <HelpCircle className="w-4 h-4 text-muted-foreground" /> },
];

export function groupTopicsByHierarchy(flashcards: Flashcard[]): GroupedTopics {
  const groups: Record<string, Set<string>> = {};
  const subTopicDetails: Record<string, string> = {};

  flashcards.forEach(card => {
    if (!groups[card.topic]) {
      groups[card.topic] = new Set();
    }
    groups[card.topic].add(card.subTopic);
    if (!subTopicDetails[card.subTopic]) {
      subTopicDetails[card.subTopic] = card.specificationPoint;
    }
  });

  const sortedTopics = Object.keys(groups).sort((a, b) => {
    const specA = parseFloat(a.split(' ')[0]);
    const specB = parseFloat(b.split(' ')[0]);
    return specA - specB;
  });

  const finalGroupedTopics: GroupedTopics = {};
  for (const topic of sortedTopics) {
    const sortedSubTopics = Array.from(groups[topic]).sort((a, b) => {
      const specA = subTopicDetails[a] || '';
      const specB = subTopicDetails[b] || '';
      return specA.localeCompare(specB, undefined, { numeric: true });
    });

    const details: Record<string, string> = {};
    sortedSubTopics.forEach(st => {
      details[st] = subTopicDetails[st];
    });

    finalGroupedTopics[topic] = {
      subTopics: sortedSubTopics,
      subTopicDetails: details,
    };
  }

  return finalGroupedTopics;
}

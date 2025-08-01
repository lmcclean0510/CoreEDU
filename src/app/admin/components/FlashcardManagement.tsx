// src/app/admin/components/FlashcardManagement.tsx
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Flashcard } from '@/lib/types';

interface FlashcardManagementProps {
  flashcards: Flashcard[];
  onEdit: (flashcard: Flashcard) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function FlashcardManagement({ 
  flashcards, 
  onEdit, 
  onDelete, 
  onAdd 
}: FlashcardManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [subTopicFilter, setSubTopicFilter] = useState('all');

  // Get unique values for filter options
  const getUniqueSubjects = () => {
    return [...new Set(flashcards.map(card => card.subject))].filter(Boolean).sort();
  };

  const getUniqueTopics = () => {
    return [...new Set(flashcards.map(card => card.topic))].filter(Boolean).sort();
  };

  const getUniqueSubTopics = () => {
    return [...new Set(flashcards.map(card => card.subTopic))].filter(Boolean).sort();
  };

  // Filter flashcards based on all criteria
  const filteredFlashcards = flashcards.filter(card => {
    const matchesSearch = searchTerm === '' || 
      card.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.subTopic.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = subjectFilter === 'all' || card.subject === subjectFilter;
    const matchesTopic = topicFilter === 'all' || card.topic === topicFilter;
    const matchesSubTopic = subTopicFilter === 'all' || card.subTopic === subTopicFilter;

    return matchesSearch && matchesSubject && matchesTopic && matchesSubTopic;
  });

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' || subjectFilter !== 'all' || topicFilter !== 'all' || subTopicFilter !== 'all';

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSubjectFilter('all');
    setTopicFilter('all');
    setSubTopicFilter('all');
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flashcards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Subject Filter */}
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {getUniqueSubjects().map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Topic Filter */}
        <Select value={topicFilter} onValueChange={setTopicFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            {getUniqueTopics().map(topic => (
              <SelectItem key={topic} value={topic}>
                {topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sub Topic Filter */}
        <Select value={subTopicFilter} onValueChange={setSubTopicFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Sub Topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sub Topics</SelectItem>
            {getUniqueSubTopics().map(subTopic => (
              <SelectItem key={subTopic} value={subTopic}>
                {subTopic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {subjectFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Subject: {subjectFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => setSubjectFilter('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {topicFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Topic: {topicFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => setTopicFilter('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {subTopicFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Sub Topic: {subTopicFilter}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => setSubTopicFilter('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredFlashcards.length} of {flashcards.length} flashcards
        </div>
      )}

      {/* Flashcards List */}
      <div className="grid gap-4">
        {filteredFlashcards.map((flashcard) => (
          <Card key={flashcard.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{flashcard.term}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{flashcard.subject}</Badge>
                    <Badge variant="secondary">{flashcard.examBoard}</Badge>
                    <Badge>{flashcard.topic}</Badge>
                    {flashcard.specificationPoint && (
                      <Badge variant="destructive">{flashcard.specificationPoint}</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {flashcard.definition}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(flashcard)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(flashcard.id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Examples:</Label>
                  <div className="mt-1 space-y-1">
                    {flashcard.examples.slice(0, 3).map((example, idx) => (
                      <div key={idx} className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {example}
                      </div>
                    ))}
                    {flashcard.examples.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{flashcard.examples.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Related Terms:</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {flashcard.relatedTerms.map((term, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Specification:</Label>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <div>{flashcard.specificationPoint}</div>
                    <div>{flashcard.subTopic}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredFlashcards.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {hasActiveFilters ? 'No flashcards found' : 'No flashcards yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first flashcard.'
              }
            </p>
            {hasActiveFilters ? (
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
                <Button onClick={onAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Flashcard
                </Button>
              </div>
            ) : (
              <Button onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Flashcard
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
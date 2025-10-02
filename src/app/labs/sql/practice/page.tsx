"use client";

import { useState, useEffect } from "react";
import { SqlPracticeWorkspace } from "@/components/sql-practice-workspace";
import { Loader2 } from "lucide-react";

export default function SQLPracticePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [exercise, setExercise] = useState<any>(null);

  useEffect(() => {
    // Load a default SQL exercise
    const loadDefaultExercise = async () => {
      try {
        setIsLoading(true);
        
        // For now, create a default exercise structure
        const defaultExercise = {
          id: 'sql-intro-1',
          title: 'Introduction - SQL exercise',
          description: 'Work through the challenge and submit your solution when you are ready.',
          questions: [{
            id: 'sql-question-1',
            question_text: 'Write SQL queries using the available tables',
            question_type: 'sql' as const,
            exercise_id: 'sql-intro-1'
          }]
        };
        
        setExercise(defaultExercise);
      } catch (error) {
        console.error('Failed to load exercise:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaultExercise();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading SQL practice environment...</p>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load exercise</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <SqlPracticeWorkspace exercise={exercise} />
    </div>
  );
}
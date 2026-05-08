"use client";
import { useState, useEffect, useMemo } from 'react';

export interface CodeInsight {
  type: 'optimization' | 'best-practice' | 'logic';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export function useCodeAnalysis(code: string, language: string) {
  const [insights, setInsights] = useState<CodeInsight[]>([]);

  const analysis = useMemo(() => {
    if (!code || code.length < 20) return [];
    
    const newInsights: CodeInsight[] = [];
    const lowerCode = code.toLowerCase();

    // 1. Nested Loop Detection (O(n^2) Alert)
    const forMatch = code.match(/for\s*\(/g);
    const whileMatch = code.match(/while\s*\(/g);
    const loopCount = (forMatch?.length || 0) + (whileMatch?.length || 0);
    
    if (loopCount >= 2 && (lowerCode.includes('for') || lowerCode.includes('while'))) {
      // Check for actual nesting (simplified heuristic)
      const nestedPattern = /(for|while).*\{[\s\S]*?(for|while)/g;
      if (nestedPattern.test(code)) {
        newInsights.push({
          type: 'optimization',
          message: "I notice you're using nested loops. This might lead to O(n²) complexity. Is there a more efficient way using a HashMap or Two Pointers?",
          severity: 'medium'
        });
      }
    }

    // 2. Brute Force Search
    if (lowerCode.includes('.includes') || lowerCode.includes('.indexof')) {
      const insideLoop = /(for|while|foreach|map).*?\.includes/g;
      if (insideLoop.test(lowerCode)) {
        newInsights.push({
          type: 'optimization',
          message: "Searching inside a loop can be slow. Using a Set or a Map could improve lookup time to O(1).",
          severity: 'low'
        });
      }
    }

    // 3. Recursion without Memoization
    const functionNameMatch = code.match(/(?:function|const|let)\s+([a-zA-Z0-9_]+)/);
    if (functionNameMatch && functionNameMatch[1]) {
      const name = functionNameMatch[1];
      const selfCallCount = (code.match(new RegExp(name + '\\(', 'g')) || []).length;
      if (selfCallCount > 1 && !lowerCode.includes('memo') && !lowerCode.includes('cache')) {
        newInsights.push({
          type: 'logic',
          message: "Recursive solutions often benefit from Memoization. Have you considered caching intermediate results?",
          severity: 'medium'
        });
      }
    }

    // 4. Missing Optimization (General)
    if (lowerCode.includes('sort(') && (lowerCode.includes('filter') || lowerCode.includes('map'))) {
       newInsights.push({
         type: 'optimization',
         message: "Filtering before sorting is generally more efficient as it reduces the number of elements to process.",
         severity: 'low'
       });
    }

    return newInsights;
  }, [code, language]);

  useEffect(() => {
    setInsights(analysis);
  }, [analysis]);

  return insights;
}

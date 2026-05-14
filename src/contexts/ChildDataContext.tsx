import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Child, WeeklyReport } from '../data/types';
import { useAuth } from './AuthContext';
import { fetchWeekInputs, getWeekRange } from '../lib/dataFetcher';
import {
  calculateFiveAxis,
  calculateTrends,
  generateHashtags,
  suggestParentActions,
  generateSeasonInsight,
  type WeekInputs,
} from '../utils/statsCalculator';

interface ChildDataContextType {
  currentChild: Child;
  currentWeekIndex: number;
  currentReport: WeeklyReport | null;
  isLoadingReport: boolean;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  academyName: string;
  hasData: boolean;
}

const ChildDataContext = createContext<ChildDataContextType | undefined>(undefined);

const MAX_PAST_WEEKS = 12;

function gradeToLabel(grade: number): string {
  if (grade >= 1 && grade <= 6) return `초등학교 ${grade}학년`;
  if (grade >= 7 && grade <= 9) return `중학교 ${grade - 6}학년`;
  if (grade >= 10 && grade <= 12) return `고등학교 ${grade - 9}학년`;
  return `${grade}학년`;
}

function gradeToAge(grade: number): number {
  return grade + 6;
}

export function ChildDataProvider({ children: childrenProp }: { children: ReactNode }) {
  const { currentAcademy } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentReport, setCurrentReport] = useState<WeeklyReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);

  const currentChild: Child = useMemo(() => {
    if (currentAcademy) {
      return {
        id: currentAcademy.studentId,
        name: currentAcademy.studentName,
        grade: gradeToLabel(currentAcademy.studentGrade),
        age: gradeToAge(currentAcademy.studentGrade),
        avatar: currentAcademy.studentAvatar || 'https://api.dicebear.com/7.x/thumbs/svg?seed=child',
      };
    }
    return {
      id: '0',
      name: '자녀',
      grade: '학년',
      age: 0,
      avatar: 'https://api.dicebear.com/7.x/thumbs/svg?seed=default',
    };
  }, [currentAcademy]);

  useEffect(() => {
    if (!currentAcademy) {
      setCurrentReport(null);
      setIsLoadingReport(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingReport(true);
      try {
        const { start, end } = getWeekRange(weekOffset);
        const prevWeek = getWeekRange(weekOffset - 1);

        const [thisInputs, prevInputs] = await Promise.all([
          fetchWeekInputs(currentAcademy.studentId, start, end),
          fetchWeekInputs(currentAcademy.studentId, prevWeek.start, prevWeek.end),
        ]);

        if (cancelled) return;

        const inputsWithPrev: WeekInputs = {
          ...thisInputs,
          prevWeekScores: prevInputs.scores,
        };

        const stats = calculateFiveAxis(inputsWithPrev, currentAcademy.studentGrade);
        const trends = calculateTrends(thisInputs.scores, prevInputs.scores);
        const hashtags = generateHashtags(stats, thisInputs);
        const parentActions = suggestParentActions(stats);
        const seasonInsight = generateSeasonInsight(stats, currentAcademy.studentName);

        const report: WeeklyReport = {
          weekId: start,
          startDate: start,
          endDate: end,
          stats,
          trends: trends.map(t => ({
            subject: t.subject,
            trend: t.trend,
            changePercent: t.changePercent,
          })),
          insights: {
            hashtags,
            parentActions,
            seasonInsight,
          },
        };

        setCurrentReport(report);
      } catch (err) {
        console.error('[ChildData] load error:', err);
        if (!cancelled) setCurrentReport(null);
      } finally {
        if (!cancelled) setIsLoadingReport(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentAcademy, weekOffset]);

  const canGoNext = weekOffset < 0;
  const canGoPrevious = weekOffset > -MAX_PAST_WEEKS;

  const goToPreviousWeek = () => {
    if (canGoPrevious) setWeekOffset(prev => prev - 1);
  };
  const goToNextWeek = () => {
    if (canGoNext) setWeekOffset(prev => prev + 1);
  };

  const hasData = useMemo(() => {
    if (!currentReport) return false;
    const { stats } = currentReport;
    return !(stats.focus === 60 && stats.growthMind === 60 &&
             stats.comprehension === 60 && stats.energy === 60);
  }, [currentReport]);

  const value = useMemo(
    () => ({
      currentChild,
      currentWeekIndex: -weekOffset,
      currentReport,
      isLoadingReport,
      goToPreviousWeek,
      goToNextWeek,
      canGoNext,
      canGoPrevious,
      academyName: currentAcademy?.academyName || '학원',
      hasData,
    }),
    [currentChild, weekOffset, currentReport, isLoadingReport, canGoNext, canGoPrevious, currentAcademy, hasData]
  );

  return (
    <ChildDataContext.Provider value={value}>{childrenProp}</ChildDataContext.Provider>
  );
}

export function useChildData() {
  const context = useContext(ChildDataContext);
  if (context === undefined) {
    throw new Error('useChildData must be used within a ChildDataProvider');
  }
  return context;
}

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getGradeLabel } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';

export default function StudentsPage() {
  const { isOwner } = useAuth();
  const { students, getMyClasses, getStudentsInClass, classes } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  // 원장이면 전체 학생, 선생님이면 본인 반 학생들만 (중복 제거)
  const visibleStudents = useMemo(() => {
    if (isOwner) return students;
    const myClasses = getMyClasses();
    const studentIds = new Set<string>();
    myClasses.forEach(c => {
      getStudentsInClass(c.id).forEach(s => studentIds.add(s.id));
    });
    return students.filter(s => studentIds.has(s.id));
  }, [isOwner, students, getMyClasses, getStudentsInClass]);

  // 각 학생이 어떤 반에 등록되어 있는지
  const getStudentClasses = (studentId: string) => {
    return classes
      .filter(c => getStudentsInClass(c.id).some(s => s.id === studentId))
      .map(c => c.name);
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return visibleStudents;
    return visibleStudents.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visibleStudents, searchQuery]);

  // 학년별 그룹핑
  const groupedByGrade = useMemo(() => {
    return filteredStudents.reduce((acc, s) => {
      if (!acc[s.grade]) acc[s.grade] = [];
      acc[s.grade].push(s);
      return acc;
    }, {} as Record<number, typeof filteredStudents>);
  }, [filteredStudents]);

  const sortedGrades = Object.keys(groupedByGrade)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="pb-4">
      <Header
        title={isOwner ? '전체 학생' : '내 반 학생'}
        rightContent={<span className="text-xs text-gray-500">{visibleStudents.length}명</span>}
      />

      <div className="px-4 py-4 space-y-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="학생 검색..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>

        {sortedGrades.map(grade => (
          <div key={grade}>
            <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">
              {getGradeLabel(grade)} ({groupedByGrade[grade].length}명)
            </h3>
            <div className="space-y-2">
              {groupedByGrade[grade].map(student => {
                const enrolledClasses = getStudentClasses(student.id);
                return (
                  <Card key={student.id} padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full bg-gray-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900">{student.name}</span>
                          {enrolledClasses.length > 0 && (
                            <p className="text-xs text-gray-500 truncate">
                              {enrolledClasses.join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {sortedGrades.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {searchQuery ? '검색 결과가 없습니다' : '등록된 학생이 없습니다'}
          </div>
        )}
      </div>
    </div>
  );
}

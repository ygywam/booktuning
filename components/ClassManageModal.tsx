'use client';

import React, { useState, useEffect } from 'react';
import { Classroom } from '@/lib/types';
import { Copy, Check, Plus, RefreshCw, Users, ShieldAlert, KeyRound } from 'lucide-react';

interface ClassManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  currentClassId?: string;
  onSelectClass: (c: Classroom) => void;
}

export default function ClassManageModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  currentClassId,
  onSelectClass,
}: ClassManageModalProps) {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 선택된 학급의 학생 목록
  const [activeTabClassId, setActiveTabClassId] = useState<string>(currentClassId || '');
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [resettingPinId, setResettingPinId] = useState<string | null>(null);

  // 1. 학급 목록 불러오기
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classes?teacherId=${encodeURIComponent(teacherId)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.classes)) {
        setClasses(data.classes);
        if (data.classes.length > 0 && !activeTabClassId) {
          setActiveTabClassId(data.classes[0].id);
        }
      }
    } catch (err) {
      console.error('학급 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. 소속 학생 목록 불러오기
  const fetchStudents = async (classId: string) => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      const res = await fetch(`/api/classes/students?classId=${encodeURIComponent(classId)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.students)) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('학생 목록 조회 실패:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen, teacherId]);

  useEffect(() => {
    if (activeTabClassId) {
      fetchStudents(activeTabClassId);
    }
  }, [activeTabClassId]);

  // 3. 새 학급 개설
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      alert('개설할 학급 이름을 입력해 주세요.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim(), teacherId }),
      });
      const data = await res.json();
      if (data.ok && data.classroom) {
        alert(`🎉 '${data.classroom.name}' 학급이 성공적으로 개설되었습니다!\n학생 참여 코드: ${data.classroom.code}`);
        setNewClassName('');
        setClasses((prev) => [data.classroom, ...prev]);
        setActiveTabClassId(data.classroom.id);
        onSelectClass(data.classroom);
      } else {
        alert(`학급 개설 실패: ${data.error}`);
      }
    } catch (err) {
      alert('학급 개설 중 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  };

  // 4. 학생 비밀번호 0000 리셋
  const handleResetPin = async (studentId: string, studentName: string) => {
    if (!confirm(`[${studentName}] 학생의 비밀번호(PIN)를 '0000'으로 초기화하시겠습니까?`)) {
      return;
    }
    setResettingPinId(studentId);
    try {
      const res = await fetch('/api/classes/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newPin: '0000' }),
      });
      const data = await res.json();
      if (data.ok) {
        alert(data.message || '비밀번호가 0000으로 초기화되었습니다.');
        fetchStudents(activeTabClassId);
      } else {
        alert(`초기화 실패: ${data.error}`);
      }
    } catch (err) {
      alert('PIN 초기화 통신 오류');
    } finally {
      setResettingPinId(null);
    }
  };

  // 5. 코드 클립보드 복사
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!isOpen) return null;

  const activeClass = classes.find((c) => c.id === activeTabClassId);

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ maxWidth: '680px' }}>
        {/* 헤더 */}
        <div className="section-title-row">
          <div>
            <h2>🏫 학급 개설 & 독서지도 관리</h2>
            <p className="subtitle">
              선생님({teacherName})이 개설한 학급을 관리하고 소속 학생들의 비밀번호를 초기화합니다.
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="space-y-5 max-h-[68vh] overflow-y-auto pr-1">
          {/* 새 학급 개설 폼 */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>새로운 학급/독서동아리 개설</span>
            </h4>
            <form onSubmit={handleCreateClass} className="flex gap-2">
              <input
                type="text"
                placeholder="예: 3학년 2반 독서동아리, 1-3 교과독서"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={creating}
                className="!bg-[#1b4332] hover:!bg-[#2d6a4f] !text-white !py-2 !px-4 !text-xs font-bold whitespace-nowrap rounded-xl border-0 cursor-pointer shadow-sm transition"
              >
                {creating ? '발급 중...' : '개설 (인증코드 자동발급)'}
              </button>
            </form>
          </div>

          {/* 내가 개설한 학급 탭 목록 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>개설된 학급 목록 ({classes.length}개)</span>
              </span>
              <button
                type="button"
                onClick={fetchClasses}
                className="!bg-stone-100 hover:!bg-stone-200 !text-stone-700 !border !border-stone-300 text-xs font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-sm"
              >
                <RefreshCw className="w-3 h-3 text-stone-600" />
                <span>새로고침</span>
              </button>
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs text-stone-400">학급 목록 불러오는 중...</div>
            ) : classes.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-stone-50 border border-dashed border-stone-300 text-xs text-stone-500">
                아직 개설된 학급이 없습니다. 위에서 첫 학급을 개설해 보세요!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => {
                  const isSelected = cls.id === activeTabClassId;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        setActiveTabClassId(cls.id);
                        onSelectClass(cls);
                        onClose(); // 학급 선택 시 모달 자동 닫힘 (바로 학급 서재로 이동)
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{cls.name}</span>
                      <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                        {cls.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 현재 선택된 학급 상세 및 학생 목록 */}
          {activeClass && (
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm space-y-3">
              {/* 학급 초대코드 배너 */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-amber-800 font-semibold block">학생 가입용 인증코드</span>
                  <span className="font-mono text-lg font-black text-amber-950 tracking-wider">
                    {activeClass.code}
                  </span>
                  <span className="text-[11px] text-amber-700 ml-2">
                    (학생들에게 이 6자리 코드를 알려주세요)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(activeClass.code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
                >
                  {copiedCode === activeClass.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>코드 복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* 학생 명단 & 비밀번호 초기화 테이블 */}
              <div>
                <h5 className="text-xs font-bold text-stone-800 mb-2 flex items-center justify-between">
                  <span>참여 학생 명단 ({students.length}명)</span>
                  <span className="text-[11px] text-stone-400 font-normal">비번 분실 시 0000으로 초기화</span>
                </h5>

                {loadingStudents ? (
                  <div className="p-4 text-center text-xs text-stone-400">학생 명단 불러오는 중...</div>
                ) : students.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-500 bg-stone-50 rounded-lg">
                    아직 가입한 학생이 없습니다. 학생들에게 인증코드(<strong>{activeClass.code}</strong>)를 안내해 주세요.
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200">
                        <tr>
                          <th className="py-2 px-3">학번</th>
                          <th className="py-2 px-3">이름</th>
                          <th className="py-2 px-3 text-right">비밀번호 관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {students.map((st) => (
                          <tr key={st.id} className="hover:bg-stone-50 transition">
                            <td className="py-2 px-3 font-mono font-semibold text-stone-800">
                              {st.studentNumber || '-'}
                            </td>
                            <td className="py-2 px-3 font-bold text-stone-900">
                              {st.name}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                disabled={resettingPinId === st.id}
                                onClick={() => handleResetPin(st.id, st.name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg !bg-rose-50 hover:!bg-rose-100 !text-rose-700 !border !border-rose-300 text-xs font-bold transition cursor-pointer shadow-xs"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                                <span>{resettingPinId === st.id ? '초기화 중...' : 'PIN 0000 리셋'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

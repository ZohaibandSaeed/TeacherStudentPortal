import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ClassAnalytics } from '../../types';
import { Trophy, Users, BookOpenCheck, Shield, BarChart3, Clock, CheckCircle2 } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Editorial Header */}
      <div className="bg-[#FDFDFB] p-8 border-2 border-zinc-900 shadow-editorial-lg text-zinc-900">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-[10px] font-mono-code font-bold uppercase tracking-[0.2em] text-orange-600 mb-1">
            <BarChart3 className="w-4 h-4 text-orange-600" />
            <span>Class Performance & Telemetry</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase font-serif-display leading-tight">
            Real-Time Score Tracking<br />
            <span className="italic font-normal text-zinc-800">& Grade Distribution</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-xl font-medium pt-1">
            Monitor real-time student performance, submission speeds, auto-graded scorecards, and topic mastery across all classes.
          </p>
        </div>
      </div>

      {/* Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-code">
        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Class Average</p>
          <p className="text-3xl font-black text-emerald-700">{analytics?.classAveragePercentage ?? 85}%</p>
          <p className="text-[10px] text-zinc-400 font-bold uppercase">Pass Threshold: 60%</p>
        </div>

        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Submissions</p>
          <p className="text-3xl font-black text-zinc-900">{analytics?.totalSubmissions || 0}</p>
          <p className="text-[10px] text-zinc-400 font-bold uppercase">Auto-Graded Instant</p>
        </div>

        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Top Score</p>
          <p className="text-3xl font-black text-orange-600">{analytics?.topScorePercentage ?? 100}%</p>
          <p className="text-[10px] text-zinc-400 font-bold uppercase">Highest Individual</p>
        </div>

        <div className="bg-white p-5 border-2 border-zinc-900 shadow-editorial space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Enrolled Students</p>
          <p className="text-3xl font-black text-zinc-900">{analytics?.totalStudents || 3}</p>
          <p className="text-[10px] text-zinc-400 font-bold uppercase">Active Portal Users</p>
        </div>
      </div>

      {/* Grade Tier Breakdown */}
      <div className="bg-white p-6 border-2 border-zinc-900 shadow-editorial-lg space-y-4">
        <h3 className="text-xl font-black uppercase font-serif-display text-zinc-900 flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-orange-600" />
          <span>Grade Tier Breakdown</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono-code">
          {analytics?.scoreDistribution.map((tier, idx) => (
            <div key={idx} className="p-4 bg-zinc-50 border-2 border-zinc-200 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900">
                <span>Grade {tier.grade}</span>
                <span className="text-zinc-500">{tier.range}</span>
              </div>
              <p className="text-2xl font-black text-orange-600">{tier.count}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Submissions</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Submissions Log Table */}
      <div className="bg-white p-6 border-2 border-zinc-900 shadow-editorial-lg space-y-4">
        <h3 className="text-xl font-black uppercase font-serif-display text-zinc-900 flex items-center space-x-2">
          <Users className="w-5 h-5 text-zinc-900" />
          <span>Student Submission Log</span>
        </h3>

        <div className="overflow-x-auto font-mono-code">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-900 text-xs font-bold text-zinc-900 uppercase">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Quiz Title</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Percentage</th>
                <th className="py-3 px-4">Time Taken</th>
                <th className="py-3 px-4">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y border-zinc-200 text-xs">
              {analytics?.recentSubmissions && analytics.recentSubmissions.length > 0 ? (
                analytics.recentSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3.5 px-4 font-black text-zinc-900">{sub.studentName}</td>
                    <td className="py-3.5 px-4 text-zinc-700 font-serif-display font-bold text-sm">{sub.quizTitle}</td>
                    <td className="py-3.5 px-4 font-black text-zinc-900">{sub.score} / {sub.maxScore}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 font-bold uppercase tracking-wider ${
                        sub.percentage >= 80
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : sub.percentage >= 60
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600">
                      {Math.floor(sub.timeTakenSeconds / 60)}m {sub.timeTakenSeconds % 60}s
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500 font-bold uppercase">
                    No submission logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

import React, { useMemo, useState } from "react";
import { Mail, Hash, GraduationCap, CalendarDays, Award, CheckCircle2, Save } from "lucide-react";
import { useApp } from "../../context/AppContext";
import ProgressBar from "../../components/ProgressBar";
import { formatDate, getSubmissionStatusForTask } from "../../data/mockData";

export default function Profile() {
  const { auth, tasks, submissions, pushToast } = useApp();
  const student = auth.user;
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);

  const myTasks = useMemo(() => tasks.filter((t) => t.assignedTo.includes(student.id)), [tasks, student.id]);
  const approved = myTasks.filter((t) => getSubmissionStatusForTask(submissions, t.id, student.id) === "approved");
  const points = approved.reduce((sum, t) => sum + t.points, 0);

  const handleSave = (e) => {
    e.preventDefault();
    pushToast("Profile updated successfully");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6 sm:p-7 flex items-center gap-5 flex-wrap">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-display font-bold shrink-0"
          style={{ backgroundColor: student.avatarColor }}
        >
          {student.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold text-white">{student.name}</h1>
          <p className="text-sm text-slate">{student.rollNo} · {student.branch}</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 text-nexura-200 rounded-xl px-4 py-2.5">
          <Award className="w-4.5 h-4.5" />
          <span className="font-display font-bold">{points}</span>
          <span className="text-sm">points earned</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-semibold text-white mb-4">Account Details</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label-text">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-text">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Save className="w-4 h-4" /> Save changes
            </button>
          </form>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-white mb-1">Club Information</h3>
          <div className="flex items-center gap-3 text-sm">
            <Hash className="w-4 h-4 text-nexura-400 shrink-0" />
            <span className="text-slate">Roll number</span>
            <span className="ml-auto font-medium text-white">{student.rollNo}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <GraduationCap className="w-4 h-4 text-nexura-400 shrink-0" />
            <span className="text-slate">Branch & year</span>
            <span className="ml-auto font-medium text-white">{student.branch}, {student.year}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-nexura-400 shrink-0" />
            <span className="text-slate">Email</span>
            <span className="ml-auto font-medium text-white truncate">{student.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CalendarDays className="w-4 h-4 text-nexura-400 shrink-0" />
            <span className="text-slate">Member since</span>
            <span className="ml-auto font-medium text-white">{formatDate(student.joined)}</span>
          </div>

          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-nexura-400" /> Task completion</span>
            </div>
            <ProgressBar value={approved.length} max={myTasks.length || 1} showLabel={false} />
            <p className="text-xs text-slate mt-1.5">{approved.length} of {myTasks.length} tasks approved</p>
          </div>
        </div>
      </div>
    </div>
  );
}

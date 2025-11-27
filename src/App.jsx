import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  LogOut, 
  Plus, 
  FileText, 
  Download,
  ChevronLeft,
  School,
  Loader2
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// --- MOCK DATABASE (Since we are skipping Firebase setup for now) ---
// This allows you to see the UI immediately without API keys.
const MOCK_USER_ID = "teacher123";
const MOCK_STUDENT_EMAIL = "student@test.com";

const INITIAL_SUBJECTS = [
  { id: '1', name: 'Computer Science 101', code: 'CS101', students: [MOCK_STUDENT_EMAIL] }
];

const INITIAL_ATTENDANCE = {};

// --- COMPONENTS ---

// 1. LOGIN SCREEN (Simulation)
const AuthScreen = ({ onLogin }) => {
  const [role, setRole] = useState('student');
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <School className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">UniAttend</h1>
        <p className="text-center text-gray-500 mb-6">Select a role to test the app</p>

        <div className="space-y-4">
          <button 
            onClick={() => onLogin('teacher')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            Login as Teacher
          </button>
          <button 
            onClick={() => onLogin('student')}
            className="w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            Login as Student
          </button>
        </div>
        <p className="mt-4 text-xs text-center text-gray-400">
          (This is a demo version using local memory)
        </p>
      </div>
    </div>
  );
};

// 2. TEACHER DASHBOARD
const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  
  const createSubject = (e) => {
    e.preventDefault();
    const newSub = {
      id: Math.random().toString(),
      name: newSubName,
      code: 'NEW-101',
      students: []
    };
    setSubjects([...subjects, newSub]);
    setIsCreating(false);
    setNewSubName('');
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
          <p className="text-gray-500">Manage your classes</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> New Subject
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Create New Subject</h3>
          <form onSubmit={createSubject} className="flex gap-4">
            <input 
              className="flex-1 border p-2 rounded-md" 
              value={newSubName} 
              onChange={e => setNewSubName(e.target.value)} 
              placeholder="Subject Name"
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md">Save</button>
          </form>
        </div>
      )}

      {selectedSubject ? (
        <SubjectManager subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(sub => (
            <div 
              key={sub.id} 
              onClick={() => setSelectedSubject(sub)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                  <BookOpen size={24} />
                </div>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{sub.code}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-800">{sub.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{sub.students.length} Students</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SubjectManager = ({ subject, onBack }) => {
  const [attendance, setAttendance] = useState({}); // { email: 'Present' }

  const toggleStatus = (email) => {
    setAttendance(prev => ({
      ...prev,
      [email]: prev[email] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`Attendance Report: ${subject.name}`, 14, 20);
    doc.autoTable({
      startY: 30,
      head: [['Student', 'Status']],
      body: subject.students.map(email => [email, attendance[email] || 'Not Marked']),
    });
    doc.save("attendance.pdf");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 min-h-[600px]">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
          <h2 className="text-xl font-bold text-gray-800">{subject.name}</h2>
        </div>
        <button onClick={generatePDF} className="text-blue-600 flex items-center gap-2">
          <Download size={18} /> PDF
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 bg-gray-50 p-4 font-semibold text-gray-600 text-sm border-b">
          <div className="col-span-8">Student</div>
          <div className="col-span-4 text-center">Mark</div>
        </div>
        {subject.students.map(email => (
          <div key={email} className="grid grid-cols-12 p-4 border-b items-center">
            <div className="col-span-8">{email}</div>
            <div className="col-span-4 flex justify-center">
              <button 
                onClick={() => toggleStatus(email)}
                className={`px-4 py-1 rounded-full text-sm font-medium ${attendance[email] === 'Present' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
              >
                {attendance[email] || 'Mark Present'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. STUDENT DASHBOARD
const StudentDashboard = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Attendance</h1>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div>
            <h3 className="font-bold text-gray-800">Computer Science 101</h3>
            <p className="text-sm text-gray-500">CS101</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-green-600">85%</span>
            <p className="text-xs text-gray-400">Attendance</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
            <span>2024-11-27</span>
            <span className="text-green-600 font-bold">Present</span>
          </div>
          <div className="flex justify-between text-sm p-2 bg-gray-50 rounded">
            <span>2024-11-26</span>
            <span className="text-red-600 font-bold">Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// MAIN APP
export default function App() {
  const [userRole, setUserRole] = useState(null); // 'teacher' or 'student'

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <School className="text-blue-600 w-6 h-6" />
               <span className="font-bold text-xl">UniAttend</span>
            </div>
            {userRole && (
              <button onClick={() => setUserRole(null)} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded">
                Logout
              </button>
            )}
         </div>
      </nav>

      <main className="py-6">
         {!userRole ? (
            <AuthScreen onLogin={setUserRole} />
         ) : userRole === 'teacher' ? (
            <TeacherDashboard />
         ) : (
            <StudentDashboard />
         )}
      </main>
    </div>
  );
}
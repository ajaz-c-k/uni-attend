import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  BookOpen, 
  Calendar, 
  LogOut, 
  Plus, 
  FileText, 
  Download,
  ChevronLeft,
  School,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// ------------------------------------------------------------------
// 1. CONFIGURATION
// ------------------------------------------------------------------

// ✅ YOUR REAL KEYS ARE CONFIGURED HERE
const firebaseConfig = {
  apiKey: "AIzaSyCZHB5AeTDTimX3VVKE4EhXqamm-0P49zY",
  authDomain: "uni-attend.firebaseapp.com",
  projectId: "uni-attend",
  storageBucket: "uni-attend.firebasestorage.app",
  messagingSenderId: "522933086650",
  appId: "1:522933086650:web:29c9ff0c248df3a2b49583",
  measurementId: "G-CRV8XCPNGS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Collection Names
const USERS_COLLECTION = 'users';
const SUBJECTS_COLLECTION = 'subjects';
const ATTENDANCE_COLLECTION = 'attendance';

// ------------------------------------------------------------------
// 2. HELPER FUNCTIONS
// ------------------------------------------------------------------

const formatDate = (date) => date.toISOString().split('T')[0];

const generatePDF = (title, headers, data, fileName) => {
  const doc = new jsPDF();
  doc.text(title, 14, 20);
  doc.autoTable({
    startY: 30,
    head: [headers],
    body: data,
  });
  doc.save(`${fileName}.pdf`);
};

// ------------------------------------------------------------------
// 3. COMPONENTS
// ------------------------------------------------------------------

// --- AUTH SCREEN ---
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student'); // student or teacher
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save user details to Database
        await setDoc(doc(db, USERS_COLLECTION, user.uid), {
          uid: user.uid,
          name,
          email,
          role,
          createdAt: serverTimestamp()
        });
        
        // Update display name
        await updateProfile(user, { displayName: name });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <School className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">UniAttend</h1>
        <p className="text-center text-gray-500 mb-6">{isLogin ? 'Sign In' : 'Create Account'}</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" required className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole('student')} className={`p-2 rounded border ${role === 'student' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'text-gray-600'}`}>Student</button>
                <button type="button" onClick={() => setRole('teacher')} className={`p-2 rounded border ${role === 'teacher' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'text-gray-600'}`}>Teacher</button>
              </div>
            </>
          )}
          <input type="email" placeholder="Email" required className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} />
          
          <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-blue-600 text-sm mt-4 hover:underline">
          {isLogin ? "Need an account? Sign Up" : "Have an account? Login"}
        </button>
      </div>
    </div>
  );
};

// --- TEACHER DASHBOARD ---
const TeacherDashboard = ({ user }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [newSubName, setNewSubName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, SUBJECTS_COLLECTION), where('teacherId', '==', user.uid));
    return onSnapshot(q, (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const createSubject = async (e) => {
    e.preventDefault();
    if(!newSubName) return;
    await addDoc(collection(db, SUBJECTS_COLLECTION), {
      name: newSubName,
      code: newSubName.substring(0,3).toUpperCase() + '-101', // Simple auto-code
      teacherId: user.uid,
      students: []
    });
    setNewSubName('');
    setIsCreating(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
        <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={20}/> New Subject
        </button>
      </div>

      {isCreating && (
        <form onSubmit={createSubject} className="mb-8 bg-white p-4 rounded shadow flex gap-4">
          <input className="flex-1 border p-2 rounded" placeholder="Subject Name (e.g. Physics)" value={newSubName} onChange={e => setNewSubName(e.target.value)}/>
          <button className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
        </form>
      )}

      {selectedSubject ? (
        <SubjectManager subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map(sub => (
            <div key={sub.id} onClick={() => setSelectedSubject(sub)} className="bg-white p-6 rounded shadow cursor-pointer hover:shadow-lg transition">
              <h3 className="font-bold text-lg">{sub.name}</h3>
              <p className="text-gray-500 text-sm">{sub.students?.length || 0} Students</p>
            </div>
          ))}
          {subjects.length === 0 && <p className="text-gray-400">No subjects yet.</p>}
        </div>
      )}
    </div>
  );
};

const SubjectManager = ({ subject, onBack }) => {
  const [date, setDate] = useState(formatDate(new Date()));
  const [attendance, setAttendance] = useState({});
  const [newStudent, setNewStudent] = useState('');
  const [activeTab, setActiveTab] = useState('mark'); // mark, students

  // Load Attendance
  useEffect(() => {
    const id = `${subject.id}_${date}`;
    return onSnapshot(doc(db, ATTENDANCE_COLLECTION, id), (docSnap) => {
      if (docSnap.exists()) setAttendance(docSnap.data().records || {});
      else setAttendance({});
    });
  }, [subject, date]);

  const addStudent = async (e) => {
    e.preventDefault();
    if (!newStudent) return;
    const updated = [...(subject.students || []), newStudent];
    await updateDoc(doc(db, SUBJECTS_COLLECTION, subject.id), { students: updated });
    setNewStudent('');
  };

  const mark = (email, status) => {
    setAttendance(prev => ({ ...prev, [email]: status }));
  };

  const save = async () => {
    const id = `${subject.id}_${date}`;
    await setDoc(doc(db, ATTENDANCE_COLLECTION, id), {
      subjectId: subject.id,
      date,
      records: attendance,
      lastUpdated: serverTimestamp()
    });
    alert('Attendance Saved!');
  };

  const report = () => {
    const data = (subject.students || []).map(email => [email, attendance[email] || '-']);
    generatePDF(`Report: ${subject.name} (${date})`, ['Student', 'Status'], data, 'report');
  };

  return (
    <div className="bg-white rounded shadow-lg min-h-[500px]">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack}><ChevronLeft/></button>
          <h2 className="font-bold text-xl">{subject.name}</h2>
        </div>
        <div className="space-x-2">
           <button onClick={() => setActiveTab('mark')} className={`px-3 py-1 rounded ${activeTab === 'mark' ? 'bg-blue-100 text-blue-700' : ''}`}>Mark</button>
           <button onClick={() => setActiveTab('students')} className={`px-3 py-1 rounded ${activeTab === 'students' ? 'bg-blue-100 text-blue-700' : ''}`}>Students</button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'students' ? (
          <div>
            <h3 className="font-bold mb-4">Enroll Students</h3>
            <form onSubmit={addStudent} className="flex gap-2 mb-4">
              <input type="email" placeholder="Student Email" className="border p-2 rounded flex-1" value={newStudent} onChange={e => setNewStudent(e.target.value)}/>
              <button className="bg-blue-600 text-white px-4 rounded">Add</button>
            </form>
            <ul className="space-y-2">
              {(subject.students || []).map(s => <li key={s} className="p-2 bg-gray-50 border rounded">{s}</li>)}
            </ul>
          </div>
        ) : (
          <div>
            <div className="flex justify-between mb-6">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded"/>
              <div className="space-x-2">
                <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">Save Attendance</button>
                <button onClick={report} className="text-blue-600 px-4 py-2 border rounded">PDF</button>
              </div>
            </div>
            <div className="space-y-2">
              {(subject.students || []).map(email => (
                <div key={email} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                  <span>{email}</span>
                  <div className="space-x-2">
                    <button onClick={() => mark(email, 'Present')} className={`px-3 py-1 rounded ${attendance[email] === 'Present' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>P</button>
                    <button onClick={() => mark(email, 'Absent')} className={`px-3 py-1 rounded ${attendance[email] === 'Absent' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>A</button>
                  </div>
                </div>
              ))}
              {(!subject.students || subject.students.length === 0) && <p className="text-center text-gray-400">Enroll students in the 'Students' tab first.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- STUDENT DASHBOARD ---
const StudentDashboard = ({ user }) => {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    // Find subjects where the students array contains my email
    const q = query(collection(db, SUBJECTS_COLLECTION), where('students', 'array-contains', user.email));
    return onSnapshot(q, (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Dashboard</h1>
      <div className="grid gap-4">
        {subjects.map(sub => (
          <StudentSubjectCard key={sub.id} subject={sub} email={user.email} />
        ))}
        {subjects.length === 0 && (
          <div className="text-center p-8 bg-white rounded border border-dashed">
            <p>You are not enrolled in any classes yet.</p>
            <p className="text-sm text-gray-400">Ask your teacher to add: {user.email}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StudentSubjectCard = ({ subject, email }) => {
  const [stats, setStats] = useState({ total: 0, present: 0 });

  useEffect(() => {
    const q = query(collection(db, ATTENDANCE_COLLECTION), where('subjectId', '==', subject.id));
    return onSnapshot(q, (snap) => {
      let total = 0, present = 0;
      snap.docs.forEach(doc => {
        const record = doc.data().records?.[email];
        if (record) {
          total++;
          if (record === 'Present') present++;
        }
      });
      setStats({ total, present });
    });
  }, [subject, email]);

  const pct = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);

  return (
    <div className="bg-white p-6 rounded shadow flex justify-between items-center">
      <div>
        <h3 className="font-bold text-lg">{subject.name}</h3>
        <p className="text-gray-500 text-sm">{subject.code}</p>
      </div>
      <div className="text-right">
        <span className={`text-2xl font-bold ${pct < 75 ? 'text-red-500' : 'text-green-500'}`}>{pct}%</span>
        <p className="text-xs text-gray-400">{stats.present}/{stats.total} Classes</p>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 4. MAIN APP SHELL
// ------------------------------------------------------------------

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch extra profile data (role)
        return onSnapshot(doc(db, USERS_COLLECTION, u.uid), (doc) => {
          if (doc.exists()) setUserProfile(doc.data());
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

  if (!user || !userProfile) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="bg-white shadow border-b h-16 flex items-center justify-between px-6 sticky top-0">
         <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <School /> UniAttend
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
               <div className="text-sm font-bold">{userProfile.name}</div>
               <div className="text-xs text-gray-500 uppercase">{userProfile.role}</div>
            </div>
            <button onClick={() => signOut(auth)} className="p-2 text-gray-500 hover:text-red-600"><LogOut/></button>
         </div>
      </nav>

      <main className="py-6">
         {userProfile.role === 'teacher' ? <TeacherDashboard user={user} /> : <StudentDashboard user={user} />}
      </main>
    </div>
  );
}
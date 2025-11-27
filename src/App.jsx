import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithCustomToken,
  sendPasswordResetEmail 
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
  deleteDoc,
  serverTimestamp,
  getDocs 
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
  AlertCircle,
  Users,
  Trash2,
  Edit2,
  Clock,
  X,
  Save,
  Hash,
  CreditCard,
  Filter,
  Zap,
  BarChart3 
} from 'lucide-react';

// ------------------------------------------------------------------
// 1. CONFIGURATION & SETTINGS
// ------------------------------------------------------------------

const ALLOWED_DOMAIN = "@gmail.com"; 

// ✅ YOUR REAL KEYS
const firebaseConfig = {
  apiKey: "AIzaSyCZHB5AeTDTimX3VVKE4EhXqamm-0P49zY",
  authDomain: "uni-attend.firebaseapp.com",
  projectId: "uni-attend",
  storageBucket: "uni-attend.firebasestorage.app",
  messagingSenderId: "522933086650",
  appId: "1:522933086650:web:29c9ff0c248df3a2b49583",
  measurementId: "G-CRV8XCPNGS"
};

// Data Constants
const TEACHER_SCHOOLS = [
  "School of Engineering",
  "School of Law and Studies",
  "Marine Engineering"
];

const STUDENT_DEPARTMENTS = [
  "Information Technology Engineering",
  "Computer Science Engineering",
  "Electrical Engineering",
  "Electronics and Communication Engineering",
  "Mechanical Engineering",
  "Fire and Safety Engineering"
];

const SEMESTERS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

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

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(); return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const generatePDF = async (title, headers, data, fileName) => {
  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
    doc.autoTable({
      startY: 36,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [66, 133, 244] },
      styles: { fontSize: 10, cellPadding: 3 },
    });
    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("PDF Error:", error);
    alert("Error generating PDF.");
  }
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
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      setError(`Access restricted. Use email ending in ${ALLOWED_DOMAIN}`);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, USERS_COLLECTION, user.uid), {
          uid: user.uid,
          name,
          email,
          role,
          createdAt: serverTimestamp(),
          onboardingComplete: false
        });
        await updateProfile(user, { displayName: name });
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', '').replace('auth/', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent! Check your inbox.");
      setError('');
    } catch (err) {
      setError(err.message.replace('Firebase:', '').replace('auth/', ''));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full"><School className="text-white w-8 h-8" /></div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">SOE ATTEND</h1>
        <p className="text-center text-gray-500 mb-6">{isLogin ? 'Sign In' : 'Create Account'}</p>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 flex gap-2"><AlertCircle size={16}/>{error}</div>}
        {info && <div className="bg-green-50 text-green-600 p-3 rounded text-sm mb-4 flex gap-2"><CheckCircle size={16}/>{info}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" required className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole('student')} className={`p-2 rounded border ${role === 'student' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'text-gray-600'}`}>Student</button>
                <button type="button" onClick={() => setRole('teacher')} className={`p-2 rounded border ${role === 'teacher' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'text-gray-600'}`}>Teacher</button>
              </div>
            </>
          )}
          <input type="email" placeholder={`Email`} required className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="w-full border p-2 rounded" value={password} onChange={e => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        {isLogin && (
          <div className="text-center mt-3">
            <button 
              type="button" 
              onClick={handleResetPassword}
              className="text-sm text-gray-500 hover:text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-blue-600 text-sm mt-4 hover:underline">
          {isLogin ? "Need an account? Sign Up" : "Have an account? Login"}
        </button>
      </div>
    </div>
  );
};

// --- ONBOARDING SCREEN ---
const OnboardingScreen = ({ user, userProfile }) => {
  const [dept, setDept] = useState('');
  const [sem, setSem] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [regNo, setRegNo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updateData = { onboardingComplete: true };

    if (userProfile.role === 'teacher') {
      if (!dept) return;
      updateData.department = dept;
    } else {
      if (!dept || !sem || !rollNo || !regNo) return;
      updateData.department = dept;
      updateData.semester = sem;
      updateData.rollNo = rollNo;
      updateData.regNo = regNo;
    }
    
    await updateDoc(doc(db, USERS_COLLECTION, user.uid), updateData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Complete Profile</h2>
        <p className="text-gray-500 mb-6 text-sm">
          {userProfile.role === 'teacher' ? "Select your School/Department." : "Enter your academic details."}
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {userProfile.role === 'teacher' ? "School / Department" : "Engineering Stream"}
            </label>
            <select required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={dept} onChange={e => setDept(e.target.value)}>
              <option value="">Select Option</option>
              {userProfile.role === 'teacher' 
                ? TEACHER_SCHOOLS.map(d => <option key={d} value={d}>{d}</option>)
                : STUDENT_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)
              }
            </select>
          </div>

          {userProfile.role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={sem} onChange={e => setSem(e.target.value)}>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label>
                  <input type="number" required placeholder="e.g. 42" className="w-full border p-2 rounded" value={rollNo} onChange={e => setRollNo(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reg No</label>
                  <input type="text" required placeholder="e.g. ABC12345" className="w-full border p-2 rounded" value={regNo} onChange={e => setRegNo(e.target.value)} />
                </div>
              </div>
            </>
          )}

          <button disabled={loading} className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- TEACHER DASHBOARD ---
const TeacherDashboard = ({ user, userProfile }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubDept, setNewSubDept] = useState(STUDENT_DEPARTMENTS[0]);
  const [newSubSem, setNewSubSem] = useState(SEMESTERS[0]);

  const [editingSubject, setEditingSubject] = useState(null);
  const [editName, setEditName] = useState('');

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
      code: `${newSubName.substring(0,3).toUpperCase()}-${newSubSem}`,
      department: newSubDept,
      semester: newSubSem,
      teacherId: user.uid,
      teacherName: userProfile.name
    });
    setNewSubName('');
    setIsCreating(false);
  };

  const deleteSubject = async (e, subjectId) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this class?")) {
      await deleteDoc(doc(db, SUBJECTS_COLLECTION, subjectId));
    }
  };

  const startEditing = (e, sub) => {
    e.stopPropagation();
    setEditingSubject(sub.id);
    setEditName(sub.name);
  };

  const saveEdit = async (e) => {
    e.stopPropagation();
    if (!editName) return;
    await updateDoc(doc(db, SUBJECTS_COLLECTION, editingSubject), { name: editName });
    setEditingSubject(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{userProfile.name}'s Dashboard</h1>
          <p className="text-sm text-gray-500">{userProfile.department}</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20}/> New Class
        </button>
      </div>

      {isCreating && (
        <form onSubmit={createSubject} className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in">
          <h3 className="font-bold text-gray-700 mb-4">Create New Class</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Subject Name</label>
              <input className="w-full border p-2 rounded" placeholder="e.g. Data Structures" value={newSubName} onChange={e => setNewSubName(e.target.value)}/>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stream</label>
              <select className="w-full border p-2 rounded" value={newSubDept} onChange={e => setNewSubDept(e.target.value)}>
                {STUDENT_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Semester</label>
              <select className="w-full border p-2 rounded" value={newSubSem} onChange={e => setNewSubSem(e.target.value)}>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700">Create</button>
            <button type="button" onClick={() => setIsCreating(false)} className="bg-gray-100 text-gray-600 px-6 py-2 rounded hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      )}

      {selectedSubject ? (
        <SubjectManager subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(sub => (
            <div key={sub.id} onClick={() => setSelectedSubject(sub)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => startEditing(e, sub)} className="p-1.5 bg-gray-100 hover:bg-blue-100 text-blue-600 rounded"><Edit2 size={14}/></button>
                <button onClick={(e) => deleteSubject(e, sub.id)} className="p-1.5 bg-gray-100 hover:bg-red-100 text-red-600 rounded"><Trash2 size={14}/></button>
              </div>
              <div className="flex justify-between items-start mb-4">
                 <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><BookOpen/></div>
                 <div className="text-right">
                   <span className="block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold mb-1">{sub.semester}</span>
                 </div>
              </div>
              {editingSubject === sub.id ? (
                <div className="flex items-center gap-2 mb-2" onClick={e => e.stopPropagation()}>
                  <input className="border p-1 rounded text-sm w-full" value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                  <button onClick={saveEdit} className="text-green-600"><Save size={16}/></button>
                  <button onClick={() => setEditingSubject(null)} className="text-gray-400"><X size={16}/></button>
                </div>
              ) : (
                <h3 className="font-bold text-lg text-gray-800">{sub.name}</h3>
              )}
              <p className="text-xs text-gray-500 mt-1 truncate">{sub.department}</p>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                 <span className="text-xs text-gray-400 font-mono">{sub.code}</span>
                 <span className="text-sm text-blue-600 font-medium">Enter Class →</span>
              </div>
            </div>
          ))}
          {subjects.length === 0 && (
             <div className="col-span-full text-center py-12 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                <BookOpen className="mx-auto mb-2 opacity-20" size={48}/>
                <p>No subjects found. Create one to start teaching.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

const SubjectManager = ({ subject, onBack }) => {
  const [date, setDate] = useState(formatDate(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [attendance, setAttendance] = useState({});
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [quickAbsentInput, setQuickAbsentInput] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);

  // 1. Fetch Students
  useEffect(() => {
    const q = query(
      collection(db, USERS_COLLECTION), 
      where('role', '==', 'student'),
      where('department', '==', subject.department),
      where('semester', '==', subject.semester)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      let studentList = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      // Sort by Roll Number
      studentList.sort((a, b) => {
        const r1 = a.rollNo || "0";
        const r2 = b.rollNo || "0";
        return r1.localeCompare(r2, undefined, { numeric: true });
      });
      setStudents(studentList);
      setLoadingStudents(false);
    });
    return () => unsub();
  }, [subject]);

  // 2. Fetch Attendance
  const attendanceId = `${subject.id}_${date}`;

  useEffect(() => {
    return onSnapshot(doc(db, ATTENDANCE_COLLECTION, attendanceId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAttendance(data.records || {});
        if(data.startTime) setStartTime(data.startTime);
        if(data.endTime) setEndTime(data.endTime);
      } else {
        // DEFAULT: Everyone is Present!
        const defaultPresence = {};
        students.forEach(s => defaultPresence[s.uid] = 'Present');
        setAttendance(defaultPresence);
      }
    });
  }, [subject, date, students]);

  const toggleAbsent = (uid) => {
    setAttendance(prev => ({
      ...prev,
      [uid]: prev[uid] === 'Absent' ? 'Present' : 'Absent'
    }));
  };

  const applyQuickAbsent = () => {
    if (!quickAbsentInput.trim()) return;
    
    const absenteesRolls = quickAbsentInput.split(',').map(s => s.trim());
    const newAttendance = { ...attendance };
    let markedCount = 0;

    students.forEach(s => {
      if (absenteesRolls.includes(String(s.rollNo))) {
        newAttendance[s.uid] = 'Absent';
        markedCount++;
      } else {
        newAttendance[s.uid] = 'Present';
      }
    });

    setAttendance(newAttendance);
    setQuickAbsentInput(''); 
    alert(`Applied! ${markedCount} students marked absent. Others marked present.`);
  };

  const save = async () => {
    await setDoc(doc(db, ATTENDANCE_COLLECTION, attendanceId), {
      subjectId: subject.id,
      date,
      startTime,
      endTime,
      records: attendance,
      lastUpdated: serverTimestamp()
    });
    alert('Attendance Saved Successfully!');
  };

  const downloadFullReport = async () => {
    setLoadingReport(true);
    try {
      // 1. Fetch all attendance records for this subject
      const q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('subjectId', '==', subject.id)
      );
      const snap = await getDocs(q);
      const allRecords = snap.docs.map(d => d.data());
      const totalClasses = allRecords.length;

      // 2. Calculate stats for each student
      const reportData = students.map(s => {
        let present = 0;
        let absent = 0;
        
        allRecords.forEach(record => {
          if (record.records[s.uid] === 'Present') present++;
          else if (record.records[s.uid] === 'Absent') absent++;
        });

        // Use totalClasses as denominator (assuming student enrolled from start)
        // Or present + absent if they missed some due to late enrollment (simplified here)
        const total = present + absent; // Using actual marked records
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return [
          s.rollNo || '-',
          s.name,
          totalClasses, // Total classes held by teacher
          present,
          absent,
          `${percentage}%`
        ];
      });

      // 3. Generate PDF
      await generatePDF(
        `Consolidated Attendance Report: ${subject.name}`,
        ['Roll No', 'Name', 'Total Classes', 'Present', 'Absent', 'Percentage'],
        reportData,
        `Full_Report_${subject.code}`
      );

    } catch (err) {
      console.error(err);
      alert("Error generating full report");
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 min-h-[500px]">
      <div className="p-6 border-b flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full bg-white shadow-sm"><ChevronLeft/></button>
          <div>
            <h2 className="font-bold text-xl text-gray-800">{subject.name}</h2>
            <p className="text-xs text-gray-500">{subject.department} • {subject.semester}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Controls */}
        <div className="flex flex-col xl:flex-row justify-between mb-6 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm">
               <Calendar className="text-gray-400 ml-2" size={16}/>
               <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-1 outline-none font-medium text-gray-700 text-sm"/>
            </div>
            <div className="flex items-center gap-2 bg-white border p-1 rounded-lg shadow-sm">
               <Clock className="text-gray-400 ml-2" size={16}/>
               <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="p-1 outline-none font-medium text-gray-700 text-sm"/>
               <span className="text-gray-400">-</span>
               <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="p-1 outline-none font-medium text-gray-700 text-sm"/>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm font-medium transition-transform active:scale-95">
              <CheckCircle size={18}/> Save
            </button>
            <button onClick={downloadFullReport} className="text-blue-600 bg-white border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-2 font-medium">
              {loadingReport ? <Loader2 className="animate-spin" size={18}/> : <BarChart3 size={18}/>} Full History
            </button>
          </div>
        </div>

        {/* Quick Absent Form */}
        <div className="mb-6 bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm whitespace-nowrap">
              <Zap size={18} className="fill-red-600"/> Quick Mark Absent
            </div>
            <input 
              className="flex-1 border border-red-200 p-2.5 rounded-lg text-sm w-full focus:ring-2 focus:ring-red-500 outline-none bg-white placeholder-gray-400" 
              placeholder="Type roll numbers separated by comma (e.g. 5, 12, 33)"
              value={quickAbsentInput}
              onChange={e => setQuickAbsentInput(e.target.value)}
            />
            <button 
              onClick={applyQuickAbsent}
              className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm whitespace-nowrap transition-colors"
            >
              Apply
            </button>
          </div>
          <p className="text-xs text-red-400 mt-2 ml-1">* Enters specific absentees instantly. Everyone else will be marked Present.</p>
        </div>

        {/* Student List */}
        {loadingStudents ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto"/></div> : (
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 text-xs font-bold text-gray-500 bg-gray-50 p-4 border-b uppercase tracking-wider">
               <div className="col-span-2">Roll No</div>
               <div className="col-span-7">Student Details</div>
               <div className="col-span-3 text-center">Mark Absent</div>
            </div>
            {students.map(s => {
              const isAbsent = attendance[s.uid] === 'Absent';
              return (
                <div key={s.uid} 
                  onClick={() => toggleAbsent(s.uid)}
                  className={`grid grid-cols-12 items-center p-4 border-b last:border-0 cursor-pointer transition-colors ${isAbsent ? 'bg-red-50 hover:bg-red-100' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="col-span-2">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 font-bold">{s.rollNo || "-"}</span>
                  </div>
                  <div className="col-span-7">
                    <div className={`font-bold ${isAbsent ? 'text-red-700' : 'text-gray-800'}`}>{s.name}</div>
                    <div className="text-xs text-gray-500">{s.regNo || "No Reg ID"}</div>
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${isAbsent ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'}`}>
                      {isAbsent && <CheckCircle size={14} className="text-white"/>}
                    </div>
                  </div>
                </div>
              );
            })}
            {students.length === 0 && (
              <div className="p-12 text-center">
                <Users className="mx-auto text-gray-300 mb-2" size={48}/>
                <p className="text-gray-500">No students found in {subject.semester} - {subject.department}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- STUDENT DASHBOARD ---
const StudentDashboard = ({ user, userProfile }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (!userProfile.department || !userProfile.semester) return;
    const q = query(
      collection(db, SUBJECTS_COLLECTION), 
      where('department', '==', userProfile.department),
      where('semester', '==', userProfile.semester)
    );
    const unsub = onSnapshot(q, (snap) => {
      setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userProfile]);

  const downloadConsolidated = async () => {
    setLoadingReport(true);
    try {
      const reportData = [];

      for (const sub of subjects) {
        const q = query(
          collection(db, ATTENDANCE_COLLECTION),
          where('subjectId', '==', sub.id)
        );
        const snap = await getDocs(q);
        let total = 0;
        let present = 0;
        
        snap.docs.forEach(doc => {
           const record = doc.data();
           // Check if student has a record for this date
           if (record.records && record.records[user.uid]) {
             total++; 
             if (record.records[user.uid] === 'Present') present++;
           }
        });
        
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        reportData.push([
          sub.name,
          sub.code,
          total,
          present,
          `${pct}%`
        ]);
      }

      await generatePDF(
        `Consolidated Attendance: ${userProfile.name} (${userProfile.semester})`,
        ['Subject', 'Code', 'Total Classes', 'Attended', 'Percentage'],
        reportData,
        `Consolidated_Attendance_${userProfile.rollNo}`
      );

    } catch (e) {
      console.error(e);
      alert("Error generating report. Please try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
         <div>
           <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
           <p className="text-sm text-gray-500">{userProfile.department} • {userProfile.semester}</p>
         </div>
         <button 
            onClick={downloadConsolidated} 
            disabled={loadingReport || subjects.length === 0}
            className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 font-medium transition-colors shadow-sm"
         >
            {loadingReport ? <Loader2 className="animate-spin" size={18}/> : <FileText size={18}/>} 
            Consolidated Report
         </button>
      </div>
      
      {selectedSubject ? (
        <StudentSubjectDetail subject={selectedSubject} user={user} onBack={() => setSelectedSubject(null)} />
      ) : (
        <div className="grid gap-4">
          {subjects.map(sub => (
            <StudentSubjectCard key={sub.id} subject={sub} user={user} onClick={() => setSelectedSubject(sub)}/>
          ))}
          {subjects.length === 0 && (
            <div className="text-center p-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <School className="text-gray-400 mx-auto mb-4" size={32}/>
              <p className="font-semibold text-gray-700">No classes found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StudentSubjectCard = ({ subject, user, onClick }) => {
  const [stats, setStats] = useState({ total: 0, present: 0 });

  useEffect(() => {
    const q = query(collection(db, ATTENDANCE_COLLECTION), where('subjectId', '==', subject.id));
    return onSnapshot(q, (snap) => {
      let total = 0, present = 0;
      snap.docs.forEach(doc => {
        const record = doc.data().records?.[user.uid];
        if (record) {
          total++;
          if (record === 'Present') present++;
        }
      });
      setStats({ total, present });
    });
  }, [subject, user]);

  const pct = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
  const color = pct >= 75 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div onClick={onClick} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className="bg-blue-50 p-4 rounded-xl text-blue-600"><BookOpen size={24}/></div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">{subject.name}</h3>
          <p className="text-gray-500 text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block mt-1">{subject.code}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-2xl font-bold ${color}`}>{pct}%</span>
        <p className="text-xs text-gray-400 font-medium">{stats.present}/{stats.total} Classes</p>
      </div>
    </div>
  );
};

const StudentSubjectDetail = ({ subject, user, onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, ATTENDANCE_COLLECTION), where('subjectId', '==', subject.id));
    return onSnapshot(q, (snap) => {
      const records = [];
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.records && data.records[user.uid]) {
          records.push({ 
            date: data.date, 
            startTime: data.startTime || '', 
            endTime: data.endTime || '',
            status: data.records[user.uid] 
          });
        }
      });
      records.sort((a,b) => new Date(b.date) - new Date(a.date));
      setHistory(records);
      setLoading(false);
    });
  }, [subject, user]);

  const downloadMyPDF = async () => {
    const data = history.map(h => [`${h.date} ${h.startTime}`, h.status]);
    await generatePDF(`Attendance Report: ${subject.name}`, ['Date/Time', 'Status'], data, `${subject.name}_Attendance`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg min-h-[500px] border border-gray-100">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all"><ChevronLeft/></button>
          <h2 className="font-bold text-lg text-gray-800">{subject.name} History</h2>
        </div>
        <button onClick={downloadMyPDF} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-all">
          <Download size={16}/> Download PDF
        </button>
      </div>
      <div className="p-6">
        {loading ? <div className="text-center p-4"><Loader2 className="animate-spin mx-auto text-blue-600"/></div> : (
          <div className="space-y-2">
            {history.map((record, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition bg-white">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-400"/>
                  <div>
                    <span className="font-medium text-gray-700 block">{record.date}</span>
                    <span className="text-xs text-gray-400">{record.startTime} - {record.endTime}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {record.status}
                </span>
              </div>
            ))}
            {history.length === 0 && <p className="text-center text-gray-400 mt-8">No records found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP SHELL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      }
    };
    initAuth();

    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        return onSnapshot(doc(db, USERS_COLLECTION, u.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data());
          }
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;

  if (!user || !userProfile) return <AuthScreen />;
  
  if (!userProfile.onboardingComplete) {
    return <OnboardingScreen user={user} userProfile={userProfile} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="bg-white shadow border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50">
         <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <School /> SOE ATTEND
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
               <div className="text-sm font-bold">{userProfile.name}</div>
               <div className="text-xs text-gray-500 uppercase bg-gray-100 px-2 rounded inline-block">{userProfile.role}</div>
            </div>
            <button onClick={() => signOut(auth)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><LogOut size={20}/></button>
         </div>
      </nav>

      <main className="py-6">
         {userProfile.role === 'teacher' ? <TeacherDashboard user={user} userProfile={userProfile} /> : <StudentDashboard user={user} userProfile={userProfile} />}
      </main>
    </div>
  );
}
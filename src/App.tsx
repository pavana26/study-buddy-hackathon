import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, signOut
} from 'firebase/auth';
import { ref, push, onValue } from 'firebase/database';
import { auth, db } from './firebase';
import { Brain } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'login' | 'name' | 'profile' | 'dashboard'>('login');
  const [profile, setProfile] = useState({
    subjects: [] as string[],
    level: ''
  });
  const [matches, setMatches] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && step === 'login') {
        setStep('profile');
      }
    });
    return unsubscribe;
  }, []);

  // const login = async () => {
  //   try {
  //     setLoading(true);
  //     await signInWithPopup(auth, googleProvider);
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     setLoading(false);
  //   }
  // };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setStep('login');
      setProfile({ subjects: [], level: '' });
      setMatches([]);
      setAllUsers([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const saveProfile = async () => {
    if (profile.subjects.length === 0 || !profile.level) return;
    
    try {
      await push(ref(db, 'studyBuddies'), {
        ...profile,
        userId: user!.uid,
        userName: user!.displayName || user!.email,
        timestamp: Date.now()
      });
      setStep('dashboard');
    } catch (error) {
      console.error('Profile save error:', error);
    }
  };

  useEffect(() => {
  if (step === 'dashboard' && user && profile.level) {
    const buddiesRef = ref(db, 'studyBuddies');
    
    const unsubscribe = onValue(buddiesRef, (snapshot) => {
      let allBuddies: any[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data) allBuddies.push({ id: childSnapshot.key, ...data });
      });
      
      // 🚀 
      const demoUsers = [
        { id: 'demo1', userName: 'Alex Johnson 🇺🇸', subjects: ['Python'], level: 'Beginner', userId: 'demo-alex' },
        { id: 'demo2', userName: 'Maria Silva 🇧🇷', subjects: ['Python', 'JavaScript'], level: 'Intermediate', userId: 'demo-maria' },
        { id: 'demo3', userName: 'Hiro Tanaka 🇯🇵', subjects: ['Math'], level: 'Advanced', userId: 'demo-hiro' },
        { id: 'demo4', userName: 'Priya Patel 🇮🇳', subjects: ['Python'], level: 'Beginner', userId: 'demo-priya' }
      ];
      
      // Add demo users FIRST + real users (no duplicates)
      const finalBuddies = [...demoUsers, ...allBuddies.filter(b => 
        !demoUsers.some(demo => demo.userId === b.userId)
      )];
      
      setAllUsers(finalBuddies.filter(b => b.userId !== user.uid));
      
      const smartMatches: any[] = [];
      finalBuddies.forEach((buddy) => {
        if (buddy.userId === user.uid || !buddy.level) return;
        
        let levelMatch = false;
        if (profile.level === 'Beginner' && buddy.level === 'Beginner') {
          levelMatch = true;
        } else if (profile.level === 'Intermediate' && ['Beginner', 'Intermediate'].includes(buddy.level)) {
          levelMatch = true;
        } else if (profile.level === 'Advanced' && buddy.level === 'Advanced') {
          levelMatch = true;
        }
        
        let subjectMatch = false;
        if (buddy.subjects && Array.isArray(buddy.subjects)) {
          subjectMatch = buddy.subjects.some((s: string) => profile.subjects.includes(s));
        } else if (typeof buddy.subjects === 'string') {
          subjectMatch = profile.subjects.includes(buddy.subjects);
        }
        
        if (levelMatch && subjectMatch) {
          smartMatches.push(buddy);
        }
      });
      
      setMatches(smartMatches.slice(0, 3));
    });
    
    return () => unsubscribe();
  }
}, [step, profile, user]);

      
     

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;

  if (step === 'login') return <Login setUser={setUser} setProfile={setProfile} setStep={setStep} setMatches={setMatches} setAllUsers={setAllUsers} />;
  if (step === 'name') return <NameEntry user={user} setUser={setUser} setStep={setStep} setProfile={setProfile} />;
  if (step === 'profile') return <Profile profile={profile} setProfile={setProfile} onSave={saveProfile} user={user} setStep={setStep} />;
  return <Dashboard profile={profile} matches={matches} allUsers={allUsers} setStep={setStep} logout={logout} />;
}


const Login = ({ setUser, setProfile, setStep }: any) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
    <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-12 max-w-md w-full text-center text-white shadow-2xl">
      <div className="w-24 h-24 bg-white/30 rounded-2xl flex items-center justify-center mx-auto mb-8">
        <Brain className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-bold mb-4">Study Buddy</h1>
      
      <div className="space-y-6 mb-12">
        <h2 className="text-3xl font-bold leading-tight">Want a study buddy?</h2>
        <p className="text-xl opacity-90">AI-powered matching for Python, Math, JS and more</p>
      </div>
      
      <button 
        onClick={() => {
          setUser({uid: 'demo1', displayName: ''});  
          setProfile({subjects: [], level: ''});
          setStep('name');  
        }} 
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 px-8 rounded-2xl font-bold text-xl shadow-xl hover:scale-105 transition-all"
      >
        🎯 Find Your Study Buddy Now
      </button>
      
      <div className="text-xs mt-8 opacity-75 space-y-1">
        <p>🌍 Global students • Smart matching</p>
        <p>✅ Level-specific AI coach</p>
      </div>
    </div>
  </div>
);

const NameEntry = ({ user, setUser, setStep, setProfile }: any) => {
  const [name, setName] = useState('');

  const handleNext = () => {
    if (name.trim()) {
      setUser({...user, displayName: name});
      setProfile({subjects: [], level: ''});
      setStep('profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setStep('login')} className="mb-8 flex items-center text-indigo-600 hover:text-indigo-800 font-semibold text-lg">
          ← Back to Demo
        </button>
        
        <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          What's your name?
        </h1>
        
        <div className="space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full p-5 border-2 border-gray-200 rounded-2xl text-lg focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            onKeyPress={(e) => e.key === 'Enter' && handleNext()}
          />
          
          <button 
            onClick={handleNext}
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-6 rounded-2xl text-xl font-bold hover:scale-105 shadow-xl disabled:opacity-50"
          >
            Continue → Choose Subjects
          </button>
        </div>
      </div>
    </div>
  );
};

const Profile = ({ profile, setProfile, onSave, user, setStep }: any) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => setStep('login')}
        className="mb-8 flex items-center text-indigo-600 hover:text-indigo-800 font-semibold text-lg"
      >
        ← Back to Demo
      </button>
      
      <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
        Hi {user.displayName?.split(' ')[0] || 'there'}!
      </h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-lg font-semibold mb-4">Choose subjects (pick 1-3)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['Python', 'JavaScript', 'Math', 'Calculus', 'Biology'].map(subj => (
              <label key={subj} className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer group hover:shadow-md transition-all">
                <input 
                  type="checkbox" 
                  checked={profile.subjects.includes(subj)}
                  onChange={e => {
                    const newSubs = e.target.checked 
                      ? [...profile.subjects, subj]
                      : profile.subjects.filter((s: string) => s !== subj);
                    setProfile({...profile, subjects: newSubs});
                  }}
                  className="w-5 h-5 mr-3 text-indigo-600"
                />
                <span className="group-hover:text-indigo-700 font-medium">{subj}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">Selected: {profile.subjects.join(', ') || 'None'}</p>
        </div>
        
        <div>
          <label className="block text-lg font-semibold mb-4">Your skill level</label>
          <select 
            value={profile.level} 
            onChange={e => setProfile({...profile, level: e.target.value})}
            className="w-full p-5 border-2 border-gray-200 rounded-2xl text-lg focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">Select level</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <button 
          onClick={onSave}
          disabled={profile.subjects.length === 0 || !profile.level}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-6 rounded-2xl text-xl font-bold hover:scale-105 shadow-xl disabled:opacity-50"
        >
          🎯 Find Study Buddies!
        </button>
      </div>
    </div>
  </div>
);

const Dashboard = ({ profile, matches, allUsers, setStep, logout }: any) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <button onClick={() => setStep('login')} className="flex items-center text-indigo-600 hover:text-indigo-800 font-semibold text-lg">
          ← Back to Demo
        </button>
        <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
          Reset Demo
        </button>
      </div>
      
      <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Your Perfect Matches! 🎉
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🤖 LEVEL-SPECIFIC AI TIPS */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-l-8 border-emerald-400 order-2 lg:order-1">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-white font-bold text-xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">AI Study Coach</h2>
          </div>
          
          <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
            {profile.subjects.includes('Python') && (
              <div>
                <p><strong>🐍 Python • {profile.level}:</strong></p>
                {profile.level === 'Beginner' && (
                  <>
                    <p className="ml-4 text-sm">• Codecademy Python → 1 hour/day</p>
                    <p className="ml-4 text-sm">• 10 simple exercises → print, loops</p>
                  </>
                )}
                {profile.level === 'Intermediate' && (
                  <>
                    <p className="ml-4 text-sm">• LeetCode Easy + HackerRank</p>
                    <p className="ml-4 text-sm">• Build: CLI calculator, web scraper</p>
                  </>
                )}
                {profile.level === 'Advanced' && (
                  <>
                    <p className="ml-4 text-sm">• LeetCode Medium + PyTorch ML</p>
                    <p className="ml-4 text-sm">• Discord bot + FastAPI backend</p>
                  </>
                )}
              </div>
            )}
            
            {profile.subjects.includes('JavaScript') && (
              <div>
                <p><strong>⚡ JavaScript • {profile.level}:</strong></p>
                {profile.level === 'Beginner' && (
                  <>
                    <p className="ml-4 text-sm">• freeCodeCamp → variables, functions</p>
                    <p className="ml-4 text-sm">• Build: To-do list, calculator</p>
                  </>
                )}
                {profile.level === 'Intermediate' && (
                  <>
                    <p className="ml-4 text-sm">• React hooks + 3 projects/week</p>
                    <p className="ml-4 text-sm">• Codewars + TypeScript</p>
                  </>
                )}
                {profile.level === 'Advanced' && (
                  <>
                    <p className="ml-4 text-sm">• Next.js + Redux Toolkit</p>
                    <p className="ml-4 text-sm">• Full-stack app + testing</p>
                  </>
                )}
              </div>
            )}
            
            {profile.subjects.includes('Math') && (
              <div>
                <p><strong>📐 Math • {profile.level}:</strong></p>
                {profile.level === 'Beginner' && (
                  <>
                    <p className="ml-4 text-sm">• Khan Academy Algebra 1</p>
                    <p className="ml-4 text-sm">• 20 problems → solve + check</p>
                  </>
                )}
                {profile.level === 'Intermediate' && (
                  <>
                    <p className="ml-4 text-sm">• Trigonometry + matrices</p>
                    <p className="ml-4 text-sm">• Proofs + explain aloud</p>
                  </>
                )}
                {profile.level === 'Advanced' && (
                  <>
                    <p className="ml-4 text-sm">• Linear algebra + proofs</p>
                    <p className="ml-4 text-sm">• Math competitions daily</p>
                  </>
                )}
              </div>
            )}
            
            {profile.subjects.includes('Calculus') && (
              <div>
                <p><strong>📈 Calculus • {profile.level}:</strong></p>
                {profile.level === 'Beginner' && (
                  <>
                    <p className="ml-4 text-sm">• Limits + basic derivatives</p>
                    <p className="ml-4 text-sm">• Desmos graphs → visualize</p>
                  </>
                )}
                {profile.level === 'Intermediate' && (
                  <>
                    <p className="ml-4 text-sm">• Chain rule + integrals</p>
                    <p className="ml-4 text-sm">• 15 problems → optimize</p>
                  </>
                )}
                {profile.level === 'Advanced' && (
                  <>
                    <p className="ml-4 text-sm">• Multivariable + series</p>
                    <p className="ml-4 text-sm">• Proofs + applications</p>
                  </>
                )}
              </div>
            )}
            
            {profile.subjects.includes('Biology') && (
              <div>
                <p><strong>🧬 Biology • {profile.level}:</strong></p>
                {profile.level === 'Beginner' && (
                  <>
                    <p className="ml-4 text-sm">• Crash Course Biology videos</p>
                    <p className="ml-4 text-sm">• Draw cell diagrams</p>
                  </>
                )}
                {profile.level === 'Intermediate' && (
                  <>
                    <p className="ml-4 text-sm">• Anki flashcards → 50/day</p>
                    <p className="ml-4 text-sm">• Quizlet + pathways</p>
                  </>
                )}
                {profile.level === 'Advanced' && (
                  <>
                    <p className="ml-4 text-sm">• Research papers → summarize</p>
                    <p className="ml-4 text-sm">• Lab simulations + biotech</p>
                  </>
                )}
              </div>
            )}
            
            {profile.subjects.length === 0 && (
              <p className="italic text-gray-500">Select subjects → Get personalized tips!</p>
            )}
            
            <div className="pt-6 border-t-2 border-emerald-200 mt-6 p-4 bg-emerald-50 rounded-2xl">
              <p className="font-bold text-emerald-800 text-lg">
                🎯 Perfect for: {profile.subjects.join(', ')} • {profile.level} level
              </p>
            </div>
          </div>
        </div>

        {/* MATCHES + DEBUG */}
        <div className="space-y-6 order-1 lg:order-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Smart Matches
              </h3>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-bold text-lg">
                {matches.length}
              </span>
            </div>
            {matches.length === 0 ? (
              <p className="text-gray-500 italic">No matches yet... Try demo buttons! 👆</p>
            ) : (
              matches.map((match: any) => (
                <div key={match.id} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-3 shadow-sm">
                  <div className="font-bold text-lg">{match.userName}</div>
                  <div className="text-sm text-emerald-700 flex items-center">
                    {Array.isArray(match.subjects) ? match.subjects.join(', ') : match.subjects} 
                    • <span className="ml-1 font-semibold">{match.level}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">📊 All Study Buddies ({allUsers.length})</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {allUsers.slice(0, 8).map((buddy: any) => (
                <div key={buddy.id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 flex justify-between items-center">
                  <span className="font-medium">{buddy.userName}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                    {buddy.subjects?.join(',')} • {buddy.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default App;

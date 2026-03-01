import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- یوسەر و پاسوۆردی سەرەکی سیستم ---
const DEFAULT_ADMIN_USER = 'SarwarS';
const DEFAULT_ADMIN_PASS = 'Sarwar1234,';
const MASTER_RECOVERY_KEY = 'Sewastore2026';

// --- لۆگۆ و واژۆی سیستم ---
const STORE_LOGO = 'https://i.ibb.co/jkdXND2T/Gemini-Generated-Image-qfc03bqfc03bqfc0.png'; 
const STORE_SIGNATURE = 'https://i.ibb.co/qL4BDmBt/Sarwar-signature.png'; // واژۆی لایەنی یەکەم
const PARTY2_SIGNATURE = 'https://i.ibb.co/Hf65zpHf/Sarwar-signature.jpg'; // واژۆی لایەنی دووەم
const STORE_PHONE = '07701534434';
const STORE_NAME = 'Sewa Store';

// --- Firebase Initialization ---
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && Object.keys(JSON.parse(__firebase_config || '{}')).length > 0) {
    try { return JSON.parse(__firebase_config); } catch (e) {}
  }
  return {
    apiKey: "AIzaSyCT_W7fvUb0uvIusJ54y9YMBLdpHee-l_4",
    authDomain: "sewa-store-db.firebaseapp.com",
    projectId: "sewa-store-db",
    storageBucket: "sewa-store-db.firebasestorage.app",
    messagingSenderId: "265812583939",
    appId: "1:265812583939:web:b186de9462bb1c95f55036"
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sewastore-local-app';

// --- Icons (SVG Components) ---
const IconHome = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconBuilding = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
const IconOffice = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></svg>;
const IconShoppingCart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
const IconPackage = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconDollarSign = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconFileText = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconPrinter = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconList = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconCreditCard = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconLock = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconUser = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconContract = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M15.5 12.5 12 16l-3-1.5L8 18"/></svg>;
const IconDocs = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconAgent = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconBox = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconMenu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

// لیستى بەڵگەنامەکان
const DOC_TYPES = ['کارتی نیشتمانی', 'کارتی زانیاری', 'پاسپۆرت', 'کۆدی ئاسایش', 'مۆڵەتی شۆفێری', 'کارت بانکی', 'ناسنامەی باری شارستانی', 'ڕەگەزنامە', 'اقامە', 'بەڵگەنامەی سەربازی', 'ساڵانەی ئۆتۆمبێل'];

// --- Main Application ---
export default function App() {
  const [user, setUser] = useState(null); 
  const [isLogged, setIsLogged] = useState(false);
  const [loggedAppUser, setLoggedAppUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile Menu State
  
  // Custom Modal State
  const [modal, setModal] = useState({ show: false, type: 'alert', message: '', onConfirm: null });
  
  // State Collections
  const [companies, setCompanies] = useState([]);
  const [agents, setAgents] = useState([]); 
  const [offices, setOffices] = useState([]); // نوسینگەکان
  const [definedItems, setDefinedItems] = useState([]); 
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [capitalTx, setCapitalTx] = useState([]);
  const [appUsers, setAppUsers] = useState([]);

  // Form States (Multi-item support)
  const [editingId, setEditingId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null); 
  const [viewingInstallments, setViewingInstallments] = useState(null);
  const [viewingDocuments, setViewingDocuments] = useState(null); 
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [saleMode, setSaleMode] = useState('installment'); 
  const [purMode, setPurMode] = useState('cash'); 
  const [saleItems, setSaleItems] = useState([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const [purItems, setPurItems] = useState([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [purEntityType, setPurEntityType] = useState('company');

  // Payment Form States
  const [compTxDir, setCompTxDir] = useState('pay');
  const [agentTxDir, setAgentTxDir] = useState('receive');
  const [viaOfficeComp, setViaOfficeComp] = useState(false);
  const [viaOfficeAgent, setViaOfficeAgent] = useState(false);
  
  // Login States
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveredData, setRecoveredData] = useState(null);

  const getToday = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ckb');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Firestore Subscriptions
  useEffect(() => {
    if (!user) return;
    const unsubCompanies = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'companies'), snap => setCompanies(snap.docs.map(d => d.data())), err => console.error(err));
    const unsubAgents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'agents'), snap => setAgents(snap.docs.map(d => d.data())), err => console.error(err));
    const unsubOffices = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'offices'), snap => setOffices(snap.docs.map(d => d.data())), err => console.error(err));
    const unsubDefinedItems = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'definedItems'), snap => setDefinedItems(snap.docs.map(d => d.data())), err => console.error(err));
    const unsubPurchases = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'purchases'), snap => setPurchases(snap.docs.map(d => d.data())), err => console.error(err));
    const unsubSales = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), snap => setSales(snap.docs.map(d => d.data())), err => console.error(err));
    const unsubCapital = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'capitalTx'), snap => {
        const data = snap.docs.map(d => d.data());
        data.sort((a, b) => a.id.localeCompare(b.id)); 
        setCapitalTx(data);
    }, err => console.error(err));
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'appUsers'), snap => setAppUsers(snap.docs.map(d => d.data())), err => console.error(err));

    return () => { unsubCompanies(); unsubAgents(); unsubOffices(); unsubDefinedItems(); unsubPurchases(); unsubSales(); unsubCapital(); unsubUsers(); };
  }, [user]);

  const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, String(docId));
  const confirmAction = (message, onConfirm) => setModal({ show: true, type: 'confirm', message, onConfirm });
  const alertMsg = (message) => setModal({ show: true, type: 'alert', message, onConfirm: null });

  // Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const u = loginForm.user;
    const p = loginForm.pass;
    const foundUser = appUsers.find(user => user.username === u && user.password === p);

    if (foundUser) {
      setLoggedAppUser(foundUser); setIsLogged(true); setLoginError('');
    } else if (u === DEFAULT_ADMIN_USER && p === DEFAULT_ADMIN_PASS) {
      setLoggedAppUser({ username: u, role: 'admin' }); setIsLogged(true); setLoginError('');
    } else {
      setLoginError('ناوی بەکارهێنەر یان وشەی تێپەڕ هەڵەیە!');
    }
  };

  const handleRecover = (e) => {
    e.preventDefault();
    if (recoveryKey === MASTER_RECOVERY_KEY) {
      let dataToShow = [];
      if (appUsers.length > 0) dataToShow = [...appUsers];
      if (!dataToShow.find(u => u.username === DEFAULT_ADMIN_USER)) {
         dataToShow.push({ username: DEFAULT_ADMIN_USER, password: DEFAULT_ADMIN_PASS, role: 'admin' });
      }
      setRecoveredData(dataToShow); setLoginError('');
    } else {
      setLoginError('کۆدی گەڕاندنەوە هەڵەیە!'); setRecoveredData(null);
    }
  };

  // --- Printing Helper ---
  const printContent = (title, receiptNo, contentHTML, party1Name = STORE_NAME, party2Name = 'کڕیار/فرۆشیار', includeSignatures = true) => {
    const signatureImage = STORE_SIGNATURE ? `<img src="${STORE_SIGNATURE}" style="width: 120px; height: auto; margin: 5px auto; display: block;" alt="واژۆ" />` : '';
    const signature2Image = PARTY2_SIGNATURE ? `<img src="${PARTY2_SIGNATURE}" style="width: 120px; height: auto; margin: 5px auto; display: block;" alt="واژۆی لایەنی دووەم" />` : '';
    
    const signaturesBlock = includeSignatures ? `
      <div style="display: flex; justify-content: space-around; margin-top: 25px; padding-top: 15px; border-top: 2px dashed #1e3a8a; page-break-inside: avoid;">
        <div style="text-align: center; width: 250px; color: #0f172a;">
          <div style="font-weight: bold; margin-bottom: ${STORE_SIGNATURE ? '10px' : '35px'}; font-size: 16px; color: #0f172a;">واژۆی لایەنی یەکەم</div>
          ${signatureImage}
          <div style="border-top: 2px solid #0f172a; padding-top: 8px; font-weight: bold;">${party1Name}</div>
        </div>
        <div style="text-align: center; width: 250px; color: #0f172a;">
          <div style="font-weight: bold; margin-bottom: ${PARTY2_SIGNATURE ? '10px' : '35px'}; font-size: 16px; color: #0f172a;">واژۆی لایەنی دووەم</div>
          ${signature2Image}
          <div style="border-top: 2px solid #0f172a; padding-top: 8px; font-weight: bold;">${party2Name}</div>
        </div>
      </div>
    ` : '';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>${title}</title>
          <style>
            @media print { 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
              @page { size: auto; margin: 8mm; }
            }
            body { font-family: 'Calibri', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; color: #0f172a; background: #ffffff; }
            .receipt-container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; border-top: 8px solid #1e3a8a; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 25px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .header-logo { display: flex; align-items: center; gap: 15px; }
            .header-logo h1 { color: #f97316; margin: 0; font-size: 28px; font-weight: 900; }
            .header-logo p { color: #1e3a8a; margin: 4px 0 0 0; font-size: 15px; font-weight: bold; }
            .header-meta { text-align: left; background: #eff6ff; padding: 10px 15px; border-radius: 8px; border: 1px solid #bfdbfe; }
            .header-meta .title-badge { color: #1e3a8a; font-size: 16px; margin-bottom: 5px; display: block; font-weight: bold; }
            .header-meta p { margin: 2px 0; font-size: 13px; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 15px; margin-bottom: 25px; font-size: 14px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
            th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; font-size: 14px; }
            tr:last-child td { border-bottom: none; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; line-height: 1.6; color: #0f172a; font-size: 14px; }
            .info-box strong { color: #f97316; display: inline-block; width: 120px; font-weight: bold; }
            .thank-you { text-align: center; margin-top: 25px; color: #334155; font-size: 15px; }
            .contact-note { margin-top: 10px; font-size: 15px; font-weight: bold; color: #ffffff; background: #1e3a8a; padding: 10px; border-radius: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="header-logo">
                ${STORE_LOGO ? `<img src="${STORE_LOGO}" style="width: 100px; height: 100px; object-fit: contain; border-radius: 8px;" alt="Logo" onerror="this.style.display='none'" />` : ''}
                <div>
                  <h1>${STORE_NAME}</h1>
                  <p>مۆبایل و ئەلیکترۆنیات</p>
                </div>
              </div>
              <div class="header-meta">
                <span class="title-badge">${title}</span>
                <p>پسوڵە ژمارە: <span style="color:#f97316; font-weight:bold; font-size:16px;">${receiptNo || '-'}</span></p>
                <p>بەرواری چاپ: ${getToday()}</p>
              </div>
            </div>
            ${contentHTML}
            ${signaturesBlock}
            <div class="thank-you">
              سوپاس بۆ مامەڵەکردن لەگەڵمان. هیوای ڕۆژێکی خۆش.
              <div class="contact-note">
                بۆ هەر پێویستییەک تکایە پەیوەندیمان پێوە بکەن بە ژمارە مۆبایلی <span dir="ltr" style="font-size: 16px;">${STORE_PHONE}</span>
              </div>
            </div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 800);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- Derived Data & Helpers ---
  const inventory = useMemo(() => {
    const items = {};
    purchases.forEach(p => {
      const iList = p.items || [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty) }];
      iList.forEach(i => {
        if (!items[i.itemName]) items[i.itemName] = { itemName: i.itemName, totalQty: 0, costSum: 0, soldQty: 0 };
        items[i.itemName].totalQty += Number(i.qty);
        items[i.itemName].costSum += (Number(i.qty) * Number(i.price || i.unitPrice));
      });
    });
    sales.forEach(s => {
      const iList = s.items || [{ itemName: s.itemName, qty: s.qty, price: s.unitPrice || (s.price/s.qty) }];
      iList.forEach(i => {
        if (items[i.itemName]) items[i.itemName].soldQty += Number(i.qty);
      });
    });
    return Object.values(items).map(item => ({
      ...item, currentQty: item.totalQty - item.soldQty, avgCost: item.totalQty > 0 ? (item.costSum / item.totalQty) : 0
    })).filter(item => item.currentQty > 0 || item.soldQty > 0);
  }, [purchases, sales]);

  const currentCapital = useMemo(() => {
    return capitalTx.reduce((sum, tx) => (tx.type === 'purchase_debt' || tx.type === 'receive_office_loan' ? sum : sum + tx.amount), 0);
  }, [capitalTx]);

  const getSalePaidAmount = (saleId) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return 0;
    if (sale.saleType === 'cash') return sale.price;
    const receivedFromTx = capitalTx.filter(tx => tx.refId === saleId && (tx.type === 'receive_installment' || tx.type === 'receive_agent_payment')).reduce((sum, tx) => sum + tx.amount, 0);
    return (sale.advance || 0) + receivedFromTx;
  };

  const getCompanyDebt = (companyId) => {
    const totalBoughtOnDebt = purchases.filter(p => p.companyId === companyId && p.paymentType === 'debt').reduce((sum, p) => sum + p.total, 0);
    const totalPaidToCompany = Math.abs(capitalTx.filter(tx => tx.refId === companyId && tx.type === 'pay_company_debt').reduce((sum, tx) => sum + tx.amount, 0));
    const totalReceivedFromCompany = capitalTx.filter(tx => tx.refId === companyId && tx.type === 'receive_company_payment').reduce((sum, tx) => sum + tx.amount, 0);
    return totalBoughtOnDebt - totalPaidToCompany + totalReceivedFromCompany;
  };

  const getAgentDebt = (agentId) => {
    const totalCreditSales = sales.filter(s => s.saleType === 'credit' && s.agentId === agentId).reduce((sum, s) => sum + s.price, 0);
    const totalReceivedFromAgent = capitalTx.filter(tx => tx.type === 'receive_agent_payment' && tx.refId === agentId).reduce((sum, tx) => sum + tx.amount, 0);
    const totalPaidToAgent = Math.abs(capitalTx.filter(tx => tx.type === 'pay_agent_payment' && tx.refId === agentId).reduce((sum, tx) => sum + tx.amount, 0));
    const totalBoughtFromAgentOnDebt = purchases.filter(p => p.companyId === agentId && p.paymentType === 'debt').reduce((sum, p) => sum + p.total, 0);
    return (totalCreditSales + totalPaidToAgent) - (totalReceivedFromAgent + totalBoughtFromAgentOnDebt);
  };

  const getOfficeDebt = (officeId) => {
    const loans = capitalTx.filter(tx => tx.type === 'receive_office_loan' && tx.refId === officeId).reduce((sum, tx) => sum + tx.amount, 0);
    const payments = Math.abs(capitalTx.filter(tx => tx.type === 'pay_office_debt' && tx.refId === officeId).reduce((sum, tx) => sum + tx.amount, 0));
    return loans - payments;
  };

  const addTransaction = async (type, amount, desc, refId = null, note = '', exactId = null, existReceiptNo = null) => {
    const id = exactId || (Date.now().toString() + Math.random().toString().slice(2, 6));
    let rNo = existReceiptNo;
    if (!rNo) {
      const sameTypeTxs = capitalTx.filter(t => t.type === type);
      rNo = sameTypeTxs.length > 0 ? Math.max(...sameTypeTxs.map(t => t.receiptNo || 0)) + 1 : 1;
    }
    const data = { id, type, amount, date: getToday(), desc, refId, note, receiptNo: rNo };
    await setDoc(getDocRef('capitalTx', id), data);
    return data;
  };

  const deleteTransactionsByRef = async (refId) => {
    const txToDelete = capitalTx.filter(tx => tx.refId === refId);
    for (const tx of txToDelete) await deleteDoc(getDocRef('capitalTx', tx.id));
  };

  // --- Users, Companies, Agents, Offices, Items ---
  const handleSaveAppUser = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newAppUser = { id: editingId || Date.now().toString(), username: form.username.value, password: form.password.value, role: form.role.value };
    if (!editingId && appUsers.find(u => u.username === newAppUser.username)) return alertMsg('ئەم ناوە پێشتر بەکارهاتووە!');
    if (newAppUser.username === DEFAULT_ADMIN_USER) return alertMsg('ناتوانیت دەستکاری یوسەری سەرەکی سیستم بکەیت لێرەوە.');
    await setDoc(getDocRef('appUsers', newAppUser.id), newAppUser);
    setEditingId(null); form.reset();
  };
  const deleteAppUser = (id) => confirmAction('دڵنیایت لە سڕینەوەی ئەم بەکارهێنەرە؟', async () => await deleteDoc(getDocRef('appUsers', id)));

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newComp = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value };
    await setDoc(getDocRef('companies', newComp.id), newComp);
    setEditingId(null); form.reset();
  };
  const deleteCompany = (id) => confirmAction('دڵنیایت لە سڕینەوەی ئەم کۆمپانیایە؟', async () => await deleteDoc(getDocRef('companies', id)));

  const handleSaveAgent = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newAgent = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value, notes: form.notes.value };
    await setDoc(getDocRef('agents', newAgent.id), newAgent);
    setEditingId(null); form.reset();
  };
  const deleteAgent = (id) => confirmAction('دڵنیایت لە سڕینەوەی ئەم بریکارە؟', async () => await deleteDoc(getDocRef('agents', id)));

  const handleSaveOffice = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newOffice = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value };
    await setDoc(getDocRef('offices', newOffice.id), newOffice);
    setEditingId(null); form.reset();
  };
  const deleteOffice = (id) => confirmAction('دڵنیایت لە سڕینەوەی ئەم نوسینگە؟', async () => await deleteDoc(getDocRef('offices', id)));

  const handleSaveDefinedItem = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newItem = { id: editingId || Date.now().toString(), type: form.itemType.value, brand: form.brand.value, name: form.name.value };
    await setDoc(getDocRef('definedItems', newItem.id), newItem);
    setEditingId(null); form.reset();
  };
  const deleteDefinedItem = (id) => confirmAction('دڵنیایت لە سڕینەوەی ئەم کاڵایە؟', async () => await deleteDoc(getDocRef('definedItems', id)));

  // --- Purchases Logic (Multi-item) ---
  const addPurItem = () => setPurItems([...purItems, { id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const removePurItem = (id) => setPurItems(purItems.filter(i => i.id !== id));
  const updatePurItem = (id, field, value) => setPurItems(purItems.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    const form = e.target;
    const paymentType = purMode;
    const note = form.note.value;
    
    if (purItems.some(i => !i.itemName || !i.qty || !i.unitPrice)) return alertMsg('تکایە زانیاری هەموو کاڵاکان بە تەواوی پڕبکەرەوە.');
    
    let entityId = form.entityId?.value || '';
    let entityName = form.companyNameStr?.value || '';

    if (paymentType === 'debt' && !entityId) return alertMsg("بۆ کڕینی قەرز دەبێت لایەنێک هەڵبژێریت!");
    
    if (entityId) {
       if (purEntityType === 'company') entityName = companies.find(c => c.id === entityId)?.name || '';
       if (purEntityType === 'agent') entityName = agents.find(a => a.id === entityId)?.name || '';
    } else if (!entityName) {
       entityName = 'فرۆشیاری نەناسراو (کاش)';
    }
    
    const totalPrice = purItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
    const purToEdit = editingId ? purchases.find(p => p.id === editingId) : null;
    const rNo = purToEdit?.receiptNo || (purchases.length > 0 ? Math.max(...purchases.map(p => p.receiptNo || 0)) + 1 : 1);

    const newPurchase = {
      id: editingId || Date.now().toString(),
      companyId: entityId, companyName: entityName, entityType: purEntityType,
      items: purItems,
      itemName: purItems.length === 1 ? purItems[0].itemName : 'کڕینی جۆراوجۆر',
      qty: purItems.reduce((sum, i) => sum + Number(i.qty), 0),
      price: purItems.length === 1 ? Number(purItems[0].unitPrice) : 0,
      total: totalPrice, paymentType, note, date: getToday(), receiptNo: rNo
    };

    if (editingId) await deleteTransactionsByRef(editingId);
    await setDoc(getDocRef('purchases', newPurchase.id), newPurchase);
    setEditingId(null); setPurItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
    
    const txType = paymentType === 'cash' ? 'purchase_cash' : 'purchase_debt';
    await addTransaction(txType, -totalPrice, `کڕین لە: ${newPurchase.companyName}`, newPurchase.id, note, null, rNo);
    form.reset();
  };

  const deletePurchase = (id) => confirmAction('دڵنیایت لە سڕینەوەی ئەم کڕینە؟', async () => { await deleteDoc(getDocRef('purchases', id)); await deleteTransactionsByRef(id); });

  const printPurchase = (p) => {
    let currentDebt = 0;
    let phone = '-';
    
    if (p.companyId) {
        if (p.entityType === 'agent') {
            currentDebt = getAgentDebt(p.companyId);
            phone = agents.find(a => a.id === p.companyId)?.phone || '-';
        } else {
            currentDebt = getCompanyDebt(p.companyId);
            phone = companies.find(c => c.id === p.companyId)?.phone || '-';
        }
    }
    
    const itemsList = p.items || [{ itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty), total: p.total }];
    
    const html = `
      <div class="info-grid">
        <div class="info-box">
          <strong>ناوی فرۆشیار:</strong> ${p.companyName}<br/>
          <strong>مۆبایل:</strong> <span dir="ltr">${phone}</span><br/>
        </div>
        <div class="info-box">
          <strong>بەرواری کڕین:</strong> ${p.date}<br/>
          <strong>جۆری مامەڵە:</strong> <span style="color: ${p.paymentType === 'debt' ? '#f97316' : '#1e3a8a'}">${p.paymentType === 'debt' ? 'قەرز لەسەرمان' : 'نەختینە (کاش)'}</span><br/>
          ${p.paymentType === 'debt' ? `<strong>کۆی حسابی ئەم لایەنە:</strong> <span dir="ltr" style="color: #f97316; font-weight: bold; font-size: 16px;">$${currentDebt.toFixed(2)}</span>` : ''}
        </div>
      </div>
      <table>
        <tr><th>ناوی کاڵا</th><th>بڕ</th><th>نرخی تاک</th><th>کۆی گشتی</th></tr>
        ${itemsList.map(i => `<tr><td>${i.itemName}</td><td>${i.qty}</td><td>$${Number(i.unitPrice).toFixed(2)}</td><td style="font-weight:bold; color:#1e3a8a;">$${(Number(i.qty) * Number(i.unitPrice)).toFixed(2)}</td></tr>`).join('')}
        <tr><td colspan="3" style="text-align: left; font-weight: bold;">کۆی گشتی پسوڵە:</td><td style="font-weight:bold; font-size: 16px; color:#f97316;">$${p.total.toFixed(2)}</td></tr>
      </table>
      <div style="margin-top:15px; color:#334155;"><strong>تێبینی:</strong> ${p.note || '-'}</div>
    `;
    printContent('پسوڵەی کڕین', p.receiptNo, html, STORE_NAME, p.companyName, true);
  };

  // --- Sales Logic (Multi-item) ---
  const addSaleItem = () => setSaleItems([...saleItems, { id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const removeSaleItem = (id) => setSaleItems(saleItems.filter(i => i.id !== id));
  const updateSaleItem = (id, field, value) => {
    setSaleItems(saleItems.map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };
        if (field === 'itemName') {
           const stockItem = inventory.find(inv => inv.itemName === value);
           if(stockItem && stockItem.avgCost) updated.unitPrice = (stockItem.avgCost * 1.1).toFixed(2);
        }
        return updated;
      }
      return i;
    }));
  };

  const handleEditSale = (s) => {
     setEditingId(s.id);
     setSaleMode(s.saleType || 'installment');
     if (s.items && s.items.length > 0) {
        setSaleItems(s.items);
     } else {
        setSaleItems([{ id: Date.now(), itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty) }]);
     }
     window.scrollTo({top:0, behavior:'smooth'});
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();
    const form = e.target;
    const note = form.note.value;
    
    if (saleItems.some(i => !i.itemName || !i.qty || !i.unitPrice)) return alertMsg('تکایە زانیاری هەموو کاڵاکان بە تەواوی پڕبکەرەوە.');

    const oldSale = editingId ? sales.find(s => s.id === editingId) : null;
    const oldItems = oldSale?.items || (oldSale ? [{ itemName: oldSale.itemName, qty: oldSale.qty }] : []);
    
    for (const item of saleItems) {
      const oldQty = oldItems.find(oi => oi.itemName === item.itemName)?.qty || 0;
      const itemInStock = inventory.find(i => i.itemName === item.itemName);
      const availableQty = itemInStock ? itemInStock.currentQty + oldQty : 0;
      if (availableQty < Number(item.qty)) return alertMsg(`بڕی پێویست لە کۆگادا نییە بۆ کاڵای: ${item.itemName} !`);
    }

    const totalPrice = saleItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
    const rNo = oldSale?.receiptNo || (sales.length > 0 ? Math.max(...sales.map(s => s.receiptNo || 0)) + 1 : 1);

    let newSale = {
      id: editingId || Date.now().toString(),
      items: saleItems,
      itemName: saleItems.length === 1 ? saleItems[0].itemName : 'فرۆشتنی جۆراوجۆر',
      qty: saleItems.reduce((sum, i) => sum + Number(i.qty), 0),
      unitPrice: saleItems.length === 1 ? Number(saleItems[0].unitPrice) : 0,
      price: totalPrice, note, date: getToday(), receiptNo: rNo, saleType: saleMode, documents: oldSale?.documents || []
    };

    if (saleMode === 'installment') {
      const advance = parseFloat(form.advance.value) || 0;
      const months = parseInt(form.months.value) || 1;
      const monthlyAmount = (totalPrice - advance) / months;
      const installments = Array.from({ length: months }).map((_, i) => {
        const date = new Date(); date.setMonth(date.getMonth() + i + 1);
        return { id: Math.random().toString(), monthNum: i + 1, amount: monthlyAmount, dueDate: date.toISOString().split('T')[0] };
      });
      newSale = { ...newSale, customerName: form.customerName.value, phone: form.phone.value, address: form.address.value, advance, months, monthlyAmount, installments };
    } else if (saleMode === 'cash') {
      newSale = { ...newSale, customerName: form.customerName.value, phone: form.phone.value, address: form.address.value };
    } else if (saleMode === 'credit') {
      const agentId = form.agentId.value;
      const agent = agents.find(a => a.id === agentId);
      const creditDays = parseInt(form.creditDays.value) || 7;
      const dueDateObj = new Date(); dueDateObj.setDate(dueDateObj.getDate() + creditDays);
      newSale = { ...newSale, agentId, customerName: agent.name, phone: agent.phone, address: agent.address, creditDays, dueDate: dueDateObj.toISOString().split('T')[0] };
    }

    if (editingId) {
      const oldAdvanceTxs = capitalTx.filter(tx => tx.refId === editingId && (tx.type === 'sale_advance' || tx.type === 'sale_cash'));
      for (const tx of oldAdvanceTxs) await deleteDoc(getDocRef('capitalTx', tx.id));
    }
    
    await setDoc(getDocRef('sales', newSale.id), newSale);
    setEditingId(null); setSaleItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
    
    if (saleMode === 'installment' && newSale.advance > 0) {
      await addTransaction('sale_advance', newSale.advance, `پێشەکی فرۆشتن بە: ${newSale.customerName}`, newSale.id, note, null, rNo);
    } else if (saleMode === 'cash') {
      await addTransaction('sale_cash', totalPrice, `فرۆشتنی کاش بە: ${newSale.customerName}`, newSale.id, note, null, rNo);
    }
    form.reset();
  };

  const deleteSale = (id) => confirmAction('دڵنیایت؟ بە سڕینەوەی ئەم پسوڵەیە کاڵاکە دەگەڕێتەوە کۆگا.', async () => {
      await deleteDoc(getDocRef('sales', id)); await deleteTransactionsByRef(id);
  });

  const printSale = (s) => {
    const isCredit = s.saleType === 'credit';
    const isCash = s.saleType === 'cash';
    let balanceHTML = '';
    
    if (isCredit) {
       balanceHTML = `<strong>کۆی قەرزی بریکار:</strong> <span dir="ltr" style="color: #f97316; font-weight: bold; font-size: 16px;">$${getAgentDebt(s.agentId).toFixed(2)}</span>`;
    } else if (!isCash) {
       const currentBalance = s.price - getSalePaidAmount(s.id);
       balanceHTML = `<strong>بڕی قەرزی ماوە:</strong> <span dir="ltr" style="color: #f97316; font-weight: bold; font-size: 16px;">$${currentBalance.toFixed(2)}</span>`;
    }

    const itemsList = s.items || [{ itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty), price: s.price }];

    const html = `
      <div class="info-grid">
        <div class="info-box">
          <strong>ناوی ${isCredit ? 'بریکار' : 'کڕیار'}:</strong> ${s.customerName}<br>
          <strong>مۆبایل:</strong> <span dir="ltr">${s.phone}</span><br>
        </div>
        <div class="info-box">
          <strong>بەرواری پسوڵە:</strong> ${s.date}<br>
          <strong>جۆری فرۆشتن:</strong> ${isCash ? 'کاش' : (isCredit ? 'قەرز (بریکار)' : 'قیست')}<br>
          ${balanceHTML}
        </div>
      </div>
      <table>
        <tr><th>ناوی کاڵا</th><th>بڕ</th><th>نرخی تاک</th><th>کۆی نرخ</th></tr>
        ${itemsList.map(i => `<tr><td>${i.itemName}</td><td>${i.qty}</td><td>$${Number(i.unitPrice).toFixed(2)}</td><td style="font-weight:bold; color:#1e3a8a;">$${(Number(i.qty) * Number(i.unitPrice)).toFixed(2)}</td></tr>`).join('')}
        <tr style="background-color: #f8fafc;">
          <td colspan="3" style="text-align: left; font-weight: bold;">کۆی گشتی پسوڵە:</td>
          <td style="font-weight:bold; font-size: 16px; color:#f97316;">$${s.price.toFixed(2)}</td>
        </tr>
        ${s.saleType === 'installment' ? `
          <tr><td colspan="3" style="text-align: left;">پێشەکی وەرگیراو:</td><td style="color:#059669; font-weight:bold;">$${s.advance.toFixed(2)}</td></tr>
          <tr><td colspan="3" style="text-align: left;">قیستی مانگانە (${s.months} مانگ):</td><td style="color:#1e3a8a; font-weight:bold;">$${s.monthlyAmount.toFixed(2)}</td></tr>
        ` : ''}
        ${isCredit ? `<tr><td colspan="3" style="text-align: left;">وادەی گەڕاندنەوە:</td><td style="color:#f97316; font-weight:bold;" dir="ltr">${s.dueDate}</td></tr>` : ''}
      </table>
      <div style="margin-top:15px; color:#334155;"><strong>تێبینی:</strong> ${s.note || '-'}</div>
    `;
    printContent(isCash ? 'پسوڵەی فرۆشتن (کاش)' : (isCredit ? 'پسوڵەی فرۆشتن (قەرز)' : 'پسوڵەی فرۆشتن (قیست)'), s.receiptNo, html, STORE_NAME, s.customerName, true);
  };

  const printContract = (s) => {
    const itemsList = s.items || [{ itemName: s.itemName }];
    const itemNames = itemsList.map(i => i.itemName).join('، ');

    const html = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h2 style="font-size: 24px; font-weight: 900; color: #1e3a8a; text-decoration: underline; margin: 0;">گرێبەستی قیست</h2>
      </div>
      <div style="font-size: 14.5px; font-weight: bold; line-height: 1.8; color: #0f172a; text-align: justify; margin-bottom: 20px; padding: 15px 20px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
        <ol style="margin: 0; padding-right: 20px;">
          <li style="margin-bottom: 10px;">هەرکات لایەنی دووەم (<span style="color:#f97316">${s.customerName}</span>) پێویستی بە کارتی نیشتمانی هەبوو کە پێشتر وەک بارمتەیەک لای لایەنی یەکەم (<span style="color:#1e3a8a">${STORE_NAME}</span>) داینابوو تەنها مۆڵەتی شۆفێری لەبری وەردەگیرێت بە مەرجێک ماوەکەی بەسەرنەچوبێت یان ئەو بڕە پارەیەی لە قیستەکە ماوە وەک ئەمانەتێک دەبێت بیدات بە لایەنی یەکەم تا ئەو کاتەی دووبارە کارتی نیشتمانی دەگێڕێتەوە.</li>
          <li style="margin-bottom: 10px;">لایەنی دووەم بەڵێن دەدات کە پابەند بێت بە گەڕاندنەوەی قیستەکانی لە ماوەی دیاریکراوی خۆیدا هەر ٣٠ ڕۆژ جارێک بێ دواکەوتن ، نەدانی مووچە و دواکەوتنی مووچە و لێبڕینی مووچە و لاوازی بازاڕ یاخوود هەر هۆکارێکی دیکە نەکاتە بەهانە بۆ دواخستنی قیستەکانی.</li>
          <li style="margin-bottom: 10px;">لایەنی دووەم ئامێری ئاماژەپێکراوی (<span style="color:#1e3a8a">${itemNames}</span>) بێ هیچ کەم و کوڕییەک وەرگرت.</li>
          <li style="margin-bottom: 10px;">پێویستە لایەنی دووەم (<span style="color:#f97316">${s.customerName}</span>) کۆپی کارتی نیشتمانی و کارتی زانیاری بدات بە لایەنی یەکەم (<span style="color:#1e3a8a">${STORE_NAME}</span>) وە پێویستە وەک بارمتەیەک لایەنی دووەم (<span style="color:#f97316">${s.customerName}</span>) کارتی نیشتمانی اصلى بدات بە لایەنی یەکەم (<span style="color:#1e3a8a">${STORE_NAME}</span>) تا کۆتایی هاتنی ماوەی قیستەکە و پاکتاوکردنی هەژمارەکەی.</li>
          <li style="margin-bottom: 10px;">هەرکات لایەنی دووەم (<span style="color:#f97316">${s.customerName}</span>) ویستی بە هەر هۆکارێک ئەم گرێبەستە هەڵبووەشێنێتەوە ئەوا لایەنی یەکەم (<span style="color:#1e3a8a">${STORE_NAME}</span>) بە مافی خۆی دەزانێت کە بڕی پێشەکی وەرگیراو نەگەڕێنێتەوە بۆ لایەنی دووەم (<span style="color:#f97316">${s.customerName}</span>) وە کاڵای گەڕاوە بە نرخی ڕۆژ خەمڵاندنی بۆ دەکرێت و دەدرێت بە لایەنی دووەم (<span style="color:#f97316">${s.customerName}</span>).</li>
        </ol>
        <p style="margin-top: 15px; margin-bottom: 0; font-weight: 900; color: #1e3a8a; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
          هەردوو لایەن پاش خوێندنەوەی تەواوی خاڵەکان و تێگەیشتنیان وە بە تەواوی هەست و هۆش و پاش ڕەزامەندییان بە ویستی خۆیان لای خوارەوە واژۆیان کرد.
        </p>
      </div>
    `;
    printContent('گرێبەستی فرۆشتن', s.receiptNo, html, STORE_NAME, s.customerName, true);
  };

  const handleDocToggle = (docName) => {
     if (selectedDocs.some(d => d.name === docName)) {
         setSelectedDocs(selectedDocs.filter(d => d.name !== docName));
     } else {
         setSelectedDocs([...selectedDocs, { name: docName, fileUrl: null }]);
     }
  };

  const handleFileChange = async (e, docName) => {
     const file = e.target.files[0];
     if(!file) return;
     setUploadingDoc(docName);
     try {
       const safeFileName = `doc_${Date.now()}`;
       const fileRef = ref(storage, `artifacts/${appId}/public/data/documents/${viewingDocuments.id}/${safeFileName}`);
       await uploadBytes(fileRef, file);
       const url = await getDownloadURL(fileRef);
       setSelectedDocs(prev => prev.map(d => d.name === docName ? { ...d, fileUrl: url } : d));
     } catch (err) {
       console.error(err);
       alertMsg("کێشەیەک ڕوویدا لە بارکردنی وێنەکە. تکایە دڵنیابە کە یاساکانی Storage لە فایەربەیسەکەت ڕێگەپێدراوە.");
     }
     setUploadingDoc(null);
  };

  const handleSaveDocs = async () => {
    await updateDoc(getDocRef('sales', viewingDocuments.id), { documents: selectedDocs });
    alertMsg('بەڵگەنامەکان بە سەرکەوتوویی پاشەکەوت کران.'); setViewingDocuments(null);
  };

  const printDocsReceipt = (sale, selectedDocsArr) => {
    const docsHTML = selectedDocsArr.length > 0 ? selectedDocsArr.map(d => `
       <li style="margin-bottom: 20px;">
          <div style="margin-bottom: 10px;">☑ ${d.name}</div>
          ${d.fileUrl ? `<img src="${d.fileUrl}" style="max-width: 100%; max-height: 250px; border-radius: 8px; border: 2px solid #cbd5e1; display: block; margin-top: 5px;" alt="${d.name}" onerror="this.style.display='none'" />` : ''}
       </li>
    `).join('') : '<li>هیچ بەڵگەنامەیەک دیاری نەکراوە.</li>';
    
    const html = `
      <div style="font-size: 16px; line-height: 1.8; color: #0f172a; margin-bottom: 20px; padding: 25px; background: #f8fafc; border-radius: 12px; border: 2px solid #e2e8f0;">
        <p style="font-size: 18px; font-weight: bold; margin-bottom: 25px; border-bottom: 1px solid #cbd5e1; padding-bottom: 15px;">
          ئاماژە بە پسوڵەی ژمارە (<span style="color:#f97316; font-size: 20px;">${sale.receiptNo}</span>)، ئەم بەڵگەنامانەی خوارەوە وەرگیراون لە کڕیار (<strong>${sale.customerName}</strong>):
        </p>
        <ul style="list-style-type: none; padding: 0; font-size: 17px; font-weight: bold; color: #1e3a8a;">${docsHTML}</ul>
      </div>
    `;
    printContent('پسوڵەی وەرگرتنی بەڵگەنامە', sale.receiptNo, html, STORE_NAME, sale.customerName, true);
  };

  // --- Payments & Receipts ---
  const printPaymentReceipt = (tx, overrideBalance = null) => {
    const isInstallment = tx.type === 'receive_installment';
    const isAgent = tx.type === 'receive_agent_payment' || tx.type === 'pay_agent_payment';
    let typeText = isInstallment ? 'وەرگرتنی پارە (قیست)' : 'پێدانی پارە (قەرز)';
    if (tx.type === 'receive_agent_payment') typeText = 'وەرگرتنی قەرز (لە بریکار)';
    if (tx.type === 'pay_agent_payment') typeText = 'پێدانی پارە (بۆ بریکار)';
    if (tx.type === 'receive_company_payment') typeText = 'وەرگرتنی پارە (لە کۆمپانیا)';
    if (tx.type === 'pay_office_debt') typeText = 'پێدانی پارە (بۆ نوسینگە)';
    if (tx.type === 'receive_office_loan') typeText = 'وەرگرتنی پارە (لە نوسینگە)';
    
    const partyName = tx.desc.split(': ')[1] || tx.desc; 
    let currentBalance = overrideBalance !== null ? overrideBalance : 0;
    let phoneNum = '-';
    
    if (overrideBalance === null) {
      const isTxNew = !capitalTx.find(t => t.id === tx.id);
      if (isInstallment && tx.refId) {
         const sale = sales.find(s => s.id === tx.refId);
         if (sale) { 
           let paid = getSalePaidAmount(tx.refId);
           if (isTxNew) paid += tx.amount;
           currentBalance = sale.price - paid; 
           phoneNum = sale.phone; 
         }
      } else if (isAgent && tx.refId) {
         const agent = agents.find(a => a.id === tx.refId);
         if (agent) { 
           let debt = getAgentDebt(tx.refId);
           if (isTxNew) {
              if (tx.type === 'receive_agent_payment') debt -= Math.abs(tx.amount);
              if (tx.type === 'pay_agent_payment') debt += Math.abs(tx.amount);
           }
           currentBalance = debt; 
           phoneNum = agent.phone; 
         }
      } else if ((tx.type === 'pay_company_debt' || tx.type === 'receive_company_payment') && tx.refId) {
         const comp = companies.find(c => c.id === tx.refId);
         if (comp) { 
           let debt = getCompanyDebt(tx.refId);
           if (isTxNew) {
              if (tx.type === 'pay_company_debt') debt -= Math.abs(tx.amount);
              if (tx.type === 'receive_company_payment') debt += Math.abs(tx.amount);
           }
           currentBalance = debt; 
           phoneNum = comp.phone; 
         }
      } else if ((tx.type === 'pay_office_debt' || tx.type === 'receive_office_loan') && tx.refId) {
         const off = offices.find(o => o.id === tx.refId);
         if (off) {
           let debt = getOfficeDebt(tx.refId);
           if (isTxNew) {
               if (tx.type === 'pay_office_debt') debt -= Math.abs(tx.amount);
               if (tx.type === 'receive_office_loan') debt += Math.abs(tx.amount);
           }
           currentBalance = debt;
           phoneNum = off.phone;
         }
      }
    }

    const html = `
      <div class="info-grid">
        <div class="info-box">
          <strong>جۆری پسوڵە:</strong> ${typeText}<br/>
          <strong>ناوی کەس/کۆمپانیا:</strong> ${partyName}<br/>
          <strong>ژمارەی مۆبایل:</strong> <span dir="ltr">${phoneNum}</span><br/>
        </div>
        <div class="info-box">
          <strong>بەروار:</strong> ${tx.date}<br/>
          <strong>کۆتا باڵانسی ماوە:</strong> <span dir="ltr" style="color: #f97316; font-weight: bold; font-size: 16px;">$${(currentBalance || 0).toFixed(2)}</span>
        </div>
      </div>
      <table>
        <tr><th>بڕی پارەی دیاریکراو</th><th>تێبینی</th></tr>
        <tr><td style="font-weight:bold; color:#1e3a8a; font-size: 18px;" dir="ltr">$${Math.abs(tx.amount).toFixed(2)}</td><td>${tx.note || '-'}</td></tr>
      </table>
    `;
    printContent(typeText, tx.receiptNo, html, STORE_NAME, partyName, true);
  };

  const handlePaymentSubmit = async (e, typeCategory) => {
    e.preventDefault();
    const form = e.target;
    const refId = form.refId.value;
    const txDirection = form.txDirection?.value || 'receive';
    const amount = parseFloat(form.amount.value);
    const note = form.note.value;
    
    let typeStr = ''; let desc = ''; let dbAmount = amount; let expectedNewBalance = 0;

    const isHawala = form.viaOffice?.checked && txDirection === 'pay';
    const officeId = form.officeId?.value;
    const officeFee = parseFloat(form.officeFee?.value) || 0;

    if (isHawala && !officeId) return alertMsg('تکایە نوسینگە هەڵبژێرە!');

    const rNo = (editingPaymentId ? capitalTx.find(t => t.id === editingPaymentId)?.receiptNo : null) 
                || (capitalTx.length > 0 ? Math.max(...capitalTx.map(t => t.receiptNo || 0)) + 1 : 1);

    if (typeCategory === 'installment') {
      typeStr = 'receive_installment';
      const sale = sales.find(s => s.id === refId);
      desc = `وەرگرتنی قیست لە: ${sale?.customerName}`;
      expectedNewBalance = sale.price - (getSalePaidAmount(refId) + amount);
    } else if (typeCategory === 'agent') {
      const agent = agents.find(a => a.id === refId);
      if (txDirection === 'receive') {
         typeStr = 'receive_agent_payment'; desc = `وەرگرتنی قەرز لە بریکار: ${agent?.name}`; expectedNewBalance = getAgentDebt(refId) - amount;
      } else {
         typeStr = 'pay_agent_payment'; desc = `پێدانی پارە بە بریکار: ${agent?.name}`; dbAmount = -amount; expectedNewBalance = getAgentDebt(refId) + amount;
      }
    } else if (typeCategory === 'company') {
      const comp = companies.find(c => c.id === refId);
      if (txDirection === 'pay') {
         typeStr = 'pay_company_debt'; desc = `پێدانەوەی قەرز بە: ${comp?.name}`; dbAmount = -amount; expectedNewBalance = getCompanyDebt(refId) - amount;
      } else {
         typeStr = 'receive_company_payment'; desc = `وەرگرتنی پارە لە کۆمپانیا: ${comp?.name}`; expectedNewBalance = getCompanyDebt(refId) + amount;
      }
    } else if (typeCategory === 'office') {
      const off = offices.find(o => o.id === refId);
      if (txDirection === 'receive') {
        typeStr = 'receive_office_loan'; desc = `وەرگرتنی پارە لە نوسینگە: ${off?.name}`; dbAmount = amount; expectedNewBalance = getOfficeDebt(refId) + amount;
      } else {
        typeStr = 'pay_office_debt'; desc = `پێدانەوەی قەرز بە نوسینگە: ${off?.name}`; dbAmount = -amount; expectedNewBalance = getOfficeDebt(refId) - amount;
      }
    }

    if (isHawala && !editingPaymentId) {
        const office = offices.find(o => o.id === officeId);
        const tx1 = await addTransaction(typeStr, dbAmount, desc + ` (لەڕێی نوسینگەی ${office.name})`, refId, note, null, rNo);
        if (officeFee > 0) await addTransaction('expense', -officeFee, `تێچووی حەواڵە بۆ نوسینگەی ${office.name}`, null, `بۆ پسوڵەی ${rNo}`, null, rNo);
        await addTransaction('receive_office_loan', amount + officeFee, `قەرزی حەواڵە بۆ ${desc}`, officeId, note, null, rNo);
        confirmAction('پارەکە بە حەواڵە درا، دەتەوێت پسوڵەکە چاپ بکەیت؟', () => printPaymentReceipt({...tx1, amount: amount}, expectedNewBalance));
        form.reset(); setViaOfficeAgent(false); setViaOfficeComp(false);
        return;
    }

    if (editingPaymentId) {
      const oldTx = capitalTx.find(t => t.id === editingPaymentId);
      if (oldTx) {
        await addTransaction(typeStr, dbAmount, desc, refId, note, oldTx.id, oldTx.receiptNo);
        setEditingPaymentId(null);
        alertMsg('مامەڵەکە بە سەرکەوتوویی نوێکرایەوە.');
      }
    } else {
      const newTx = await addTransaction(typeStr, dbAmount, desc, refId, note, null, rNo);
      confirmAction('مامەڵەکە سەرکەوتوو بوو، ئایا دەتەوێت ڕاستەوخۆ پسوڵەکە چاپ بکەیت؟', () => printPaymentReceipt(newTx, expectedNewBalance));
    }
    form.reset();
  };

  const deletePaymentTx = (id) => confirmAction('دڵنیایت لە سڕینەوەی ئەم مامەڵەیە؟', async () => await deleteDoc(getDocRef('capitalTx', id)));

  const handleCapitalSubmit = async (e) => {
    e.preventDefault();
    const type = e.target.type.value;
    const amount = parseFloat(e.target.amount.value);
    const reason = e.target.reason.value;
    const note = e.target.note.value;
    if (type === 'expense') await addTransaction('expense', -amount, `خەرجی: ${reason}`, null, note);
    else if (type === 'add') await addTransaction('capital_add', amount, `زیادکردنی سەرمایە: ${reason}`, null, note);
    else await addTransaction('capital_remove', -amount, `کێشانەوەی سەرمایە: ${reason}`, null, note);
    e.target.reset();
  };

  // --- View Renderers ---
  const renderDashboard = () => {
    const totalSales = sales.reduce((acc, s) => acc + s.price, 0);
    const totalDebtInMarket = sales.filter(s=>s.saleType==='installment').reduce((acc, s) => acc + (s.price - getSalePaidAmount(s.id)), 0);
    const totalAgentDebt = agents.reduce((acc, a) => acc + getAgentDebt(a.id), 0);
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">سەرەتا - ئامارەکان</h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${loggedAppUser?.role === 'admin' ? '4' : '3'} gap-4 md:gap-6`}>
          {loggedAppUser?.role === 'admin' && (
            <div className="bg-blue-900 text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between">
              <div><p className="text-blue-200 mb-1 font-medium text-sm md:text-base">سندوق (نەختینە)</p><h3 className="text-xl md:text-2xl font-bold">${currentCapital.toFixed(2)}</h3></div>
              <IconDollarSign size={32} className="opacity-80" />
            </div>
          )}
          <div className="bg-orange-500 text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div><p className="text-orange-100 mb-1 font-medium text-sm md:text-base">کۆی فرۆشراو</p><h3 className="text-xl md:text-2xl font-bold">${totalSales.toFixed(2)}</h3></div>
            <IconShoppingCart size={32} className="opacity-80" />
          </div>
          <div className="bg-slate-800 text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div><p className="text-slate-300 mb-1 font-medium text-sm md:text-base">قەرزی بازاڕ (قیست)</p><h3 className="text-xl md:text-2xl font-bold">${totalDebtInMarket.toFixed(2)}</h3></div>
            <IconList size={32} className="opacity-80" />
          </div>
          <div className="bg-blue-800 text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div><p className="text-blue-200 mb-1 font-medium text-sm md:text-base">قەرزی بریکارەکان</p><h3 className="text-xl md:text-2xl font-bold">${totalAgentDebt.toFixed(2)}</h3></div>
            <IconAgent size={32} className="opacity-80" />
          </div>
        </div>
      </div>
    );
  };

  const renderDefinedItems = () => {
    const itemToEdit = editingId ? definedItems.find(i => i.id === editingId) : null;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">پێناسەی کاڵاکان</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveDefinedItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">جۆری کاڵا (نموونە: مۆبایل)</label><input required name="itemType" defaultValue={itemToEdit?.type} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">براند (نموونە: ئەپڵ)</label><input required name="brand" defaultValue={itemToEdit?.brand} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ناوی کاڵا</label><input required name="name" defaultValue={itemToEdit?.name} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" placeholder="iPhone 15 Pro Max..." /></div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white p-2.5 rounded-lg font-medium transition-colors">{editingId ? 'نوێکردنەوە' : 'زیادکردن'}</button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-400 text-white p-2.5 rounded-lg">بەتاڵ</button>}
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[500px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700"><tr><th className="p-3 md:p-4">جۆری کاڵا</th><th className="p-3 md:p-4">براند</th><th className="p-3 md:p-4">ناوی کاڵا (مۆدێل)</th><th className="p-3 md:p-4">کردارەکان</th></tr></thead>
            <tbody>
              {definedItems.map(i => (
                <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3 md:p-4 font-medium">{i.type}</td><td className="p-3 md:p-4">{i.brand}</td><td className="p-3 md:p-4 font-bold text-blue-900">{i.name}</td><td className="p-3 md:p-4 flex gap-2"><button onClick={() => setEditingId(i.id)} className="text-blue-900 bg-blue-50 p-2 rounded-full"><IconEdit /></button><button onClick={() => deleteDefinedItem(i.id)} className="text-rose-600 bg-rose-50 p-2 rounded-full"><IconTrash /></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    if (loggedAppUser?.role !== 'admin') return <div className="text-rose-600 p-6 bg-white rounded-xl shadow-sm">ببورە، تەنها ئەدمین بۆی هەیە ئەم بەشە ببینێت.</div>;
    const userToEdit = editingId ? appUsers.find(u => u.id === editingId) : null;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">بەڕێوەبردنی بەکارهێنەران</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new_user'} onSubmit={handleSaveAppUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">ناوی بەکارهێنەر</label><input required name="username" defaultValue={userToEdit?.username} className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-900" dir="ltr" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">وشەی تێپەڕ</label><input required name="password" defaultValue={userToEdit?.password} className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-900" dir="ltr" /></div>
            <div>
              <label className="block text-sm mb-1 text-slate-600">ڕۆڵ (دەسەڵات)</label>
              <select required name="role" defaultValue={userToEdit?.role || 'user'} className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900">
                <option value="user">بەکارهێنەری ئاسایی (User)</option>
                <option value="admin">ئەدمین (Admin)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white p-2.5 rounded-lg font-medium transition-colors">{editingId ? 'نوێکردنەوە' : 'دروستکردن'}</button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-400 hover:bg-slate-500 text-white p-2.5 rounded-lg transition-colors">بەتاڵ</button>}
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[400px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700"><tr><th className="p-3 md:p-4">ناوی بەکارهێنەر</th><th className="p-3 md:p-4">ڕۆڵ</th><th className="p-3 md:p-4">کردارەکان</th></tr></thead>
            <tbody>
              {appUsers.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3 md:p-4 font-medium" dir="ltr">{u.username}</td><td className="p-3 md:p-4">{u.role === 'admin' ? 'ئەدمین' : 'ئاسایی'}</td><td className="p-3 md:p-4 flex gap-2"><button onClick={() => setEditingId(u.id)} className="text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-full"><IconEdit /></button><button onClick={() => deleteAppUser(u.id)} className="text-rose-600 bg-rose-50 hover:bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>
              ))}
              <tr className="border-b border-slate-100 bg-blue-50/30"><td className="p-3 md:p-4 font-medium text-slate-500" dir="ltr">{DEFAULT_ADMIN_USER}</td><td className="p-3 md:p-4 text-slate-500">سەرەکی (گۆڕانکاری ناکرێت)</td><td className="p-3 md:p-4 text-slate-400 text-sm">بنچینەیی</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCompanies = () => {
    const compToEdit = editingId ? companies.find(c => c.id === editingId) : null;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">بەڕێوەبردنی کۆمپانیاکان</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveCompany} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">ناوی کۆمپانیا</label><input required name="name" defaultValue={compToEdit?.name} className="w-full border border-slate-300 p-2.5 rounded-lg outline-none bg-white text-slate-900 focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ژمارەی مۆبایل</label><input required name="phone" defaultValue={compToEdit?.phone} className="w-full border border-slate-300 p-2.5 rounded-lg outline-none bg-white text-slate-900 focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ناونیشان</label><input name="address" defaultValue={compToEdit?.address} className="w-full border border-slate-300 p-2.5 rounded-lg outline-none bg-white text-slate-900 focus:ring-2 focus:ring-blue-900" /></div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white p-2.5 rounded-lg font-medium transition-colors">{editingId ? 'نوێکردنەوە' : 'زیادکردن'}</button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-400 hover:bg-slate-500 text-white p-2.5 rounded-lg transition-colors">بەتاڵ</button>}
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700"><tr><th className="p-3 md:p-4">ناو</th><th className="p-3 md:p-4">مۆبایل</th><th className="p-3 md:p-4">ناونیشان</th><th className="p-3 md:p-4">قەرزی ماوە</th><th className="p-3 md:p-4">کردارەکان</th></tr></thead>
            <tbody>
              {companies.map(c => {
                const debt = getCompanyDebt(c.id);
                return (<tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3 md:p-4 font-medium">{c.name}</td><td className="p-3 md:p-4">{c.phone}</td><td className="p-3 md:p-4">{c.address}</td><td className="p-3 md:p-4 font-bold text-orange-600">${debt.toFixed(2)}</td><td className="p-3 md:p-4 flex gap-2"><button onClick={() => setEditingId(c.id)} className="text-blue-900 bg-blue-50 p-2 rounded-full"><IconEdit /></button><button onClick={() => deleteCompany(c.id)} className="text-rose-600 bg-rose-50 p-2 rounded-full"><IconTrash /></button></td></tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAgents = () => {
    const agentToEdit = editingId ? agents.find(a => a.id === editingId) : null;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">بەڕێوەبردنی بریکارەکان</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveAgent} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">ناوی بریکار</label><input required name="name" defaultValue={agentToEdit?.name} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ژمارەی مۆبایل</label><input required name="phone" defaultValue={agentToEdit?.phone} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ناونیشان</label><input name="address" defaultValue={agentToEdit?.address} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">تێبینی</label><input name="notes" defaultValue={agentToEdit?.notes} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white p-2.5 rounded-lg font-medium transition-colors">{editingId ? 'نوێکردنەوە' : 'زیادکردن'}</button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-400 text-white p-2.5 rounded-lg">بەتاڵ</button>}
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700"><tr><th className="p-3 md:p-4">ناو</th><th className="p-3 md:p-4">مۆبایل</th><th className="p-3 md:p-4">ناونیشان</th><th className="p-3 md:p-4">قەرزی لایە</th><th className="p-3 md:p-4">کردارەکان</th></tr></thead>
            <tbody>
              {agents.map(a => {
                const debt = getAgentDebt(a.id);
                return (<tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3 md:p-4 font-medium">{a.name}</td><td className="p-3 md:p-4">{a.phone}</td><td className="p-3 md:p-4">{a.address}</td><td className="p-3 md:p-4 font-bold text-orange-600">${debt.toFixed(2)}</td><td className="p-3 md:p-4 flex gap-2"><button onClick={() => setEditingId(a.id)} className="text-blue-900 bg-blue-50 p-2 rounded-full"><IconEdit /></button><button onClick={() => deleteAgent(a.id)} className="text-rose-600 bg-rose-50 p-2 rounded-full"><IconTrash /></button></td></tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOffices = () => {
    const officeToEdit = editingId ? offices.find(o => o.id === editingId) : null;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">بەڕێوەبردنی نوسینگەکان (حەواڵە)</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveOffice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">ناوی نوسینگە</label><input required name="name" defaultValue={officeToEdit?.name} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ژمارەی مۆبایل</label><input name="phone" defaultValue={officeToEdit?.phone} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ناونیشان</label><input name="address" defaultValue={officeToEdit?.address} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white p-2.5 rounded-lg font-medium transition-colors">{editingId ? 'نوێکردنەوە' : 'زیادکردن'}</button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-400 text-white p-2.5 rounded-lg">بەتاڵ</button>}
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[500px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700"><tr><th className="p-3 md:p-4">ناو</th><th className="p-3 md:p-4">مۆبایل</th><th className="p-3 md:p-4">ناونیشان</th><th className="p-3 md:p-4">قەرز (ئێمە قەرزارین)</th><th className="p-3 md:p-4">کردارەکان</th></tr></thead>
            <tbody>
              {offices.map(o => {
                const debt = getOfficeDebt(o.id);
                return (<tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3 md:p-4 font-medium">{o.name}</td><td className="p-3 md:p-4">{o.phone}</td><td className="p-3 md:p-4">{o.address}</td><td className="p-3 md:p-4 font-bold text-orange-600">${debt.toFixed(2)}</td><td className="p-3 md:p-4 flex gap-2"><button onClick={() => setEditingId(o.id)} className="text-blue-900 bg-blue-50 p-2 rounded-full"><IconEdit /></button><button onClick={() => deleteOffice(o.id)} className="text-rose-600 bg-rose-50 p-2 rounded-full"><IconTrash /></button></td></tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPurchases = () => {
    const handleEditPurchase = (p) => {
       setEditingId(p.id); setPurMode(p.paymentType);
       setPurEntityType(p.entityType || (p.paymentType === 'debt' ? 'company' : 'none'));
       if(p.items && p.items.length > 0) setPurItems(p.items);
       else setPurItems([{ id: Date.now(), itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty) }]);
       window.scrollTo({top:0, behavior:'smooth'});
    };

    const purToEdit = editingId ? purchases.find(p => p.id === editingId) : null;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">کڕین لە کۆمپانیا یان بریکار</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={`${editingId || 'new'}-${purMode}-${purEntityType}`} onSubmit={handleSavePurchase} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
            
            <div className="lg:col-span-2">
              <label className="block text-sm mb-1 text-slate-600">جۆری مامەڵە</label>
              <select required name="paymentType" value={purMode} onChange={e=>{setPurMode(e.target.value); if(e.target.value==='debt' && purEntityType==='none') setPurEntityType('company');}} className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900">
                <option value="cash">کاش</option>
                <option value="debt">قەرز</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm mb-1 text-slate-600">کڕین لە کێ؟</label>
              <select value={purEntityType} onChange={e=>setPurEntityType(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900">
                <option value="company">کۆمپانیا</option>
                <option value="agent">بریکار</option>
                {purMode === 'cash' && <option value="none">کەسی نەناسراو</option>}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm mb-1 text-slate-600">هەڵبژاردنی ناو {purMode === 'debt' && <span className="text-rose-500">*</span>}</label>
              {purEntityType === 'none' ? (
                 <input name="companyNameStr" placeholder="ناوی فرۆشیار بنووسە..." defaultValue={purToEdit ? purToEdit.companyName : ''} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" />
              ) : (
                 <select required={purMode === 'debt'} name="entityId" defaultValue={purToEdit?.companyId} className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900">
                   <option value="">هەڵبژێرە...</option>
                   {(purEntityType === 'company' ? companies : agents).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              )}
            </div>

            <div className="lg:col-span-7 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 space-y-3">
               <h4 className="font-bold text-slate-700 mb-2 border-b pb-2">لیستی کاڵاکان</h4>
               {purItems.map((item, index) => (
                   <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:items-end p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none bg-white sm:bg-transparent">
                       <div className="flex-1">
                         <label className="block text-xs mb-1 text-slate-600">ناوی کاڵا</label>
                         <select required value={item.itemName} onChange={(e) => updatePurItem(item.id, 'itemName', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-900">
                           <option value="">هەڵبژێرە...</option>
                           {definedItems.map(i => <option key={i.id} value={i.name}>{i.brand} - {i.name}</option>)}
                         </select>
                       </div>
                       <div className="flex gap-3">
                         <div className="w-24 flex-1 sm:flex-none">
                           <label className="block text-xs mb-1 text-slate-600">بڕ (دانە)</label>
                           <input required type="number" step="any" value={item.qty} onChange={(e) => updatePurItem(item.id, 'qty', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-900" />
                         </div>
                         <div className="w-32 flex-1 sm:flex-none">
                           <label className="block text-xs mb-1 text-slate-600">نرخی تاک</label>
                           <input required type="number" step="any" value={item.unitPrice} onChange={(e) => updatePurItem(item.id, 'unitPrice', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-900" />
                         </div>
                       </div>
                       {purItems.length > 1 && (
                          <button type="button" onClick={() => removePurItem(item.id)} className="p-2 w-full sm:w-auto bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-lg transition-colors mt-2 sm:mt-0"><IconTrash/> سڕینەوە</button>
                       )}
                   </div>
               ))}
               <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                  <button type="button" onClick={addPurItem} className="w-full sm:w-auto text-sm font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-4 py-2.5 rounded-lg transition-colors">+ زیادکردنی کاڵای تر</button>
                  <div className="text-left font-black text-xl text-blue-900 bg-white px-4 py-2 rounded-lg shadow-sm border">کۆی گشتی: ${purItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0).toFixed(2)}</div>
               </div>
            </div>

            <div className="lg:col-span-5"><label className="block text-sm mb-1 text-slate-600">تێبینی</label><input name="note" defaultValue={purToEdit?.note} className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900" placeholder="هەر تێبینییەک..." /></div>

            <div className="lg:col-span-2 flex gap-2">
              <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white p-3 rounded-lg font-bold transition-colors">{editingId ? 'نوێکردنەوە' : 'پاشەکەوتکردنی کڕین'}</button>
              {editingId && <button type="button" onClick={() => {setEditingId(null); setPurItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }])}} className="bg-slate-400 hover:bg-slate-500 text-white p-3 rounded-lg transition-colors">بەتاڵ</button>}
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700"><tr><th className="p-3 md:p-4">ژ.پ</th><th className="p-3 md:p-4">بەروار</th><th className="p-3 md:p-4">فرۆشیار</th><th className="p-3 md:p-4">کاڵاکان</th><th className="p-3 md:p-4">کۆی گشتی</th><th className="p-3 md:p-4">پێدان</th><th className="p-3 md:p-4">تێبینی</th><th className="p-3 md:p-4">کردارەکان</th></tr></thead>
            <tbody>
              {purchases.map(p => {
                const itemsList = p.items || [{ itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty) }];
                return (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 md:p-4 font-bold text-slate-400">{p.receiptNo}</td><td className="p-3 md:p-4">{p.date}</td><td className="p-3 md:p-4 font-semibold">{p.companyName} <span className="text-xs text-slate-400">({p.entityType === 'agent' ? 'بریکار' : 'کۆمپانیا'})</span></td>
                  <td className="p-3 md:p-4">{itemsList.map(i=>i.itemName).join('، ')}</td>
                  <td className="p-3 md:p-4 font-bold text-blue-900">${p.total.toFixed(2)}</td><td className="p-3 md:p-4">{p.paymentType === 'debt' ? <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">قەرز</span> : <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">کاش</span>}</td><td className="p-3 md:p-4 text-slate-500">{p.note}</td>
                  <td className="p-3 md:p-4 flex gap-2"><button onClick={() => printPurchase(p)} className="text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full"><IconPrinter /></button><button onClick={() => handleEditPurchase(p)} className="text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-full"><IconEdit /></button><button onClick={() => deletePurchase(p.id)} className="text-rose-500 bg-rose-50 hover:bg-rose-100 p-2 rounded-full"><IconTrash /></button></td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInventory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">کۆگا (کاڵا بەردەستەکان)</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
        <table className="w-full text-right min-w-[500px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700"><tr><th className="p-3 md:p-4">ناوی کاڵا</th><th className="p-3 md:p-4">تێکڕای نرخی کڕین (تێچوو)</th><th className="p-3 md:p-4">بڕی ماوە لە کۆگا</th></tr></thead>
          <tbody>
            {inventory.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-slate-500">کۆگا بەتاڵە</td></tr>}
            {inventory.map(i => (
              <tr key={i.itemName} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3 md:p-4 font-semibold text-slate-800">{i.itemName}</td><td className="p-3 md:p-4">${i.avgCost.toFixed(2)}</td><td className="p-3 md:p-4 font-bold text-blue-900 text-lg">{i.currentQty}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSales = () => {
    if (viewingInstallments) {
      const sale = sales.find(s => s.id === viewingInstallments);
      const isInstallment = sale.saleType === 'installment';
      const isCredit = sale.saleType === 'credit';
      const totalPaid = getSalePaidAmount(sale.id);
      const balance = sale.price - totalPaid;
      const paymentsMade = capitalTx.filter(tx => tx.refId === sale.id && (tx.type === 'receive_installment' || tx.type === 'receive_agent_payment'));

      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">وردەکاری: {sale.customerName}</h2>
            <button onClick={() => setViewingInstallments(null)} className="text-blue-900 bg-blue-50 px-4 py-2 rounded-lg font-medium self-start sm:self-auto">گەڕانەوە</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200"><p className="text-sm text-slate-500">کۆی گشتی فرۆشتن</p><h3 className="text-xl font-bold">${sale.price.toFixed(2)}</h3></div>
            <div className="bg-blue-50 p-4 md:p-5 rounded-xl border border-blue-200"><p className="text-sm text-blue-800">کۆی بڕی وەرگیراو</p><h3 className="text-xl font-bold text-blue-900">${totalPaid.toFixed(2)}</h3></div>
            <div className="bg-orange-50 p-4 md:p-5 rounded-xl border border-orange-200"><p className="text-sm text-orange-800">قەرزی ماوە</p><h3 className="text-xl font-bold text-orange-600">${balance.toFixed(2)}</h3></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-x-auto">
              <h3 className="font-bold text-lg mb-3 border-b pb-2">{isInstallment ? 'خشتەی کاتی دیاریکراوی قیستەکان' : 'زانیاری قەرز'}</h3>
              {isInstallment ? (
                 <table className="w-full text-right text-sm min-w-[300px]"><thead className="bg-slate-50"><tr><th className="p-2">مانگ</th><th className="p-2">بەروار</th><th className="p-2">بڕی پێویست</th></tr></thead><tbody>{sale.installments?.map(inst => (<tr key={inst.id} className="border-b"><td className="p-2">مانگی {inst.monthNum}</td><td className="p-2" dir="ltr">{inst.dueDate}</td><td className="p-2 font-bold">${inst.amount.toFixed(2)}</td></tr>))}</tbody></table>
              ) : (
                 <div className="p-4"><p><strong>وادەی دیاریکراو بۆ گەڕاندنەوە:</strong> <span dir="ltr">${sale.dueDate}</span> ({sale.creditDays} ڕۆژ)</p></div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-x-auto">
              <h3 className="font-bold text-lg mb-3 border-b pb-2">مێژووی وەرگرتنی پارەکان</h3>
              <table className="w-full text-right text-sm min-w-[300px]">
                <thead className="bg-slate-50"><tr><th className="p-2">بەروار</th><th className="p-2">بڕ</th><th className="p-2">تێبینی</th></tr></thead>
                <tbody>
                  {sale.advance > 0 && <tr><td className="p-2">{sale.date}</td><td className="p-2 text-blue-600 font-bold">${sale.advance.toFixed(2)}</td><td className="p-2">پێشەکی وەرگیراو لەکاتی فرۆشتن</td></tr>}
                  {sale.saleType === 'cash' && <tr><td className="p-2">{sale.date}</td><td className="p-2 text-blue-600 font-bold">${sale.price.toFixed(2)}</td><td className="p-2">فرۆشتنی کاش بە یەکجار</td></tr>}
                  {paymentsMade.map(p => (<tr key={p.id} className="border-b"><td className="p-2">{p.date}</td><td className="p-2 text-blue-600 font-bold">${p.amount.toFixed(2)}</td><td className="p-2">{p.note}</td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    const handleEditSale = (s) => {
       setEditingId(s.id); setSaleMode(s.saleType || 'installment');
       if(s.items && s.items.length > 0) setSaleItems(s.items);
       else setSaleItems([{ id: Date.now(), itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty) }]);
       window.scrollTo({top:0, behavior:'smooth'});
    };

    const saleToEdit = editingId ? sales.find(s => s.id === editingId) : null;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">فرۆشتن (کاش، قەرز، قیست)</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          
          <div className="flex flex-wrap gap-4 mb-6 border-b pb-4">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 py-2 px-3 rounded-lg"><input type="radio" name="smode" checked={saleMode === 'installment'} onChange={()=>setSaleMode('installment')} className="w-5 h-5 accent-blue-900" /> فرۆشتن بە قیست</label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 py-2 px-3 rounded-lg"><input type="radio" name="smode" checked={saleMode === 'cash'} onChange={()=>setSaleMode('cash')} className="w-5 h-5 accent-blue-900" /> فرۆشتنی کاش</label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 py-2 px-3 rounded-lg"><input type="radio" name="smode" checked={saleMode === 'credit'} onChange={()=>setSaleMode('credit')} className="w-5 h-5 accent-blue-900" /> قەرز بۆ بریکار</label>
          </div>

          <form key={`${editingId || 'new'}-${saleMode}`} onSubmit={handleSaveSale} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
            
            {saleMode === 'credit' ? (
              <div className="lg:col-span-2">
                <label className="block text-sm mb-1 text-slate-600">ناوی بریکار</label>
                <select required name="agentId" defaultValue={saleToEdit?.agentId} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900">
                  <option value="">هەڵبژێرە...</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            ) : (
              <>
                <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">ناوی کڕیار</label><input required name="customerName" defaultValue={saleToEdit?.customerName} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
                <div><label className="block text-sm mb-1 text-slate-600">ژمارەی مۆبایل</label><input required name="phone" defaultValue={saleToEdit?.phone} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
                <div><label className="block text-sm mb-1 text-slate-600">ناونیشان</label><input required={saleMode==='installment'} name="address" defaultValue={saleToEdit?.address} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
              </>
            )}
            
            <div className="md:col-span-4 lg:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 space-y-3">
               <h4 className="font-bold text-slate-700 mb-2 border-b pb-2">لیستی کاڵاکان</h4>
               {saleItems.map((item, index) => (
                   <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:items-end p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none bg-white sm:bg-transparent">
                       <div className="flex-1">
                         <label className="block text-xs mb-1 text-slate-600">ناوی کاڵا</label>
                         <select required value={item.itemName} onChange={(e) => updateSaleItem(item.id, 'itemName', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-900">
                           <option value="">هەڵبژێرە لە کۆگا...</option>
                           {inventory.map(i => <option key={i.itemName} value={i.itemName}>{i.itemName} (بەردەست: {i.currentQty})</option>)}
                         </select>
                       </div>
                       <div className="flex gap-3">
                         <div className="w-full sm:w-24">
                           <label className="block text-xs mb-1 text-slate-600">بڕ</label>
                           <input required type="number" step="any" value={item.qty} onChange={(e) => updateSaleItem(item.id, 'qty', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-900" />
                         </div>
                         <div className="w-full sm:w-32">
                           <label className="block text-xs mb-1 text-slate-600">نرخی تاک</label>
                           <input required type="number" step="any" value={item.unitPrice} onChange={(e) => updateSaleItem(item.id, 'unitPrice', e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-900" />
                         </div>
                       </div>
                       {saleItems.length > 1 && (
                          <button type="button" onClick={() => removeSaleItem(item.id)} className="p-2.5 mt-2 sm:mt-0 w-full sm:w-auto bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-lg transition-colors flex justify-center items-center gap-1"><IconTrash/> <span className="sm:hidden">سڕینەوە</span></button>
                       )}
                   </div>
               ))}
               <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                  <button type="button" onClick={addSaleItem} className="w-full sm:w-auto text-sm font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-4 py-2.5 rounded-lg transition-colors">+ زیادکردنی کاڵای تر</button>
                  <div className="text-left font-black text-xl text-blue-900 bg-white px-4 py-2 rounded-lg border shadow-sm w-full sm:w-auto text-center">کۆی گشتی: ${saleItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0).toFixed(2)}</div>
               </div>
            </div>

            {saleMode === 'installment' && (
              <>
                <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">پێشەکی وەرگیراو</label><input required type="number" step="any" name="advance" defaultValue={saleToEdit?.advance || 0} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
                <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">مانگەکانی قیست</label><input required type="number" name="months" min="1" defaultValue={saleToEdit?.months} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" /></div>
              </>
            )}

            {saleMode === 'credit' && (
              <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">ماوەی دانەوە (ڕۆژ)</label><input required type="number" name="creditDays" min="1" defaultValue="7" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900 font-bold text-blue-900" /></div>
            )}

            <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">تێبینی</label><input name="note" defaultValue={saleToEdit?.note} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-900" placeholder="تێبینی..." /></div>
            
            <div className="md:col-span-6 flex gap-2 mt-2">
              <button type="submit" className="flex-1 bg-blue-900 hover:bg-blue-800 text-white p-3 rounded-lg font-bold transition-colors">{editingId ? 'نوێکردنەوە و پاشەکەوتکردن' : 'تۆمارکردنی فرۆشتن'}</button>
              {editingId && <button type="button" onClick={() => {setEditingId(null); setSaleItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }])}} className="bg-slate-400 text-white p-3 rounded-lg transition-colors">بەتاڵ</button>}
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700"><tr><th className="p-3 md:p-4">ژ.پ / جۆر</th><th className="p-3 md:p-4">کڕیار/بریکار</th><th className="p-3 md:p-4">کاڵاکان</th><th className="p-3 md:p-4">کۆی نرخ</th><th className="p-3 md:p-4">وەرگیراو</th><th className="p-3 md:p-4">ماوە(قەرز)</th><th className="p-3 md:p-4">کردارەکان</th></tr></thead>
            <tbody>
              {sales.map(s => {
                const paid = getSalePaidAmount(s.id);
                const balance = s.price - paid;
                const isInst = s.saleType === 'installment';
                const isCash = s.saleType === 'cash';
                const typeBadge = isCash ? 'کاش' : (isInst ? 'قیست' : 'بریکار');
                const itemsList = s.items || [{ itemName: s.itemName }];
                return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 md:p-4 font-bold text-slate-600">{s.receiptNo} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">{typeBadge}</span></td>
                  <td className="p-3 md:p-4 font-semibold">{s.customerName}</td>
                  <td className="p-3 md:p-4">{itemsList.map(i=>i.itemName).join('، ')}</td>
                  <td className="p-3 md:p-4 font-bold text-blue-900">${s.price.toFixed(2)}</td><td className="p-3 md:p-4 text-emerald-600">${paid.toFixed(2)}</td><td className="p-3 md:p-4 text-orange-600 font-bold">${balance.toFixed(2)}</td>
                  <td className="p-3 md:p-4 flex gap-2">
                    {!isCash && <button onClick={() => setViewingInstallments(s.id)} className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100" title="وردەکاری هەژمار">وردەکاری</button>}
                    {isInst && <button onClick={() => { setViewingDocuments(s); setSelectedDocs((s.documents || []).map(d => typeof d === 'string' ? {name:d, fileUrl:null} : d)); }} className="text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-full" title="بەڵگەنامەکان"><IconDocs /></button>}
                    {isInst && <button onClick={() => printContract(s)} className="text-slate-800 bg-slate-100 hover:bg-slate-200 p-2 rounded-full" title="چاپکردنی گرێبەست"><IconContract /></button>}
                    <button onClick={() => printSale(s)} className="text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full" title="چاپکردنی پسوڵە"><IconPrinter /></button>
                    <button onClick={() => handleEditSale(s)} className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-full" title="دەستکاریکردن"><IconEdit /></button>
                    <button onClick={() => deleteSale(s.id)} className="text-rose-600 bg-rose-50 hover:bg-rose-100 p-2 rounded-full"><IconTrash /></button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    const activeSales = sales.filter(s => s.saleType === 'installment' && (s.price - getSalePaidAmount(s.id)) > 0);
    const activeCreditSales = sales.filter(s => s.saleType === 'credit' && (s.price - getSalePaidAmount(s.id)) > 0);
    const activeDebts = companies.filter(c => getCompanyDebt(c.id) > 0);
    const recentPayments = [...capitalTx].filter(tx => tx.type === 'receive_installment' || tx.type === 'receive_agent_payment' || tx.type === 'pay_agent_payment' || tx.type === 'pay_company_debt' || tx.type === 'receive_company_payment' || tx.type === 'pay_office_debt' || tx.type === 'receive_office_loan').reverse().slice(0, 10);
    
    const pToEdit = editingPaymentId ? capitalTx.find(t => t.id === editingPaymentId) : null;
    const isEditingReceiveInst = pToEdit?.type === 'receive_installment';
    const isEditingAgent = pToEdit?.type === 'receive_agent_payment' || pToEdit?.type === 'pay_agent_payment';
    const isEditingCompany = pToEdit?.type === 'pay_company_debt' || pToEdit?.type === 'receive_company_payment';
    const isEditingOffice = pToEdit?.type === 'pay_office_debt' || pToEdit?.type === 'receive_office_loan';

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">وەرگرتن و پێدانی پارە</h2>
        
        {editingPaymentId && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex justify-between items-center">
            <span className="font-bold text-orange-800">تۆ لە دۆخی دەستکاریکردنی پسوڵەی ژمارە ({pToEdit.receiptNo}) دایت!</span>
            <button onClick={() => setEditingPaymentId(null)} className="text-sm bg-orange-200 px-3 py-1 rounded text-orange-900 transition-colors">پاشگەزبوونەوە</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* وەرگرتنی قیست */}
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isEditingReceiveInst ? 'ring-2 ring-orange-500' : 'border-t-4 border-t-emerald-500'}`}>
            <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><IconDollarSign/> {isEditingReceiveInst ? 'دەستکاری قیست' : 'وەرگرتنی قیست'}</h3>
            <form key={`ri-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'installment')} className="space-y-4 flex-1 flex flex-col">
              <select required name="refId" defaultValue={isEditingReceiveInst ? pToEdit?.refId : ''} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option value="">کڕیار هەڵبژێرە...</option>
                {(isEditingReceiveInst ? sales.filter(s=>s.saleType==='installment') : activeSales).map(s => <option key={s.id} value={s.id}>{s.customerName} (ماوە: ${(s.price - getSalePaidAmount(s.id)).toFixed(2)})</option>)}
              </select>
              <input required type="number" step="any" name="amount" defaultValue={isEditingReceiveInst ? Math.abs(pToEdit.amount) : ''} placeholder="بڕی وەرگیراو $" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500" />
              <input name="note" defaultValue={isEditingReceiveInst ? pToEdit?.note : ''} placeholder="تێبینی..." className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500" />
              <div className="mt-auto pt-4"><button type="submit" disabled={isEditingCompany || isEditingAgent || isEditingOffice} className="w-full bg-emerald-600 text-white p-2.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors">تۆمارکردن</button></div>
            </form>
          </div>

          {/* مامەڵەی بریکارەکان */}
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isEditingAgent ? 'ring-2 ring-orange-500' : 'border-t-4 border-t-blue-500'}`}>
            <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><IconAgent/> {isEditingAgent ? 'دەستکاری پارەی بریکار' : 'مامەڵەی بریکارەکان'}</h3>
            <form key={`ra-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'agent')} className="space-y-4 flex-1 flex flex-col">
              <select required name="txDirection" value={agentTxDir} onChange={e=>setAgentTxDir(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg bg-blue-50 font-bold text-blue-900 focus:ring-2 focus:ring-blue-500">
                 <option value="receive">وەرگرتنی پارە (لە بریکار)</option>
                 <option value="pay">پێدانی پارە (بە بریکار)</option>
              </select>
              <select required name="refId" defaultValue={isEditingAgent ? pToEdit?.refId : ''} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">ناوی بریکار...</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} (قەرزی لایە: ${getAgentDebt(a.id).toFixed(2)})</option>)}
              </select>
              <input required type="number" step="any" name="amount" defaultValue={isEditingAgent ? Math.abs(pToEdit.amount) : ''} placeholder="بڕی پارە $" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500" />
              
              {agentTxDir === 'pay' && !isEditingAgent && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                   <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm mb-2"><input type="checkbox" name="viaOffice" checked={viaOfficeAgent} onChange={e=>setViaOfficeAgent(e.target.checked)} className="w-4 h-4 accent-blue-600" /> پارەدان لەڕێی نوسینگە</label>
                   {viaOfficeAgent && (
                     <div className="space-y-2 mt-2">
                        <select required name="officeId" className="w-full border border-slate-300 p-2 rounded-lg text-sm">
                           <option value="">نوسینگە هەڵبژێرە...</option>
                           {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <input type="number" step="any" name="officeFee" placeholder="تێچووی حەواڵە $" className="w-full border border-slate-300 p-2 rounded-lg text-sm" />
                     </div>
                   )}
                </div>
              )}

              <input name="note" defaultValue={isEditingAgent ? pToEdit?.note : ''} placeholder="تێبینی..." className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500" />
              <div className="mt-auto pt-4"><button type="submit" disabled={isEditingCompany || isEditingReceiveInst || isEditingOffice} className="w-full bg-blue-900 text-white p-2.5 rounded-lg font-bold hover:bg-blue-800 transition-colors">تۆمارکردن</button></div>
            </form>
          </div>

          {/* مامەڵەی کۆمپانیاکان */}
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isEditingCompany ? 'ring-2 ring-orange-500' : 'border-t-4 border-t-rose-500'}`}>
            <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><IconBuilding/> {isEditingCompany ? 'دەستکاری پارەی کۆمپانیا' : 'مامەڵەی کۆمپانیاکان'}</h3>
            <form key={`pay-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'company')} className="space-y-4 flex-1 flex flex-col">
              <select required name="txDirection" value={compTxDir} onChange={e=>setCompTxDir(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg bg-rose-50 font-bold text-rose-900 focus:ring-2 focus:ring-rose-500">
                 <option value="pay">پێدانی پارە (بە کۆمپانیا)</option>
                 <option value="receive">وەرگرتنی پارە (لە کۆمپانیا)</option>
              </select>
              <select required name="refId" defaultValue={isEditingCompany ? pToEdit?.refId : ''} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-rose-500">
                <option value="">کۆمپانیا هەڵبژێرە...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name} (قەرز لەسەرمان: $${getCompanyDebt(c.id).toFixed(2)})</option>)}
              </select>
              <input required type="number" step="any" name="amount" defaultValue={isEditingCompany ? Math.abs(pToEdit.amount) : ''} placeholder="بڕی پارە $" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-rose-500" />
              
              {compTxDir === 'pay' && !isEditingCompany && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                   <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm mb-2"><input type="checkbox" name="viaOffice" checked={viaOfficeComp} onChange={e=>setViaOfficeComp(e.target.checked)} className="w-4 h-4 accent-rose-600" /> پارەدان لەڕێی نوسینگە</label>
                   {viaOfficeComp && (
                     <div className="space-y-2 mt-2">
                        <select required name="officeId" className="w-full border border-slate-300 p-2 rounded-lg text-sm">
                           <option value="">نوسینگە هەڵبژێرە...</option>
                           {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <input type="number" step="any" name="officeFee" placeholder="تێچووی حەواڵە $" className="w-full border border-slate-300 p-2 rounded-lg text-sm" />
                     </div>
                   )}
                </div>
              )}

              <input name="note" defaultValue={isEditingCompany ? pToEdit?.note : ''} placeholder="ڕەقەم حەواڵە یان تێبینی..." className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-rose-500" />
              <div className="mt-auto pt-4"><button type="submit" disabled={isEditingReceiveInst || isEditingAgent || isEditingOffice} className="w-full bg-rose-600 text-white p-2.5 rounded-lg font-bold hover:bg-rose-700 transition-colors">تۆمارکردن</button></div>
            </form>
          </div>

          {/* مامەڵەی نوسینگەکان (حەواڵە) */}
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isEditingOffice ? 'ring-2 ring-orange-500' : 'border-t-4 border-t-orange-500'}`}>
            <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2"><IconOffice/> {isEditingOffice ? 'دەستکاری پارەی نوسینگە' : 'مامەڵەی نوسینگەکان'}</h3>
            <form key={`off-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'office')} className="space-y-4 flex-1 flex flex-col">
              <select required name="txDirection" defaultValue={isEditingOffice ? (pToEdit.type === 'pay_office_debt' ? 'pay' : 'receive') : 'receive'} className="w-full border border-slate-300 p-2.5 rounded-lg bg-orange-50 font-bold text-orange-900 focus:ring-2 focus:ring-orange-500">
                 <option value="receive">وەرگرتنی پارە (لە نوسینگە)</option>
                 <option value="pay">پێدانی پارە (بە نوسینگە)</option>
              </select>
              <select required name="refId" defaultValue={isEditingOffice ? pToEdit?.refId : ''} className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500">
                <option value="">نوسینگە هەڵبژێرە...</option>
                {offices.map(o => <option key={o.id} value={o.id}>{o.name} (قەرزاریین: $${getOfficeDebt(o.id).toFixed(2)})</option>)}
              </select>
              <input required type="number" step="any" name="amount" defaultValue={isEditingOffice ? Math.abs(pToEdit.amount) : ''} placeholder="بڕی پارە $" className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500" />
              <input name="note" defaultValue={isEditingOffice ? pToEdit?.note : ''} placeholder="تێبینی..." className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500" />
              <div className="mt-auto pt-4"><button type="submit" disabled={isEditingCompany || isEditingAgent || isEditingReceiveInst} className="w-full bg-orange-500 text-white p-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors">تۆمارکردن</button></div>
            </form>
          </div>
        </div>

        {/* دوایین مامەڵەکان */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mt-6 overflow-x-auto">
          <h3 className="font-bold text-lg mb-4 border-b pb-2 text-slate-800">دوایین مامەڵەکانی پارەدان و وەرگرتن</h3>
          <table className="w-full text-right text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr><th className="p-3">ژ.پ</th><th className="p-3">بەروار</th><th className="p-3">جۆری مامەڵە</th><th className="p-3">وردەکاری</th><th className="p-3">بڕ</th><th className="p-3">کردارەکان</th></tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">هیچ مامەڵەیەک نییە</td></tr>}
              {recentPayments.map(tx => (
                <tr key={tx.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-400">{tx.receiptNo}</td>
                  <td className="p-3 text-slate-600" dir="ltr">{tx.date}</td>
                  <td className="p-3 font-bold">
                    {tx.type === 'receive_installment' && <span className="text-emerald-600">وەرگرتنی قیست</span>}
                    {tx.type === 'receive_agent_payment' && <span className="text-blue-600">وەرگرتن لە بریکار</span>}
                    {tx.type === 'pay_agent_payment' && <span className="text-rose-600">پێدان بە بریکار</span>}
                    {tx.type === 'pay_company_debt' && <span className="text-rose-600">پێدانی قەرز کۆمپانیا</span>}
                    {tx.type === 'receive_company_payment' && <span className="text-emerald-600">وەرگرتن لە کۆمپانیا</span>}
                    {tx.type === 'receive_office_loan' && <span className="text-orange-600">وەرگرتن لە نوسینگە</span>}
                    {tx.type === 'pay_office_debt' && <span className="text-rose-600">پێدان بە نوسینگە</span>}
                  </td>
                  <td className="p-3 text-slate-700">{tx.desc} <span className="text-slate-400">({tx.note})</span></td>
                  <td className="p-3 font-bold" dir="ltr"><span className={(tx.type.includes('receive') && tx.type !== 'receive_office_loan') ? 'text-emerald-600' : 'text-rose-600'}>${Math.abs(tx.amount).toFixed(2)}</span></td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => printPaymentReceipt(tx)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 p-2 rounded-lg text-xs font-semibold"><IconPrinter /></button>
                    {/* Hiding edit for hawala auto-generated txs to prevent bugs. Just delete and recreate if needed */}
                    {(!tx.desc.includes('حەواڵە')) && <button onClick={() => { setEditingPaymentId(tx.id); window.scrollTo({top:0, behavior:'smooth'}); }} className="bg-orange-50 text-orange-600 hover:bg-orange-100 p-2 rounded-lg"><IconEdit /></button>}
                    <button onClick={() => deletePaymentTx(tx.id)} className="bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 rounded-lg"><IconTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCapitalContent = () => {
    if (loggedAppUser?.role !== 'admin') return null;

    const totalInvested = capitalTx.filter(t => t.type === 'capital_add').reduce((a, t) => a + t.amount, 0) - Math.abs(capitalTx.filter(t => t.type === 'capital_remove').reduce((a, t) => a + t.amount, 0));
    
    // Profit Calculation
    const totalSalesAmount = sales.reduce((acc, s) => acc + s.price, 0);
    let totalCostOfSold = 0;
    sales.forEach(s => {
      const sItems = s.items || [{ itemName: s.itemName, qty: s.qty, price: s.unitPrice || (s.price/s.qty) }];
      sItems.forEach(si => {
         const pItems = purchases.flatMap(p => p.items ? p.items.map(pi=>({ ...pi, parentId: p.id })) : [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty) }]).filter(pi => pi.itemName === si.itemName);
         const totalQty = pItems.reduce((acc, p) => acc + Number(p.qty), 0);
         const avgCost = totalQty > 0 ? (pItems.reduce((acc, p) => acc + (Number(p.qty) * Number(p.price || p.unitPrice)), 0) / totalQty) : 0;
         totalCostOfSold += (Number(si.qty) * avgCost);
      });
    });
    const expectedGrossProfit = totalSalesAmount - totalCostOfSold;
    const totalExpenses = capitalTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const netProfit = expectedGrossProfit - totalExpenses;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">پوختەی سەرمایە و خەرجییەکان</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
             <p className="text-sm text-blue-800 font-bold">سەرمایەی خاوەن کار (دانراو)</p>
             <h3 className="text-2xl font-bold text-blue-900">${totalInvested.toFixed(2)}</h3>
          </div>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
             <p className="text-sm text-emerald-800 font-bold">پوختەی قازانج (دوای خەرجی)</p>
             <h3 className="text-2xl font-bold text-emerald-900">${netProfit.toFixed(2)}</h3>
          </div>
          <div className="bg-orange-500 p-5 rounded-xl border border-orange-600 shadow-md">
             <p className="text-sm text-orange-100 font-bold">کۆی سەرمایەی بنچینەیی ئێستا</p>
             <h3 className="text-2xl font-bold text-white">${(totalInvested + netProfit).toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <h3 className="text-xl mb-4 font-bold text-slate-800">زیادکردنی جوڵەی سەرمایە یان خەرجی</h3>
          <form onSubmit={handleCapitalSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-sm mb-1 text-slate-700 font-medium">جۆری مامەڵە</label>
              <select name="type" className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900">
                <option value="expense">خەرجی (کەمکردن)</option>
                <option value="add">زیادکردنی سەرمایە</option>
                <option value="remove">کێشانەوەی سەرمایە</option>
              </select>
            </div>
            <div><label className="block text-sm mb-1 text-slate-700 font-medium">بڕ (دۆلار)</label><input required type="number" step="any" name="amount" className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900" /></div>
            <div><label className="block text-sm mb-1 text-slate-700 font-medium">هۆکار</label><input required name="reason" className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900" /></div>
            <div className="lg:col-span-2 flex gap-2 items-end">
              <div className="flex-1"><label className="block text-sm mb-1 text-slate-700 font-medium">تێبینی</label><input name="note" className="w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-900" /></div>
              <button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white p-2.5 px-6 rounded-lg font-bold transition-colors">جێبەجێکردن</button>
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <h3 className="p-4 bg-slate-50 font-bold border-b border-slate-200 text-slate-800">تەواوی جوڵەکانی سندوق</h3>
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr><th className="p-4">ژ.پ</th><th className="p-4">بەروار</th><th className="p-4">جۆر</th><th className="p-4">وەسف</th><th className="p-4">تێبینی</th><th className="p-4">بڕ</th></tr>
            </thead>
            <tbody>
              {[...capitalTx].reverse().map(tx => (
                <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-400">{tx.receiptNo || '-'}</td>
                  <td className="p-4 text-slate-500" dir="ltr">{tx.date}</td>
                  <td className="p-4">
                    {tx.type === 'expense' && <span className="text-rose-600 font-medium">خەرجی</span>}
                    {tx.type === 'capital_add' && <span className="text-blue-600 font-medium">سەرمایە (زیاد)</span>}
                    {tx.type === 'capital_remove' && <span className="text-orange-600 font-medium">سەرمایە (کەم)</span>}
                    {(tx.type === 'purchase' || tx.type === 'purchase_cash') && <span className="text-rose-600 font-medium">کڕین (کاش)</span>}
                    {tx.type === 'purchase_debt' && <span className="text-rose-800 font-medium">کڕین (قەرز)</span>}
                    {tx.type === 'sale_advance' && <span className="text-blue-600 font-medium">پێشەکی فرۆشتن</span>}
                    {tx.type === 'sale_cash' && <span className="text-blue-600 font-medium">فرۆشتنی کاش</span>}
                    {tx.type === 'receive_installment' && <span className="text-emerald-600 font-bold">وەرگرتنی قیست</span>}
                    {tx.type === 'receive_agent_payment' && <span className="text-blue-600 font-bold">وەرگرتن لە بریکار</span>}
                    {tx.type === 'pay_agent_payment' && <span className="text-rose-600 font-bold">پێدان بە بریکار</span>}
                    {tx.type === 'pay_company_debt' && <span className="text-rose-600 font-bold">پێدانی قەرز کۆمپانیا</span>}
                    {tx.type === 'receive_company_payment' && <span className="text-emerald-600 font-bold">وەرگرتن لە کۆمپانیا</span>}
                    {tx.type === 'receive_office_loan' && <span className="text-orange-600 font-bold">قەرزی نوسینگە (حەواڵە)</span>}
                    {tx.type === 'pay_office_debt' && <span className="text-rose-600 font-bold">پێدانەوەی قەرزی نوسینگە</span>}
                  </td>
                  <td className="p-4 text-slate-700">{tx.desc}</td>
                  <td className="p-4 text-slate-500">{tx.note}</td>
                  <td className="p-4 font-bold" dir="ltr"><span className={tx.amount > 0 ? 'text-blue-600' : 'text-rose-600'}>{tx.amount > 0 ? '+':''}{tx.amount.toFixed(2)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const [reportTab, setReportTab] = useState('active_accounts');
  const [statementFilter, setStatementFilter] = useState({ name: '', dateFrom: '', dateTo: '' });
  const [itemReportFilter, setItemReportFilter] = useState({ name: '', dateFrom: '', dateTo: '' });

  const renderReports = () => {
    const today = getToday();

    // 1. Active
    const activeAccounts = sales.filter(s => s.saleType === 'installment').map(s => ({ ...s, paid: getSalePaidAmount(s.id), balance: s.price - getSalePaidAmount(s.id) })).filter(s => s.balance > 0);

    // 2. Late
    const lateAccounts = sales.filter(s => s.saleType === 'installment').map(s => {
      const paid = getSalePaidAmount(s.id);
      let expectedToPay = s.advance;
      s.installments?.forEach(inst => { if (inst.dueDate <= today) expectedToPay += inst.amount; });
      const arrears = Math.max(0, expectedToPay - paid);
      return { ...s, paid, balance: s.price - paid, arrears };
    }).filter(s => s.arrears > 0);

    // 3. Completed
    const completedAccounts = sales.map(s => {
      const paid = getSalePaidAmount(s.id);
      return { ...s, paid, balance: s.price - paid };
    }).filter(s => s.balance <= 0);

    // Overdue Agent Debts 
    const overdueAgents = sales.filter(s => s.saleType === 'credit' && s.dueDate < today && (s.price - getSalePaidAmount(s.id)) > 0).map(s => ({
       ...s, paid: getSalePaidAmount(s.id), balance: s.price - getSalePaidAmount(s.id)
    }));

    const agentsStatus = agents.map(a => ({ ...a, debt: getAgentDebt(a.id) })).sort((a,b) => b.debt - a.debt);
    const companiesStatus = companies.map(c => ({ ...c, debt: getCompanyDebt(c.id) })).sort((a,b) => b.debt - a.debt);
    const officesStatus = offices.map(o => ({ ...o, debt: getOfficeDebt(o.id) })).sort((a,b) => b.debt - a.debt);

    const totalCompanyDebt = companiesStatus.reduce((acc, c) => acc + c.debt, 0);
    const totalOfficesDebt = officesStatus.reduce((acc, o) => acc + o.debt, 0);

    const printTable = (title, tableId) => {
      const html = document.getElementById(tableId).outerHTML;
      printContent(title, '', html, STORE_NAME, '', false); 
    };

    // Item Performance Logic
    const generateItemReport = () => {
      let allSaleItems = [];
      sales.forEach(s => {
         const items = s.items || [{ itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty) }];
         items.forEach(i => {
            allSaleItems.push({ id: s.id, receiptNo: s.receiptNo, date: s.date, saleType: s.saleType, itemName: i.itemName, qty: Number(i.qty), price: Number(i.qty) * Number(i.unitPrice) });
         });
      });

      let filteredSales = allSaleItems;
      if (itemReportFilter.name) filteredSales = filteredSales.filter(s => s.itemName === itemReportFilter.name);
      if (itemReportFilter.dateFrom) filteredSales = filteredSales.filter(s => s.date >= itemReportFilter.dateFrom);
      if (itemReportFilter.dateTo) filteredSales = filteredSales.filter(s => s.date <= itemReportFilter.dateTo);

      let tQty = 0; let tSales = 0; let tCost = 0;
      const allPurchaseItems = purchases.flatMap(p => p.items ? p.items.map(pi=>({...pi, pType: p.paymentType})) : [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty), pType: p.paymentType }]);

      const rows = filteredSales.map(s => {
        const pItems = allPurchaseItems.filter(p => p.itemName === s.itemName);
        const totalPQty = pItems.reduce((acc, p) => acc + Number(p.qty), 0);
        const avgC = totalPQty > 0 ? (pItems.reduce((acc, p) => acc + (Number(p.qty) * Number(p.price || p.unitPrice)), 0) / totalPQty) : 0;
        
        const cost = avgC * s.qty;
        const profit = s.price - cost;
        
        tQty += s.qty; tSales += s.price; tCost += cost;
        
        return { ...s, avgCost: avgC, totalCost: cost, profit };
      });
      return { rows, tQty, tSales, tCost, tProfit: tSales - tCost };
    };
    const itemPerf = generateItemReport();

    // 5. Statement Logic
    const generateStatementData = () => {
      let entries = [];
      const searchTarget = statementFilter.name.trim();
      if (!searchTarget) return { entries: [], name: '', isResolved: false };

      let matchedName = searchTarget;
      let isCompany = companies.some(c => c.name === matchedName);
      let isAgent = agents.some(a => a.name === matchedName);
      let isCustomer = sales.some(s => s.customerName === matchedName && s.saleType !== 'credit');
      let isOffice = offices.some(o => o.name === matchedName);

      // هێزی گەڕان بەپێی مۆبایل یان ژمارەی پسوڵە
      if (!isCompany && !isCustomer && !isAgent && !isOffice) {
         const comp = companies.find(c => c.phone === searchTarget);
         if (comp) { matchedName = comp.name; isCompany = true; }
         else {
           const ag = agents.find(a => a.phone === searchTarget);
           if (ag) { matchedName = ag.name; isAgent = true; }
           else {
              const cust = sales.find(s => s.phone === searchTarget || String(s.receiptNo) === searchTarget);
              if (cust) { matchedName = cust.customerName; isCustomer = true; }
              else {
                 const off = offices.find(o => o.phone === searchTarget);
                 if (off) { matchedName = off.name; isOffice = true; }
              }
           }
         }
      }

      if (isCompany) {
        purchases.filter(p => p.companyName === matchedName && p.paymentType === 'debt').forEach(p => {
           const names = (p.items || [{ itemName: p.itemName }]).map(i=>i.itemName).join('، ');
           entries.push({ date: p.date, id: p.id, type: 'کڕین (قەرز)', desc: `کاڵا: ${names}`, note: p.note, debit: 0, credit: p.total, receiptNo: p.receiptNo });
        });
        capitalTx.filter(tx => tx.type === 'pay_company_debt' && companies.find(c=>c.name===matchedName)?.id === tx.refId).forEach(tx => {
           entries.push({ date: tx.date, id: tx.id, type: 'پێدانی قەرز', desc: 'پێدانی پارە بە کۆمپانیا', note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo });
        });
        capitalTx.filter(tx => tx.type === 'receive_company_payment' && companies.find(c=>c.name===matchedName)?.id === tx.refId).forEach(tx => {
           entries.push({ date: tx.date, id: tx.id, type: 'وەرگرتن لە کۆمپانیا', desc: 'گەڕانەوەی پارە', note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo });
        });
      } else if (isCustomerOrAgent) {
        sales.filter(s => s.customerName === matchedName).forEach(s => {
           const names = (s.items || [{ itemName: s.itemName }]).map(i=>i.itemName).join('، ');
           entries.push({ date: s.date, id: s.id, type: s.saleType === 'cash' ? 'فرۆشتن (کاش)' : (s.saleType === 'credit' ? 'فرۆشتن (قەرز)' : 'فرۆشتن (قیست)'), desc: `کاڵا: ${names}`, note: s.note, debit: s.price, credit: s.saleType === 'cash' ? s.price : 0, receiptNo: s.receiptNo });
        });
        const saleIds = sales.filter(s => s.customerName === matchedName).map(s => s.id);
        const agentId = agents.find(a => a.name === matchedName)?.id;
        
        capitalTx.filter(tx => (tx.type === 'receive_installment' || tx.type === 'sale_advance') && saleIds.includes(tx.refId)).forEach(tx => {
           entries.push({ date: tx.date, id: tx.id, type: tx.type.includes('advance') ? 'پێشەکی' : 'وەرگرتنی پارە', desc: 'وەرگرتنی پارە', note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo });
        });
        
        if(agentId) {
            capitalTx.filter(tx => tx.type === 'receive_agent_payment' && tx.refId === agentId).forEach(tx => {
               entries.push({ date: tx.date, id: tx.id, type: 'وەرگرتنی پارە', desc: 'وەرگرتن لە بریکار', note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo });
            });
            capitalTx.filter(tx => tx.type === 'pay_agent_payment' && tx.refId === agentId).forEach(tx => {
               entries.push({ date: tx.date, id: tx.id, type: 'پێدانی پارە', desc: 'پێدان بە بریکار', note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo });
            });
            // کڕین لە بریکار بە قەرز
            purchases.filter(p => p.companyId === agentId && p.paymentType === 'debt').forEach(p => {
               const names = (p.items || [{ itemName: p.itemName }]).map(i=>i.itemName).join('، ');
               entries.push({ date: p.date, id: p.id, type: 'کڕین (قەرز)', desc: `کاڵا: ${names}`, note: p.note, debit: 0, credit: p.total, receiptNo: p.receiptNo });
            });
        }
      } else if (isOffice) {
         const officeId = offices.find(o => o.name === matchedName)?.id;
         if (officeId) {
             capitalTx.filter(tx => tx.type === 'receive_office_loan' && tx.refId === officeId).forEach(tx => {
                 entries.push({ date: tx.date, id: tx.id, type: 'قەرزی حەواڵە', desc: tx.desc, note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo });
             });
             capitalTx.filter(tx => tx.type === 'pay_office_debt' && tx.refId === officeId).forEach(tx => {
                 entries.push({ date: tx.date, id: tx.id, type: 'دانەوەی قەرز', desc: 'پێدان بە نوسینگە', note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo });
             });
         }
      }

      if (statementFilter.dateFrom) entries = entries.filter(e => e.date >= statementFilter.dateFrom);
      if (statementFilter.dateTo) entries = entries.filter(e => e.date <= statementFilter.dateTo);
      entries.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

      let runningBalance = 0;
      entries = entries.map(e => {
        runningBalance += (isCompany || isOffice) ? (e.credit - e.debit) : (e.debit - e.credit);
        return { ...e, balance: runningBalance };
      });

      return { entries, name: matchedName, isResolved: isCompany || isCustomerOrAgent || isOffice };
    };

    const statementResult = generateStatementData();
    const finalBalance = statementResult.entries.length > 0 ? statementResult.entries[statementResult.entries.length - 1].balance : 0;

    const allCustomersAndAgents = Array.from(new Set([...sales.map(s => s.customerName), ...agents.map(a=>a.name)]));

    // Cashbox Statement Logic
    const generateCashboxStatement = () => {
       let entries = [...capitalTx];
       if (statementFilter.dateFrom) entries = entries.filter(e => e.date >= statementFilter.dateFrom);
       if (statementFilter.dateTo) entries = entries.filter(e => e.date <= statementFilter.dateTo);
       entries.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

       let runningBalance = 0;
       entries = entries.map(e => {
          let am = e.amount;
          if (e.type === 'receive_office_loan') am = 0; // Does not touch cashbox
          runningBalance += am;
          return { ...e, balance: runningBalance, realAmount: am };
       }).filter(e => e.realAmount !== 0);

       return entries;
    };
    const cashboxEntries = generateCashboxStatement();
    const cashboxFinalBalance = cashboxEntries.length > 0 ? cashboxEntries[cashboxEntries.length - 1].balance : 0;


    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">ڕاپۆرتەکان و کەشف حساب</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setReportTab('active_accounts')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='active_accounts'?'bg-blue-900 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>هەژماری قیستەکان</button>
          <button onClick={() => setReportTab('late')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='late'?'bg-blue-900 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>قیستە دواکەوتووەکان</button>
          <button onClick={() => setReportTab('agents_all')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='agents_all'?'bg-blue-900 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>بریکارەکان</button>
          <button onClick={() => setReportTab('agents_late')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='agents_late'?'bg-blue-900 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>قەرزی دواکەوتووی بریکارەکان</button>
          <button onClick={() => setReportTab('companies')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='companies'?'bg-blue-900 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>کۆمپانیاکان</button>
          <button onClick={() => setReportTab('offices')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='offices'?'bg-blue-900 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>نوسینگەکان</button>
          
          {loggedAppUser?.role === 'admin' && (
            <button onClick={() => setReportTab('item_perf')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='item_perf'?'bg-blue-900 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>فرۆش و قازانجی کاڵا</button>
          )}
          {loggedAppUser?.role === 'admin' && (
            <button onClick={() => setReportTab('cashbox')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='cashbox'?'bg-blue-900 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>سندوق</button>
          )}
          <button onClick={() => setReportTab('statement')} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab==='statement'?'bg-orange-500 text-white shadow-md':'bg-white text-slate-700 border hover:bg-slate-50'}`}>کەشف حساب</button>
        </div>

        {reportTab === 'cashbox' && loggedAppUser?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 md:p-5 rounded-xl border border-blue-100">
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">لە بەرواری</label><input type="date" value={statementFilter.dateFrom} onChange={e=>setStatementFilter({...statementFilter, dateFrom: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">بۆ بەرواری</label><input type="date" value={statementFilter.dateTo} onChange={e=>setStatementFilter({...statementFilter, dateTo: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
            
            <button onClick={() => printTable(`ڕاپۆرتی سندوق`, 'print-cashbox-area')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200 transition-colors"><IconPrinter/> چاپکردن</button>
            <div id="print-cashbox-area" className="overflow-x-auto">
              <div className="mb-4 text-center"><h3 className="text-xl font-bold text-slate-800">ڕاپۆرتی سندوق</h3></div>
              <div className="bg-blue-900 text-white p-4 rounded-xl mb-4 flex justify-between items-center">
                 <span className="font-bold">بڕی پارەی ناو سندوق (لەم ماوەیەدا):</span>
                 <span className="font-black text-2xl" dir="ltr">${cashboxFinalBalance.toFixed(2)}</span>
              </div>
              <table className="w-full text-right border border-slate-200 text-sm min-w-[700px]">
                <thead className="bg-slate-50"><tr><th className="p-3 border">ژ.پ</th><th className="p-3 border">بەروار</th><th className="p-3 border">جۆر</th><th className="p-3 border">وەسف</th><th className="p-3 border">زیادبوون (داهات)</th><th className="p-3 border">کەمبوون (خەرجی)</th><th className="p-3 border bg-blue-50">باڵانس</th></tr></thead>
                <tbody>
                  {cashboxEntries.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">هیچ مامەڵەیەک نییە لەم بەروارەدا</td></tr>}
                  {cashboxEntries.map((e, idx) => (
                    <tr key={`${e.id}-${idx}`} className="border-b hover:bg-slate-50">
                      <td className="p-3 border text-slate-400 font-bold">{e.receiptNo || '-'}</td>
                      <td className="p-3 border text-slate-500" dir="ltr">{e.date}</td>
                      <td className="p-3 border font-medium">
                        {e.type === 'expense' && 'خەرجی'}
                        {e.type === 'capital_add' && 'سەرمایە (زیاد)'}
                        {e.type === 'capital_remove' && 'سەرمایە (کەم)'}
                        {e.type === 'purchase_cash' && 'کڕین (کاش)'}
                        {e.type === 'sale_advance' && 'پێشەکی فرۆشتن'}
                        {e.type === 'sale_cash' && 'فرۆشتنی کاش'}
                        {e.type === 'receive_installment' && 'وەرگرتنی قیست'}
                        {e.type === 'receive_agent_payment' && 'وەرگرتن لە بریکار'}
                        {e.type === 'pay_agent_payment' && 'پێدان بە بریکار'}
                        {e.type === 'pay_company_debt' && 'پێدانی قەرز کۆمپانیا'}
                        {e.type === 'receive_company_payment' && 'وەرگرتن لە کۆمپانیا'}
                        {e.type === 'pay_office_debt' && 'پێدان بە نوسینگە'}
                      </td>
                      <td className="p-3 border">{e.desc} {e.note && <span className="text-slate-400 text-xs mr-2">({e.note})</span>}</td>
                      <td className="p-3 border font-bold text-blue-600" dir="ltr">{e.realAmount > 0 ? '$'+e.realAmount.toFixed(2) : '-'}</td>
                      <td className="p-3 border font-bold text-rose-600" dir="ltr">{e.realAmount < 0 ? '$'+Math.abs(e.realAmount).toFixed(2) : '-'}</td>
                      <td className="p-3 border font-bold bg-blue-50/50" dir="ltr">${e.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportTab === 'companies' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <button onClick={() => printTable('ڕاپۆرتی گشتی کۆمپانیاکان', 'tbl-companies')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button>
            <div id="tbl-companies" className="overflow-x-auto">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-4">
                 <h3 className="text-lg font-bold text-orange-900">کۆی گشتی قەرزی کۆمپانیاکان (لەسەرمان): <span dir="ltr" className="text-xl md:text-2xl">${totalCompanyDebt.toFixed(2)}</span></h3>
              </div>
              <table className="w-full text-right border border-blue-200 min-w-[500px]">
                <thead className="bg-blue-50 text-blue-900"><tr><th className="p-3 border border-blue-200">ناوی کۆمپانیا</th><th className="p-3 border border-blue-200">مۆبایل</th><th className="p-3 border border-blue-200">ناونیشان</th><th className="p-3 border border-blue-200">کۆی قەرز لەسەرمان</th></tr></thead>
                <tbody>
                  {companiesStatus.map(c => (<tr key={c.id} className="border-b border-blue-100"><td className="p-3 border border-blue-200 font-semibold">{c.name}</td><td className="p-3 border border-blue-200">{c.phone}</td><td className="p-3 border border-blue-200">${c.address}</td><td className="p-3 border border-blue-200 text-orange-600 font-bold bg-orange-50/50">${c.debt.toFixed(2)}</td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportTab === 'offices' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <button onClick={() => printTable('ڕاپۆرتی گشتی نوسینگەکان (حەواڵە)', 'tbl-offices')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button>
            <div id="tbl-offices" className="overflow-x-auto">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-4">
                 <h3 className="text-lg font-bold text-orange-900">کۆی گشتی قەرزی نوسینگەکان (لەسەرمان): <span dir="ltr" className="text-xl md:text-2xl">${totalOfficesDebt.toFixed(2)}</span></h3>
              </div>
              <table className="w-full text-right border border-blue-200 min-w-[500px]">
                <thead className="bg-blue-50 text-blue-900"><tr><th className="p-3 border border-blue-200">ناوی نوسینگە</th><th className="p-3 border border-blue-200">مۆبایل</th><th className="p-3 border border-blue-200">ناونیشان</th><th className="p-3 border border-blue-200">کۆی قەرز لەسەرمان</th></tr></thead>
                <tbody>
                  {officesStatus.map(o => (<tr key={o.id} className="border-b border-blue-100"><td className="p-3 border border-blue-200 font-semibold">{o.name}</td><td className="p-3 border border-blue-200">{o.phone}</td><td className="p-3 border border-blue-200">${o.address}</td><td className="p-3 border border-blue-200 text-orange-600 font-bold bg-orange-50/50">${o.debt.toFixed(2)}</td></tr>))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportTab === 'item_perf' && loggedAppUser?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200">
               <div>
                  <label className="block text-sm mb-1 font-bold text-slate-700">ناوی کاڵا</label>
                  <select value={itemReportFilter.name} onChange={e=>setItemReportFilter({...itemReportFilter, name: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 outline-none">
                    <option value="">(سەرجەم کاڵاکان)</option>
                    {definedItems.map(i => <option key={i.id} value={i.name}>{i.brand} - {i.name}</option>)}
                  </select>
               </div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">لە بەرواری</label><input type="date" value={itemReportFilter.dateFrom} onChange={e=>setItemReportFilter({...itemReportFilter, dateFrom: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-900" /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">بۆ بەرواری</label><input type="date" value={itemReportFilter.dateTo} onChange={e=>setItemReportFilter({...itemReportFilter, dateTo: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-900" /></div>
            </div>
            
            <button onClick={() => printTable('ڕاپۆرتی فرۆش و قازانجی کاڵاکان', 'tbl-item-perf')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200 transition-colors"><IconPrinter/> چاپکردن</button>
            
            <div id="tbl-item-perf" className="overflow-x-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 min-w-[600px]">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-sm text-slate-500 mb-1">کۆی فرۆشراو (دانە)</p><h3 className="text-xl md:text-2xl font-bold text-slate-800">{itemPerf.tQty}</h3></div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200"><p className="text-sm text-blue-800 mb-1">کۆی داهاتی فرۆشتن</p><h3 className="text-xl md:text-2xl font-bold text-blue-900">${itemPerf.tSales.toFixed(2)}</h3></div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-sm text-slate-500 mb-1">کۆی تێچووی کاڵاکان</p><h3 className="text-xl md:text-2xl font-bold text-slate-800">${itemPerf.tCost.toFixed(2)}</h3></div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-sm text-slate-500 mb-1">پوختەی قازانج</p><h3 className={`text-xl md:text-2xl font-bold ${itemPerf.tProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${itemPerf.tProfit.toFixed(2)}</h3></div>
              </div>

              <table className="w-full text-right border border-slate-200 text-sm min-w-[700px]">
                <thead className="bg-slate-50"><tr><th className="p-3 border">بەروار</th><th className="p-3 border">جۆر / ژ.پ</th><th className="p-3 border">کاڵا</th><th className="p-3 border">بڕ</th><th className="p-3 border">تێچووی دانە</th><th className="p-3 border">کۆی داهات</th><th className="p-3 border">قازانج / زەرەر</th></tr></thead>
                <tbody>
                  {itemPerf.rows.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">هیچ داتایەک نییە</td></tr>}
                  {itemPerf.rows.map(r => (
                    <tr key={`${r.id}-${r.itemName}`} className="border-b hover:bg-slate-50">
                      <td className="p-3 border text-slate-500" dir="ltr">{r.date}</td>
                      <td className="p-3 border font-medium text-slate-700">{r.saleType === 'cash' ? 'کاش' : (r.saleType === 'credit' ? 'بریکار' : 'قیست')} | {r.receiptNo}</td>
                      <td className="p-3 border font-bold text-blue-900">{r.itemName}</td>
                      <td className="p-3 border">{r.qty}</td>
                      <td className="p-3 border text-slate-600">${r.avgCost.toFixed(2)}</td>
                      <td className="p-3 border font-bold text-blue-900">${r.price.toFixed(2)}</td>
                      <td className={`p-3 border font-bold ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>${r.profit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportTab === 'active_accounts' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto">
            <button onClick={() => printTable('لیستی هەژماری قیستەکان', 'tbl-active')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium transition-colors"><IconPrinter/> چاپکردن</button>
            <table id="tbl-active" className="w-full text-right border border-slate-200 min-w-[700px]">
              <thead className="bg-slate-50"><tr><th className="p-3 border">کڕیار</th><th className="p-3 border">مۆبایل</th><th className="p-3 border">کاڵا</th><th className="p-3 border">کۆی گشتی</th><th className="p-3 border">وەرگیراو</th><th className="p-3 border">قەرزی ماوە</th></tr></thead>
              <tbody>
                {activeAccounts.map(s => (
                  <tr key={s.id} className="border-b"><td className="p-3 border font-medium">{s.customerName}</td><td className="p-3 border">{s.phone}</td><td className="p-3 border">{(s.items || [{itemName: s.itemName}]).map(i=>i.itemName).join('، ')}</td><td className="p-3 border">${s.price.toFixed(2)}</td><td className="p-3 border text-blue-600">${s.paid.toFixed(2)}</td><td className="p-3 border font-bold text-orange-600">${s.balance.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportTab === 'late' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto">
            <button onClick={() => printTable('قیستە دواکەوتووەکان', 'tbl-late')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium transition-colors"><IconPrinter/> چاپکردن</button>
            <table id="tbl-late" className="w-full text-right border border-rose-200 min-w-[600px]">
              <thead className="bg-rose-50 text-rose-800"><tr><th className="p-3 border border-rose-200">کڕیار</th><th className="p-3 border border-rose-200">مۆبایل</th><th className="p-3 border border-rose-200">کۆی بڕی ماوە</th><th className="p-3 border border-rose-200">بڕی پارەی دواکەوتوو</th></tr></thead>
              <tbody>
                {lateAccounts.map(s => (
                  <tr key={s.id} className="border-b border-rose-100"><td className="p-3 border border-rose-200 font-semibold">{s.customerName}</td><td className="p-3 border border-rose-200">{s.phone}</td><td className="p-3 border border-rose-200">${s.balance.toFixed(2)}</td><td className="p-3 border border-rose-200 text-rose-600 font-bold bg-rose-50">${s.arrears.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportTab === 'agents_all' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto">
            <button onClick={() => printTable('حسابی گشتی بریکارەکان', 'tbl-agents')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button>
            <table id="tbl-agents" className="w-full text-right border border-blue-200 min-w-[600px]">
              <thead className="bg-blue-50 text-blue-900"><tr><th className="p-3 border border-blue-200">ناوی بریکار</th><th className="p-3 border border-blue-200">مۆبایل</th><th className="p-3 border border-blue-200">ناونیشان</th><th className="p-3 border border-blue-200">کۆی قەرزی لایە</th></tr></thead>
              <tbody>
                {agentsStatus.map(a => (<tr key={a.id} className="border-b border-blue-100"><td className="p-3 border border-blue-200 font-semibold">{a.name}</td><td className="p-3 border border-blue-200">{a.phone}</td><td className="p-3 border border-blue-200">${a.address}</td><td className="p-3 border border-blue-200 text-orange-600 font-bold bg-orange-50/50">${a.debt.toFixed(2)}</td></tr>))}
              </tbody>
            </table>
          </div>
        )}

        {reportTab === 'agents_late' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto">
            <button onClick={() => printTable('پسوڵە دواکەوتووەکانی بریکارەکان', 'tbl-agents-late')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> چاپکردن</button>
            <table id="tbl-agents-late" className="w-full text-right border border-rose-200 min-w-[600px]">
              <thead className="bg-rose-50 text-rose-900"><tr><th className="p-3 border border-rose-200">پسوڵە</th><th className="p-3 border border-rose-200">بریکار</th><th className="p-3 border border-rose-200">مۆبایل</th><th className="p-3 border border-rose-200">بەرواری گەڕاندنەوە</th><th className="p-3 border border-rose-200">قەرزی ماوە لەم پسوڵەیە</th></tr></thead>
              <tbody>
                {overdueAgents.map(s => (<tr key={s.id} className="border-b border-rose-100"><td className="p-3 border border-rose-200 font-bold text-slate-500">{s.receiptNo}</td><td className="p-3 border border-rose-200 font-semibold">{s.customerName}</td><td className="p-3 border border-rose-200">{s.phone}</td><td className="p-3 border border-rose-200 text-rose-600 font-bold" dir="ltr">{s.dueDate}</td><td className="p-3 border border-rose-200 text-rose-600 font-bold bg-rose-50">${s.balance.toFixed(2)}</td></tr>))}
              </tbody>
            </table>
          </div>
        )}

        {reportTab === 'statement' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-blue-50 p-4 md:p-5 rounded-xl border border-blue-100">
               <div>
                  <label className="block text-sm mb-1 font-bold text-blue-900">گەڕان (ناو، مۆبایل، ژ.پ)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={statementFilter.name} 
                      onChange={e => setStatementFilter({...statementFilter, name: e.target.value})} 
                      placeholder="بگەڕێ..." 
                      className="flex-1 border border-blue-200 p-2.5 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-orange-500 outline-none min-w-0"
                    />
                    <select 
                      value="" 
                      onChange={e => { if(e.target.value) setStatementFilter({...statementFilter, name: e.target.value}) }} 
                      className="w-12 border border-blue-200 rounded-lg bg-blue-100 text-blue-900 focus:ring-2 focus:ring-orange-500 cursor-pointer appearance-none text-center font-bold"
                      title="هەڵبژاردن لە لیستەوە"
                    >
                      <option value="" disabled>▼</option>
                      {companies.length > 0 && <optgroup label="کۆمپانیاکان">{companies.map(c => <option key={`dl-comp-${c.id}`} value={c.name}>{c.name}</option>)}</optgroup>}
                      {offices.length > 0 && <optgroup label="نوسینگەکان">{offices.map(o => <option key={`dl-off-${o.id}`} value={o.name}>{o.name}</option>)}</optgroup>}
                      {allCustomersAndAgents.length > 0 && <optgroup label="بریکار و کڕیارەکان">{allCustomersAndAgents.map((name, i) => <option key={`dl-all-${i}`} value={name}>{name}</option>)}</optgroup>}
                    </select>
                  </div>
               </div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">لە بەرواری</label><input type="date" value={statementFilter.dateFrom} onChange={e=>setStatementFilter({...statementFilter, dateFrom: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-orange-500" /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">بۆ بەرواری</label><input type="date" value={statementFilter.dateTo} onChange={e=>setStatementFilter({...statementFilter, dateTo: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-orange-500" /></div>
            </div>
            
            {statementResult.isResolved && (
              <div className="overflow-x-auto">
                <button onClick={() => printTable(`کەشف حسابی: ${statementResult.name}`, 'print-statement-area')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200 transition-colors"><IconPrinter/> چاپکردن</button>
                <div id="print-statement-area">
                  <div className="mb-4 text-center"><h3 className="text-xl font-bold text-slate-800">کەشف حسابی: <span className="text-orange-600">{statementResult.name}</span></h3></div>
                  <table className="w-full text-right border border-slate-200 text-sm min-w-[700px]">
                    <thead className="bg-slate-50"><tr><th className="p-3 border">ژ.پ</th><th className="p-3 border">بەروار</th><th className="p-3 border">جۆر</th><th className="p-3 border">وەسف و کاڵا</th><th className="p-3 border">قەرز (لەسەری)</th><th className="p-3 border">پێدان (پارەی دراو)</th><th className="p-3 border bg-blue-50">باڵانس (ماوە)</th></tr></thead>
                    <tbody>
                      {statementResult.entries.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">هیچ مامەڵەیەک نییە لەم بەروارەدا</td></tr>}
                      {statementResult.entries.map((e, idx) => (
                        <tr key={`${e.id}-${idx}`} className="border-b hover:bg-slate-50">
                          <td className="p-3 border text-slate-400 font-bold">{e.receiptNo || '-'}</td>
                          <td className="p-3 border text-slate-500" dir="ltr">{e.date}</td>
                          <td className="p-3 border font-medium">{e.type}</td>
                          <td className="p-3 border">{e.desc} {e.note && <span className="text-slate-400 text-xs mr-2">({e.note})</span>}</td>
                          <td className="p-3 border font-bold text-rose-600" dir="ltr">{e.debit > 0 ? '$'+e.debit.toFixed(2) : '-'}</td>
                          <td className="p-3 border font-bold text-blue-600" dir="ltr">{e.credit > 0 ? '$'+e.credit.toFixed(2) : '-'}</td>
                          <td className="p-3 border font-bold bg-blue-50/50" dir="ltr">${e.balance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                    <span style={{ color: '#0f172a' }}>کۆتا حسابی ماوە:</span>
                    <span dir="ltr" style={{ color: '#ea580c', fontSize: '22px' }}>${finalBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            {!statementResult.isResolved && statementFilter.name && <div className="p-8 text-center text-rose-500 border border-dashed border-rose-200 rounded-xl bg-rose-50">هیچ حسابێک نەدۆزرایەوە بەم ناوە یان ژمارەیە.</div>}
            {!statementFilter.name && <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">تکایە لە سەرەوە ناو، مۆبایل، یان ژمارەی پسوڵە بنووسە بۆ بینینی کەشف حساب.</div>}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600 font-bold text-xl" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p>چاوەڕێ بکە، پەیوەندی بە ڕاژەی پارێزراوەوە دەکرێت...</p>
        </div>
      </div>
    );
  }

  if (!isLogged) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4" dir="rtl" style={{fontFamily: "'Calibri', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"}}>
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          
          {showForgot ? (
            <div>
              <div className="flex justify-center mb-6">
                <div className="bg-orange-100 p-4 rounded-full text-orange-600">
                  <IconLock />
                </div>
              </div>
              <h1 className="text-xl font-black text-center text-slate-800 mb-2">گەڕاندنەوەی هەژمارەکان</h1>
              <p className="text-center text-slate-500 mb-6 text-sm">تکایە کۆدی گەڕاندنەوە (Recovery Key) بنووسە بۆ بینینی وشە تێپەڕەکان</p>
              
              {!recoveredData ? (
                <form onSubmit={handleRecover} className="space-y-4">
                  <input 
                    type="password" 
                    value={recoveryKey} 
                    onChange={e => setRecoveryKey(e.target.value)} 
                    placeholder="کۆدی گەڕاندنەوە..."
                    className="w-full border border-slate-300 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-center bg-white text-slate-900" 
                    dir="ltr"
                  />
                  {loginError && <p className="text-rose-600 text-sm font-medium text-center">{loginError}</p>}
                  <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors">پێشاندانی پاسوۆردەکان</button>
                  <button type="button" onClick={() => {setShowForgot(false); setLoginError('');}} className="w-full text-slate-500 text-sm mt-2">گەڕانەوە بۆ چوونەژوورەوە</button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto space-y-3">
                    {recoveredData.map((ru, i) => (
                      <div key={i} className="bg-white p-3 rounded shadow-sm border border-slate-100 text-left" dir="ltr">
                        <p className="text-xs text-slate-400 mb-1">Role: {ru.role}</p>
                        <p className="font-bold text-slate-800">User: <span className="text-blue-600">{ru.username}</span></p>
                        <p className="font-bold text-slate-800">Pass: <span className="text-rose-600">{ru.password}</span></p>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => {setShowForgot(false); setRecoveredData(null); setRecoveryKey('');}} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors">گەڕانەوە بۆ چوونەژوورەوە</button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full text-blue-700">
                  <IconLock />
                </div>
              </div>
              <h1 className="text-2xl font-black text-center text-blue-900 mb-2">{STORE_NAME}</h1>
              <p className="text-center text-slate-500 mb-8 text-sm">چوونەژوورەوەی سیستم</p>
              
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ناوی بەکارهێنەر (User)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      autoComplete="username"
                      value={loginForm.user} 
                      onChange={(e) => setLoginForm({...loginForm, user: e.target.value})} 
                      className="w-full border border-slate-300 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 text-slate-900 transition-all text-left" 
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">وشەی تێپەڕ (Password)</label>
                  <input 
                    type="password" 
                    autoComplete="current-password"
                    value={loginForm.pass} 
                    onChange={(e) => setLoginForm({...loginForm, pass: e.target.value})} 
                    className="w-full border border-slate-300 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 text-slate-900 transition-all text-left" 
                    dir="ltr"
                  />
                </div>
                
                {loginError && (
                  <p className="text-rose-600 bg-rose-50 p-3 rounded-lg text-sm font-medium border border-rose-100 text-center">
                    {loginError}
                  </p>
                )}
                
                <button 
                  type="submit" 
                  className="w-full bg-orange-500 text-white font-bold text-lg py-3 rounded-xl shadow-lg hover:bg-orange-600 transition-colors"
                >
                  چوونە ژوورەوە
                </button>
              </form>

              <div className="mt-6 text-center">
                <button onClick={() => setShowForgot(true)} className="text-sm font-semibold text-blue-800 hover:text-blue-600 underline transition-colors">
                  وشەی تێپەڕم بیرچووە؟
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // --- Layout ---
  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden" dir="rtl" style={{fontFamily: "'Calibri', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"}}>
      
      {/* Mobile Top Nav */}
      <div className="md:hidden bg-blue-950 text-white p-4 flex justify-between items-center shadow-md z-20">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors">
            <IconMenu />
        </button>
        <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-orange-500">{STORE_NAME}</h1>
            {STORE_LOGO && <img src={STORE_LOGO} alt="Logo" className="w-8 h-8 object-contain" />}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
         <div className="md:hidden fixed inset-0 bg-slate-900/50 z-40" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-blue-950 text-white flex flex-col shadow-2xl z-50 border-l border-blue-900`}>
        <div className="p-6 text-center border-b border-blue-900 bg-blue-900/40 relative">
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden absolute top-4 left-4 text-blue-300 hover:text-white"><IconX /></button>
          {STORE_LOGO && <img src={STORE_LOGO} alt="Logo" className="w-24 h-24 mx-auto mb-4 object-contain drop-shadow-md" />}
          <h1 className="text-2xl font-black text-orange-500 tracking-tight">{STORE_NAME}</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2 text-sm md:text-base">
          {[
            { id: 'dashboard', label: 'سەرەتا', icon: <IconHome /> },
            { id: 'items', label: 'پێناسەی کاڵاکان', icon: <IconBox /> },
            { id: 'companies', label: 'کۆمپانیاکان', icon: <IconBuilding /> },
            { id: 'agents', label: 'بریکارەکان', icon: <IconAgent /> },
            { id: 'offices', label: 'نوسینگەکان (حەواڵە)', icon: <IconOffice /> },
            { id: 'purchases', label: 'كڕین (کاش،قەرز)', icon: <IconPackage /> },
            { id: 'sales', label: 'فرۆشتن (کاش،قەرز،قیست)', icon: <IconFileText /> },
            { id: 'payments', label: 'وەرگرتن و پێدان', icon: <IconCreditCard /> },
            { id: 'inventory', label: 'کۆگا', icon: <IconShoppingCart /> },
            ...(loggedAppUser?.role === 'admin' ? [{ id: 'capital', label: 'سەرمایە و خەرجی', icon: <IconDollarSign /> }] : []),
            { id: 'reports', label: 'ڕاپۆرتەکان', icon: <IconList /> },
            ...(loggedAppUser?.role === 'admin' ? [{ id: 'users', label: 'بەکارهێنەران', icon: <IconUsers /> }] : [])
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setEditingId(null); setEditingPaymentId(null); setViewingInstallments(null); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${view === item.id ? 'bg-orange-500 text-white shadow-md' : 'text-blue-200 hover:bg-blue-900 hover:text-white'}`}
            >
              <span className={view === item.id ? 'text-orange-100' : 'text-blue-400'}>{item.icon}</span> <span>{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-blue-900 bg-blue-900/20">
           <div className="flex items-center gap-3 text-blue-200 mb-3">
              <div className="bg-blue-800 p-2 rounded-full"><IconUser /></div>
              <div>
                <p className="text-xs text-blue-400">ژوورەوە وەک</p>
                <p className="font-bold text-sm" dir="ltr">{loggedAppUser?.username || 'بەکارهێنەر'}</p>
              </div>
           </div>
           <button onClick={() => {setIsLogged(false); setLoggedAppUser(null); setLoginForm({user:'', pass:''}); setIsMobileMenuOpen(false);}} className="w-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 py-2 rounded-lg font-medium text-sm transition-colors border border-rose-500/20">
              دەرچوون (چۆڵکردن)
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        <div className="max-w-6xl mx-auto pb-20 md:pb-0">
          {view === 'dashboard' && renderDashboard()}
          {view === 'items' && renderDefinedItems()}
          {view === 'agents' && renderAgents()}
          {view === 'offices' && renderOffices()}
          {view === 'companies' && renderCompanies()}
          {view === 'purchases' && renderPurchases()}
          {view === 'inventory' && renderInventory()}
          {view === 'sales' && renderSales()}
          {view === 'payments' && renderPayments()}
          {view === 'capital' && renderCapitalContent()}
          {view === 'reports' && renderReports()}
          {view === 'users' && renderUsers()}
        </div>
      </div>
      
      {/* پەنجەرەی تایبەت بە بەڵگەنامەکان و وێنەکانیان */}
      {viewingDocuments && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><IconDocs/> بەڵگەنامەکانی: {viewingDocuments.customerName}</h3>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-2">
              {DOC_TYPES.map(dName => {
                const docItem = selectedDocs.find(d => d.name === dName);
                const isSelected = !!docItem;
                const isUploading = uploadingDoc === dName;
                
                return (
                  <div key={dName} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isSelected ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input type="checkbox" checked={isSelected} onChange={() => handleDocToggle(dName)} className="w-5 h-5 accent-orange-500 rounded" />
                      <span className="font-bold text-slate-700">{dName}</span>
                    </label>
                    
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        {isUploading ? (
                           <span className="text-xs text-orange-500 animate-pulse font-bold">... باردەکرێت</span>
                        ) : docItem.fileUrl ? (
                           <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">هاوپێچ کرا</span>
                        ) : (
                           <label className="cursor-pointer text-white bg-blue-900 hover:bg-blue-800 w-8 h-8 rounded-full flex items-center justify-center shadow-sm" title="وێنە بگرە یان هەڵبژێرە">
                              + <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, dName)} />
                           </label>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-between items-center mt-6 gap-3 pt-4 border-t">
              <button onClick={() => setViewingDocuments(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-semibold transition-colors">داخستن</button>
              <div className="flex gap-2">
                 <button onClick={() => printDocsReceipt(viewingDocuments, selectedDocs)} className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-xl font-bold transition-colors flex items-center gap-1"><IconPrinter/> چاپ</button>
                 <button onClick={handleSaveDocs} className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-lg transition-colors">پاشەکەوت</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{modal.type === 'confirm' ? 'دڵنیابوونەوە' : 'ئاگاداری'}</h3>
            <p className="text-lg text-slate-700 mb-8">{modal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModal({show:false, type:'', message:'', onConfirm:null})} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-semibold transition-colors">
                {modal.type === 'confirm' ? 'پاشگەزبوونەوە' : 'داخستن'}
              </button>
              {modal.type === 'confirm' && (
                <button onClick={() => { modal.onConfirm(); setModal({show:false, type:'', message:'', onConfirm:null}); }} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg transition-colors">
                  بەڵێ دڵنیام
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

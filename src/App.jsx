import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- Constants & Config ---
const DEFAULT_ADMIN_USER = 'ArkanA';
const DEFAULT_ADMIN_PASS = 'Arkan1234,';
const MASTER_RECOVERY_KEY = 'Aida2026';
const ADMIN_WHATSAPP_NUMBER = '9647769516814';
const STORE_LOGO = 'https://i.ibb.co/hx5T0jpJ/icon.png'; 
const INITIAL_STORE_SIGNATURE = 'https://i.ibb.co/PZt3sfJc/Arkan-signature.jpg';
const PARTY2_SIGNATURE = 'https://i.ibb.co/Hf65zpHf/Sarwar-signature.jpg';
const INITIAL_STORE_PHONE = '07769516814';
const STORE_NAME = 'ئایدا ستۆر';
const INITIAL_STORE_ADDRESS = 'سلێمانی، شەقامی سەرەکی';

const CURRENCIES = {
  USD: { symbol: '$', name: 'دۆلار', code: 'USD' },
  IQD: { symbol: 'د.ع', name: 'دینار', code: 'IQD' },
  AED: { symbol: 'د.ئ', name: 'درهەم', code: 'AED' }
};

const LANGUAGES = { 
  KU: { label: 'کوردی', code: 'KU', dir: 'rtl' }, 
  EN: { label: 'English', code: 'EN', dir: 'ltr' }, 
  AR: { label: 'العربية', code: 'AR', dir: 'rtl' } 
};

// Full & Enriched Translation Dictionary
const DICT = {
  KU: { 
    m_dashboard:'ئامارەکانی سەرەتا', m_items:'پێناسەکردنی کاڵاکان', m_companies:'لیستی کۆمپانیاکان', m_agents:'لیستی بریکارەکان', m_offices:'نوسینگەکانی حەواڵە', m_purchases:'کڕینی کاڵاکان', m_sales:'فرۆشتنی کاڵاکان', m_installment_ops:'مامەڵەی قیستەکان', m_payments:'وەرگرتن و پێدانی پارە', m_inventory:'کۆگا (بەردەست)', m_reports:'ڕاپۆرتە گشتییەکان', m_capital:'سندوق و سەرمایە', m_users:'لیستی بەکارهێنەران', m_settings:'ڕێکخستنەکانی سیستم', 
    add:'زیادکردن', upd:'نوێکردنەوە', can:'پاشگەزبوونەوە', sav:'پاشەکەوتکردن', del:'سڕینەوە', edt:'دەستکاری', prt:'چاپکردنی پسوڵە', src:'گەڕان بۆ...', act:'کردارەکان', not:'تێبینییەکان', dat:'بەروار', amt:'بڕی پارە', cur:'جۆری دراو', tot:'کۆی گشتی', nam:'ناو', phn:'ژمارەی مۆبایل', adr:'ناونیشانی تەواو', pic:'وێنە/لۆگۆ', 
    c_box:'سندوقی نەختینە', t_sal:'کۆی گشتی فرۆشراو', m_dbt:'قەرزی بازاڕ (قیست)', a_dbt:'کۆی قەرزی بریکارەکان', lgi:'ژوورەوە وەک:', lgo:'چوونەدەرەوە', typ:'جۆر', brd:'براند/مارکە', i_nam:'ناوی کاڵا', rem_d:'قەرزی ماوە بۆ دانەوە', b_typ:'جۆری مامەڵە', csh:'نەختینە (کاش)', dbt:'قەرز (لەسەرمان/لایان)', b_frm:'کڕین لە لایەن:', u_sel:'فرۆشیاری نەناسراو', u_prc:'نرخی تاک', c_nam:'ناوی کڕیار', adv:'پێشەکی وەرگیراو', mth:'مانگەکانی قیست', c_day:'ماوەی قەرز (ڕۆژ)', a_itm:'+ کاڵایەکی تر', qty:'بڕ (دانە)', r_no:'ژمارەی پسوڵە', p_rec:'پارە وەرگرتن', e_ins:'دەستکاری قیست', pl_sel:'هەڵبژێرە لە لیستەکە...', a_ops:'مامەڵەی پارەی بریکار', c_ops:'مامەڵەی پارەی کۆمپانیا', o_ops:'مامەڵەی پارەی نوسینگە', v_off:'لەڕێگەی نوسینگەوە (حەواڵە)', h_fee:'تێچووی حەواڵە', l_tx:'دوایین مامەڵە داراییەکان', c_sum:'پوختەی سەرمایەی سیستم', invs:'سەرمایەی خاوەن کار', n_prf:'پوختەی قازانج', t_cap:'کۆی گشتی سەرمایە', exp:'خەرجییەکان', c_add:'زیادکردنی سەرمایە', c_rem:'کێشانەوەی سەرمایە', rsn:'هۆکاری مامەڵە', stm:'کەشف حسابی لایەنەکان', f_sz:'قەبارەی فۆنتی سیستم', s_cur:'دراوی سەرەکی سیستم', s_lng:'زمانی سیستم', c_del:'ئایا دڵنیایت لە سڕینەوەی ئەم داتایە؟', e_fil:'تکایە هەموو زانیارییە پێویستەکان پڕبکەرەوە.', e_stk:'بڕی داواکراو لە کۆگادا بەردەست نییە!', s_sav:'زانیارییەکان بە سەرکەوتوویی پاشەکەوت کران.', dcs:'بەڵگەنامەکانی کڕیار', ow_u:'قەرز لەسەرمانە بۆیان:', w_ow:'قەرزارمانن:', i_acc:'هەژماری قیستەکان', l_ins:'قیستە دواکەوتووەکان', l_dbt:'قەرزە دواکەوتووەکان', a_cst:'تێکڕای تێچووی کڕین', bal:'باڵانسی کۆتایی', pad:'بڕی وەرگیراو', p_np:'چاپکردن (بەبێ نرخ)', p_wp:'چاپکردن (بە نرخەوە)',
    login_title:'چوونەژوورەوە بۆ ناو سیستم', user_n:'ناوی بەکارهێنەر', pass_w:'وشەی تێپەڕ (پاسوۆرد)', login_btn:'چوونە ژوورەوە', forgot_btn:'وشەی تێپەڕت بیرچووە؟', rec_key_pl:'کۆدی گەڕاندنەوە بنووسە...', rec_btn:'پیشاندانی پاسوۆردەکان', req_wa_btn:'داواکردنی لە واتسئەپ', back_btn:'گەڕانەوە', no_tx:'هیچ مامەڵەیەکی دارایی نییە', inv_emp:'کۆگا بەتاڵە و هیچ کاڵایەکی تێدا نییە', s_cash:'فرۆشتنی نەختینە (کاش)', s_inst:'فرۆشتن بە شێوازی قیست', s_c_agt:'فرۆشتنی قەرز (بۆ بریکار)', s_c_cmp:'فرۆشتنی قەرز (بۆ کۆمپانیا)', p_r_agt:'وەرگرتنی پارە لە بریکار', p_p_agt:'پێدانی پارە بە بریکار', p_r_cmp:'وەرگرتنی پارە لە کۆمپانیا', p_p_cmp:'پێدانی پارە بە کۆمپانیا', p_r_off:'وەرگرتنی پارە لە نوسینگە', p_p_off:'پێدانی پارە بە نوسینگە',
    rl_usr:'بەکارهێنەری ئاسایی', rl_adm:'بەڕێوەبەر (ئەدمین)', sel_from_inv:'هەڵبژێرە لە کاڵاکانی کۆگا...', tot_inv:'کۆی گشتی نرخی پسوڵە:', inst_month:'بڕی قیستی مانگانە', rcv_inst:'وەرگرتنی قیست لە:', p_r_inst:'وەرگرتنی پارەی قیست', no_acc_found:'هیچ حسابێک نەدۆزرایەوە بەم ناوەوە', pls_search:'تکایە لە سەرەوە ناو یان ژمارە مۆبایل بنووسە',
    rl_all:'تەواوی دەسەڵاتەکانی هەیە', rl_bas:'دەسەڵاتی بنچینەیی', lg_no:'هیچ چالاکییەک تۆمار نەکراوە لە سیستمەکەدا', d_m_dbt:'قەرزی بازاڕ (قیستەکان)'
  },
  EN: { 
    m_dashboard:'Dashboard & Stats', m_items:'Item Definitions', m_companies:'Company Management', m_agents:'Agent Management', m_offices:'Office (Hawala) Management', m_purchases:'Purchase Invoices', m_sales:'Sales Invoices', m_installment_ops:'Installment Operations', m_payments:'Payments & Receipts', m_inventory:'Inventory Stock', m_reports:'System Reports', m_capital:'Safe & Capital', m_users:'User Management', m_settings:'System Settings', 
    add:'Add New', upd:'Update Record', can:'Cancel', sav:'Save Changes', del:'Delete Record', edt:'Edit', prt:'Print Receipt', src:'Search here...', act:'Actions', not:'Notes/Remarks', dat:'Date', amt:'Amount', cur:'Currency', tot:'Total Amount', nam:'Name', phn:'Phone Number', adr:'Full Address', pic:'Image/Logo', 
    c_box:'Safe (Cashbox)', t_sal:'Total Sales Revenue', m_dbt:'Market Debt (Inst.)', a_dbt:'Total Agent Debt', lgi:'Logged in as:', lgo:'Log Out', typ:'Category', brd:'Brand', i_nam:'Item Name', rem_d:'Remaining Balance', b_typ:'Transaction Type', csh:'Cash Transaction', dbt:'Debt Transaction', b_frm:'Purchased From:', u_sel:'Unknown Seller', u_prc:'Unit Price', c_nam:'Customer Name', adv:'Advance Payment', mth:'Months', c_day:'Credit Term (Days)', a_itm:'+ Add Another Item', qty:'Quantity', r_no:'Receipt No.', p_rec:'Receive Payment', e_ins:'Edit Installment', pl_sel:'Select from list...', a_ops:'Agent Transactions', c_ops:'Company Transactions', o_ops:'Office Transactions', v_off:'Transfer via Office', h_fee:'Transfer Fee', l_tx:'Recent Transactions', c_sum:'Capital Summary', invs:'Invested Capital', n_prf:'Net Profit', t_cap:'Total Current Capital', exp:'General Expenses', c_add:'Add to Capital', c_rem:'Withdraw Capital', rsn:'Reason for Tx', stm:'Account Statement', f_sz:'System Font Size', s_cur:'Default Currency', s_lng:'System Language', c_del:'Are you sure you want to delete this?', e_fil:'Please fill in all required fields.', e_stk:'Requested quantity not available in stock!', s_sav:'Data saved successfully.', dcs:'Customer Documents', ow_u:'We Owe Them:', w_ow:'They Owe Us:', i_acc:'Active Installments', l_ins:'Overdue Installments', l_dbt:'Overdue Debts', a_cst:'Average Cost Price', bal:'Final Balance', pad:'Amount Paid', p_np:'Print (Without Prices)', p_wp:'Print (With Prices)',
    login_title:'System Login', user_n:'Username', pass_w:'Password', login_btn:'Sign In', forgot_btn:'Forgot Password?', rec_key_pl:'Enter Recovery Key...', rec_btn:'Reveal Passwords', req_wa_btn:'Request via WhatsApp', back_btn:'Go Back', no_tx:'No transactions found', inv_emp:'Inventory is empty', s_cash:'Cash Sale', s_inst:'Installment Sale', s_c_agt:'Credit Sale (Agent)', s_c_cmp:'Credit Sale (Company)', p_r_agt:'Receive from Agent', p_p_agt:'Pay to Agent', p_r_cmp:'Receive from Company', p_p_cmp:'Pay to Company', p_r_off:'Receive from Office', p_p_off:'Pay to Office',
    rl_usr:'Standard User', rl_adm:'Administrator', sel_from_inv:'Select from inventory...', tot_inv:'Invoice Total:', inst_month:'Monthly Installment', rcv_inst:'Receive installment from:', p_r_inst:'Receive Installment Payment', no_acc_found:'No account found with this search', pls_search:'Please search by name or phone above',
    rl_all:'Full Access Rights', rl_bas:'Basic Access', lg_no:'No system activity logged yet', d_m_dbt:'Market Debt (Installments)'
  },
  AR: { 
    m_dashboard:'لوحة القيادة والإحصائيات', m_items:'تعريف المواد', m_companies:'إدارة الشركات', m_agents:'إدارة الوكلاء', m_offices:'إدارة المكاتب (الحوالات)', m_purchases:'فواتير المشتريات', m_sales:'فواتير المبيعات', m_installment_ops:'إدارة الأقساط', m_payments:'القبض والدفع', m_inventory:'المخزن (المتوفر)', m_reports:'التقارير الشاملة', m_capital:'الصندوق ورأس المال', m_users:'إدارة المستخدمين', m_settings:'إعدادات النظام', 
    add:'إضافة جديد', upd:'تحديث السجل', can:'تراجع', sav:'حفظ البيانات', del:'حذف السجل', edt:'تعديل', prt:'طباعة الفاتورة', src:'ابحث هنا...', act:'الإجراءات', not:'ملاحظات', dat:'التاريخ', amt:'المبلغ', cur:'العملة', tot:'المجموع الكلي', nam:'الاسم', phn:'رقم الهاتف', adr:'العنوان الكامل', pic:'صورة/شعار', 
    c_box:'صندوق النقد', t_sal:'إجمالي المبيعات', m_dbt:'ديون السوق (أقساط)', a_dbt:'إجمالي ديون الوكلاء', lgi:'تسجيل الدخول كـ:', lgo:'تسجيل خروج', typ:'الفئة', brd:'الماركة', i_nam:'اسم المادة', rem_d:'الرصيد المتبقي', b_typ:'نوع المعاملة', csh:'معاملة نقدية', dbt:'معاملة آجلة (دين)', b_frm:'تم الشراء من:', u_sel:'بائع غير معروف', u_prc:'سعر المفرد', c_nam:'اسم الزبون', adv:'الدفعة المقدمة', mth:'الأشهر', c_day:'أيام السماح', a_itm:'+ إضافة مادة أخرى', qty:'الكمية', r_no:'رقم الفاتورة', p_rec:'استلام دفعة', e_ins:'تعديل القسط', pl_sel:'اختر من القائمة...', a_ops:'معاملات الوكلاء', c_ops:'معاملات الشركات', o_ops:'معاملات المكاتب', v_off:'تحويل عبر مكتب', h_fee:'أجور التحويل', l_tx:'أحدث المعاملات', c_sum:'ملخص رأس المال', invs:'رأس المال المستثمر', n_prf:'صافي الأرباح', t_cap:'إجمالي رأس المال الحالي', exp:'المصروفات العامة', c_add:'إضافة لرأس المال', c_rem:'سحب من رأس المال', rsn:'سبب المعاملة', stm:'كشف حساب العميل', f_sz:'حجم خط النظام', s_cur:'العملة الافتراضية', s_lng:'لغة النظام', c_del:'هل أنت متأكد من رغبتك في الحذف؟', e_fil:'يرجى ملء جميع الحقول المطلوبة.', e_stk:'الكمية المطلوبة غير متوفرة في المخزن!', s_sav:'تم حفظ البيانات بنجاح.', dcs:'مستندات العميل', ow_u:'ديون علينا لهم:', w_ow:'ديون لنا عليهم:', i_acc:'حسابات الأقساط النشطة', l_ins:'الأقساط المتأخرة', l_dbt:'الديون المتأخرة', a_cst:'متوسط سعر التكلفة', bal:'الرصيد النهائي', pad:'المبلغ المدفوع', p_np:'طباعة (بدون الأسعار)', p_wp:'طباعة (مع الأسعار)',
    login_title:'تسجيل الدخول للنظام', user_n:'اسم المستخدم', pass_w:'كلمة المرور', login_btn:'تسجيل الدخول', forgot_btn:'نسيت كلمة المرور؟', rec_key_pl:'أدخل رمز الاسترداد...', rec_btn:'إظهار كلمات المرور', req_wa_btn:'طلب عبر واتساب', back_btn:'الرجوع للخلف', no_tx:'لا توجد معاملات مسجلة', inv_emp:'المخزن فارغ حالياً', s_cash:'بيع نقدي', s_inst:'بيع بالتقسيط', s_c_agt:'بيع آجل (للوكيل)', s_c_cmp:'بيع آجل (للشركة)', p_r_agt:'استلام نقد من وكيل', p_p_agt:'دفع نقد لوكيل', p_r_cmp:'استلام نقد من شركة', p_p_cmp:'دفع نقد لشركة', p_r_off:'استلام نقد من مكتب', p_p_off:'دفع نقد لمكتب',
    rl_usr:'مستخدم عادي', rl_adm:'مسؤول النظام', sel_from_inv:'اختر من المخزون...', tot_inv:'إجمالي الفاتورة:', inst_month:'القسط الشهري', rcv_inst:'استلام قسط من:', p_r_inst:'استلام دفعة قسط', no_acc_found:'لم يتم العثور على حساب بهذا البحث', pls_search:'يرجى البحث بالاسم أو الهاتف أعلاه',
    rl_all:'صلاحيات كاملة', rl_bas:'صلاحيات أساسية', lg_no:'لم يتم تسجيل أي نشاط في النظام بعد', d_m_dbt:'ديون السوق (الأقساط)'
  }
};

const THEMES = {
  orangeBlue: { main: 'bg-orange-500', text: 'text-[#1e3a8a]', hover: 'hover:bg-orange-600', lightBg: 'bg-white', border: 'border-orange-500', sidebar: 'bg-[#1e3a8a]', sidebarHover: 'hover:bg-blue-900', iconText: 'text-orange-200', name: 'شین و پرتەقاڵی نەرم' },
  purpleWhite: { main: 'bg-purple-600', text: 'text-purple-900', hover: 'hover:bg-purple-700', lightBg: 'bg-white', border: 'border-purple-600', sidebar: 'bg-purple-900', sidebarHover: 'hover:bg-purple-800', iconText: 'text-purple-200', name: 'مۆر و سپی' },
  redDark: { main: 'bg-rose-600', text: 'text-rose-900', hover: 'hover:bg-rose-700', lightBg: 'bg-white', border: 'border-rose-600', sidebar: 'bg-black', sidebarHover: 'hover:bg-slate-800', iconText: 'text-rose-200', name: 'سوور و ڕەش' },
  emeraldDark: { main: 'bg-emerald-700', text: 'text-emerald-900', hover: 'hover:bg-emerald-800', lightBg: 'bg-white', border: 'border-emerald-700', sidebar: 'bg-slate-900', sidebarHover: 'hover:bg-slate-800', iconText: 'text-emerald-400', name: 'سەوز و ڕەش' },
  creamBrown: { main: 'bg-[#8B5A2B]', text: 'text-[#5c3a1a]', hover: 'hover:bg-[#6b4423]', lightBg: 'bg-[#F5F5DC]', border: 'border-[#8B5A2B]', sidebar: 'bg-[#3E2723]', sidebarHover: 'hover:bg-[#4e342e]', iconText: 'text-[#D2B48C]', name: 'قاوەیی و کرێمی' },
  bw: { main: 'bg-black', text: 'text-black', hover: 'hover:bg-slate-800', lightBg: 'bg-white', border: 'border-black', sidebar: 'bg-black', sidebarHover: 'hover:bg-slate-800', iconText: 'text-white', name: 'ڕەش و سپی' }
};

const DOC_TYPES = ['کارتی نیشتمانی', 'کارتی زانیاری', 'پاسپۆرت', 'مۆڵەتی شۆفێری', 'کارت بانکی', 'ناسنامە'];

const getFirebaseConfig = () => { try { if (typeof __firebase_config !== 'undefined') return JSON.parse(__firebase_config); } catch (e) {} return { apiKey:"AIzaSyBFPkNBvMcOOMc6Oam8nlrQWAOpCTOu0Bg", authDomain:"aidastore-2026.firebaseapp.com", projectId:"aidastore-2026", storageBucket:"aidastore-2026.firebasestorage.app", messagingSenderId:"1009068204406", appId:"1:1009068204406:web:f64cb19253296e4a391a57" }; };
const app = initializeApp(getFirebaseConfig()); const auth = getAuth(app); const db = getFirestore(app); const appId = typeof __app_id !== 'undefined' ? __app_id : 'sewastore-local-app';

// Base64 Image Compression Utility
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; const MAX_HEIGHT = 600;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// SVG Icons
const Ico = ({p,c}) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}><path d={p}/></svg>;
const IconHome = () => <Ico p="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10"/>;
const IconBuilding = () => <Ico p="M4 2h16v20H4z M9 22v-4h6v4 M8 6h.01 M16 6h.01 M12 6h.01 M12 10h.01 M12 14h.01 M16 10h.01 M16 14h.01 M8 10h.01 M8 14h.01"/>;
const IconOffice = () => <Ico p="M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M20 10v11 M8 14v3 M12 14v3 M16 14v3"/>;
const IconShoppingCart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
const IconPackage = () => <Ico p="m7.5 4.27 9 5.15 M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z m-17.7-1 8.7 5 8.7-5 M12 22V12"/>;
const IconDollarSign = () => <Ico p="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>;
const IconFileText = () => <Ico p="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"/>;
const IconPrinter = () => <Ico p="M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z"/>;
const IconTrash = () => <Ico p="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6"/>;
const IconEdit = () => <Ico p="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>;
const IconList = () => <Ico p="M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01"/>;
const IconCreditCard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconUser = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconContract = () => <Ico p="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M15.5 12.5 12 16l-3-1.5L8 18"/>;
const IconDocs = () => <Ico p="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>;
const IconAgent = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconBox = () => <Ico p="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96 12 12.01 20.73 6.96 M12 22.08V12"/>;
const IconMenu = () => <Ico p="M4 12h16 M4 6h16 M4 18h16"/>;
const IconX = () => <Ico p="M18 6L6 18 M6 6l12 12"/>;
const IconSearch = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconSettings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconImage = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconUpload = () => <Ico p="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12"/>;
const IconActivity = () => <Ico p="M22 12h-4l-3 9L9 3l-3 9H2"/>;

const MODULES_LIST = [
  { id: 'dashboard', k: 'm_dashboard', ic: IconHome }, 
  { id: 'items', k: 'm_items', ic: IconBox }, 
  { id: 'companies', k: 'm_companies', ic: IconBuilding }, 
  { id: 'agents', k: 'm_agents', ic: IconUsers }, 
  { id: 'offices', k: 'm_offices', ic: IconOffice }, 
  { id: 'purchases', k: 'm_purchases', ic: IconPackage }, 
  { id: 'sales', k: 'm_sales', ic: IconShoppingCart }, 
  { id: 'payments', k: 'm_payments', ic: IconActivity }, 
  { id: 'inventory', k: 'm_inventory', ic: IconList }, 
  { id: 'reports', k: 'm_reports', ic: IconFileText }, 
  { id: 'capital', k: 'm_capital', ic: IconDollarSign }, 
  { id: 'users', k: 'm_users', ic: IconUser }, 
  { id: 'settings', k: 'm_settings', ic: IconSettings }
];

export default function App() {
  const [user, setUser] = useState(null); 
  const [isLogged, setIsLogged] = useState(false);
  const [loggedAppUser, setLoggedAppUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [modal, setModal] = useState({ show: false, type: 'alert', message: '', onConfirm: null });
  
  const [settings, setSettings] = useState({
      storePhone: INITIAL_STORE_PHONE, storeAddress: INITIAL_STORE_ADDRESS, signatureUrl: INITIAL_STORE_SIGNATURE, themeKey: 'orangeBlue', fontSize: 'text-base', currency: 'USD', language: 'KU'
  });

  const [companies, setCompanies] = useState([]);
  const [agents, setAgents] = useState([]); 
  const [offices, setOffices] = useState([]);
  const [definedItems, setDefinedItems] = useState([]); 
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [capitalTx, setCapitalTx] = useState([]);
  const [appUsers, setAppUsers] = useState([]);
  const [userLogs, setUserLogs] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null); 
  const [viewingInstallments, setViewingInstallments] = useState(null);
  const [viewingDocuments, setViewingDocuments] = useState(null); 
  const [selectedDocs, setSelectedDocs] = useState([]);
  
  const [saleMode, setSaleMode] = useState('cash'); 
  const [purMode, setPurMode] = useState('cash'); 
  const [saleItems, setSaleItems] = useState([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const [purItems, setPurItems] = useState([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [purEntityType, setPurEntityType] = useState('company');

  const [compTxDir, setCompTxDir] = useState('pay');
  const [agentTxDir, setAgentTxDir] = useState('receive');
  const [viaOfficeComp, setViaOfficeComp] = useState(false);
  const [viaOfficeAgent, setViaOfficeAgent] = useState(false);

  const [searchTerms, setSearchTerms] = useState({ installment: '', agent: '', company: '', office: '' });
  const installmentSelectRef = useRef(null);
  const agentSelectRef = useRef(null);
  const companySelectRef = useRef(null);
  const officeSelectRef = useRef(null);
  
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveredData, setRecoveredData] = useState(null);

  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);

  const getToday = () => new Date().toISOString().split('T')[0];
  const currentCurrency = CURRENCIES[settings.currency] || CURRENCIES.USD;

  const t = (key) => DICT[settings.language]?.[key] || DICT['KU']?.[key] || key;

  const logAction = async (actionDesc) => {
    if (!loggedAppUser || !user) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'userLogs'), {
            username: loggedAppUser.username,
            action: actionDesc,
            timestamp: serverTimestamp(),
            date: new Date().toLocaleString('en-GB')
        });
    } catch (e) { console.error("Error logging:", e); }
  };

  const hasPermission = (modId) => {
      if (loggedAppUser?.role === 'admin' || loggedAppUser?.username === DEFAULT_ADMIN_USER) return true;
      if (!loggedAppUser?.permissions) return true; 
      return loggedAppUser.permissions.includes(modId);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('sewastore_settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({...prev, ...parsed}));
        }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const dir = LANGUAGES[settings.language]?.dir || 'rtl';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', settings.language.toLowerCase());
  }, [settings.language]);

  // Inject logic for adding icon meta tags for homescreen shortcuts dynamically
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = STORE_LOGO;

    let appleLink = document.querySelector("link[rel~='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.getElementsByTagName('head')[0].appendChild(appleLink);
    }
    appleLink.href = STORE_LOGO;

    document.title = STORE_NAME;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (error) { console.error(error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubCompanies = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'companies'), snap => setCompanies(snap.docs.map(d => d.data())));
    const unsubAgents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'agents'), snap => setAgents(snap.docs.map(d => d.data())));
    const unsubOffices = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'offices'), snap => setOffices(snap.docs.map(d => d.data())));
    const unsubDefinedItems = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'definedItems'), snap => setDefinedItems(snap.docs.map(d => d.data())));
    const unsubPurchases = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'purchases'), snap => setPurchases(snap.docs.map(d => d.data())));
    const unsubSales = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'sales'), snap => setSales(snap.docs.map(d => d.data())));
    const unsubCapital = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'capitalTx'), snap => {
        const data = snap.docs.map(d => d.data());
        data.sort((a, b) => a.id.localeCompare(b.id)); 
        setCapitalTx(data);
    });
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'appUsers'), snap => setAppUsers(snap.docs.map(d => d.data())));
    
    // Load Logs
    const logsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'userLogs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(logsQuery, snap => setUserLogs(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubCompanies(); unsubAgents(); unsubOffices(); unsubDefinedItems(); unsubPurchases(); unsubSales(); unsubCapital(); unsubUsers(); unsubLogs(); };
  }, [user]);

  useEffect(() => {
     if (loggedAppUser) {
        if (hasPermission('installment_ops')) setSaleMode('installment');
        else setSaleMode('cash');
     }
  }, [loggedAppUser]);

  const currentTheme = THEMES[settings.themeKey] || THEMES.orangeBlue;
  const inpCls = `w-full border border-slate-300 p-2.5 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:${currentTheme.border} text-sm`;
  const thCls = `p-3 border-b border-slate-200 font-bold`; 
  const tdCls = "p-3 border-b border-slate-100";

  const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, String(docId));
  const confirmAction = (message, onConfirm) => setModal({ show: true, type: 'confirm', message, onConfirm });
  const alertMsg = (message) => setModal({ show: true, type: 'alert', message, onConfirm: null });

  const formatMoney = (amount, currencyCode) => {
      const code = currencyCode || settings.currency;
      const sym = CURRENCIES[code]?.symbol || '$';
      return `${sym}${Number(amount).toFixed(2)}`;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const u = loginForm.user; const p = loginForm.pass;
    const foundUser = appUsers.find(user => user.username === u && user.password === p);
    if (foundUser) { setLoggedAppUser(foundUser); setIsLogged(true); setLoginError(''); await logAction(t('login_btn')); }
    else if (u === DEFAULT_ADMIN_USER && p === DEFAULT_ADMIN_PASS) { setLoggedAppUser({ username: u, role: 'admin' }); setIsLogged(true); setLoginError(''); await logAction('Admin Login'); }
    else setLoginError('ناوی بەکارهێنەر یان وشەی تێپەڕ هەڵەیە!');
  };

  const handleRecover = (e) => {
    e.preventDefault();
    if (recoveryKey === MASTER_RECOVERY_KEY) {
      let dataToShow = appUsers.length > 0 ? [...appUsers] : [];
      if (!dataToShow.find(u => u.username === DEFAULT_ADMIN_USER)) dataToShow.push({ username: DEFAULT_ADMIN_USER, password: DEFAULT_ADMIN_PASS, role: 'admin' });
      setRecoveredData(dataToShow); setLoginError('');
    } else { setLoginError('کۆدی هەڵەیە!'); setRecoveredData(null); }
  };

  const requestPasswordViaWhatsApp = () => {
      const message = encodeURIComponent(`سڵاو، من پاسوۆردی سیستمی ئایدا ستۆرم بیرچووەتەوە. تکایە هاوکاریم بکە.`);
      window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const handleSaveSettings = async (e) => {
      e.preventDefault();
      const form = e.target;
      const newSettings = { storePhone: form.storePhone.value, storeAddress: form.storeAddress.value, signatureUrl: form.signatureUrl.value, themeKey: form.themeKey.value, fontSize: form.fontSize.value, currency: form.currency.value, language: form.language.value };
      setSettings(newSettings);
      localStorage.setItem('sewastore_settings', JSON.stringify(newSettings));
      await logAction('گۆڕانکاری ڕێکخستنەکان');
      alertMsg(t('s_sav'));
  };

  const printContent = (title, receiptNo, contentHTML, party1Name = STORE_NAME, party2Name = t('c_nam'), includeSignatures = true) => {
    const signatureImage = settings.signatureUrl ? `<img src="${settings.signatureUrl}" style="width:120px;height:auto;margin:5px auto;display:block;" alt="واژۆ" />` : '';
    const signature2Image = typeof PARTY2_SIGNATURE !== 'undefined' && PARTY2_SIGNATURE ? `<img src="${PARTY2_SIGNATURE}" style="width:120px;height:auto;margin:5px auto;display:block;" alt="واژۆی لایەنی دووەم" />` : '';
    
    let printColorMain = '#064e3b'; let printColorBg = '#ecfdf5';
    if (settings.themeKey === 'orangeDark') { printColorMain = '#c2410c'; printColorBg = '#fff7ed'; }
    if (settings.themeKey === 'blueDark') { printColorMain = '#1e3a8a'; printColorBg = '#eff6ff'; }
    if (settings.themeKey === 'creamBrown') { printColorMain = '#8B5A2B'; printColorBg = '#F5F5DC'; }
    if (settings.themeKey === 'goldDark') { printColorMain = '#B8860B'; printColorBg = '#FFF8DC'; }
    if (settings.themeKey === 'redDark') { printColorMain = '#e11d48'; printColorBg = '#fff1f2'; }
    if (settings.themeKey === 'bw') { printColorMain = '#000000'; printColorBg = '#f1f5f9'; }
    if (settings.themeKey === 'orangeBlue') { printColorMain = '#1e3a8a'; printColorBg = '#fff7ed'; }
    if (settings.themeKey === 'purpleWhite') { printColorMain = '#7e22ce'; printColorBg = '#faf5ff'; }

    const printWindow = window.open('', '_blank');
    if (!printWindow) { alertMsg("تکایە ڕێگە بە کردنەوەی پەنجەرەی نوێ (Pop-ups) بدە."); return; }

    const dir = LANGUAGES[settings.language]?.dir || 'rtl';

    printWindow.document.write(`
      <html dir="${dir}"><head><title>${title}</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>*,*::before,*::after{box-sizing:border-box!important}@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;margin:0;padding:10px;width:100%}*{color-adjust:exact!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{size:A4 portrait;margin:10mm}.receipt-container{box-shadow:none!important;border:2px solid ${printColorMain}!important;width:100%!important;max-width:100%!important;padding:20px!important;margin:0!important}table{font-size:14px!important;min-width:0!important;width:100%!important;table-layout:auto!important;border-collapse:collapse!important;margin-bottom:15px!important;border:1px solid #cbd5e1!important}th,td{padding:8px!important;white-space:normal!important;border:1px solid #cbd5e1!important;word-wrap:break-word!important}th{background-color:${printColorMain}!important;color:#fff!important}div,table,tbody,tr,td,th{max-width:100%!important;overflow:visible!important}.info-grid{display:flex!important;flex-wrap:wrap!important;gap:15px!important}.info-box{flex:1 1 45%!important;border:1px solid #cbd5e1!important;padding:15px!important;font-size:14px!important;background-color:${printColorBg}!important}.overflow-x-auto,.table-responsive{overflow-x:visible!important}[class*="min-w-"]{min-width:0!important}::-webkit-scrollbar{display:none}}body{font-family:'Calibri',sans-serif;padding:20px;color:#0f172a;background:#fff;margin:0}.receipt-container{max-width:850px;margin:0 auto;background:#fff;border-radius:12px;border:2px solid #e2e8f0;border-top:10px solid ${printColorMain};padding:30px}.header{display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:25px}.header-logo{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:15px}.header-logo img{width:160px;height:160px;object-fit:contain;border-radius:16px}.header-logo h1{color:${printColorMain};margin:0;font-size:38px;font-weight:900}.header-meta{text-align:center;background:${printColorBg};padding:15px 20px;border-radius:8px;border:1px solid ${printColorMain};width:100%;max-width:450px}.table-responsive{width:100%;overflow-x:auto}table{width:100%;border-collapse:collapse;margin-top:20px;margin-bottom:30px;font-size:16px;border:1px solid #e2e8f0}th,td{padding:12px;text-align:${dir==='rtl'?'right':'left'};border:1px solid #e2e8f0}th{background-color:${printColorMain};color:#fff;font-weight:bold}.info-grid{display:flex;gap:20px;margin-bottom:25px}.info-box{flex:1;background:${printColorBg};padding:20px;border-radius:8px;border:1px solid #cbd5e1}.thank-you{text-align:center;margin-top:35px;font-size:16px}.contact-note{margin-top:15px;font-weight:bold;border:2px dashed ${printColorMain};padding:15px;border-radius:8px;text-align:center;font-size:18px}.print-img{max-width:120px;max-height:120px;border-radius:8px;border:1px solid #cbd5e1;object-fit:cover}</style>
      </head><body><div class="receipt-container"><div class="header"><div class="header-logo">${STORE_LOGO ? `<img src="${STORE_LOGO}" alt="Logo" onerror="this.style.display='none'" />` : ''}<h1>${STORE_NAME}</h1></div><div class="header-meta"><span style="font-size:20px;font-weight:bold;color:${printColorMain};display:block;margin-bottom:8px;">${title}</span><p style="margin:5px 0;">${t('r_no')}: <span style="font-weight:bold;font-size:18px;">${receiptNo||'-'}</span></p><p style="margin:5px 0;">${t('dat')}: ${getToday()}</p></div></div>${contentHTML}
        ${includeSignatures ? `
          <div style="display:flex;justify-content:space-around;margin-top:30px;padding-top:20px;border-top:2px dashed ${printColorMain};page-break-inside:avoid;">
            <div style="text-align:center;width:250px;color:#0f172a;"><div style="font-weight:bold;margin-bottom:${settings.signatureUrl?'10px':'35px'};font-size:18px;color:${printColorMain};">واژۆی لایەنی یەکەم</div>${signatureImage}<div style="border-top:2px solid #0f172a;padding-top:8px;font-weight:bold;font-size:16px;">${party1Name}</div></div>
            <div style="text-align:center;width:250px;color:#0f172a;"><div style="font-weight:bold;margin-bottom:${PARTY2_SIGNATURE?'10px':'35px'};font-size:18px;color:${printColorMain};">واژۆی لایەنی دووەم</div>${signature2Image}<div style="border-top:2px solid #0f172a;padding-top:8px;font-weight:bold;font-size:16px;">${party2Name}</div></div>
          </div>` : ''}
        <div class="thank-you"><div class="contact-note">${settings.storeAddress ? `${settings.storeAddress} | ` : ''}<span dir="ltr" style="font-size:20px;">${settings.storePhone}</span></div></div></div><script>window.onload=function(){setTimeout(function(){window.print();},1200);};window.onafterprint=function(){window.close();};</script></body></html>
    `);
    printWindow.document.close();
  };

  const ImageUploadField = ({ name, defaultValue, label, placeholder }) => {
    const [preview, setPreview] = useState(defaultValue || '');
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploadingGlobal(true); setIsUploading(true);
        try {
            const base64Str = await compressImage(file);
            setPreview(base64Str);
        } catch (err) { alertMsg("کێشەیەک ڕوویدا لە بارکردن."); }
        setIsUploading(false); setIsUploadingGlobal(false);
    };

    return (
        <div className="flex flex-col">
            <label className="block text-sm mb-1 text-slate-600 flex items-center gap-1"><IconImage/> {label}</label>
            <div className="flex items-center gap-2">
                <input type="hidden" name={name} value={preview} />
                <input type="url" value={preview} onChange={(e) => setPreview(e.target.value)} className={`flex-1 border border-slate-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:${currentTheme.border} text-sm`} placeholder={placeholder} dir="ltr" />
                <label className={`cursor-pointer ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg flex items-center justify-center transition-colors relative`} title="بارکردن">
                    {isUploading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block"></span> : <IconUpload />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
            </div>
            {preview && (
                <div className="mt-2 relative inline-block">
                    <img src={preview} alt="P" className="h-16 w-16 object-cover rounded-lg border border-slate-300 shadow-sm" onError={(e) => e.target.style.display='none'} />
                    <button type="button" onClick={() => setPreview('')} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:bg-rose-600"><IconX/></button>
                </div>
            )}
        </div>
    );
  };

  const inventory = useMemo(() => {
    const items = {};
    purchases.forEach(p => {
      const iList = p.items || [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty), currency: p.currency }];
      iList.forEach(i => {
        const itemCurr = i.currency || p.currency || settings.currency; const key = `${i.itemName}_${itemCurr}`;
        if (!items[key]) items[key] = { itemName: i.itemName, totalQty: 0, costSum: 0, soldQty: 0, photoUrl: i.photoUrl || p.photoUrl || '', currency: itemCurr };
        items[key].totalQty += Number(i.qty); items[key].costSum += (Number(i.qty) * Number(i.price || i.unitPrice));
      });
    });
    sales.forEach(s => {
      const iList = s.items || [{ itemName: s.itemName, qty: s.qty, price: s.unitPrice || (s.price/s.qty), currency: s.currency }];
      iList.forEach(i => { 
         const itemCurr = i.currency || s.currency || settings.currency; const key = `${i.itemName}_${itemCurr}`;
         if (items[key]) items[key].soldQty += Number(i.qty); 
      });
    });
    return Object.values(items).map(item => ({ ...item, currentQty: item.totalQty - item.soldQty, avgCost: item.totalQty > 0 ? (item.costSum / item.totalQty) : 0 })).filter(item => item.currentQty > 0 || item.soldQty > 0);
  }, [purchases, sales, settings.currency]);

  const VALID_CASH_TYPES = ['purchase_cash', 'sale_cash', 'sale_advance', 'receive_installment', 'receive_agent_payment', 'pay_agent_payment', 'pay_company_debt', 'receive_company_payment', 'receive_office_loan', 'pay_office_debt', 'expense', 'capital_add', 'capital_remove'];

  const currentCapital = useMemo(() => {
      const capitals = { USD: 0, IQD: 0, AED: 0 };
      capitalTx.forEach(tx => {
         const curr = tx.currency || settings.currency;
         if(VALID_CASH_TYPES.includes(tx.type) && capitals[curr] !== undefined) capitals[curr] += tx.amount;
      });
      return capitals;
  }, [capitalTx, settings.currency]);

  const getSalePaidAmount = (saleId) => {
    const sale = sales.find(s => s.id === saleId); if (!sale) return 0; if (sale.saleType === 'cash') return sale.price;
    return (sale.advance || 0) + capitalTx.filter(tx => tx.refId === saleId && (tx.type === 'receive_installment' || tx.type === 'receive_agent_payment')).reduce((sum, tx) => sum + tx.amount, 0);
  };
  const getCompanyDebt = (companyId, currencyCode) => {
    const code = currencyCode || settings.currency;
    const totalBoughtOnDebt = purchases.filter(p => p.companyId === companyId && p.paymentType === 'debt' && (p.currency || settings.currency) === code).reduce((sum, p) => sum + p.total, 0);
    const totalPaidToCompany = Math.abs(capitalTx.filter(tx => tx.refId === companyId && tx.type === 'pay_company_debt' && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0));
    const totalReceivedFromCompany = capitalTx.filter(tx => tx.refId === companyId && tx.type === 'receive_company_payment' && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0);
    const totalCreditSalesToCompany = sales.filter(s => s.saleType === 'credit_company' && s.companyId === companyId && (s.currency || settings.currency) === code).reduce((sum, s) => sum + s.price, 0);
    return totalBoughtOnDebt - totalPaidToCompany + totalReceivedFromCompany - totalCreditSalesToCompany;
  };
  const getAgentDebt = (agentId, currencyCode) => {
    const code = currencyCode || settings.currency;
    const totalCreditSales = sales.filter(s => (s.saleType === 'credit_agent' || s.saleType === 'credit') && s.agentId === agentId && (s.currency || settings.currency) === code).reduce((sum, s) => sum + s.price, 0);
    const totalReceivedFromAgent = capitalTx.filter(tx => tx.type === 'receive_agent_payment' && tx.refId === agentId && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0);
    const totalPaidToAgent = Math.abs(capitalTx.filter(tx => tx.type === 'pay_agent_payment' && tx.refId === agentId && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0));
    const totalBoughtFromAgentOnDebt = purchases.filter(p => p.companyId === agentId && p.paymentType === 'debt' && (p.currency || settings.currency) === code).reduce((sum, p) => sum + p.total, 0);
    return (totalCreditSales + totalPaidToAgent) - (totalReceivedFromAgent + totalBoughtFromAgentOnDebt);
  };
  const getOfficeDebt = (officeId, currencyCode) => {
    const code = currencyCode || settings.currency;
    const loans = capitalTx.filter(tx => tx.type === 'receive_office_loan' && tx.refId === officeId && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0);
    const payments = Math.abs(capitalTx.filter(tx => tx.type === 'pay_office_debt' && tx.refId === officeId && (tx.currency || settings.currency) === code).reduce((sum, tx) => sum + tx.amount, 0));
    return loans - payments;
  };

  const addTransaction = async (type, amount, desc, refId = null, note = '', exactId = null, existReceiptNo = null, customCurrency = null) => {
    const id = exactId || (Date.now().toString() + Math.random().toString().slice(2, 6));
    let rNo = existReceiptNo || (capitalTx.filter(t => t.type === type).length > 0 ? Math.max(...capitalTx.filter(t => t.type === type).map(t => t.receiptNo || 0)) + 1 : 1);
    const currencyToUse = customCurrency || settings.currency;
    const data = { id, type, amount, date: getToday(), desc, refId, note, receiptNo: rNo, currency: currencyToUse };
    await setDoc(getDocRef('capitalTx', id), data); return data;
  };
  const deleteTransactionsByRef = async (refId) => { for (const tx of capitalTx.filter(tx => tx.refId === refId)) await deleteDoc(getDocRef('capitalTx', tx.id)); };

  const handleSaveAppUser = async (e) => {
    e.preventDefault(); const form = e.target; 
    const selectedPermissions = [];
    MODULES_LIST.forEach(mod => { if(form[`perm_${mod.id}`]?.checked) selectedPermissions.push(mod.id); });
    if(form[`perm_installment_ops`]?.checked) selectedPermissions.push('installment_ops');
    const newAppUser = { id: editingId || Date.now().toString(), username: form.username.value, password: form.password.value, role: form.role.value, permissions: selectedPermissions };
    if (!editingId && appUsers.find(u => u.username === newAppUser.username)) return alertMsg('Username Exists!');
    if (newAppUser.username === DEFAULT_ADMIN_USER) return alertMsg('Cannot edit master admin!');
    await setDoc(getDocRef('appUsers', newAppUser.id), newAppUser); await logAction(`User: ${newAppUser.username}`); setEditingId(null); form.reset();
  };

  const handleSaveCompany = async (e) => { e.preventDefault(); const form = e.target; const newComp = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value, photoUrl: form.photoUrl.value }; await setDoc(getDocRef('companies', newComp.id), newComp); await logAction(`Company: ${newComp.name}`); setEditingId(null); form.reset(); };
  const handleSaveAgent = async (e) => { e.preventDefault(); const form = e.target; const newAgent = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value, notes: form.notes.value, photoUrl: form.photoUrl.value }; await setDoc(getDocRef('agents', newAgent.id), newAgent); await logAction(`Agent: ${newAgent.name}`); setEditingId(null); form.reset(); };
  const handleSaveOffice = async (e) => { e.preventDefault(); const form = e.target; const newOffice = { id: editingId || Date.now().toString(), name: form.name.value, phone: form.phone.value, address: form.address.value }; await setDoc(getDocRef('offices', newOffice.id), newOffice); await logAction(`Office: ${newOffice.name}`); setEditingId(null); form.reset(); };
  const handleSaveDefinedItem = async (e) => { e.preventDefault(); const form = e.target; const newItem = { id: editingId || Date.now().toString(), type: form.itemType.value, brand: form.brand.value, name: form.name.value, photoUrl: form.photoUrl.value }; await setDoc(getDocRef('definedItems', newItem.id), newItem); await logAction(`Item: ${newItem.name}`); setEditingId(null); form.reset(); };
  const deleteAppUser = (id) => confirmAction(t('c_del'), async () => { await deleteDoc(getDocRef('appUsers', id)); await logAction(`Del User: ${id}`); });
  const deleteCompany = (id) => confirmAction(t('c_del'), async () => { await deleteDoc(getDocRef('companies', id)); await logAction(`Del Company: ${id}`); });
  const deleteAgent = (id) => confirmAction(t('c_del'), async () => { await deleteDoc(getDocRef('agents', id)); await logAction(`Del Agent: ${id}`); });
  const deleteOffice = (id) => confirmAction(t('c_del'), async () => { await deleteDoc(getDocRef('offices', id)); await logAction(`Del Office: ${id}`); });
  const deleteDefinedItem = (id) => confirmAction(t('c_del'), async () => { await deleteDoc(getDocRef('definedItems', id)); await logAction(`Del Item: ${id}`); });

  const addPurItem = () => setPurItems([...purItems, { id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const removePurItem = (id) => setPurItems(purItems.filter(i => i.id !== id));
  const updatePurItem = (id, field, value) => setPurItems(purItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  const handleSavePurchase = async (e) => {
    e.preventDefault(); const form = e.target; const paymentType = purMode; const note = form.note.value; const selectedCurrency = form.currency.value;
    if (purItems.some(i => !i.itemName || !i.qty || !i.unitPrice)) return alertMsg(t('e_fil'));
    let entityId = form.entityId?.value || ''; let entityName = form.companyNameStr?.value || '';
    if (paymentType === 'debt' && !entityId) return alertMsg(t('e_fil'));
    if (entityId) {
       if (purEntityType === 'company') entityName = companies.find(c => c.id === entityId)?.name || '';
       if (purEntityType === 'agent') entityName = agents.find(a => a.id === entityId)?.name || '';
    } else if (!entityName) entityName = t('u_sel');
    const totalPrice = purItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
    const purToEdit = editingId ? purchases.find(p => p.id === editingId) : null;
    const rNo = purToEdit?.receiptNo || (purchases.length > 0 ? Math.max(...purchases.map(p => p.receiptNo || 0)) + 1 : 1);
    const newPurchase = { id: editingId || Date.now().toString(), companyId: entityId, companyName: entityName, entityType: purEntityType, items: purItems, itemName: purItems.length === 1 ? purItems[0].itemName : 'Multiple', qty: purItems.reduce((sum, i) => sum + Number(i.qty), 0), price: purItems.length === 1 ? Number(purItems[0].unitPrice) : 0, total: totalPrice, paymentType, note, date: getToday(), receiptNo: rNo, currency: selectedCurrency };
    if (editingId) await deleteTransactionsByRef(editingId);
    await setDoc(getDocRef('purchases', newPurchase.id), newPurchase);
    await logAction(editingId ? `Upd Purchase: ${rNo}` : `New Purchase: ${rNo}`);
    setEditingId(null); setPurItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
    
    // Only save Cash transactions to Safe (capitalTx), ignoring 'debt' completely
    if (paymentType === 'cash') {
       await addTransaction('purchase_cash', -totalPrice, `Purchase: ${newPurchase.companyName}`, newPurchase.id, note, null, rNo, selectedCurrency);
    }
    form.reset();
  };
  const deletePurchase = (id) => confirmAction(t('c_del'), async () => { const p = purchases.find(x=>x.id===id); await deleteDoc(getDocRef('purchases', id)); await deleteTransactionsByRef(id); await logAction(`Del Purchase: ${p?.receiptNo}`); });
  const printPurchase = (p) => {
    let currentDebt = 0; let phone = '-'; let entityPhoto = '';
    if (p.companyId) {
        if (p.entityType === 'agent') { currentDebt = getAgentDebt(p.companyId, p.currency); const ag = agents.find(a => a.id === p.companyId); phone = ag?.phone || '-'; entityPhoto = ag?.photoUrl || ''; } 
        else { currentDebt = getCompanyDebt(p.companyId, p.currency); const comp = companies.find(c => c.id === p.companyId); phone = comp?.phone || '-'; entityPhoto = comp?.photoUrl || ''; }
    }
    const itemsList = p.items || [{ itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty), total: p.total }];
    const photoHtml = entityPhoto ? `<img src="${entityPhoto}" class="print-img" alt="Photo" onerror="this.style.display='none'" />` : '';
    const dir = LANGUAGES[settings.language]?.dir || 'rtl';
    const align = dir === 'rtl' ? 'text-align:left' : 'text-align:right';
    const html = `<div class="info-grid"><div class="info-box flex gap-4 items-center">${photoHtml}<div><strong>${t('nam')}:</strong> ${p.companyName}<br/><strong>${t('phn')}:</strong> <span dir="ltr">${phone}</span><br/></div></div><div class="info-box"><strong>${t('dat')}:</strong> ${p.date}<br/><strong>${t('b_typ')}:</strong> <span style="font-weight: bold;">${p.paymentType === 'debt' ? t('dbt') : t('csh')}</span><br/>${p.paymentType === 'debt' ? `<strong>${t('bal')}:</strong> <span dir="ltr" style="color:#000000;font-weight:bold;font-size:16px;">${formatMoney(currentDebt, p.currency)}</span>` : ''}</div></div><div class="table-responsive"><table><tr><th>${t('i_nam')}</th><th>${t('qty')}</th><th>${t('u_prc')}</th><th>${t('tot')}</th></tr>${itemsList.map(i => {const defItem = definedItems.find(d => d.name === i.itemName); const itemPhotoHtml = defItem?.photoUrl ? `<img src="${defItem.photoUrl}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;vertical-align:middle;margin:0 8px;" onerror="this.style.display='none'"/>` : ''; return `<tr><td>${itemPhotoHtml} ${i.itemName}</td><td>${i.qty}</td><td>${formatMoney(i.unitPrice, p.currency)}</td><td style="font-weight:bold;">${formatMoney(Number(i.qty) * Number(i.unitPrice), p.currency)}</td></tr>`}).join('')}<tr><td colspan="3" style="${align};font-weight:bold;">${t('tot')}:</td><td style="font-weight:bold;font-size:16px;">${formatMoney(p.total, p.currency)}</td></tr></table></div><div style="margin-top:15px;color:#334155;"><strong>${t('not')}:</strong> ${p.note || '-'}</div>`;
    printContent(t('m_purchases'), p.receiptNo, html, STORE_NAME, p.companyName, true);
  };

  const addSaleItem = () => setSaleItems([...saleItems, { id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
  const removeSaleItem = (id) => setSaleItems(saleItems.filter(i => i.id !== id));
  const updateSaleItem = (id, field, value) => {
    setSaleItems(saleItems.map(i => {
      if (i.id === id) {
        let updated = { ...i, [field]: value };
        if (field === 'itemName') { const stockItem = inventory.find(inv => inv.itemName === value); if(stockItem && stockItem.avgCost) updated.unitPrice = (stockItem.avgCost * 1.1).toFixed(2); }
        return updated;
      } return i;
    }));
  };
  const handleEditSale = (s) => {
     setEditingId(s.id); setSaleMode(s.saleType === 'credit' ? 'credit_agent' : (s.saleType || 'installment'));
     if (s.items && s.items.length > 0) setSaleItems(s.items); else setSaleItems([{ id: Date.now(), itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty) }]);
     window.scrollTo({top:0, behavior:'smooth'});
  };
  const handleSaveSale = async (e) => {
    e.preventDefault(); const form = e.target; const note = form.note.value; const selectedCurrency = form.currency.value;
    if (saleItems.some(i => !i.itemName || !i.qty || !i.unitPrice)) return alertMsg(t('e_fil'));
    const oldSale = editingId ? sales.find(s => s.id === editingId) : null;
    const oldItems = oldSale?.items || (oldSale ? [{ itemName: oldSale.itemName, qty: oldSale.qty }] : []);
    for (const item of saleItems) {
      const oldQty = oldItems.find(oi => oi.itemName === item.itemName)?.qty || 0;
      const itemInStock = inventory.find(i => i.itemName === item.itemName && i.currency === selectedCurrency); 
      const availableQty = itemInStock ? itemInStock.currentQty + oldQty : 0;
      if (availableQty < Number(item.qty)) return alertMsg(t('e_stk'));
    }
    const totalPrice = saleItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
    const rNo = oldSale?.receiptNo || (sales.length > 0 ? Math.max(...sales.map(s => s.receiptNo || 0)) + 1 : 1);
    let newSale = { id: editingId || Date.now().toString(), items: saleItems, itemName: 'Multiple', qty: saleItems.reduce((sum, i) => sum + Number(i.qty), 0), unitPrice: 0, price: totalPrice, note, date: getToday(), receiptNo: rNo, saleType: saleMode, documents: oldSale?.documents || [], currency: selectedCurrency };
    if (saleMode === 'installment') {
      const advance = parseFloat(form.advance.value) || 0; const months = parseInt(form.months.value) || 1; const monthlyAmount = (totalPrice - advance) / months;
      const installments = Array.from({ length: months }).map((_, i) => { const date = new Date(); date.setMonth(date.getMonth() + i + 1); return { id: Math.random().toString(), monthNum: i + 1, amount: monthlyAmount, dueDate: date.toISOString().split('T')[0] }; });
      newSale = { ...newSale, customerName: form.customerName.value, phone: form.phone.value, address: form.address.value, customerPhotoUrl: form.customerPhotoUrl?.value||'', advance, months, monthlyAmount, installments };
    } else if (saleMode === 'cash') { newSale = { ...newSale, customerName: form.customerName.value, phone: form.phone.value, address: form.address.value, customerPhotoUrl: form.customerPhotoUrl?.value||'' }; } 
    else if (saleMode === 'credit_agent' || saleMode === 'credit_company') {
      const isAgent = saleMode === 'credit_agent'; const entityId = isAgent ? form.agentId.value : form.companyId.value; const entity = isAgent ? agents.find(a => a.id === entityId) : companies.find(c => c.id === entityId);
      const creditDays = parseInt(form.creditDays.value) || 7; const dueDateObj = new Date(); dueDateObj.setDate(dueDateObj.getDate() + creditDays);
      newSale = { ...newSale, agentId: isAgent ? entityId : null, companyId: !isAgent ? entityId : null, customerName: entity.name, phone: entity.phone, address: entity.address, customerPhotoUrl: entity.photoUrl || '', creditDays, dueDate: dueDateObj.toISOString().split('T')[0] };
    }
    if (editingId) { for (const tx of capitalTx.filter(tx => tx.refId === editingId && (tx.type === 'sale_advance' || tx.type === 'sale_cash'))) await deleteDoc(getDocRef('capitalTx', tx.id)); }
    await setDoc(getDocRef('sales', newSale.id), newSale); 
    await logAction(editingId ? `Upd Sale: ${rNo}` : `New Sale: ${rNo}`);
    setEditingId(null); setSaleItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }]);
    
    // Only saving Cash and Advance to Safe, completely ignoring Credit sales
    if (saleMode === 'installment' && newSale.advance > 0) await addTransaction('sale_advance', newSale.advance, `Adv: ${newSale.customerName}`, newSale.id, note, null, rNo, selectedCurrency);
    else if (saleMode === 'cash') await addTransaction('sale_cash', totalPrice, `Cash Sale: ${newSale.customerName}`, newSale.id, note, null, rNo, selectedCurrency);
    form.reset();
  };
  const deleteSale = (id) => confirmAction(t('c_del'), async () => { const s = sales.find(x=>x.id===id); await deleteDoc(getDocRef('sales', id)); await deleteTransactionsByRef(id); await logAction(`Del Sale: ${s?.receiptNo}`); });

  const printSale = (s) => {
    const isCreditAgent = s.saleType === 'credit' || s.saleType === 'credit_agent'; const isCreditCompany = s.saleType === 'credit_company'; const isCash = s.saleType === 'cash';
    let balanceHTML = '';
    if (isCreditAgent) balanceHTML = `<strong>${t('a_dbt')}:</strong> <span dir="ltr" style="color:#000;font-weight:bold;font-size:16px;">${formatMoney(getAgentDebt(s.agentId, s.currency), s.currency)}</span>`;
    else if (isCreditCompany) { const cDebt = getCompanyDebt(s.companyId, s.currency); balanceHTML = `<strong>${t('bal')}:</strong> <span dir="ltr" style="color:#000;font-weight:bold;font-size:16px;">${cDebt > 0 ? `${t('ow_u')} ${formatMoney(Math.abs(cDebt), s.currency)}` : `${t('w_ow')} ${formatMoney(Math.abs(cDebt), s.currency)}`}</span>`; } 
    else if (!isCash) balanceHTML = `<strong>${t('rem_d')}:</strong> <span dir="ltr" style="color:#000;font-weight:bold;font-size:16px;">${formatMoney(s.price - getSalePaidAmount(s.id), s.currency)}</span>`;
    const itemsList = s.items || [{ itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty), price: s.price }];
    const typeLabel = isCash ? t('s_cash') : (isCreditAgent ? t('s_c_agt') : (isCreditCompany ? t('s_c_cmp') : t('s_inst')));
    const customerTypeLabel = isCreditAgent ? t('m_agents') : (isCreditCompany ? t('m_companies') : t('c_nam'));
    const photoHtml = s.customerPhotoUrl ? `<img src="${s.customerPhotoUrl}" class="print-img" alt="Photo" onerror="this.style.display='none'" />` : '';
    const dir = LANGUAGES[settings.language]?.dir || 'rtl';
    const align = dir === 'rtl' ? 'text-align:left' : 'text-align:right';
    const html = `<div class="info-grid"><div class="info-box flex gap-4 items-center">${photoHtml}<div><strong>${customerTypeLabel}:</strong> ${s.customerName}<br><strong>${t('phn')}:</strong> <span dir="ltr">${s.phone}</span><br></div></div><div class="info-box"><strong>${t('dat')}:</strong> ${s.date}<br><strong>${t('typ')}:</strong> ${typeLabel}<br>${balanceHTML}</div></div><div class="table-responsive"><table><tr><th>${t('i_nam')}</th><th>${t('qty')}</th><th>${t('u_prc')}</th><th>${t('tot')}</th></tr>${itemsList.map(i => {const defItem = definedItems.find(d => d.name === i.itemName); const itemPhotoHtml = defItem?.photoUrl ? `<img src="${defItem.photoUrl}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;vertical-align:middle;margin:0 8px;" onerror="this.style.display='none'"/>` : ''; return `<tr><td>${itemPhotoHtml} ${i.itemName}</td><td>${i.qty}</td><td>${formatMoney(i.unitPrice, s.currency)}</td><td style="font-weight:bold;">${formatMoney(Number(i.qty) * Number(i.unitPrice), s.currency)}</td></tr>`}).join('')}<tr style="background-color:#f8fafc;"><td colspan="3" style="${align};font-weight:bold;">${t('tot_inv')}</td><td style="font-weight:bold;font-size:16px;">${formatMoney(s.price, s.currency)}</td></tr>${s.saleType === 'installment' ? `<tr><td colspan="3" style="${align};">${t('adv')}:</td><td style="font-weight:bold;">${formatMoney(s.advance, s.currency)}</td></tr><tr><td colspan="3" style="${align};">${t('inst_month')} (${s.months}):</td><td style="font-weight:bold;">${formatMoney(s.monthlyAmount, s.currency)}</td></tr>` : ''}${isCreditAgent || isCreditCompany ? `<tr><td colspan="3" style="${align};">${t('dat')}:</td><td style="color:#000;font-weight:bold;" dir="ltr">${s.dueDate}</td></tr>` : ''}</table></div><div style="margin-top:15px;color:#334155;"><strong>${t('not')}:</strong> ${s.note || '-'}</div>`;
    printContent(`${t('m_sales')} (${typeLabel})`, s.receiptNo, html, STORE_NAME, s.customerName, true);
  };

  const printContract = (s) => {
    const itemNames = (s.items || [{ itemName: s.itemName }]).map(i => i.itemName).join('، ');
    const html = `<div style="text-align:center;margin-bottom:15px;"><h2 style="font-size:24px;font-weight:900;text-decoration:underline;margin:0;">گرێبەستی قیست</h2></div><div style="font-size:14.5px;font-weight:bold;line-height:1.8;color:#0f172a;text-align:justify;margin-bottom:20px;padding:15px 20px;background:#ecfdf5;border-radius:12px;border:2px solid #cbd5e1;"><ol style="margin:0;padding-right:20px;"><li style="margin-bottom:10px;">هەرکات لایەنی دووەم (<span>${s.customerName}</span>) پێویستی بە کارتی نیشتمانی هەبوو کە پێشتر وەک بارمتەیەک لای لایەنی یەکەم (<span>${STORE_NAME}</span>) داینابوو تەنها مۆڵەتی شۆفێری لەبری وەردەگیرێت بە مەرجێک ماوەکەی بەسەرنەچوبێت یان ئەو بڕە پارەیەی لە قیستەکە ماوە وەک ئەمانەتێک دەبێت بیدات بە لایەنی یەکەم تا ئەو کاتەی دووبارە کارتی نیشتمانی دەگێڕێتەوە.</li><li style="margin-bottom:10px;">لایەنی دووەم بەڵێن دەدات کە پابەند بێت بە گەڕاندنەوەی قیستەکانی لە ماوەی دیاریکراوی خۆیدا هەر ٣٠ ڕۆژ جارێک بێ دواکەوتن ، نەدانی مووچە و دواکەوتنی مووچە و لێبڕینی مووچە و لاوازی بازاڕ یاخوود هەر هۆکارێکی دیکە نەکاتە بەهانە بۆ دواخستنی قیستەکانی.</li><li style="margin-bottom:10px;">لایەنی دووەم ئامێری ئاماژەپێکراوی (<span>${itemNames}</span>) بێ هیچ کەم و کوڕییەک وەرگرت.</li><li style="margin-bottom:10px;">پێویستە لایەنی دووەم (<span>${s.customerName}</span>) کۆپی کارتی نیشتمانی و کارتی زانیاری بدات بە لایەنی یەکەم (<span>${STORE_NAME}</span>) وە پێویستە وەک بارمتەیەک لایەنی دووەم (<span>${s.customerName}</span>) کارتی نیشتمانی اصلى بدات بە لایەنی یەکەم (<span>${STORE_NAME}</span>) تا کۆتایی هاتنی ماوەی قیستەکە و پاکتاوکردنی هەژمارەکەی.</li><li style="margin-bottom:10px;">هەرکات لایەنی دووەم (<span>${s.customerName}</span>) ویستی بە هەر هۆکارێک ئەم گرێبەستە هەڵبووەشێنێتەوە ئەوا لایەنی یەکەم (<span>${STORE_NAME}</span>) بە مافی خۆی دەزانێت کە بڕی پێشەکی وەرگیراو نەگەڕێنێتەوە بۆ لایەنی دووەم (<span>${s.customerName}</span>) وە کاڵای گەڕاوە بە نرخی ڕۆژ خەمڵاندنی بۆ دەکرێت و دەدرێت بە لایەنی دووەم (<span>${s.customerName}</span>).</li></ol><p style="margin-top:15px;margin-bottom:0;font-weight:900;text-align:center;border-top:1px dashed #cbd5e1;padding-top:15px;">هەردوو لایەن پاش خوێندنەوەی تەواوی خاڵەکان و تێگەیشتنیان وە بە تەواوی هەست و هۆش و پاش ڕەزامەندییان بە ویستی خۆیان لای خوارەوە واژۆیان کرد.</p></div>`;
    printContent('گرێبەستی فرۆشتن', s.receiptNo, html, STORE_NAME, s.customerName, true);
  };

  const handleDocToggle = (docName) => setSelectedDocs(selectedDocs.some(d => d.name === docName) ? selectedDocs.filter(d => d.name !== docName) : [...selectedDocs, { name: docName, fileUrl: null }]);
  const handleFileChange = async (e, docName) => {
     const file = e.target.files[0]; if(!file) return; setUploadingDoc(docName);
     try {
       const base64Str = await compressImage(file);
       setSelectedDocs(prev => prev.map(d => d.name === docName ? { ...d, fileUrl: base64Str } : d));
     } catch (err) { alertMsg("Error uploading."); } setUploadingDoc(null);
  };
  const handleSaveDocs = async () => { await updateDoc(getDocRef('sales', viewingDocuments.id), { documents: selectedDocs }); await logAction(`Saved Docs: ${viewingDocuments.customerName}`); alertMsg(t('s_sav')); setViewingDocuments(null); };
  const printDocsReceipt = (sale, selectedDocsArr) => {
    const docsHTML = selectedDocsArr.length > 0 ? selectedDocsArr.map(d => `<li style="margin-bottom:20px;"><div style="margin-bottom:10px;">☑ ${d.name}</div>${d.fileUrl ? `<img src="${d.fileUrl}" style="max-width:100%;max-height:250px;border-radius:8px;border:2px solid #cbd5e1;display:block;margin-top:5px;" alt="doc"/>` : ''}</li>`).join('') : `<li>${t('e_fil')}</li>`;
    const html = `<div style="font-size:16px;line-height:1.8;color:#0f172a;margin-bottom:20px;padding:25px;background:#ecfdf5;border-radius:12px;border:2px solid #a7f3d0;"><p style="font-size:18px;font-weight:bold;margin-bottom:25px;border-bottom:1px solid #cbd5e1;padding-bottom:15px;">ئاماژە بە پسوڵەی ژمارە (<span style="font-size:20px;">${sale.receiptNo}</span>)، ئەم بەڵگەنامانەی خوارەوە وەرگیراون لە کڕیار (<strong>${sale.customerName}</strong>):</p><ul style="list-style-type:none;padding:0;font-size:17px;font-weight:bold;">${docsHTML}</ul></div>`;
    printContent(t('dcs'), sale.receiptNo, html, STORE_NAME, sale.customerName, true);
  };

  const printPaymentReceipt = (tx, overrideBalance = null) => {
    const isInstallment = tx.type === 'receive_installment'; const isAgent = tx.type === 'receive_agent_payment' || tx.type === 'pay_agent_payment';
    let typeText = isInstallment ? t('p_r_inst') : t('m_payments');
    if (tx.type === 'receive_agent_payment') typeText = t('p_r_agt'); if (tx.type === 'pay_agent_payment') typeText = t('p_p_agt');
    if (tx.type === 'receive_company_payment') typeText = t('p_r_cmp'); if (tx.type === 'pay_office_debt') typeText = t('p_p_off'); if (tx.type === 'receive_office_loan') typeText = t('p_r_off');
    const partyName = tx.desc.split(': ')[1] || tx.desc; let currentBalance = overrideBalance !== null ? overrideBalance : 0; let phoneNum = '-';
    if (overrideBalance === null) {
      const isTxNew = !capitalTx.find(t => t.id === tx.id);
      if (isInstallment && tx.refId) { const sale = sales.find(s => s.id === tx.refId); if (sale) { let paid = getSalePaidAmount(tx.refId); if (isTxNew) paid += tx.amount; currentBalance = sale.price - paid; phoneNum = sale.phone; } } 
      else if (isAgent && tx.refId) { const agent = agents.find(a => a.id === tx.refId); if (agent) { let debt = getAgentDebt(tx.refId, tx.currency); if (isTxNew) { debt += (tx.type === 'pay_agent_payment' ? Math.abs(tx.amount) : -Math.abs(tx.amount)); } currentBalance = debt; phoneNum = agent.phone; } } 
      else if ((tx.type === 'pay_company_debt' || tx.type === 'receive_company_payment') && tx.refId) { const comp = companies.find(c => c.id === tx.refId); if (comp) { let debt = getCompanyDebt(tx.refId, tx.currency); if (isTxNew) { debt += (tx.type === 'receive_company_payment' ? Math.abs(tx.amount) : -Math.abs(tx.amount)); } currentBalance = Math.abs(debt); phoneNum = comp.phone; } } 
      else if ((tx.type === 'pay_office_debt' || tx.type === 'receive_office_loan') && tx.refId) { const off = offices.find(o => o.id === tx.refId); if (off) { let debt = getOfficeDebt(tx.refId, tx.currency); if (isTxNew) { debt += (tx.type === 'pay_office_debt' ? Math.abs(tx.amount) : -Math.abs(tx.amount)); } currentBalance = debt; phoneNum = off.phone; } }
    }
    const html = `<div class="info-grid"><div class="info-box"><strong>${t('b_typ')}:</strong> ${typeText}<br/><strong>${t('nam')}:</strong> ${partyName}<br/><strong>${t('phn')}:</strong> <span dir="ltr">${phoneNum}</span><br/></div><div class="info-box"><strong>${t('dat')}:</strong> ${tx.date}<br/><strong>${t('bal')}:</strong> <span dir="ltr" style="color:#000;font-weight:bold;font-size:16px;">${formatMoney(Math.abs(currentBalance || 0), tx.currency)}</span></div></div><table><tr><th>${t('amt')}</th><th>${t('not')}</th></tr><tr><td style="font-weight:bold;font-size:18px;" dir="ltr">${formatMoney(Math.abs(tx.amount), tx.currency)}</td><td>${tx.note || '-'}</td></tr></table>`;
    printContent(typeText, tx.receiptNo, html, STORE_NAME, partyName, true);
  };

  const handlePaymentSubmit = async (e, typeCategory) => {
    e.preventDefault(); const form = e.target; const refId = form.refId.value; const txDirection = form.txDirection?.value || 'receive'; const amount = parseFloat(form.amount.value); const note = form.note.value; const selectedCurrency = form.currency.value;
    let typeStr = ''; let desc = ''; let dbAmount = amount; let expectedNewBalance = 0;
    const isHawala = form.viaOffice?.checked && txDirection === 'pay'; const officeId = form.officeId?.value; const officeFee = parseFloat(form.officeFee?.value) || 0;
    if (isHawala && !officeId) return alertMsg(t('e_fil'));
    const rNo = (editingPaymentId ? capitalTx.find(t => t.id === editingPaymentId)?.receiptNo : null) || (capitalTx.length > 0 ? Math.max(...capitalTx.map(t => t.receiptNo || 0)) + 1 : 1);

    if (typeCategory === 'installment') { typeStr = 'receive_installment'; const sale = sales.find(s => s.id === refId); desc = `${t('rcv_inst')} ${sale?.customerName}`; expectedNewBalance = sale.price - (getSalePaidAmount(refId) + amount); } 
    else if (typeCategory === 'agent') { const agent = agents.find(a => a.id === refId); if (txDirection === 'receive') { typeStr = 'receive_agent_payment'; desc = `${t('p_r_agt')} ${agent?.name}`; expectedNewBalance = getAgentDebt(refId, selectedCurrency) - amount; } else { typeStr = 'pay_agent_payment'; desc = `${t('p_p_agt')} ${agent?.name}`; dbAmount = -amount; expectedNewBalance = getAgentDebt(refId, selectedCurrency) + amount; } } 
    else if (typeCategory === 'company') { const comp = companies.find(c => c.id === refId); if (txDirection === 'pay') { typeStr = 'pay_company_debt'; desc = `${t('p_p_cmp')} ${comp?.name}`; dbAmount = -amount; expectedNewBalance = getCompanyDebt(refId, selectedCurrency) - amount; } else { typeStr = 'receive_company_payment'; desc = `${t('p_r_cmp')} ${comp?.name}`; expectedNewBalance = getCompanyDebt(refId, selectedCurrency) + amount; } } 
    else if (typeCategory === 'office') { const off = offices.find(o => o.id === refId); if (txDirection === 'receive') { typeStr = 'receive_office_loan'; desc = `${t('p_r_off')} ${off?.name}`; dbAmount = amount; expectedNewBalance = getOfficeDebt(refId, selectedCurrency) + amount; } else { typeStr = 'pay_office_debt'; desc = `${t('p_p_off')} ${off?.name}`; dbAmount = -amount; expectedNewBalance = getOfficeDebt(refId, selectedCurrency) - amount; } }

    if (isHawala && !editingPaymentId) {
        const office = offices.find(o => o.id === officeId);
        const tx1 = await addTransaction(typeStr, dbAmount, desc + ` (${t('v_off')} ${office.name})`, refId, note, null, rNo, selectedCurrency);
        if (officeFee > 0) await addTransaction('expense', -officeFee, `${t('h_fee')} - ${office.name}`, null, `For ${rNo}`, null, rNo, selectedCurrency);
        await addTransaction('receive_office_loan', amount + officeFee, `Hawala Debt ${desc}`, officeId, note, null, rNo, selectedCurrency);
        await logAction(`Hawala ${desc}`);
        confirmAction(t('prt'), () => printPaymentReceipt({...tx1, amount: amount}, expectedNewBalance));
        form.reset(); setViaOfficeAgent(false); setViaOfficeComp(false); return;
    }

    if (editingPaymentId) { const oldTx = capitalTx.find(t => t.id === editingPaymentId); if (oldTx) { await addTransaction(typeStr, dbAmount, desc, refId, note, oldTx.id, oldTx.receiptNo, selectedCurrency); await logAction(`Update TX ${oldTx.receiptNo}`); setEditingPaymentId(null); alertMsg(t('s_sav')); } } 
    else { const newTx = await addTransaction(typeStr, dbAmount, desc, refId, note, null, rNo, selectedCurrency); await logAction(`Create TX ${rNo}`); confirmAction(t('prt'), () => printPaymentReceipt(newTx, expectedNewBalance)); }
    form.reset();
  };
  const deletePaymentTx = (id) => confirmAction(t('c_del'), async () => { const t = capitalTx.find(x=>x.id===id); await deleteDoc(getDocRef('capitalTx', id)); await logAction(`Delete TX ${t?.receiptNo}`); });
  const handleCapitalSubmit = async (e) => { e.preventDefault(); const type = e.target.type.value; const amount = parseFloat(e.target.amount.value); const reason = e.target.reason.value; const note = e.target.note.value; const selectedCurrency = e.target.currency.value; if (type === 'expense') await addTransaction('expense', -amount, `${t('exp')}: ${reason}`, null, note, null, null, selectedCurrency); else if (type === 'add') await addTransaction('capital_add', amount, `${t('c_add')}: ${reason}`, null, note, null, null, selectedCurrency); else await addTransaction('capital_remove', -amount, `${t('c_rem')}: ${reason}`, null, note, null, null, selectedCurrency); await logAction(`Capital Op: ${type} - ${amount} ${selectedCurrency}`); e.target.reset(); };
  const handleSearchChange = (type, value) => { setSearchTerms({ ...searchTerms, [type]: value }); if (value.trim() !== '') { if (type === 'installment' && installmentSelectRef.current) installmentSelectRef.current.size = 5; if (type === 'agent' && agentSelectRef.current) agentSelectRef.current.size = 5; if (type === 'company' && companySelectRef.current) companySelectRef.current.size = 5; if (type === 'office' && officeSelectRef.current) officeSelectRef.current.size = 5; } else { if (type === 'installment' && installmentSelectRef.current) installmentSelectRef.current.size = 1; if (type === 'agent' && agentSelectRef.current) agentSelectRef.current.size = 1; if (type === 'company' && companySelectRef.current) companySelectRef.current.size = 1; if (type === 'office' && officeSelectRef.current) officeSelectRef.current.size = 1; } };
  const handleSelectChange = (e, ref) => { if(ref.current) ref.current.size = 1; };

  // --- UI Render ---
  const renderDashboard = () => {
    const totalSales = sales.reduce((acc, s) => acc + (s.currency === settings.currency ? s.price : 0), 0); 
    const totalDebtInMarket = sales.filter(s=>s.saleType==='installment' && s.currency === settings.currency).reduce((acc, s) => acc + (s.price - getSalePaidAmount(s.id)), 0); 
    const totalAgentDebt = agents.reduce((acc, a) => acc + getAgentDebt(a.id, settings.currency), 0);
    const totalCompanyDebt = companies.reduce((acc, c) => acc + getCompanyDebt(c.id, settings.currency), 0);

    const chartData = [
      { label: t('c_box'), value: currentCapital[settings.currency] || 0, color: 'bg-blue-500' },
      { label: t('t_sal'), value: totalSales, color: 'bg-emerald-500' },
      { label: t('d_m_dbt'), value: totalDebtInMarket, color: 'bg-amber-500' },
      { label: t('a_dbt'), value: totalAgentDebt, color: 'bg-rose-500' },
      { label: t('c_ops'), value: totalCompanyDebt, color: 'bg-purple-500' }
    ];
    const maxSummaryValue = Math.max(...chartData.map(d => d.value), 1);

    const lineChartData = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const val = sales.filter(s => s.date === dateStr && s.currency === settings.currency).reduce((sum, s) => sum + s.price, 0);
        return { label: displayDate, value: val };
    });
    const maxLineValue = Math.max(...lineChartData.map(d => d.value), 1);

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_dashboard')} ({currentCurrency.name})</h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${hasPermission('capital') ? '4' : '3'} gap-4 md:gap-6`}>
          {hasPermission('capital') && (<div className={`${currentTheme.main} text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between`}><div><p className="opacity-80 mb-1 font-medium text-sm md:text-base">{t('c_box')}</p><h3 className="text-xl md:text-2xl font-bold">{formatMoney(currentCapital[settings.currency] || 0)}</h3></div><IconDollarSign size={32} className="opacity-80" /></div>)}
          <div className="bg-slate-900 text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-slate-300 mb-1 font-medium text-sm md:text-base">{t('t_sal')}</p><h3 className="text-xl md:text-2xl font-bold">{formatMoney(totalSales)}</h3></div><IconShoppingCart size={32} className="opacity-80" /></div>
          {hasPermission('installment_ops') && (
            <div className="bg-black text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between"><div><p className="text-slate-400 mb-1 font-medium text-sm md:text-base">{t('d_m_dbt')}</p><h3 className="text-xl md:text-2xl font-bold">{formatMoney(totalDebtInMarket)}</h3></div><IconList size={32} className="opacity-80" /></div>
          )}
          <div className={`${currentTheme.main} text-white p-5 md:p-6 rounded-xl shadow-lg flex items-center justify-between opacity-90`}><div><p className="opacity-80 mb-1 font-medium text-sm md:text-base">{t('a_dbt')}</p><h3 className="text-xl md:text-2xl font-bold">{formatMoney(totalAgentDebt)}</h3></div><IconAgent size={32} className="opacity-80" /></div>
        </div>

        {/* Custom UI Charts without external dependencies */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">پوختەی دارایی گشتی</h3>
                <div className="h-[250px] flex items-end gap-2 sm:gap-4 pt-6 border-b border-slate-200 pb-2">
                   {chartData.map((item, idx) => {
                      const heightPct = Math.max((item.value / maxSummaryValue) * 100, 2);
                      return (
                         <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {formatMoney(item.value)}
                            </div>
                            <div className={`w-full rounded-t-md ${item.color} transition-all duration-500 opacity-80 hover:opacity-100 cursor-pointer`} style={{ height: `${heightPct}%` }}></div>
                            <div className="text-[10px] sm:text-xs text-center mt-2 text-slate-600 font-medium truncate w-full" title={item.label}>{item.label}</div>
                         </div>
                      )
                   })}
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">جوڵەی فرۆشتنی ٧ ڕۆژی ڕابردوو</h3>
                <div className="h-[250px] flex items-end gap-2 sm:gap-4 pt-6 border-b border-slate-200 pb-2">
                   {lineChartData.map((item, idx) => {
                      const heightPct = Math.max((item.value / maxLineValue) * 100, 2);
                      return (
                         <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {formatMoney(item.value)}
                            </div>
                            <div className={`w-full rounded-t-md bg-blue-500 transition-all duration-500 opacity-80 hover:opacity-100 cursor-pointer`} style={{ height: `${heightPct}%` }}></div>
                            <div className="text-[10px] sm:text-xs text-center mt-2 text-slate-600 font-medium truncate w-full whitespace-nowrap" dir="ltr" title={item.label}>{item.label}</div>
                         </div>
                      )
                   })}
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderDefinedItems = () => {
    const itemToEdit = editingId ? definedItems.find(i => i.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_items')}</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveDefinedItem} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">{t('typ')}</label><input required name="itemType" defaultValue={itemToEdit?.type} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('brd')}</label><input required name="brand" defaultValue={itemToEdit?.brand} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('i_nam')}</label><input required name="name" defaultValue={itemToEdit?.name} className={inpCls} /></div>
            <ImageUploadField name="photoUrl" defaultValue={itemToEdit?.photoUrl} label={t('pic')} placeholder="URL..." />
            <div className="flex gap-2"><button type="submit" disabled={isUploadingGlobal} className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium disabled:opacity-50`}>{editingId ? t('upd') : t('add')}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">{t('can')}</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[600px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{[t('pic'), t('typ'), t('brd'), t('i_nam'), t('act')].map((h, i)=><th key={i} className={thCls}>{h}</th>)}</tr></thead><tbody>{definedItems.map(i => (<tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{i.photoUrl ? <img src={i.photoUrl} alt="Item" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconBox /></div>}</td><td className={tdCls}>{i.type}</td><td className={tdCls}>{i.brand}</td><td className={`${tdCls} font-bold ${currentTheme.text}`}>{i.name}</td><td className={`${tdCls} flex gap-2`}><button onClick={() => setEditingId(i.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteDefinedItem(i.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>))}</tbody></table></div>
      </div>
    );
  };

  const renderUsers = () => {
    if (loggedAppUser?.role !== 'admin') return null; const userToEdit = editingId ? appUsers.find(u => u.id === editingId) : null;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('m_users')}</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new_user'} onSubmit={handleSaveAppUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">{t('user_n')}</label><input required name="username" defaultValue={userToEdit?.username} className={inpCls} dir="ltr" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('pass_w')}</label><input required name="password" defaultValue={userToEdit?.password} className={inpCls} dir="ltr" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">ڕۆڵ</label><select required name="role" defaultValue={userToEdit?.role || 'user'} className={inpCls}><option value="user">{t('rl_usr')}</option><option value="admin">{t('rl_adm')}</option></select></div>
            <div className="flex gap-2"><button type="submit" className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium`}>{editingId ? t('upd') : t('add')}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">{t('can')}</button>}</div>
            
            <div className="col-span-1 md:col-span-4 mt-2">
                <label className="block text-sm mb-2 text-slate-600 font-bold border-b pb-2">دەسەڵاتەکان</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MODULES_LIST.map(mod => {
                        if(mod.id === 'inventory_print_price') return null;
                        return (
                            <label key={mod.id} className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded border border-slate-200 text-sm hover:bg-slate-100">
                                <input type="checkbox" name={`perm_${mod.id}`} defaultChecked={userToEdit ? (userToEdit.permissions?.includes(mod.id)) : true} className="w-4 h-4" />
                                {t(mod.k)}
                            </label>
                        )
                    })}
                </div>
            </div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[400px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{[t('user_n'), 'ڕۆڵ', 'دەسەڵاتەکان', t('act')].map((h, i)=><th key={i} className={thCls}>{h}</th>)}</tr></thead><tbody>{appUsers.map(u => (<tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={`${tdCls} font-medium`} dir="ltr">{u.username}</td><td className={tdCls}>{u.role === 'admin' ? t('rl_adm') : t('rl_usr')}</td><td className={tdCls}>{u.role === 'admin' ? t('rl_all') : (u.permissions ? u.permissions.length : t('rl_all'))}</td><td className={`${tdCls} flex gap-2`}><button onClick={() => setEditingId(u.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteAppUser(u.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>))}<tr className="border-b border-slate-100 bg-slate-50"><td className={`${tdCls} font-medium text-slate-500`} dir="ltr">{DEFAULT_ADMIN_USER}</td><td className={`${tdCls} text-slate-500`}>{t('rl_adm')}</td><td className={`${tdCls} text-slate-500`}>{t('rl_all')}</td><td className={`${tdCls} text-slate-400 text-sm`}>{t('rl_bas')}</td></tr></tbody></table></div>
        
        <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2"><IconActivity/> Logs</h3>
        <div className="bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-800 max-h-[400px] flex flex-col">
            <div className="overflow-y-auto p-4 space-y-2">
                {userLogs.length === 0 && <p className="text-slate-500 text-center py-4">{t('lg_no')}</p>}
                {userLogs.map(log => (
                    <div key={log.id} className="text-sm border-b border-slate-800 pb-2">
                        <span className="text-emerald-500 font-bold" dir="ltr">[{log.date}]</span> 
                        <span className="text-blue-400 font-bold mx-2">{log.username}:</span> 
                        <span className="text-slate-300">{log.action}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  };

  const renderCompanies = () => {
    const compToEdit = editingId ? companies.find(c => c.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_companies')}</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveCompany} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">{t('nam')}</label><input required name="name" defaultValue={compToEdit?.name} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('phn')}</label><input required name="phone" defaultValue={compToEdit?.phone} className={inpCls} dir="ltr" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('adr')}</label><input name="address" defaultValue={compToEdit?.address} className={inpCls} /></div>
            <ImageUploadField name="photoUrl" defaultValue={compToEdit?.photoUrl} label={t('pic')} placeholder="URL..." />
            <div className="flex gap-2"><button type="submit" disabled={isUploadingGlobal} className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium disabled:opacity-50`}>{editingId ? t('upd') : t('add')}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">{t('can')}</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[700px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{[t('pic'),t('nam'),t('phn'),t('adr'),t('rem_d'),t('act')].map((h, i)=><th key={i} className={thCls}>{h}</th>)}</tr></thead><tbody>{companies.map(c => { const debt = getCompanyDebt(c.id, settings.currency); return (<tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{c.photoUrl ? <img src={c.photoUrl} alt="Company" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconBuilding /></div>}</td><td className={`${tdCls} font-medium`}>{c.name}</td><td className={tdCls} dir="ltr">{c.phone}</td><td className={tdCls}>{c.address}</td><td className={`${tdCls} font-bold`} dir="ltr">{debt > 0 ? <span className="text-black">{t('ow_u')} ${formatMoney(debt)}</span> : debt < 0 ? <span className="text-blue-600">{t('w_ow')} ${formatMoney(Math.abs(debt))}</span> : <span className="text-slate-500">${formatMoney(0)}</span>}</td><td className={`${tdCls} flex gap-2 mt-1`}><button onClick={() => setEditingId(c.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteCompany(c.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>)})}</tbody></table></div>
      </div>
    );
  };

  const renderAgents = () => {
    const agentToEdit = editingId ? agents.find(a => a.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_agents')}</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveAgent} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">{t('nam')}</label><input required name="name" defaultValue={agentToEdit?.name} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('phn')}</label><input required name="phone" defaultValue={agentToEdit?.phone} className={inpCls} dir="ltr" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('adr')}</label><input name="address" defaultValue={agentToEdit?.address} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('not')}</label><input name="notes" defaultValue={agentToEdit?.notes} className={inpCls} /></div>
            <div className="lg:col-span-1"><ImageUploadField name="photoUrl" defaultValue={agentToEdit?.photoUrl} label={t('pic')} placeholder="URL..." /></div>
            <div className="flex gap-2"><button type="submit" disabled={isUploadingGlobal} className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium disabled:opacity-50`}>{editingId ? t('upd') : t('add')}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">{t('can')}</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[700px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{[t('pic'),t('nam'),t('phn'),t('adr'),t('rem_d'),t('act')].map((h, i)=><th key={i} className={thCls}>{h}</th>)}</tr></thead><tbody>{agents.map(a => { const debt = getAgentDebt(a.id, settings.currency); return (<tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{a.photoUrl ? <img src={a.photoUrl} alt="Agent" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconAgent /></div>}</td><td className={`${tdCls} font-medium`}>{a.name}</td><td className={tdCls} dir="ltr">{a.phone}</td><td className={tdCls}>{a.address}</td><td className={`${tdCls} font-bold text-black`} dir="ltr">{formatMoney(debt)}</td><td className={`${tdCls} flex gap-2 mt-1`}><button onClick={() => setEditingId(a.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteAgent(a.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>)})}</tbody></table></div>
      </div>
    );
  };

  const renderOffices = () => {
    const officeToEdit = editingId ? offices.find(o => o.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_offices')}</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={editingId || 'new'} onSubmit={handleSaveOffice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div><label className="block text-sm mb-1 text-slate-600">{t('nam')}</label><input required name="name" defaultValue={officeToEdit?.name} className={inpCls} /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('phn')}</label><input name="phone" defaultValue={officeToEdit?.phone} className={inpCls} dir="ltr" /></div>
            <div><label className="block text-sm mb-1 text-slate-600">{t('adr')}</label><input name="address" defaultValue={officeToEdit?.address} className={inpCls} /></div>
            <div className="flex gap-2"><button type="submit" className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-2.5 rounded-lg font-medium`}>{editingId ? t('upd') : t('add')}</button>{editingId && <button type="button" onClick={() => setEditingId(null)} className="bg-slate-900 text-white p-2.5 rounded-lg">{t('can')}</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[500px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{[t('nam'),t('phn'),t('adr'),t('rem_d'),t('act')].map((h, i)=><th key={i} className={thCls}>{h}</th>)}</tr></thead><tbody>{offices.map(o => { const debt = getOfficeDebt(o.id, settings.currency); return (<tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={`${tdCls} font-medium`}>{o.name}</td><td className={tdCls} dir="ltr">{o.phone}</td><td className={tdCls}>{o.address}</td><td className={`${tdCls} font-bold text-orange-600`} dir="ltr">{formatMoney(debt)}</td><td className={`${tdCls} flex gap-2`}><button onClick={() => setEditingId(o.id)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deleteOffice(o.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>)})}</tbody></table></div>
      </div>
    );
  };

  const renderPurchases = () => {
    const handleEditPurchase = (p) => { setEditingId(p.id); setPurMode(p.paymentType); setPurEntityType(p.entityType || (p.paymentType === 'debt' ? 'company' : 'none')); if(p.items && p.items.length > 0) setPurItems(p.items); else setPurItems([{ id: Date.now(), itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty) }]); window.scrollTo({top:0, behavior:'smooth'}); };
    const purToEdit = editingId ? purchases.find(p => p.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_purchases')}</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <form key={`${editingId || 'new'}-${purMode}-${purEntityType}`} onSubmit={handleSavePurchase} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
            <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">{t('b_typ')}</label><select required name="paymentType" value={purMode} onChange={e=>{setPurMode(e.target.value); if(e.target.value==='debt' && purEntityType==='none') setPurEntityType('company');}} className={inpCls}><option value="cash">{t('csh')}</option><option value="debt">{t('dbt')}</option></select></div>
            <div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">{t('b_frm')}</label><select value={purEntityType} onChange={e=>setPurEntityType(e.target.value)} className={inpCls}><option value="company">{t('m_companies')}</option><option value="agent">{t('m_agents')}</option>{purMode === 'cash' && <option value="none">{t('u_sel')}</option>}</select></div>
            <div className="lg:col-span-3"><label className="block text-sm mb-1 text-slate-600">{t('nam')} {purMode === 'debt' && <span className="text-rose-500 font-bold">*</span>}</label>{purEntityType === 'none' ? (<input name="companyNameStr" placeholder="..." defaultValue={purToEdit ? purToEdit.companyName : ''} className={inpCls} />) : (<select required={purMode === 'debt'} name="entityId" defaultValue={purToEdit?.companyId} className={inpCls}><option value="">{t('pl_sel')}</option>{(purEntityType === 'company' ? companies : agents).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>)}</div>
            <div className="lg:col-span-1"><label className="block text-sm mb-1 text-slate-600">{t('cur')}</label><select name="currency" defaultValue={purToEdit?.currency || settings.currency} className={inpCls}>{Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            
            <div className={`lg:col-span-8 ${currentTheme.lightBg} p-4 rounded-xl border border-slate-200 mt-2 space-y-3`}><h4 className={`font-bold ${currentTheme.text} mb-2 border-b pb-2`}>{t('m_items')}</h4>
               {purItems.map((item, index) => (
                   <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:items-end p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none bg-white sm:bg-transparent">
                       <div className="flex-1"><label className="block text-xs mb-1 text-slate-600">{t('i_nam')}</label><select required value={item.itemName} onChange={(e) => updatePurItem(item.id, 'itemName', e.target.value)} className={inpCls}><option value="">{t('pl_sel')}</option>{definedItems.map(i => <option key={i.id} value={i.name}>{i.brand} - {i.name}</option>)}</select></div>
                       <div className="flex gap-3"><div className="w-24 flex-1 sm:flex-none"><label className="block text-xs mb-1 text-slate-600">{t('qty')}</label><input required type="number" step="any" value={item.qty} onChange={(e) => updatePurItem(item.id, 'qty', e.target.value)} className={inpCls} /></div><div className="w-32 flex-1 sm:flex-none"><label className="block text-xs mb-1 text-slate-600">{t('u_prc')}</label><input required type="number" step="any" value={item.unitPrice} onChange={(e) => updatePurItem(item.id, 'unitPrice', e.target.value)} className={inpCls} /></div></div>
                       {purItems.length > 1 && (<button type="button" onClick={() => removePurItem(item.id)} className="p-2 w-full sm:w-auto bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors mt-2 sm:mt-0"><IconTrash/></button>)}
                   </div>
               ))}
               <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4"><button type="button" onClick={addPurItem} className={`w-full sm:w-auto text-sm font-bold ${currentTheme.text} bg-white px-4 py-2.5 rounded-lg border border-slate-300 shadow-sm`}>{t('a_itm')}</button><div className={`text-left font-black text-xl ${currentTheme.text} bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200`} dir="ltr">{t('tot')}: {purItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0).toFixed(2)}</div></div>
            </div>
            <div className="lg:col-span-6"><label className="block text-sm mb-1 text-slate-600">{t('not')}</label><input name="note" defaultValue={purToEdit?.note} className={inpCls} placeholder="..." /></div>
            <div className="lg:col-span-2 flex gap-2"><button type="submit" className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-3 rounded-lg font-bold`}>{editingId ? t('upd') : t('sav')}</button>{editingId && <button type="button" onClick={() => {setEditingId(null); setPurItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }])}} className="bg-slate-900 text-white p-3 rounded-lg">{t('can')}</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><table className="w-full text-right whitespace-nowrap min-w-[800px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{[t('r_no'),t('dat'),t('nam'),t('m_items'),t('tot'),t('b_typ'),t('not'),t('act')].map((h, i)=><th key={i} className={thCls}>{h}</th>)}</tr></thead><tbody>{purchases.map(p => { const itemsList = p.items || [{ itemName: p.itemName, qty: p.qty, unitPrice: p.price || (p.total/p.qty) }]; return (<tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={`${tdCls} font-bold text-slate-400`}>{p.receiptNo}</td><td className={tdCls}>{p.date}</td><td className={`${tdCls} font-semibold`}>{p.companyName} <span className="text-xs text-slate-400">({p.entityType === 'agent' ? t('m_agents') : t('m_companies')})</span></td><td className={tdCls}>{itemsList.map(i=>i.itemName).join('، ')}</td><td className={`${tdCls} font-bold ${currentTheme.text}`} dir="ltr">{formatMoney(p.total, p.currency)}</td><td className={tdCls}>{p.paymentType === 'debt' ? <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded text-xs font-bold">{t('dbt')}</span> : <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{t('csh')}</span>}</td><td className={`${tdCls} text-slate-500`}>{p.note}</td><td className={`${tdCls} flex gap-2`}><button onClick={() => printPurchase(p)} className="text-slate-900 bg-slate-200 p-2 rounded-full"><IconPrinter /></button><button onClick={() => handleEditPurchase(p)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`}><IconEdit /></button><button onClick={() => deletePurchase(p.id)} className="text-rose-500 bg-rose-50 p-2 rounded-full"><IconTrash /></button></td></tr>)})}</tbody></table></div>
      </div>
    );
  };

  const renderInventory = () => {
    const printInventory = (withPrice) => {
        const html = `
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="font-size:22px;color:#0f172a;">${t('m_inventory')}</h2>
            <p style="font-size:14px;color:#64748b;">${t('dat')}: ${getToday()}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;text-align:right;font-size:14px;">
            <thead>
              <tr style="background-color:#f1f5f9;border-bottom:2px solid #cbd5e1;">
                <th style="padding:10px;border:1px solid #e2e8f0;">${t('i_nam')}</th>
                <th style="padding:10px;border:1px solid #e2e8f0;">${t('qty')}</th>
                ${withPrice ? `<th style="padding:10px;border:1px solid #e2e8f0;">${t('a_cst')}</th><th style="padding:10px;border:1px solid #e2e8f0;">${t('tot')}</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${inventory.map(i => `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;">${i.itemName} <span style="font-size:11px;color:#64748b">(${i.currency})</span></td>
                  <td style="padding:10px;border:1px solid #e2e8f0;">${i.currentQty}</td>
                  ${withPrice ? `<td style="padding:10px;border:1px solid #e2e8f0;" dir="ltr">${formatMoney(i.avgCost, i.currency)}</td><td style="padding:10px;border:1px solid #e2e8f0;font-weight:bold;" dir="ltr">${formatMoney(i.currentQty * i.avgCost, i.currency)}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        printContent(t('m_inventory'), '', html, STORE_NAME, '', false);
    };

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_inventory')}</h2>
        <div className="flex gap-3 mb-4">
           <button onClick={() => printInventory(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-black"><IconPrinter/> {t('p_np')}</button>
           {hasPermission('inventory_print_price') && <button onClick={() => printInventory(true)} className={`${currentTheme.main} text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2`}><IconPrinter/> {t('p_wp')}</button>}
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right min-w-[500px]">
            <thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{[t('pic'),t('i_nam'),t('a_cst'),t('qty')].map((h, i)=><th key={i} className={thCls}>{h}</th>)}</tr></thead>
            <tbody>
              {inventory.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">{t('inv_emp')}</td></tr>}
              {inventory.map(i => {
                const defItem = definedItems.find(d => d.name === i.itemName); const photo = defItem?.photoUrl || i.photoUrl || '';
                return (<tr key={`${i.itemName}_${i.currency}`} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{photo ? <img src={photo} alt="Item" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconBox /></div>}</td><td className={`${tdCls} font-semibold text-slate-800`}>{i.itemName} <span className="text-xs text-slate-400">({i.currency})</span></td><td className={tdCls} dir="ltr">{hasPermission('inventory_print_price') ? formatMoney(i.avgCost, i.currency) : '---'}</td><td className={`${tdCls} font-bold ${currentTheme.text} text-lg`}>{i.currentQty}</td></tr>)
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSales = () => {
    if (viewingInstallments) {
      const sale = sales.find(s => s.id === viewingInstallments); const isInstallment = sale.saleType === 'installment'; const totalPaid = getSalePaidAmount(sale.id); const balance = sale.price - totalPaid; const paymentsMade = capitalTx.filter(tx => tx.refId === sale.id && (tx.type === 'receive_installment' || tx.type === 'receive_agent_payment'));
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"><h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">{sale.customerPhotoUrl && <img src={sale.customerPhotoUrl} className="w-12 h-12 rounded-full object-cover border-2 shadow-sm" alt="C" />} {sale.customerName}</h2><button onClick={() => setViewingInstallments(null)} className="text-white bg-slate-900 px-4 py-2 rounded-lg font-medium self-start sm:self-auto hover:bg-black">{t('back_btn')}</button></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4"><div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200"><p className="text-sm text-slate-500">{t('tot')}</p><h3 className="text-xl font-bold" dir="ltr">{formatMoney(sale.price, sale.currency)}</h3></div><div className={`${currentTheme.lightBg} p-4 md:p-5 rounded-xl border ${currentTheme.border}`}><p className={`text-sm ${currentTheme.text}`}>{t('pad')}</p><h3 className={`text-xl font-bold ${currentTheme.text}`} dir="ltr">{formatMoney(totalPaid, sale.currency)}</h3></div><div className="bg-slate-100 p-4 md:p-5 rounded-xl border border-slate-300"><p className="text-sm text-slate-800">{t('rem_d')}</p><h3 className="text-xl font-bold text-black" dir="ltr">{formatMoney(balance, sale.currency)}</h3></div></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-x-auto"><h3 className="font-bold text-lg mb-3 border-b pb-2">{isInstallment ? t('i_acc') : t('not')}</h3>{isInstallment ? (<table className="w-full text-right text-sm min-w-[300px]"><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{[t('mth'),t('dat'),t('amt')].map((h, i)=><th key={i} className="p-2">{h}</th>)}</tr></thead><tbody>{sale.installments?.map(inst => (<tr key={inst.id} className="border-b"><td className="p-2">{t('mth')} {inst.monthNum}</td><td className="p-2" dir="ltr">{inst.dueDate}</td><td className="p-2 font-bold" dir="ltr">{formatMoney(inst.amount, sale.currency)}</td></tr>))}</tbody></table>) : (<div className="p-4"><p><strong>{t('c_day')}:</strong> <span dir="ltr">${sale.dueDate}</span> ({sale.creditDays})</p></div>)}</div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-x-auto"><h3 className="font-bold text-lg mb-3 border-b pb-2">{t('m_payments')}</h3><table className="w-full text-right text-sm min-w-[300px]"><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{[t('dat'),t('amt'),t('not')].map((h, i)=><th key={i} className="p-2">{h}</th>)}</tr></thead><tbody>{sale.advance > 0 && <tr><td className="p-2">{sale.date}</td><td className={`p-2 ${currentTheme.text} font-bold`} dir="ltr">{formatMoney(sale.advance, sale.currency)}</td><td className="p-2">{t('adv')}</td></tr>}{sale.saleType === 'cash' && <tr><td className="p-2">{sale.date}</td><td className={`p-2 ${currentTheme.text} font-bold`} dir="ltr">{formatMoney(sale.price, sale.currency)}</td><td className="p-2">{t('s_cash')}</td></tr>}{paymentsMade.map(p => (<tr key={p.id} className="border-b"><td className="p-2">{p.date}</td><td className={`p-2 ${currentTheme.text} font-bold`} dir="ltr">{formatMoney(p.amount, sale.currency)}</td><td className="p-2">{p.note}</td></tr>))}</tbody></table></div>
          </div>
        </div>
      );
    }

    const saleToEdit = editingId ? sales.find(s => s.id === editingId) : null;
    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_sales')}</h2>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-4 mb-6 border-b pb-4">
            {['cash-'+t('s_cash'), 'credit_agent-'+t('s_c_agt'), 'credit_company-'+t('s_c_cmp')].map(mode => { const [m, lbl] = mode.split('-'); return (<label key={m} className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 py-2 px-3 rounded-lg"><input type="radio" name="smode" checked={saleMode === m || (m === 'credit_agent' && saleMode === 'credit')} onChange={()=>setSaleMode(m)} className="w-5 h-5 accent-black" /> {lbl}</label>) })}
            {hasPermission('installment_ops') && (
              <label key="installment" className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 py-2 px-3 rounded-lg"><input type="radio" name="smode" checked={saleMode === 'installment'} onChange={()=>setSaleMode('installment')} className="w-5 h-5 accent-black" /> {t('s_inst')}</label>
            )}
          </div>
          <form key={`${editingId || 'new'}-${saleMode}`} onSubmit={handleSaveSale} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
            {saleMode === 'credit_agent' || saleMode === 'credit' ? (<div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">{t('nam')}</label><select required name="agentId" defaultValue={saleToEdit?.agentId} className={inpCls}><option value="">{t('pl_sel')}</option>{agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>) : saleMode === 'credit_company' ? (<div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">{t('nam')}</label><select required name="companyId" defaultValue={saleToEdit?.companyId} className={inpCls}><option value="">{t('pl_sel')}</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>) : (<><div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">{t('c_nam')}</label><input required name="customerName" defaultValue={saleToEdit?.customerName} className={inpCls} /></div><div><label className="block text-sm mb-1 text-slate-600">{t('phn')}</label><input required name="phone" defaultValue={saleToEdit?.phone} className={inpCls} dir="ltr" /></div><div><label className="block text-sm mb-1 text-slate-600">{t('adr')}</label><input required={saleMode==='installment'} name="address" defaultValue={saleToEdit?.address} className={inpCls} /></div></>)}
            <div className="lg:col-span-1"><label className="block text-sm mb-1 text-slate-600">{t('cur')}</label><select name="currency" defaultValue={saleToEdit?.currency || settings.currency} className={inpCls}>{Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
            {(saleMode === 'installment' || saleMode === 'cash') && (<div className="lg:col-span-2"><ImageUploadField name="customerPhotoUrl" defaultValue={saleToEdit?.customerPhotoUrl} label={t('pic')} placeholder="URL..." /></div>)}
            <div className={`md:col-span-4 lg:col-span-7 ${currentTheme.lightBg} p-4 rounded-xl border border-slate-200 mt-2 space-y-3`}><h4 className={`font-bold ${currentTheme.text} mb-2 border-b pb-2`}>{t('m_items')}</h4>
               {saleItems.map((item, index) => (
                   <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:items-end p-3 sm:p-0 border sm:border-0 rounded-lg sm:rounded-none bg-white sm:bg-transparent">
                       <div className="flex-1"><label className="block text-xs mb-1 text-slate-600">{t('i_nam')}</label><select required value={item.itemName} onChange={(e) => updateSaleItem(item.id, 'itemName', e.target.value)} className={inpCls}><option value="">{t('sel_from_inv')}</option>{inventory.map(i => <option key={i.itemName} value={i.itemName}>{i.itemName} ({i.currentQty} {i.currency})</option>)}</select></div>
                       <div className="flex gap-3"><div className="w-full sm:w-24"><label className="block text-xs mb-1 text-slate-600">{t('qty')}</label><input required type="number" step="any" value={item.qty} onChange={(e) => updateSaleItem(item.id, 'qty', e.target.value)} className={inpCls} /></div><div className="w-full sm:w-32"><label className="block text-xs mb-1 text-slate-600">{t('u_prc')}</label><input required type="number" step="any" value={item.unitPrice} onChange={(e) => updateSaleItem(item.id, 'unitPrice', e.target.value)} className={inpCls} /></div></div>
                       {saleItems.length > 1 && (<button type="button" onClick={() => removeSaleItem(item.id)} className="p-2.5 mt-2 sm:mt-0 w-full sm:w-auto bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors flex justify-center items-center gap-1"><IconTrash/> <span className="sm:hidden">سڕینەوە</span></button>)}
                   </div>
               ))}
               <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4"><button type="button" onClick={addSaleItem} className={`w-full sm:w-auto text-sm font-bold ${currentTheme.text} bg-white px-4 py-2.5 rounded-lg shadow-sm border border-slate-200`}>{t('a_itm')}</button><div className={`text-left font-black text-xl ${currentTheme.text} bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm`} dir="ltr">{t('tot')}: {saleItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0).toFixed(2)}</div></div>
            </div>
            {saleMode === 'installment' && (<><div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">{t('adv')}</label><input required type="number" step="any" name="advance" defaultValue={saleToEdit?.advance || 0} className={inpCls} /></div><div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">{t('mth')}</label><input required type="number" name="months" min="1" defaultValue={saleToEdit?.months} className={inpCls} /></div></>)}
            {(saleMode === 'credit_agent' || saleMode === 'credit' || saleMode === 'credit_company') && (<div className="lg:col-span-2"><label className="block text-sm mb-1 text-slate-600">{t('c_day')}</label><input required type="number" name="creditDays" min="1" defaultValue="7" className={`${inpCls} font-bold`} /></div>)}
            <div className="lg:col-span-3"><label className="block text-sm mb-1 text-slate-600">{t('not')}</label><input name="note" defaultValue={saleToEdit?.note} className={inpCls} placeholder="..." /></div>
            <div className="md:col-span-7 flex gap-2 mt-2"><button type="submit" disabled={isUploadingGlobal} className={`flex-1 ${currentTheme.main} ${currentTheme.hover} text-white p-3 rounded-lg font-bold disabled:opacity-50`}>{editingId ? t('upd') : t('sav')}</button>{editingId && <button type="button" onClick={() => {setEditingId(null); setSaleItems([{ id: Date.now(), itemName: '', qty: 1, unitPrice: '' }])}} className="bg-slate-900 text-white p-3 rounded-lg">{t('can')}</button>}</div>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200">
          <table className="w-full text-right whitespace-nowrap min-w-[900px]"><thead className={`${currentTheme.lightBg} border-b border-slate-200 text-slate-800`}><tr>{[t('pic'), t('r_no'), t('nam'), t('m_items'), t('tot'), t('pad'), t('rem_d'), t('act')].map((h, i)=><th key={i} className={thCls}>{h}</th>)}</tr></thead>
            <tbody>
              {sales.map(s => {
                const paid = getSalePaidAmount(s.id); const balance = s.price - paid; const isInst = s.saleType === 'installment'; const isCash = s.saleType === 'cash'; const isComp = s.saleType === 'credit_company'; const typeBadge = isCash ? t('csh') : (isInst ? t('m_installment_ops') : (isComp ? t('m_companies') : t('m_agents'))); const itemsList = s.items || [{ itemName: s.itemName }]; const photoUrl = s.customerPhotoUrl || (s.agentId ? agents.find(a=>a.id===s.agentId)?.photoUrl : (s.companyId ? companies.find(c=>c.id===s.companyId)?.photoUrl : ''));

                return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50"><td className={tdCls}>{photoUrl ? <img src={photoUrl} alt="User" className="w-10 h-10 object-cover rounded-lg border border-slate-200" /> : <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><IconUser /></div>}</td><td className={`${tdCls} font-bold text-slate-600`}>{s.receiptNo} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">{typeBadge}</span></td><td className={`${tdCls} font-semibold`}>{s.customerName}</td><td className={tdCls}>{itemsList.map(i=>i.itemName).join('، ')}</td><td className={`${tdCls} font-bold ${currentTheme.text}`} dir="ltr">{formatMoney(s.price, s.currency)}</td><td className={`${tdCls} text-emerald-700`} dir="ltr">{formatMoney(paid, s.currency)}</td><td className={`${tdCls} text-black font-bold`} dir="ltr">{formatMoney(balance, s.currency)}</td><td className={`${tdCls} flex gap-2 mt-1`}>{!isCash && <button onClick={() => setViewingInstallments(s.id)} className={`bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold`} title="وردەکاری هەژمار"><IconList/></button>}{isInst && <button onClick={() => { setViewingDocuments(s); setSelectedDocs((s.documents || []).map(d => typeof d === 'string' ? {name:d, fileUrl:null} : d)); }} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`} title="بەڵگەنامەکان"><IconDocs /></button>}{isInst && <button onClick={() => printContract(s)} className="text-slate-900 bg-slate-200 p-2 rounded-full" title="چاپکردنی گرێبەست"><IconContract /></button>}<button onClick={() => printSale(s)} className="text-slate-600 bg-slate-200 p-2 rounded-full" title="چاپکردنی پسوڵە"><IconPrinter /></button><button onClick={() => handleEditSale(s)} className={`${currentTheme.text} ${currentTheme.lightBg} p-2 rounded-full`} title="دەستکاریکردن"><IconEdit /></button><button onClick={() => deleteSale(s.id)} className="text-rose-600 bg-rose-100 p-2 rounded-full"><IconTrash /></button></td></tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    const activeSales = sales.filter(s => s.saleType === 'installment' && (s.price - getSalePaidAmount(s.id)) > 0); const filteredActiveSales = activeSales.filter(s => s.customerName.includes(searchTerms.installment) || String(s.receiptNo).includes(searchTerms.installment) || s.phone.includes(searchTerms.installment));
    const filteredAgents = agents.filter(a => a.name.includes(searchTerms.agent) || a.phone.includes(searchTerms.agent)); const filteredCompanies = companies.filter(c => c.name.includes(searchTerms.company) || c.phone.includes(searchTerms.company)); const filteredOffices = offices.filter(o => o.name.includes(searchTerms.office) || o.phone.includes(searchTerms.office));
    const recentPayments = [...capitalTx].filter(tx => ['receive_installment', 'receive_agent_payment', 'pay_agent_payment', 'pay_company_debt', 'receive_company_payment', 'pay_office_debt', 'receive_office_loan'].includes(tx.type)).reverse().slice(0, 10);
    const pToEdit = editingPaymentId ? capitalTx.find(t => t.id === editingPaymentId) : null; const isE_Inst = pToEdit?.type === 'receive_installment'; const isE_Ag = pToEdit?.type === 'receive_agent_payment' || pToEdit?.type === 'pay_agent_payment'; const isE_Comp = pToEdit?.type === 'pay_company_debt' || pToEdit?.type === 'receive_company_payment'; const isE_Off = pToEdit?.type === 'pay_office_debt' || pToEdit?.type === 'receive_office_loan';

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_payments')}</h2>
        {editingPaymentId && (<div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex justify-between items-center"><span className="font-bold text-rose-900">{t('edt')} ({pToEdit.receiptNo})</span><button onClick={() => setEditingPaymentId(null)} className="text-sm bg-rose-200 px-3 py-1 rounded text-rose-900">{t('can')}</button></div>)}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {hasPermission('installment_ops') && (
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isE_Inst ? `ring-2 ring-blue-500` : `border-t-4 border-t-blue-600`}`}><h3 className={`font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}><IconDollarSign/> {isE_Inst ? t('e_ins') : t('p_r_inst')}</h3><div className="mb-3 relative"><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div><input type="text" placeholder={t('src')} value={searchTerms.installment} onChange={(e) => handleSearchChange('installment', e.target.value)} className={inpCls} /></div><form key={`ri-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'installment')} className="space-y-4 flex-1 flex flex-col"><select ref={installmentSelectRef} onChange={(e) => handleSelectChange(e, installmentSelectRef)} required name="refId" defaultValue={isE_Inst ? pToEdit?.refId : ''} className={inpCls}><option value="">{t('pl_sel')}</option>{(isE_Inst ? sales.filter(s=>s.saleType==='installment') : filteredActiveSales).map(s => <option key={s.id} value={s.id}>{s.customerName} - {s.receiptNo} (ماوە: ${formatMoney(s.price - getSalePaidAmount(s.id), s.currency)})</option>)}</select><div className="flex gap-2"><input required type="number" step="any" name="amount" defaultValue={isE_Inst ? Math.abs(pToEdit.amount) : ''} placeholder={t('amt')} className={inpCls} /><select name="currency" defaultValue={isE_Inst ? pToEdit?.currency : settings.currency} className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">{Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div><input name="note" defaultValue={isE_Inst ? pToEdit?.note : ''} placeholder={t('not')} className={inpCls} /><div className="mt-auto pt-4"><button type="submit" disabled={isE_Comp || isE_Ag || isE_Off} className={`w-full ${currentTheme.main} text-white p-2.5 rounded-lg font-bold ${currentTheme.hover}`}>{t('sav')}</button></div></form></div>
          )}

          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isE_Ag ? `ring-2 ring-blue-500` : `border-t-4 border-t-slate-900`}`}><h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><IconAgent/> {isE_Ag ? t('edt') : t('a_ops')}</h3><div className="mb-3 relative"><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div><input type="text" placeholder={t('src')} value={searchTerms.agent} onChange={(e) => handleSearchChange('agent', e.target.value)} className={inpCls} /></div><form key={`ra-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'agent')} className="space-y-4 flex-1 flex flex-col"><select required name="txDirection" value={agentTxDir} onChange={e=>setAgentTxDir(e.target.value)} className={`${inpCls} ${currentTheme.lightBg} font-bold ${currentTheme.text}`}><option value="receive">{t('p_r_agt')}</option><option value="pay">{t('p_p_agt')}</option></select><select ref={agentSelectRef} onChange={(e) => handleSelectChange(e, agentSelectRef)} required name="refId" defaultValue={isE_Ag ? pToEdit?.refId : ''} className={inpCls}><option value="">{t('pl_sel')}</option>{filteredAgents.map(a => <option key={a.id} value={a.id}>{a.name} (${formatMoney(getAgentDebt(a.id, settings.currency), settings.currency)})</option>)}</select><div className="flex gap-2"><input required type="number" step="any" name="amount" defaultValue={isE_Ag ? Math.abs(pToEdit.amount) : ''} placeholder={t('amt')} className={inpCls} /><select name="currency" defaultValue={isE_Ag ? pToEdit?.currency : settings.currency} className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">{Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div>{agentTxDir === 'pay' && !isE_Ag && (<div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm mb-2"><input type="checkbox" name="viaOffice" checked={viaOfficeAgent} onChange={e=>setViaOfficeAgent(e.target.checked)} className="w-4 h-4 accent-black" /> {t('v_off')}</label>{viaOfficeAgent && (<div className="space-y-2 mt-2"><select required name="officeId" className={inpCls}><option value="">{t('pl_sel')}</option>{offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select><input type="number" step="any" name="officeFee" placeholder={t('h_fee')} className={inpCls} /></div>)}</div>)}<input name="note" defaultValue={isE_Ag ? pToEdit?.note : ''} placeholder={t('not')} className={inpCls} /><div className="mt-auto pt-4"><button type="submit" disabled={isE_Comp || isE_Inst || isE_Off} className="w-full bg-slate-900 text-white p-2.5 rounded-lg font-bold hover:bg-black">{t('sav')}</button></div></form></div>
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isE_Comp ? `ring-2 ring-blue-500` : `border-t-4 border-t-black`}`}><h3 className="font-bold text-black mb-4 flex items-center gap-2"><IconBuilding/> {isE_Comp ? t('edt') : t('c_ops')}</h3><div className="mb-3 relative"><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div><input type="text" placeholder={t('src')} value={searchTerms.company} onChange={(e) => handleSearchChange('company', e.target.value)} className={inpCls} /></div><form key={`pay-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'company')} className="space-y-4 flex-1 flex flex-col"><select required name="txDirection" value={compTxDir} onChange={e=>setCompTxDir(e.target.value)} className={`${inpCls} ${currentTheme.lightBg} font-bold ${currentTheme.text}`}><option value="pay">{t('p_p_cmp')}</option><option value="receive">{t('p_r_cmp')}</option></select><select ref={companySelectRef} onChange={(e) => handleSelectChange(e, companySelectRef)} required name="refId" defaultValue={isE_Comp ? pToEdit?.refId : ''} className={inpCls}><option value="">{t('pl_sel')}</option>{filteredCompanies.map(c => <option key={c.id} value={c.id}>{c.name} (${formatMoney(getCompanyDebt(c.id, settings.currency), settings.currency)})</option>)}</select><div className="flex gap-2"><input required type="number" step="any" name="amount" defaultValue={isE_Comp ? Math.abs(pToEdit.amount) : ''} placeholder={t('amt')} className={inpCls} /><select name="currency" defaultValue={isE_Comp ? pToEdit?.currency : settings.currency} className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">{Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div>{compTxDir === 'pay' && !isE_Comp && (<div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-sm mb-2"><input type="checkbox" name="viaOffice" checked={viaOfficeComp} onChange={e=>setViaOfficeComp(e.target.checked)} className="w-4 h-4 accent-black" /> {t('v_off')}</label>{viaOfficeComp && (<div className="space-y-2 mt-2"><select required name="officeId" className={inpCls}><option value="">{t('pl_sel')}</option>{offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select><input type="number" step="any" name="officeFee" placeholder={t('h_fee')} className={inpCls} /></div>)}</div>)}<input name="note" defaultValue={isE_Comp ? pToEdit?.note : ''} placeholder={t('not')} className={inpCls} /><div className="mt-auto pt-4"><button type="submit" disabled={isE_Inst || isE_Ag || isE_Off} className="w-full bg-black text-white p-2.5 rounded-lg font-bold hover:bg-slate-900">{t('sav')}</button></div></form></div>
          <div className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col ${isE_Off ? `ring-2 ring-blue-500` : `border-t-4 border-t-blue-600`}`}><h3 className={`font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}><IconOffice/> {isE_Off ? t('edt') : t('o_ops')}</h3><div className="mb-3 relative"><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400"><IconSearch /></div><input type="text" placeholder={t('src')} value={searchTerms.office} onChange={(e) => handleSearchChange('office', e.target.value)} className={inpCls} /></div><form key={`off-${editingPaymentId || 'new'}`} onSubmit={e => handlePaymentSubmit(e, 'office')} className="space-y-4 flex-1 flex flex-col"><select required name="txDirection" defaultValue={isE_Off ? (pToEdit?.type === 'pay_office_debt' ? 'pay' : 'receive') : 'receive'} className={`${inpCls} ${currentTheme.lightBg} font-bold ${currentTheme.text}`}><option value="receive">{t('p_r_off')}</option><option value="pay">{t('p_p_off')}</option></select><select ref={officeSelectRef} onChange={(e) => handleSelectChange(e, officeSelectRef)} required name="refId" defaultValue={isE_Off ? pToEdit?.refId : ''} className={inpCls}><option value="">{t('pl_sel')}</option>{filteredOffices.map(o => <option key={o.id} value={o.id}>{o.name} (${formatMoney(getOfficeDebt(o.id, settings.currency), settings.currency)})</option>)}</select><div className="flex gap-2"><input required type="number" step="any" name="amount" defaultValue={isE_Off ? Math.abs(pToEdit.amount) : ''} placeholder={t('amt')} className={inpCls} /><select name="currency" defaultValue={isE_Off ? pToEdit?.currency : settings.currency} className="border border-slate-300 p-2.5 rounded-lg bg-slate-50">{Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div><input name="note" defaultValue={isE_Off ? pToEdit?.note : ''} placeholder={t('not')} className={inpCls} /><div className="mt-auto pt-4"><button type="submit" disabled={isE_Comp || isE_Ag || isE_Inst} className={`w-full ${currentTheme.main} text-white p-2.5 rounded-lg font-bold ${currentTheme.hover}`}>{t('sav')}</button></div></form></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mt-6 overflow-x-auto"><h3 className="font-bold text-lg mb-4 border-b pb-2 text-slate-800">{t('l_tx')}</h3><table className="w-full text-right text-sm min-w-[600px]"><thead className="bg-slate-50 text-slate-600 border-b"><tr>{[t('r_no'),t('dat'),t('b_typ'),t('not'),t('amt'),t('act')].map((h, i)=><th key={i} className="p-3">{h}</th>)}</tr></thead><tbody>{recentPayments.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-slate-500">{t('no_tx')}</td></tr>}{recentPayments.map(tx => (<tr key={tx.id} className="border-b hover:bg-slate-50"><td className="p-3 font-bold text-slate-400">{tx.receiptNo}</td><td className="p-3 text-slate-600" dir="ltr">{tx.date}</td><td className="p-3 font-bold">{tx.type === 'receive_installment' && <span className="text-blue-600">{t('p_r_inst')}</span>}{tx.type === 'receive_agent_payment' && <span className="text-emerald-600">{t('p_r_agt')}</span>}{tx.type === 'pay_agent_payment' && <span className="text-rose-600">{t('p_p_agt')}</span>}{tx.type === 'pay_company_debt' && <span className="text-rose-600">{t('p_p_cmp')}</span>}{tx.type === 'receive_company_payment' && <span className="text-blue-600">{t('p_r_cmp')}</span>}{tx.type === 'receive_office_loan' && <span className="text-emerald-600">{t('p_r_off')}</span>}{tx.type === 'pay_office_debt' && <span className="text-rose-600">{t('p_p_off')}</span>}</td><td className="p-3 text-slate-700">{tx.desc} <span className="text-slate-400">({tx.note})</span></td><td className="p-3 font-bold" dir="ltr"><span className={(tx.type.includes('receive') && tx.type !== 'receive_office_loan') ? 'text-blue-600' : 'text-rose-600'}>{formatMoney(Math.abs(tx.amount), tx.currency)}</span></td><td className="p-3 flex gap-2"><button onClick={() => printPaymentReceipt(tx)} className="bg-slate-200 text-slate-700 hover:bg-slate-300 p-2 rounded-lg text-xs font-semibold"><IconPrinter /></button>{(!tx.desc.includes(t('v_off')) && !tx.desc.includes('via') && !tx.desc.includes('حەواڵە')) && <button onClick={() => { setEditingPaymentId(tx.id); window.scrollTo({top:0, behavior:'smooth'}); }} className={`${currentTheme.lightBg} ${currentTheme.text} hover:opacity-80 p-2 rounded-lg`}><IconEdit /></button>}<button onClick={() => deletePaymentTx(tx.id)} className="bg-slate-200 text-black hover:bg-slate-300 p-2 rounded-lg"><IconTrash /></button></td></tr>))}</tbody></table></div>
      </div>
    );
  };

  const renderCapitalContent = () => {
    if (loggedAppUser?.role !== 'admin') return null;
    const totalInvested = capitalTx.filter(t => t.type === 'capital_add' && t.currency === settings.currency).reduce((a, t) => a + t.amount, 0) - Math.abs(capitalTx.filter(t => t.type === 'capital_remove' && t.currency === settings.currency).reduce((a, t) => a + t.amount, 0));
    const totalSalesAmount = sales.filter(s => s.currency === settings.currency).reduce((acc, s) => acc + s.price, 0); let totalCostOfSold = 0;
    sales.filter(s => s.currency === settings.currency).forEach(s => { const sItems = s.items || [{ itemName: s.itemName, qty: s.qty, price: s.unitPrice || (s.price/s.qty) }]; sItems.forEach(si => { const pItems = purchases.filter(p => p.currency === settings.currency).flatMap(p => p.items ? p.items.map(pi=>({ ...pi, parentId: p.id })) : [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty) }]).filter(pi => pi.itemName === si.itemName); const totalQty = pItems.reduce((acc, p) => acc + Number(p.qty), 0); const avgCost = totalQty > 0 ? (pItems.reduce((acc, p) => acc + (Number(p.qty) * Number(p.price || p.unitPrice)), 0) / totalQty) : 0; totalCostOfSold += (Number(si.qty) * avgCost); }); });
    const expectedGrossProfit = totalSalesAmount - totalCostOfSold; const totalExpenses = capitalTx.filter(t => t.type === 'expense' && t.currency === settings.currency).reduce((acc, t) => acc + Math.abs(t.amount), 0); const netProfit = expectedGrossProfit - totalExpenses;

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('c_sum')} ({currentCurrency.name})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6"><div className={`${currentTheme.lightBg} p-5 rounded-xl border ${currentTheme.border}`}><p className={`text-sm ${currentTheme.text} font-bold`}>{t('invs')}</p><h3 className={`text-2xl font-bold ${currentTheme.text}`} dir="ltr">{formatMoney(totalInvested)}</h3></div><div className="bg-slate-100 p-5 rounded-xl border border-slate-300"><p className="text-sm text-slate-800 font-bold">{t('n_prf')}</p><h3 className="text-2xl font-bold text-slate-900" dir="ltr">{formatMoney(netProfit)}</h3></div><div className={`${currentTheme.main} p-5 rounded-xl shadow-md`}><p className="text-sm text-white/80 font-bold">{t('t_cap')}</p><h3 className="text-2xl font-bold text-white" dir="ltr">{formatMoney(totalInvested + netProfit)}</h3></div></div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 mb-6"><h3 className="text-xl mb-4 font-bold text-slate-800">{t('c_add')}</h3><form onSubmit={handleCapitalSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end bg-slate-50 p-5 rounded-xl border border-slate-200"><div><label className="block text-sm mb-1 text-slate-700 font-medium">{t('b_typ')}</label><select name="type" className={inpCls}><option value="expense">{t('exp')}</option><option value="add">{t('c_add')}</option><option value="remove">{t('c_rem')}</option></select></div><div className="lg:col-span-2 flex gap-2"><div className="flex-1"><label className="block text-sm mb-1 text-slate-700 font-medium">{t('amt')}</label><input required type="number" step="any" name="amount" className={inpCls} /></div><div><label className="block text-sm mb-1 text-slate-700 font-medium">{t('cur')}</label><select name="currency" defaultValue={settings.currency} className={inpCls}>{Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div></div><div><label className="block text-sm mb-1 text-slate-700 font-medium">{t('rsn')}</label><input required name="reason" className={inpCls} /></div><div className="lg:col-span-2 flex gap-2 items-end"><div className="flex-1"><label className="block text-sm mb-1 text-slate-700 font-medium">{t('not')}</label><input name="note" className={inpCls} /></div><button type="submit" className={`${currentTheme.main} ${currentTheme.hover} text-white p-2.5 px-6 rounded-lg font-bold`}>{t('sav')}</button></div></form></div>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-slate-200"><h3 className="p-4 bg-slate-50 font-bold border-b border-slate-200 text-slate-800">{t('l_tx')}</h3><table className="w-full text-right min-w-[800px]"><thead className="bg-slate-50 border-b border-slate-200 text-slate-600"><tr>{[t('r_no'),t('dat'),t('b_typ'),t('not'),t('amt')].map((h, i)=><th key={i} className="p-4">{h}</th>)}</tr></thead><tbody>{[...capitalTx].reverse().map(tx => (<tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-4 font-bold text-slate-400">{tx.receiptNo || '-'}</td><td className="p-4 text-slate-500" dir="ltr">{tx.date}</td><td className="p-4">{tx.type === 'expense' ? t('exp') : (tx.type === 'capital_add' ? t('c_add') : (tx.type === 'capital_remove' ? t('c_rem') : tx.desc.split(':')[0]))}</td><td className="p-4 text-slate-700">{tx.desc} {tx.note && <span className="text-slate-500">({tx.note})</span>}</td><td className="p-4 font-bold" dir="ltr"><span className={tx.amount > 0 ? 'text-blue-600' : 'text-rose-600'}>{formatMoney(tx.amount, tx.currency)}</span></td></tr>))}</tbody></table></div>
      </div>
    );
  };

  const [reportTab, setReportTab] = useState('active_accounts');
  const [statementFilter, setStatementFilter] = useState({ name: '', dateFrom: '', dateTo: '' });
  const [itemReportFilter, setItemReportFilter] = useState({ name: '', dateFrom: '', dateTo: '' });

  useEffect(() => {
     if(!hasPermission('installment_ops') && (reportTab === 'active_accounts' || reportTab === 'late')) {
        setReportTab('agents_all');
     }
  }, [loggedAppUser, reportTab]);

  const renderReports = () => {
    const today = getToday();
    const activeAccounts = sales.filter(s => s.saleType === 'installment').map(s => ({ ...s, paid: getSalePaidAmount(s.id), balance: s.price - getSalePaidAmount(s.id) })).filter(s => s.balance > 0);
    const lateAccounts = sales.filter(s => s.saleType === 'installment').map(s => { const paid = getSalePaidAmount(s.id); let expectedToPay = s.advance; s.installments?.forEach(inst => { if (inst.dueDate <= today) expectedToPay += inst.amount; }); const arrears = Math.max(0, expectedToPay - paid); return { ...s, paid, balance: s.price - paid, arrears }; }).filter(s => s.arrears > 0);
    const overdueAgents = sales.filter(s => (s.saleType === 'credit' || s.saleType === 'credit_agent' || s.saleType === 'credit_company') && s.dueDate < today && (s.price - getSalePaidAmount(s.id)) > 0).map(s => ({ ...s, paid: getSalePaidAmount(s.id), balance: s.price - getSalePaidAmount(s.id) }));
    const agentsStatus = agents.map(a => ({ ...a, debt: getAgentDebt(a.id, settings.currency) })).sort((a,b) => b.debt - a.debt);
    const companiesStatus = companies.map(c => ({ ...c, debt: getCompanyDebt(c.id, settings.currency) })).sort((a,b) => b.debt - a.debt);
    const officesStatus = offices.map(o => ({ ...o, debt: getOfficeDebt(o.id, settings.currency) })).sort((a,b) => b.debt - a.debt);
    const totalCompanyDebt = companiesStatus.reduce((acc, c) => acc + c.debt, 0); const totalOfficesDebt = officesStatus.reduce((acc, o) => acc + o.debt, 0);

    const printTable = (title, tableId) => printContent(title, '', document.getElementById(tableId).outerHTML, STORE_NAME, '', false); 

    const generateItemReport = () => {
      let allSaleItems = []; sales.filter(s => s.currency === settings.currency).forEach(s => { const items = s.items || [{ itemName: s.itemName, qty: s.qty, unitPrice: s.unitPrice || (s.price/s.qty) }]; items.forEach(i => { allSaleItems.push({ id: s.id, receiptNo: s.receiptNo, date: s.date, saleType: s.saleType, itemName: i.itemName, qty: Number(i.qty), price: Number(i.qty) * Number(i.unitPrice) }); }); });
      let filteredSales = allSaleItems; if (itemReportFilter.name) filteredSales = filteredSales.filter(s => s.itemName === itemReportFilter.name); if (itemReportFilter.dateFrom) filteredSales = filteredSales.filter(s => s.date >= itemReportFilter.dateFrom); if (itemReportFilter.dateTo) filteredSales = filteredSales.filter(s => s.date <= itemReportFilter.dateTo);
      let tQty = 0; let tSales = 0; let tCost = 0; const allPurchaseItems = purchases.filter(p => p.currency === settings.currency).flatMap(p => p.items ? p.items.map(pi=>({...pi, pType: p.paymentType})) : [{ itemName: p.itemName, qty: p.qty, price: p.unitPrice || (p.total/p.qty), pType: p.paymentType }]);
      const rows = filteredSales.map(s => { const pItems = allPurchaseItems.filter(p => p.itemName === s.itemName); const totalPQty = pItems.reduce((acc, p) => acc + Number(p.qty), 0); const avgC = totalPQty > 0 ? (pItems.reduce((acc, p) => acc + (Number(p.qty) * Number(p.price || p.unitPrice)), 0) / totalPQty) : 0; const cost = avgC * s.qty; const profit = s.price - cost; tQty += s.qty; tSales += s.price; tCost += cost; return { ...s, avgCost: avgC, totalCost: cost, profit }; });
      return { rows, tQty, tSales, tCost, tProfit: tSales - tCost };
    };
    const itemPerf = generateItemReport();

    const generateStatementData = () => {
      let entries = []; const searchTarget = statementFilter.name.trim(); if (!searchTarget) return { entries: [], name: '', isResolved: false, currency: settings.currency };
      let matchedName = searchTarget; let isCompany = companies.some(c => c.name === matchedName); let isAgent = agents.some(a => a.name === matchedName); let isCustomer = sales.some(s => s.customerName === matchedName && s.saleType !== 'credit' && s.saleType !== 'credit_agent' && s.saleType !== 'credit_company'); let isOffice = offices.some(o => o.name === matchedName);
      if (!isCompany && !isCustomer && !isAgent && !isOffice) { const comp = companies.find(c => c.phone === searchTarget); if (comp) { matchedName = comp.name; isCompany = true; } else { const ag = agents.find(a => a.phone === searchTarget); if (ag) { matchedName = ag.name; isAgent = true; } else { const cust = sales.find(s => s.phone === searchTarget || String(s.receiptNo) === searchTarget); if (cust) { matchedName = cust.customerName; isCustomer = true; } else { const off = offices.find(o => o.phone === searchTarget); if (off) { matchedName = off.name; isOffice = true; } } } } }

      if (isCompany) {
        purchases.filter(p => p.companyName === matchedName && p.paymentType === 'debt' && (p.currency || settings.currency) === settings.currency).forEach(p => entries.push({ date: p.date, id: p.id, type: t('dbt'), desc: `کاڵا: ${(p.items || [{ itemName: p.itemName }]).map(i=>i.itemName).join('، ')}`, note: p.note, debit: 0, credit: p.total, receiptNo: p.receiptNo }));
        sales.filter(s => s.customerName === matchedName && s.saleType === 'credit_company' && (s.currency || settings.currency) === settings.currency).forEach(s => entries.push({ date: s.date, id: s.id, type: t('sal'), desc: `کاڵا: ${(s.items || [{ itemName: s.itemName }]).map(i=>i.itemName).join('، ')}`, note: s.note, debit: s.price, credit: 0, receiptNo: s.receiptNo }));
        const compId = companies.find(c => c.name === matchedName)?.id;
        capitalTx.filter(tx => tx.type === 'pay_company_debt' && tx.refId === compId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: t('pay'), desc: t('p_p_cmp'), note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo }));
        capitalTx.filter(tx => tx.type === 'receive_company_payment' && tx.refId === compId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: t('p_rec'), desc: t('p_r_cmp'), note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo }));
      } else if (isCustomer || isAgent) {
        sales.filter(s => s.customerName === matchedName && (s.currency || settings.currency) === settings.currency).forEach(s => entries.push({ date: s.date, id: s.id, type: s.saleType === 'cash' ? t('csh') : (s.saleType === 'credit' || s.saleType === 'credit_agent' ? t('dbt') : t('ins')), desc: `کاڵا: ${(s.items || [{ itemName: s.itemName }]).map(i=>i.itemName).join('، ')}`, note: s.note, debit: s.price, credit: s.saleType === 'cash' ? s.price : 0, receiptNo: s.receiptNo }));
        const saleIds = sales.filter(s => s.customerName === matchedName).map(s => s.id); const agentId = agents.find(a => a.name === matchedName)?.id;
        capitalTx.filter(tx => (tx.type === 'receive_installment' || tx.type === 'sale_advance') && saleIds.includes(tx.refId) && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: tx.type.includes('advance') ? t('adv') : t('p_rec'), desc: t('p_rec'), note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo }));
        if(agentId) {
            capitalTx.filter(tx => tx.type === 'receive_agent_payment' && tx.refId === agentId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: t('p_rec'), desc: t('p_r_agt'), note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo }));
            capitalTx.filter(tx => tx.type === 'pay_agent_payment' && tx.refId === agentId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: t('pay'), desc: t('p_p_agt'), note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo }));
            purchases.filter(p => p.companyId === agentId && p.paymentType === 'debt' && (p.currency || settings.currency) === settings.currency).forEach(p => entries.push({ date: p.date, id: p.id, type: t('pur'), desc: `کاڵا: ${(p.items || [{ itemName: p.itemName }]).map(i=>i.itemName).join('، ')}`, note: p.note, debit: 0, credit: p.total, receiptNo: p.receiptNo }));
        }
      } else if (isOffice) {
         const officeId = offices.find(o => o.name === matchedName)?.id;
         if (officeId) {
             capitalTx.filter(tx => tx.type === 'receive_office_loan' && tx.refId === officeId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: t('p_rec'), desc: tx.desc, note: tx.note, debit: 0, credit: Math.abs(tx.amount), receiptNo: tx.receiptNo }));
             capitalTx.filter(tx => tx.type === 'pay_office_debt' && tx.refId === officeId && (tx.currency || settings.currency) === settings.currency).forEach(tx => entries.push({ date: tx.date, id: tx.id, type: t('pay'), desc: t('p_p_off'), note: tx.note, debit: Math.abs(tx.amount), credit: 0, receiptNo: tx.receiptNo }));
         }
      }

      if (statementFilter.dateFrom) entries = entries.filter(e => e.date >= statementFilter.dateFrom); if (statementFilter.dateTo) entries = entries.filter(e => e.date <= statementFilter.dateTo);
      entries.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)); let runningBalance = 0;
      entries = entries.map(e => { runningBalance += (isCompany || isOffice) ? (e.credit - e.debit) : (e.debit - e.credit); return { ...e, balance: runningBalance }; });
      return { entries, name: matchedName, isResolved: isCompany || isCustomer || isAgent || isOffice, currency: settings.currency };
    };

    const statementResult = generateStatementData(); const finalBalance = statementResult.entries.length > 0 ? statementResult.entries[statementResult.entries.length - 1].balance : 0;
    const allCustomersAndAgents = Array.from(new Set([...sales.filter(s=> (s.currency||settings.currency)===settings.currency).map(s => s.customerName), ...agents.map(a=>a.name)]));

    const generateCashboxStatement = () => {
       let entries = [...capitalTx].filter(t => (t.currency || settings.currency) === settings.currency && VALID_CASH_TYPES.includes(t.type));
       if (statementFilter.dateFrom) entries = entries.filter(e => e.date >= statementFilter.dateFrom); if (statementFilter.dateTo) entries = entries.filter(e => e.date <= statementFilter.dateTo);
       entries.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)); let runningBalance = 0;
       return entries.map(e => { let am = e.type === 'receive_office_loan' ? 0 : e.amount; runningBalance += am; return { ...e, balance: runningBalance, realAmount: am }; }).filter(e => e.realAmount !== 0);
    };
    const cashboxEntries = generateCashboxStatement(); const cashboxFinalBalance = cashboxEntries.length > 0 ? cashboxEntries[cashboxEntries.length - 1].balance : 0;

    return (
      <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_reports')} <span className="text-sm font-normal text-slate-500">({currentCurrency.name})</span></h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {[...(hasPermission('installment_ops') ? [{id:'active_accounts', l:t('i_acc')}, {id:'late', l:t('l_ins')}] : []), {id:'agents_all', l:t('m_agents')}, {id:'agents_late', l:t('l_dbt')}, {id:'companies', l:t('m_companies')}, {id:'offices', l:t('m_offices')}, ...(hasPermission('capital') ? [{id:'item_perf', l:t('n_prf')}, {id:'cashbox', l:t('c_box')}] : []), {id:'statement', l:t('stm')}].map(b => (
             <button key={b.id} onClick={() => setReportTab(b.id)} className={`px-4 py-2.5 rounded-lg font-semibold transition-colors ${reportTab===b.id?`${b.id==='statement'?'bg-blue-600':currentTheme.main} text-white shadow-md`:'bg-white text-slate-700 border hover:bg-slate-50'}`}>{b.l}</button>
          ))}
        </div>

        {reportTab === 'cashbox' && hasPermission('capital') && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${currentTheme.lightBg} p-4 md:p-5 rounded-xl border ${currentTheme.border}`}>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">{t('dat')} لە</label><input type="date" value={statementFilter.dateFrom} onChange={e=>setStatementFilter({...statementFilter, dateFrom: e.target.value})} className={inpCls} /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">{t('dat')} بۆ</label><input type="date" value={statementFilter.dateTo} onChange={e=>setStatementFilter({...statementFilter, dateTo: e.target.value})} className={inpCls} /></div>
            </div>
            <button onClick={() => printTable(`${t('c_box')} (${currentCurrency.name})`, 'print-cashbox-area')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200"><IconPrinter/> {t('prt')}</button>
            <div id="print-cashbox-area" className="overflow-x-auto">
              <div className="mb-4 text-center"><h3 className="text-xl font-bold text-slate-800">{t('c_box')} <span className="text-sm">({currentCurrency.name})</span></h3></div>
              <div className={`${currentTheme.main} text-white p-4 rounded-xl mb-4 flex justify-between items-center`}><span className="font-bold">بڕی پارەی ناو سندوق (لەم ماوەیەدا):</span><span className="font-black text-2xl" dir="ltr">{formatMoney(cashboxFinalBalance)}</span></div>
              <table className="w-full text-right border border-slate-200 text-sm min-w-[700px]"><thead className="bg-slate-50"><tr>{[t('r_no'),t('dat'),t('b_typ'),t('not'),'+','-',t('bal')].map((h, i)=><th key={i} className={`p-3 border ${h===t('bal')?currentTheme.lightBg:''}`}>{h}</th>)}</tr></thead><tbody>{cashboxEntries.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">{t('no_tx')}</td></tr>}{cashboxEntries.map((e, idx) => (<tr key={`${e.id}-${idx}`} className="border-b hover:bg-slate-50"><td className="p-3 border text-slate-400 font-bold">{e.receiptNo || '-'}</td><td className="p-3 border text-slate-500" dir="ltr">{e.date}</td><td className="p-3 border font-medium">{e.type}</td><td className="p-3 border">{e.desc} {e.note && <span className="text-slate-400 text-xs mr-2">({e.note})</span>}</td><td className="p-3 border font-bold text-blue-600" dir="ltr">{e.realAmount > 0 ? formatMoney(e.realAmount) : '-'}</td><td className="p-3 border font-bold text-rose-600" dir="ltr">{e.realAmount < 0 ? formatMoney(Math.abs(e.realAmount)) : '-'}</td><td className={`p-3 border font-bold ${currentTheme.lightBg} opacity-80`} dir="ltr">{formatMoney(e.balance)}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {reportTab === 'companies' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200"><button onClick={() => printTable(`${t('m_companies')} (${currentCurrency.name})`, 'tbl-companies')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> {t('prt')}</button><div id="tbl-companies" className="overflow-x-auto"><div className={`${currentTheme.lightBg} border ${currentTheme.border} p-4 rounded-xl mb-4`}><h3 className={`text-lg font-bold ${currentTheme.text}`}>کۆی گشتی قەرزی کۆمپانیاکان: <span dir="ltr" className="text-xl md:text-2xl">${formatMoney(totalCompanyDebt)}</span></h3></div><table className={`w-full text-right border ${currentTheme.border} min-w-[500px]`}><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{[t('nam'),t('phn'),t('adr'),t('rem_d')].map((h, i)=><th key={i} className={`p-3 border ${currentTheme.border}`}>{h}</th>)}</tr></thead><tbody>{companiesStatus.map(c => (<tr key={c.id} className="border-b border-slate-200"><td className={`p-3 border ${currentTheme.border} font-semibold`}>{c.name}</td><td className={`p-3 border ${currentTheme.border}`}>{c.phone}</td><td className={`p-3 border ${currentTheme.border}`}>${c.address}</td><td className={`p-3 border ${currentTheme.border} font-bold`} dir="ltr">{c.debt > 0 ? <span className="text-rose-600">{t('ow_u')} {formatMoney(c.debt)}</span> : c.debt < 0 ? <span className="text-blue-600">{t('w_ow')} {formatMoney(Math.abs(c.debt))}</span> : <span className="text-slate-500">{formatMoney(0)}</span>}</td></tr>))}</tbody></table></div></div>
        )}

        {reportTab === 'offices' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200"><button onClick={() => printTable(`${t('m_offices')} (${currentCurrency.name})`, 'tbl-offices')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> {t('prt')}</button><div id="tbl-offices" className="overflow-x-auto"><div className={`${currentTheme.lightBg} border ${currentTheme.border} p-4 rounded-xl mb-4`}><h3 className={`text-lg font-bold ${currentTheme.text}`}>کۆی گشتی قەرزی نوسینگەکان: <span dir="ltr" className="text-xl md:text-2xl">{formatMoney(totalOfficesDebt)}</span></h3></div><table className={`w-full text-right border ${currentTheme.border} min-w-[500px]`}><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{[t('nam'),t('phn'),t('adr'),'قەرز لەسەرمان'].map((h, i)=><th key={i} className={`p-3 border ${currentTheme.border}`}>{h}</th>)}</tr></thead><tbody>{officesStatus.map(o => (<tr key={o.id} className="border-b border-slate-200"><td className={`p-3 border ${currentTheme.border} font-semibold`}>{o.name}</td><td className={`p-3 border ${currentTheme.border}`}>{o.phone}</td><td className={`p-3 border ${currentTheme.border}`}>${o.address}</td><td className={`p-3 border ${currentTheme.border} text-rose-600 font-bold bg-rose-50/50`} dir="ltr">{formatMoney(o.debt)}</td></tr>))}</tbody></table></div></div>
        )}

        {reportTab === 'item_perf' && hasPermission('capital') && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200">
               <div><label className="block text-sm mb-1 font-bold text-slate-700">{t('i_nam')}</label><select value={itemReportFilter.name} onChange={e=>setItemReportFilter({...itemReportFilter, name: e.target.value})} className={inpCls}><option value="">({t('pl_sel')})</option>{definedItems.map(i => <option key={i.id} value={i.name}>{i.brand} - {i.name}</option>)}</select></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">{t('dat')} لە</label><input type="date" value={itemReportFilter.dateFrom} onChange={e=>setItemReportFilter({...itemReportFilter, dateFrom: e.target.value})} className={inpCls} /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">{t('dat')} بۆ</label><input type="date" value={itemReportFilter.dateTo} onChange={e=>setItemReportFilter({...itemReportFilter, dateTo: e.target.value})} className={inpCls} /></div>
            </div>
            <button onClick={() => printTable(`ڕاپۆرتی قازانجی کاڵاکان (${currentCurrency.name})`, 'tbl-item-perf')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200"><IconPrinter/> {t('prt')}</button>
            <div id="tbl-item-perf" className="overflow-x-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 min-w-[600px]"><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-sm text-slate-500 mb-1">کۆی فرۆشراو (دانە)</p><h3 className="text-xl md:text-2xl font-bold text-slate-800">{itemPerf.tQty}</h3></div><div className="bg-blue-50 p-4 rounded-xl border border-blue-200"><p className="text-sm text-blue-800 mb-1">کۆی داهاتی فرۆشتن</p><h3 className="text-xl md:text-2xl font-bold text-blue-600" dir="ltr">{formatMoney(itemPerf.tSales)}</h3></div><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-sm text-slate-500 mb-1">کۆی تێچووی کاڵاکان</p><h3 className="text-xl md:text-2xl font-bold text-slate-800" dir="ltr">{formatMoney(itemPerf.tCost)}</h3></div><div className={`${currentTheme.lightBg} p-4 rounded-xl border ${currentTheme.border}`}><p className={`text-sm ${currentTheme.text} mb-1`}>پوختەی قازانج</p><h3 className={`text-xl md:text-2xl font-bold ${itemPerf.tProfit >= 0 ? currentTheme.text : 'text-rose-600'}`} dir="ltr">{formatMoney(itemPerf.tProfit)}</h3></div></div>
              <table className="w-full text-right border border-slate-200 text-sm min-w-[700px]"><thead className="bg-slate-50"><tr>{[t('dat'),t('r_no'),t('i_nam'),t('qty'),t('a_cst'),t('tot'),'قازانج'].map((h, index)=><th key={`h-${index}`} className="p-3 border">{h}</th>)}</tr></thead><tbody>{itemPerf.rows.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">{t('no_tx')}</td></tr>}{itemPerf.rows.map((r, index) => (<tr key={`r-${r.id}-${r.itemName}-${index}`} className="border-b hover:bg-slate-50"><td className="p-3 border text-slate-500" dir="ltr">{r.date}</td><td className="p-3 border font-medium text-slate-700">{r.saleType === 'cash' ? t('csh') : (r.saleType.includes('credit') ? t('dbt') : t('ins'))} | {r.receiptNo}</td><td className="p-3 border font-bold text-slate-900">{r.itemName}</td><td className="p-3 border">{r.qty}</td><td className="p-3 border text-slate-600" dir="ltr">{formatMoney(r.avgCost)}</td><td className="p-3 border font-bold text-blue-600" dir="ltr">{formatMoney(r.price)}</td><td className={`p-3 border font-bold ${r.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`} dir="ltr">{formatMoney(r.profit)}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        {reportTab === 'active_accounts' && hasPermission('installment_ops') && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto"><button onClick={() => printTable(t('i_acc'), 'tbl-active')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> {t('prt')}</button><table id="tbl-active" className="w-full text-right border border-slate-200 min-w-[700px]"><thead className="bg-slate-50"><tr>{[t('c_nam'),t('phn'),t('i_nam'),t('tot'),t('pad'),t('rem_d')].map((h, idx)=><th key={`acth-${idx}`} className="p-3 border">{h}</th>)}</tr></thead><tbody>{activeAccounts.map(s => (<tr key={s.id} className="border-b"><td className="p-3 border font-medium">{s.customerName}</td><td className="p-3 border">{s.phone}</td><td className="p-3 border">{(s.items || [{itemName: s.itemName}]).map(i=>i.itemName).join('، ')}</td><td className="p-3 border" dir="ltr">{formatMoney(s.price, s.currency)}</td><td className="p-3 border text-blue-600" dir="ltr">{formatMoney(s.paid, s.currency)}</td><td className="p-3 border font-bold text-slate-900" dir="ltr">{formatMoney(s.balance, s.currency)}</td></tr>))}</tbody></table></div>
        )}

        {reportTab === 'late' && hasPermission('installment_ops') && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto"><button onClick={() => printTable(t('l_ins'), 'tbl-late')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> {t('prt')}</button><table id="tbl-late" className="w-full text-right border border-rose-200 min-w-[600px]"><thead className="bg-rose-50 text-rose-800"><tr>{[t('c_nam'),t('phn'),t('rem_d'),'بڕی پارەی دواکەوتوو'].map((h, idx)=><th key={`lath-${idx}`} className="p-3 border border-rose-200">{h}</th>)}</tr></thead><tbody>{lateAccounts.map(s => (<tr key={s.id} className="border-b border-rose-100"><td className="p-3 border border-rose-200 font-semibold">{s.customerName}</td><td className="p-3 border border-rose-200">{s.phone}</td><td className="p-3 border border-rose-200" dir="ltr">{formatMoney(s.balance, s.currency)}</td><td className="p-3 border border-rose-200 text-rose-600 font-bold bg-rose-50" dir="ltr">{formatMoney(s.arrears, s.currency)}</td></tr>))}</tbody></table></div>
        )}

        {reportTab === 'agents_all' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto"><button onClick={() => printTable(`${t('m_agents')} (${currentCurrency.name})`, 'tbl-agents')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> {t('prt')}</button><table id="tbl-agents" className={`w-full text-right border ${currentTheme.border} min-w-[600px]`}><thead className={`${currentTheme.lightBg} ${currentTheme.text}`}><tr>{[t('nam'),t('phn'),t('adr'),t('rem_d')].map((h, idx)=><th key={`agth-${idx}`} className={`p-3 border ${currentTheme.border}`}>{h}</th>)}</tr></thead><tbody>{agentsStatus.map(a => (<tr key={a.id} className="border-b border-slate-200"><td className={`p-3 border ${currentTheme.border} font-semibold`}>{a.name}</td><td className={`p-3 border ${currentTheme.border}`}>{a.phone}</td><td className={`p-3 border ${currentTheme.border}`}>${a.address}</td><td className={`p-3 border ${currentTheme.border} text-orange-600 font-bold bg-orange-50/50`} dir="ltr">{formatMoney(a.debt)}</td></tr>))}</tbody></table></div>
        )}

        {reportTab === 'agents_late' && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 overflow-x-auto"><button onClick={() => printTable(t('l_dbt'), 'tbl-agents-late')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium"><IconPrinter/> {t('prt')}</button><table id="tbl-agents-late" className="w-full text-right border border-slate-300 min-w-[600px]"><thead className="bg-slate-100 text-black"><tr>{[t('r_no'),t('nam'),t('phn'),t('dat'),t('rem_d')].map((h, idx)=><th key={`aglth-${idx}`} className="p-3 border border-slate-300">{h}</th>)}</tr></thead><tbody>{overdueAgents.map(s => (<tr key={s.id} className="border-b border-slate-200"><td className="p-3 border border-slate-300 font-bold text-slate-500">{s.receiptNo} <span className="text-xs bg-slate-200 px-1 rounded">{s.saleType === 'credit_company' ? t('m_companies') : t('m_agents')}</span></td><td className="p-3 border border-slate-300 font-semibold">{s.customerName}</td><td className="p-3 border border-slate-300">{s.phone}</td><td className="p-3 border border-slate-300 text-black font-bold" dir="ltr">{s.dueDate}</td><td className="p-3 border border-slate-300 text-rose-600 font-bold bg-rose-50" dir="ltr">{formatMoney(s.balance, s.currency)}</td></tr>))}</tbody></table></div>
        )}

        {reportTab === 'statement' && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-slate-200">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${currentTheme.lightBg} p-4 md:p-5 rounded-xl border ${currentTheme.border}`}>
               <div><label className={`block text-sm mb-1 font-bold ${currentTheme.text}`}>{t('src')}</label><div className="flex gap-2"><input type="text" value={statementFilter.name} onChange={e => setStatementFilter({...statementFilter, name: e.target.value})} placeholder="..." className={inpCls}/><select value="" onChange={e => { if(e.target.value) setStatementFilter({...statementFilter, name: e.target.value}) }} className={`w-12 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:${currentTheme.border} cursor-pointer appearance-none text-center font-bold`}><option value="" disabled>▼</option>{companies.length > 0 && <optgroup label={t('m_companies')}>{companies.map(c => <option key={`dl-comp-${c.id}`} value={c.name}>{c.name}</option>)}</optgroup>}{offices.length > 0 && <optgroup label={t('m_offices')}>{offices.map(o => <option key={`dl-off-${o.id}`} value={o.name}>{o.name}</option>)}</optgroup>}{allCustomersAndAgents.length > 0 && <optgroup label="بریکار و کڕیارەکان">{allCustomersAndAgents.map((name, i) => <option key={`dl-all-${i}`} value={name}>{name}</option>)}</optgroup>}</select></div></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">{t('dat')} لە</label><input type="date" value={statementFilter.dateFrom} onChange={e=>setStatementFilter({...statementFilter, dateFrom: e.target.value})} className={inpCls} /></div>
               <div><label className="block text-sm mb-1 font-semibold text-slate-700">{t('dat')} بۆ</label><input type="date" value={statementFilter.dateTo} onChange={e=>setStatementFilter({...statementFilter, dateTo: e.target.value})} className={inpCls} /></div>
            </div>
            {statementResult.isResolved && (
              <div className="overflow-x-auto"><button onClick={() => printTable(`کەشف حسابی: ${statementResult.name} (${statementResult.currency})`, 'print-statement-area')} className="mb-4 bg-slate-100 px-4 py-2 rounded-lg flex gap-2 font-medium hover:bg-slate-200"><IconPrinter/> چاپکردن</button><div id="print-statement-area"><div className="mb-4 text-center"><h3 className="text-xl font-bold text-slate-800">کەشف حسابی: <span className="text-blue-600">{statementResult.name}</span> <span className="text-sm text-slate-500">({statementResult.currency})</span></h3></div><table className="w-full text-right border border-slate-200 text-sm min-w-[700px]"><thead className="bg-slate-50"><tr>{[t('r_no'),t('dat'),t('typ'),t('not'),'قەرز (لەسەری)','پێدان (دراو)',t('bal')].map((h, idx)=><th key={`stth-${idx}`} className="p-3 border">{h}</th>)}</tr></thead><tbody>{statementResult.entries.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-slate-500">{t('no_tx')}</td></tr>}{statementResult.entries.map((e, idx) => (<tr key={`${e.id}-${idx}`} className="border-b hover:bg-slate-50"><td className="p-3 border text-slate-400 font-bold">{e.receiptNo || '-'}</td><td className="p-3 border text-slate-500" dir="ltr">{e.date}</td><td className="p-3 border font-medium">{e.type}</td><td className="p-3 border">{e.desc} {e.note && <span className="text-slate-400 text-xs mr-2">({e.note})</span>}</td><td className="p-3 border font-bold text-slate-900" dir="ltr">{e.debit > 0 ? formatMoney(e.debit) : '-'}</td><td className="p-3 border font-bold text-blue-600" dir="ltr">{e.credit > 0 ? formatMoney(e.credit) : '-'}</td><td className={`p-3 border font-bold bg-blue-50/50`} dir="ltr">{formatMoney(e.balance)}</td></tr>))}</tbody></table><div style={{marginTop:'24px',padding:'16px',backgroundColor:'#f8fafc',borderRadius:'8px',border:'2px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'18px',fontWeight:'bold'}}><span style={{color:'#0f172a'}}>کۆتا حسابی ماوە:</span><span dir="ltr" style={{color:'#000',fontSize:'22px'}}>{formatMoney(finalBalance)}</span></div></div></div>
            )}
            {!statementResult.isResolved && statementFilter.name && <div className="p-8 text-center text-black border border-dashed border-slate-300 rounded-xl bg-slate-50">هیچ حسابێک نەدۆزرایەوە بەم ناوە.</div>}
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
      if (loggedAppUser?.role !== 'admin') return null;
      return (
         <div className="space-y-6"><h2 className="text-2xl font-bold text-slate-800">{t('m_settings')}</h2>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
               <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label className="block text-sm mb-1 text-slate-700 font-bold">{t('phn')}</label><input required name="storePhone" defaultValue={settings.storePhone} className={inpCls} dir="ltr" /></div><div><label className="block text-sm mb-1 text-slate-700 font-bold">{t('adr')}</label><input required name="storeAddress" defaultValue={settings.storeAddress} className={inpCls} /></div></div>
                  <div className="grid grid-cols-1 gap-5"><div><label className="block text-sm mb-1 text-slate-700 font-bold">لینک (URL) ی واژۆ</label><input name="signatureUrl" defaultValue={settings.signatureUrl} className={inpCls} dir="ltr" /><p className="text-xs text-slate-500 mt-1">بۆ پیشاندانی واژۆ لە کاتی چاپکردندا.</p></div></div>
                  <div><label className="block text-sm mb-2 text-slate-700 font-bold">ڕەنگی سەرەکی سیستم</label><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">{Object.entries(THEMES).map(([key, themeObj]) => (<label key={key} className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col items-center gap-2 ${settings.themeKey === key ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" name="themeKey" value={key} defaultChecked={settings.themeKey === key} className="hidden" /><div className={`w-8 h-8 rounded-full ${themeObj.main} shadow-sm border border-slate-300`}></div><span className="text-xs font-bold text-center text-slate-700">{themeObj.name}</span></label>))}</div></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div><label className="block text-sm mb-2 text-slate-700 font-bold">{t('f_sz')}</label><select name="fontSize" defaultValue={settings.fontSize} className={inpCls}><option value="text-sm">بچووک (Small)</option><option value="text-base">مامناوەند (Medium)</option><option value="text-lg">گەورە (Large)</option></select></div>
                      <div><label className="block text-sm mb-2 text-slate-700 font-bold">{t('s_cur')}</label><select name="currency" defaultValue={settings.currency} className={inpCls}>{Object.values(CURRENCIES).map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}</select></div>
                      <div><label className="block text-sm mb-2 text-slate-700 font-bold">{t('s_lng')}</label><select name="language" defaultValue={settings.language || 'KU'} className={inpCls}>{Object.keys(LANGUAGES).map(l => <option key={l} value={l}>{LANGUAGES[l].label}</option>)}</select></div>
                  </div>
                  <div className="pt-4 border-t border-slate-200"><button type="submit" className={`${currentTheme.main} ${currentTheme.hover} text-white px-8 py-3 rounded-xl font-bold shadow-md`}>{t('sav')}</button></div>
               </form>
            </div>
         </div>
      );
  };

  if (!user) return (<div className="flex h-screen items-center justify-center bg-slate-900 text-emerald-400 font-bold text-xl" dir="rtl"><div className="flex flex-col items-center gap-4"><svg className="animate-spin h-10 w-10 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p>چاوەڕێ بکە...</p></div></div>);

  if (!isLogged) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${currentTheme.sidebar} p-4`} dir={LANGUAGES[settings.language]?.dir||'rtl'} style={{fontFamily: "'Calibri', sans-serif"}}>
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200">
          <div className="flex flex-col items-center mb-8"><h1 className={`text-3xl font-black ${currentTheme.text} text-center`}>{STORE_NAME}</h1><p className="text-center text-slate-500 mt-2">{t('login_title')}</p></div>
          {showForgot ? (
            <div>
              <p className="text-center text-slate-500 mb-6 text-sm">{t('rec_key_pl')}</p>
              {!recoveredData ? (
                <form onSubmit={handleRecover} className="space-y-4">
                  <input type="password" value={recoveryKey} onChange={e => setRecoveryKey(e.target.value)} placeholder="..." className={`w-full border border-slate-300 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:${currentTheme.border} text-center bg-slate-50 text-slate-900`} dir="ltr"/>
                  {loginError && <p className="text-rose-500 text-sm font-medium text-center">{loginError}</p>}
                  <button type="submit" className={`w-full ${currentTheme.main} ${currentTheme.hover} text-white font-bold py-3 rounded-xl transition-colors`}>{t('rec_btn')}</button>
                  <div className="border-t border-slate-200 my-4 pt-4 text-center"><button type="button" onClick={requestPasswordViaWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-3 rounded-xl mb-2 transition-colors">{t('req_wa_btn')}</button><button type="button" onClick={() => {setShowForgot(false); setLoginError('');}} className="w-full text-slate-500 hover:text-slate-800 text-sm mt-2 font-medium">{t('back_btn')}</button></div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto space-y-3">{recoveredData.map((ru, i) => (<div key={i} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-left" dir="ltr"><p className="text-xs text-slate-400 mb-1">Role: {ru.role}</p><p className="font-bold text-slate-800">User: <span className={currentTheme.text}>{ru.username}</span></p><p className="font-bold text-slate-800">Pass: <span className="text-rose-500">{ru.password}</span></p></div>))}</div>
                  <button type="button" onClick={() => {setShowForgot(false); setRecoveredData(null); setRecoveryKey('');}} className={`w-full ${currentTheme.main} ${currentTheme.hover} text-white font-bold py-3 rounded-xl transition-colors`}>{t('back_btn')}</button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">{t('user_n')}</label><input type="text" value={loginForm.user} onChange={(e) => setLoginForm({...loginForm, user: e.target.value})} className={`w-full border border-slate-300 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:${currentTheme.border} bg-slate-50 text-slate-900 text-left`} dir="ltr"/></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">{t('pass_w')}</label><input type="password" value={loginForm.pass} onChange={(e) => setLoginForm({...loginForm, pass: e.target.value})} className={`w-full border border-slate-300 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:${currentTheme.border} bg-slate-50 text-slate-900 text-left`} dir="ltr"/></div>
              {loginError && <p className="text-rose-500 bg-rose-50 border border-rose-100 p-3 rounded-lg text-sm text-center font-medium">{loginError}</p>}
              <button type="submit" className={`w-full ${currentTheme.main} ${currentTheme.hover} text-white font-bold text-lg py-3 rounded-xl shadow-md transition-colors mt-2`}>{t('login_btn')}</button>
              <div className="text-center mt-4"><button type="button" onClick={() => setShowForgot(true)} className={`text-sm text-slate-500 font-medium hover:${currentTheme.text} transition-colors`}>{t('forgot_btn')}</button></div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden ${settings.fontSize}`} dir={LANGUAGES[settings.language]?.dir || 'rtl'} style={{fontFamily: "'Calibri', sans-serif"}}>
      <div className={`${currentTheme.sidebar} text-white p-4 flex justify-between items-center shadow-md z-20 md:hidden`}>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 ${currentTheme.sidebarHover} rounded-lg`}><IconMenu /></button>
        <div className="flex items-center gap-3"><h1 className={`text-lg font-black ${currentTheme.iconText}`}>{STORE_NAME}</h1></div>
      </div>
      {isMobileMenuOpen && <div className="md:hidden fixed inset-0 bg-slate-900/50 z-40" onClick={() => setIsMobileMenuOpen(false)}></div>}
      <div className={`fixed inset-y-0 ${LANGUAGES[settings.language]?.dir === 'rtl' ? 'right-0 md:border-l' : 'left-0 md:border-r'} transform ${isMobileMenuOpen ? 'translate-x-0' : (LANGUAGES[settings.language]?.dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-full md:w-64 ${currentTheme.sidebar} text-white flex flex-col shadow-2xl z-50 ${currentTheme.border}`}>
        <div className="p-6 text-center border-b border-white/10 relative">
          <button onClick={() => setIsMobileMenuOpen(false)} className={`md:hidden absolute top-4 ${LANGUAGES[settings.language]?.dir === 'rtl' ? 'left-4' : 'right-4'} text-white/50 hover:text-white`}><IconX /></button>
          <div className="mb-4">{STORE_LOGO ? <img src={STORE_LOGO} alt="Logo" className="w-24 h-24 mx-auto object-contain bg-white/5 p-2 rounded-2xl" /> : <div className="w-24 h-24 mx-auto bg-white/10 rounded-2xl flex items-center justify-center"><IconHome size={40} /></div>}</div>
          <h1 className={`text-2xl font-black ${currentTheme.iconText}`}>{STORE_NAME}</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2 text-sm md:text-base">
          {MODULES_LIST.filter(m => hasPermission(m.id)).map(item => {
             const IconComponent = item.ic;
             if(item.id === 'inventory_print_price' || item.id === 'installment_ops') return null;

             return (
              <button key={item.id} onClick={() => { setView(item.id); setEditingId(null); setEditingPaymentId(null); setViewingInstallments(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold ${view === item.id ? `${currentTheme.main} text-white shadow-md` : `text-slate-300 ${currentTheme.sidebarHover}`}`}><span className={view === item.id ? 'text-white' : currentTheme.iconText}><IconComponent /></span> <span>{t(item.k)}</span></button>
             )
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
           <div className="flex items-center gap-3 text-slate-300 mb-3"><div className="bg-white/10 p-2 rounded-full"><IconUser /></div><div><p className="text-xs text-white/50">{t('lgi')}</p><p className={`font-bold text-sm ${currentTheme.iconText}`} dir="ltr">{loggedAppUser?.username}</p></div></div>
           <button onClick={() => {setIsLogged(false); setLoggedAppUser(null); setLoginForm({user:'', pass:''}); setIsMobileMenuOpen(false); logAction('Logout'); }} className="w-full bg-rose-500/10 text-rose-400 py-2 rounded-lg text-sm border border-rose-500/20 transition-colors">{t('lgo')}</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
        <div className="max-w-6xl mx-auto pb-20 md:pb-0">
          {view === 'dashboard' && hasPermission('dashboard') && renderDashboard()}
          {view === 'items' && hasPermission('items') && renderDefinedItems()}
          {view === 'agents' && hasPermission('agents') && renderAgents()}
          {view === 'offices' && hasPermission('offices') && renderOffices()}
          {view === 'companies' && hasPermission('companies') && renderCompanies()}
          {view === 'purchases' && hasPermission('purchases') && renderPurchases()}
          {view === 'inventory' && hasPermission('inventory') && renderInventory()}
          {view === 'sales' && hasPermission('sales') && renderSales()}
          {view === 'payments' && hasPermission('payments') && renderPayments()}
          {view === 'capital' && hasPermission('capital') && renderCapitalContent()}
          {view === 'reports' && hasPermission('reports') && renderReports()}
          {view === 'users' && hasPermission('users') && renderUsers()}
          {view === 'settings' && hasPermission('settings') && renderSettings()}
        </div>
      </div>
      
      {viewingDocuments && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-3"><IconDocs/> {t('dcs')}: {viewingDocuments.customerName}</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-2">
              {DOC_TYPES.map(dName => {
                const docItem = selectedDocs.find(d => d.name === dName); const isSelected = !!docItem; const isUploading = uploadingDoc === dName;
                return (
                  <div key={dName} className={`flex items-center justify-between p-3 border rounded-lg ${isSelected ? `${currentTheme.border} ${currentTheme.lightBg}` : 'border-slate-100 hover:bg-slate-50'}`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1"><input type="checkbox" checked={isSelected} onChange={() => handleDocToggle(dName)} className="w-5 h-5" /><span className="font-bold text-slate-700">{dName}</span></label>
                    {isSelected && (<div className="flex items-center gap-2">{isUploading ? (<span className={`text-xs ${currentTheme.text} animate-pulse font-bold`}>...</span>) : docItem.fileUrl ? (<span className={`text-xs font-bold ${currentTheme.text} ${currentTheme.lightBg} px-2 py-1 rounded`}>بەڵێ</span>) : (<label className={`cursor-pointer text-white ${currentTheme.main} ${currentTheme.hover} w-8 h-8 rounded-full flex items-center justify-center shadow-sm`}><IconUpload /><input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, dName)} /></label>)}</div>)}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between items-center mt-6 gap-3 pt-4 border-t">
              <button onClick={() => setViewingDocuments(null)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-slate-800 font-semibold">{t('can')}</button>
              <div className="flex gap-2"><button onClick={() => printDocsReceipt(viewingDocuments, selectedDocs)} className="px-4 py-2.5 bg-blue-50 text-blue-800 rounded-xl font-bold flex items-center gap-1"><IconPrinter/> {t('prt')}</button><button onClick={handleSaveDocs} className={`px-5 py-2.5 ${currentTheme.main} text-white rounded-xl font-bold`}>{t('sav')}</button></div>
            </div>
          </div>
        </div>
      )}

      {modal.show && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">{modal.type === 'confirm' ? '؟' : '!'}</h3>
            <p className="text-lg text-slate-700 mb-8">{modal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModal({show:false, type:'', message:'', onConfirm:null})} className="px-5 py-2.5 bg-slate-100 rounded-xl text-slate-800 font-semibold">{t('can')}</button>
              {modal.type === 'confirm' && (<button onClick={() => { modal.onConfirm(); setModal({show:false, type:'', message:'', onConfirm:null}); }} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold">بەڵێ</button>)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

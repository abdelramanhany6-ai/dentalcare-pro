import {useCallback,useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {useLanguage} from '../context/LanguageContext'
export default function AdminRegistrations(){
 const {t,language}=useLanguage(),locale=language==='ar'?'ar-EG':'en-GB'
 const [requests,setRequests]=useState([]),[clinics,setClinics]=useState([]),[unconfirmed,setUnconfirmed]=useState([]),[deviceRequests,setDeviceRequests]=useState([])
 const [loading,setLoading]=useState(true),[statsLoading,setStatsLoading]=useState(true),[busyId,setBusyId]=useState(''),[message,setMessage]=useState(''),[clinicStats,setClinicStats]=useState(null)
 const formatDate=value=>value?new Date(value).toLocaleString(locale):'—'
 const loadRequests=useCallback(async()=>{setLoading(true);const {data,error}=await supabase.functions.invoke('registration-admin',{body:{action:'list'}});if(error)setMessage(error.message||t('تعذر تحميل الطلبات.','Could not load requests.'));else setRequests(data.requests||[]);setLoading(false)},[t])
 const loadOverview=useCallback(async()=>{
  setStatsLoading(true)
  const [stats,clinicData,unconfirmedData,deviceData]=await Promise.all([
   supabase.functions.invoke('registration-admin',{body:{action:'clinics_summary'}}),
   supabase.functions.invoke('registration-admin',{body:{action:'clinics_list'}}),
   supabase.functions.invoke('registration-admin',{body:{action:'unconfirmed_approved'}}),
   supabase.functions.invoke('device-access',{body:{action:'list_requests'}})
  ])
  if(stats.error||clinicData.error||unconfirmedData.error||deviceData.error)setMessage(t('تعذر تحميل بعض بيانات الإدارة.','Some admin data could not be loaded.'))
  else{setClinicStats(stats.data);setClinics(clinicData.data.clinics||[]);setUnconfirmed(unconfirmedData.data.users||[]);setDeviceRequests(deviceData.data.requests||[])}
  setStatsLoading(false)
 },[t])
 const refresh=useCallback(()=>{loadRequests();loadOverview()},[loadRequests,loadOverview])
 useEffect(()=>{refresh()},[refresh])
 async function decide(userId,decision){setBusyId(userId);setMessage('');const {error}=await supabase.functions.invoke('registration-admin',{body:{action:decision,user_id:userId}});if(error)setMessage(error.message||t('تعذر تحديث الطلب.','Could not update request.'));else{setRequests(items=>items.filter(x=>x.user_id!==userId));setMessage(decision==='approve'?t('تمت الموافقة على الطلب.','Request approved.'):t('تم رفض الطلب.','Request rejected.'));loadOverview()}setBusyId('')}
 async function resend(userId){setBusyId(userId);setMessage('');const {error}=await supabase.functions.invoke('registration-admin',{body:{action:'resend_confirmation',user_id:userId}});setMessage(error?t('تعذر إعادة إرسال رسالة التأكيد: ','Could not resend confirmation: ')+(error.message||''):t('تم طلب إعادة إرسال رسالة تأكيد البريد.','Confirmation email resend requested.'));setBusyId('')}
 async function setSuspension(userId,suspended,email){
  const prompt=suspended?t('تأكيد إيقاف حساب '+email+'؟ سيُمنع من استخدام النظام مع الاحتفاظ بكل بياناته.','Suspend '+email+'? They will lose access while all their data is retained.'):t('إعادة تفعيل حساب '+email+'؟','Reactivate '+email+'?')
  if(!window.confirm(prompt))return
  setBusyId(userId);setMessage('')
  const {data,error}=await supabase.functions.invoke('registration-admin',{body:{action:'set_suspension',user_id:userId,suspended}})
  if(error||data?.error)setMessage(data?.error||error?.message||t('تعذر تحديث حالة الحساب.','Could not update account status.'))
  else{setMessage(suspended?t('تم إيقاف الحساب مع الاحتفاظ ببياناته.','Account suspended; its data was retained.'):t('تمت إعادة تفعيل الحساب.','Account reactivated.'));await loadOverview()}
  setBusyId('')
 }
 async function decideDeviceRequest(requestId,decision){
  const prompt=decision==='approved'?t('الموافقة ستزيد الحد الأقصى للأجهزة لهذه العيادة. متابعة؟','Approving will increase this clinic device limit. Continue?'):t('رفض طلب زيادة الأجهزة؟','Reject this device limit request?')
  if(!window.confirm(prompt))return
  setBusyId(requestId);setMessage('')
  const {data,error}=await supabase.functions.invoke('device-access',{body:{action:'decide_request',request_id:requestId,decision}})
  if(error||data?.error)setMessage(data?.error||error?.message||t('تعذر تحديث الطلب.','Could not update request.'))
  else{setMessage(decision==='approved'?t('تمت الموافقة وزيادة الحد المسموح.','Request approved and device limit increased.'):t('تم رفض الطلب.','Request rejected.'));await loadOverview()}
  setBusyId('')
 }
 async function deleteAccount(userId,email,role){
  if(role==='owner'){setMessage(t('لا يمكن حذف مالك العيادة قبل نقل ملكيتها إلى مستخدم آخر.','A clinic owner cannot be deleted before transferring clinic ownership.'));return}
  const prompt=t('تحذير: حذف حساب '+email+' نهائي ولا يمكن التراجع عنه. ستظل بيانات المرضى والمواعيد والفواتير محفوظة، لكن سيُزال الحساب من عضوية العيادة. هل تريد المتابعة؟','Warning: deleting '+email+' is permanent and cannot be undone. Patient, appointment and invoice data will be retained, but this account will be removed from clinic membership. Continue?')
  if(!window.confirm(prompt))return
  if(!window.confirm(t('تأكيد أخير: احذف الحساب نهائيًا؟','Final confirmation: permanently delete this account?')))return
  setBusyId(userId);setMessage('')
  const {data,error}=await supabase.functions.invoke('registration-admin',{body:{action:'delete_account',user_id:userId,confirm:true}})
  if(error||data?.error)setMessage(data?.error||error?.message||t('تعذر حذف الحساب.','Could not delete account.'))
  else{setMessage(t('تم حذف الحساب نهائيًا مع الاحتفاظ بالسجلات الطبية والمالية.','Account permanently deleted; clinical and billing records were retained.'));await loadOverview();await loadRequests()}
  setBusyId('')
 }
 return <div className="page-stack">
  <div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>{t('إدارة العيادات والتسجيل','Clinics & registrations')}</h1><p className="muted">{t('تابع العيادات والحسابات الجديدة وحالة تأكيد البريد وإدارة صلاحية الدخول.','Manage clinics, new accounts, email verification, and account access.')}</p></div><button onClick={refresh} disabled={loading||statsLoading}>{t('تحديث الكل','Refresh all')}</button></div>
  {message&&<p className="message">{message}</p>}
  <section className="panel"><div className="section-heading"><h2>{t('إحصائيات العيادات','Clinic statistics')}</h2></div><div className="inline-form"><div className="count-chip">{t('إجمالي العيادات','Total clinics')}: <strong>{statsLoading?'—':clinicStats?.total_clinics??'—'}</strong></div><div className="count-chip">{t('العيادات المملوكة لحسابي','Clinics owned by my account')}: <strong>{statsLoading?'—':clinicStats?.owned_clinics??'—'}</strong></div></div></section>
  <section className="panel"><div className="section-heading"><h2>{t('كل العيادات والمستخدمين','All clinics & users')}</h2><span className="count-chip">{clinics.reduce((n,c)=>n+(c.members?.length||0),0)}</span></div>
   {statsLoading?<p className="empty-state">{t('جاري التحميل...','Loading...')}</p>:clinics.length===0?<p className="empty-state">{t('لا توجد عيادات.','No clinics yet.')}</p>:<div className="table-wrap"><table><thead><tr><th>{t('اسم العيادة','Clinic')}</th><th>{t('البريد الإلكتروني','Email')}</th><th>{t('الدور','Role')}</th><th>{t('تاريخ الانضمام','Joined')}</th><th>{t('حالة الحساب','Account status')}</th><th>{t('الإجراءات','Actions')}</th></tr></thead><tbody>{clinics.flatMap(c=>(c.members||[]).map((m,i)=><tr key={c.id+'-'+m.user_id}><td><strong>{i===0?c.name:''}</strong><div className="muted">{i===0?t('تأسست: ','Clinic created: ')+new Date(c.created_at).toLocaleDateString(locale):''}</div></td><td>{m.email}</td><td>{m.role==='owner'?t('مالك','Owner'):m.role==='doctor'?t('طبيب','Doctor'):m.role==='receptionist'?t('استقبال','Receptionist'):m.role}</td><td>{formatDate(m.registered_at)}</td><td>{m.suspended?<span>{t('موقوف مؤقتًا','Suspended')}</span>:m.email_confirmed?<span>{t('نشط','Active')}</span>:<span>{t('بانتظار تأكيد البريد','Awaiting email')}</span>}</td><td><div className="inline-form"><button disabled={busyId===m.user_id} onClick={()=>setSuspension(m.user_id,!m.suspended,m.email)}>{busyId===m.user_id?t('جارٍ التنفيذ...','Working...'):m.suspended?t('إعادة تفعيل','Reactivate'):t('إيقاف مؤقت','Suspend')}</button><button className="logout-button" disabled={busyId===m.user_id||m.role==='owner'} onClick={()=>deleteAccount(m.user_id,m.email,m.role)}>{t('حذف نهائي','Delete')}</button></div>{m.role==='owner'&&<small className="muted">{t('انقل ملكية العيادة أولًا للحذف','Transfer ownership before deletion')}</small>}</td></tr>))}</tbody></table></div>}
  </section>
  <section className="panel"><div className="section-heading"><h2>{t('حسابات وافقت عليها ولم تؤكد البريد','Approved accounts awaiting email confirmation')}</h2><span className="count-chip">{unconfirmed.length}</span></div>
   {statsLoading?<p className="empty-state">{t('جاري التحميل...','Loading...')}</p>:unconfirmed.length===0?<p className="empty-state">{t('كل الحسابات الموافق عليها أكدت بريدها.','All approved accounts have confirmed their email.')}</p>:<div className="table-wrap"><table><thead><tr><th>{t('البريد الإلكتروني','Email')}</th><th>{t('تاريخ التسجيل','Registered')}</th><th>{t('الإجراء','Action')}</th></tr></thead><tbody>{unconfirmed.map(u=><tr key={u.user_id}><td><strong>{u.email}</strong></td><td>{formatDate(u.created_at)}</td><td><button disabled={busyId===u.user_id} onClick={()=>resend(u.user_id)}>{busyId===u.user_id?t('جاري الإرسال...','Sending...'):t('إعادة إرسال التأكيد','Resend confirmation')}</button></td></tr>)}</tbody></table></div>}
  </section>
  <section className="panel"><div className="section-heading"><h2>{t('طلبات زيادة عدد الأجهزة','Additional device requests')}</h2><span className="count-chip">{deviceRequests.length}</span></div>
   {statsLoading?<p className="empty-state">{t('جاري التحميل...','Loading...')}</p>:deviceRequests.length===0?<p className="empty-state">{t('لا توجد طلبات أجهزة معلقة.','No pending device requests.')}</p>:<div className="table-wrap"><table><thead><tr><th>{t('العيادة','Clinic')}</th><th>{t('الحد الحالي','Current limit')}</th><th>{t('العدد المطلوب','Requested limit')}</th><th>{t('السبب','Reason')}</th><th>{t('تاريخ الطلب','Requested')}</th><th>{t('الإجراء','Action')}</th></tr></thead><tbody>{deviceRequests.map(r=><tr key={r.id}><td><strong>{r.clinics?.name||'—'}</strong></td><td>{r.clinics?.device_limit??2}</td><td>{r.requested_limit}</td><td>{r.reason||'—'}</td><td>{formatDate(r.created_at)}</td><td><div className="inline-form"><button disabled={busyId===r.id} onClick={()=>decideDeviceRequest(r.id,'approved')}>{t('موافقة','Approve')}</button><button className="logout-button" disabled={busyId===r.id} onClick={()=>decideDeviceRequest(r.id,'rejected')}>{t('رفض','Reject')}</button></div></td></tr>)}</tbody></table></div>}
  </section>
  <section className="panel"><div className="section-heading"><h2>{t('طلبات بانتظار الموافقة','Pending requests')}</h2><span className="count-chip">{requests.length}</span></div>
   {loading?<p className="empty-state">{t('جاري تحميل الطلبات...','Loading requests...')}</p>:!requests.length?<p className="empty-state">{t('لا توجد طلبات معلقة حالياً.','No pending requests.')}</p>:<div className="table-wrap"><table><thead><tr><th>{t('البريد الإلكتروني','Email')}</th><th>{t('تاريخ الطلب','Requested')}</th><th>{t('الإجراء','Action')}</th></tr></thead><tbody>{requests.map(r=><tr key={r.user_id}><td><strong>{r.email}</strong></td><td>{formatDate(r.created_at)}</td><td><div className="inline-form"><button disabled={busyId===r.user_id} onClick={()=>decide(r.user_id,'approve')}>{t('موافقة','Approve')}</button><button className="logout-button" disabled={busyId===r.user_id} onClick={()=>decide(r.user_id,'reject')}>{t('رفض','Reject')}</button></div></td></tr>)}</tbody></table></div>}
  </section>
 </div>
}

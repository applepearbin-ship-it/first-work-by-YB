import { useState, useEffect, useRef } from "react";

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_LABELS = { reading:"읽는 중", done:"완독", want:"읽고 싶음" };
const STATUS_COLORS = { reading:"#2563EB", done:"#16A34A", want:"#9CA3AF" };
const COVER_COLORS = ["#1C1C1E","#2C2C2E","#1C1C2E","#1C2E1C","#2E1C1C","#1C2E2E","#2E2E1C","#2E1C2E"];
const LEVELS = [
  {min:0,title:"Reader",color:"#9CA3AF"},
  {min:100,title:"Scholar",color:"#6366F1"},
  {min:300,title:"Thinker",color:"#8B5CF6"},
  {min:600,title:"Philosopher",color:"#D97706"},
  {min:1000,title:"Sage",color:"#DC2626"},
];
const BADGES = [
  {id:"first_book",label:"First Book",desc:"첫 번째 책을 기록했어요",xp:20},
  {id:"first_quiz",label:"First Quiz",desc:"첫 퀴즈를 풀었어요",xp:15},
  {id:"month_goal",label:"Goal Met",desc:"월 목표를 달성했어요",xp:50},
  {id:"3books_month",label:"Momentum",desc:"한 달에 3권을 읽었어요",xp:40},
  {id:"5stars",label:"Curator",desc:"별점 5점짜리 책이 3권",xp:30},
  {id:"10books",label:"Bibliophile",desc:"총 10권을 기록했어요",xp:100},
  {id:"quiz_perfect",label:"Perfect Mind",desc:"퀴즈 3문제 모두 정답",xp:35},
];
const MEDAL_TYPES = [
  {id:"goal_1",label:"First Goal",color:"#CD7F32",symbol:"◆"},
  {id:"goal_3",label:"Hat Trick",color:"#C0C0C0",symbol:"◆◆"},
  {id:"goal_6",label:"Half Year",color:"#FFD700",symbol:"◆◆◆"},
  {id:"goal_12",label:"Full Year",color:"#E5E4E2",symbol:"⬡"},
  {id:"streak_3",label:"Streak ×3",color:"#F97316",symbol:"🔥"},
  {id:"streak_6",label:"Streak ×6",color:"#DC2626",symbol:"🔥🔥"},
];
const CATS = ["철학","역사","경제","사회학","심리학","인류학","정치","과학","문화","예술","종교","언어학","기타"];
const READ_TYPES = { paper:"종이책", ebook:"전자책", audio:"오디오북" };
const EMPTY = { title:"", author:"", dateRead:"", quote:"", insight:"", rating:0, tags:"", status:"done", category:"", readType:"", reread:null };
const SAMPLE = [
  {id:"s1",title:"사피엔스",author:"유발 하라리",dateRead:"2024-06-12",quote:"허구를 믿는 능력이야말로 호모 사피엔스의 가장 독특한 특징이다.",insight:"인류 협력의 비밀은 공통의 이야기를 믿는 능력에 있었다.",rating:5,tags:"역사,인류학",status:"done",category:"역사",readType:"paper",reread:true},
  {id:"s2",title:"철학이란 무엇인가",author:"들뢰즈",dateRead:"2024-09-03",quote:"철학은 개념을 창조하는 일이다.",insight:"개념을 만드는 행위 자체가 철학이라는 관점이 새로웠다.",rating:4,tags:"철학",status:"done",category:"철학",readType:"ebook",reread:false},
  {id:"s3",title:"총 균 쇠",author:"재레드 다이아몬드",dateRead:"2025-03-05",quote:"환경이 역사를 만든다.",insight:"문명의 차이는 인종이 아닌 지리적 환경에서 비롯됐다.",rating:5,tags:"역사",status:"done",category:"역사",readType:"paper",reread:true},
];

// CSS vars (light-mode friendly)
const C = {
  bg: "#ffffff",
  bgSub: "#f7f5f2",
  border: "#e5e0d8",
  borderStrong: "#c8bfb0",
  text: "#1a1612",
  textSub: "#6b6560",
  textMuted: "#a09890",
  accent: "#D97706",
  danger: "#DC2626",
  good: "#16A34A",
};

const memStore = {};
function safeGet(key){ return Promise.resolve(memStore[key]!==undefined?{value:JSON.stringify(memStore[key])}:null); }
function safeSet(key,val){ memStore[key]=val; }

function getLevel(xp){var l=LEVELS[0];for(var i=0;i<LEVELS.length;i++){if(xp>=LEVELS[i].min)l=LEVELS[i];}return l;}
function getNext(xp){var i=LEVELS.findIndex(function(l){return l===getLevel(xp);});return LEVELS[i+1]||null;}
function coverBg(t){var h=0;for(var i=0;i<t.length;i++)h=t.charCodeAt(i)+((h<<5)-h);return COVER_COLORS[Math.abs(h)%COVER_COLORS.length];}

var coverCache={};
function fetchCover(title,author){
  var key=title+"_"+(author||"");
  if(coverCache[key]!==undefined)return Promise.resolve(coverCache[key]);
  return fetch("https://www.googleapis.com/books/v1/volumes?q="+encodeURIComponent(title+" "+(author||""))+"&maxResults=3&langRestrict=ko")
    .then(r=>r.json())
    .then(d=>{
      if(d.items){for(var i=0;i<d.items.length;i++){var links=d.items[i].volumeInfo&&d.items[i].volumeInfo.imageLinks;var img=links&&(links.extraLarge||links.large||links.medium||links.thumbnail);if(img){var hq=img.replace("http://","https://").replace("zoom=1","zoom=3").replace("&edge=curl","");coverCache[key]=hq;return hq;}}}
      coverCache[key]=null;return null;
    }).catch(()=>{coverCache[key]=null;return null;});
}

function BookCover({title,author,size=80}){
  const h=Math.round(size*1.4);
  const [img,setImg]=useState(null);
  const [tried,setTried]=useState(false);
  useEffect(()=>{var c=false;fetchCover(title,author).then(u=>{if(!c){setImg(u);setTried(true);}});return()=>{c=true;};},[title,author]);
  if(img)return <div style={{width:size,height:h,borderRadius:3,overflow:"hidden",flexShrink:0}}><img src={img} alt={title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImg(null)}/></div>;
  return(
    <div style={{width:size,height:h,background:coverBg(title),borderRadius:3,display:"flex",alignItems:"flex-end",padding:6,boxSizing:"border-box",flexShrink:0,position:"relative"}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"rgba(255,255,255,0.12)"}}/>
      {tried&&<p style={{fontSize:size<60?7:9,color:"rgba(255,255,255,0.55)",margin:0,lineHeight:1.2,wordBreak:"keep-all"}}>{title}</p>}
    </div>
  );
}

function Stars({value,onChange}){
  const [hov,setHov]=useState(0);
  return(
    <div style={{display:"flex",gap:3}}>
      {[1,2,3,4,5].map(i=>(
        <span key={i}
          onMouseEnter={()=>{if(onChange)setHov(i);}}
          onMouseLeave={()=>{if(onChange)setHov(0);}}
          onClick={()=>{if(onChange)onChange(value===i?0:i);}}
          style={{fontSize:13,cursor:onChange?"pointer":"default",color:(hov||value)>=i?C.accent:C.border,letterSpacing:1}}>★</span>
      ))}
    </div>
  );
}

function Pill({onClick,active,label}){
  return(
    <button type="button" onClick={onClick} style={{padding:"6px 14px",borderRadius:2,border:`1px solid ${active?C.text:C.border}`,background:active?C.text:"transparent",color:active?C.bg:C.textSub,cursor:"pointer",fontSize:11,fontWeight:active?500:400,letterSpacing:"0.04em",flexShrink:0}}>
      {label}
    </button>
  );
}

function ProfilePanel({xp,badges,medals,userName,remindMonths,onClose,onSaveName,onSaveRemind}){
  const [val,setVal]=useState(userName||"");
  const lv=getLevel(xp),nxt=getNext(xp);
  const lvPct=nxt?Math.min(100,Math.round(((xp-lv.min)/(nxt.min-lv.min))*100)):100;
  const ls={fontSize:10,color:C.textMuted,letterSpacing:"0.08em",textTransform:"uppercase"};
  return(
    <div style={{display:"flex",position:"fixed",inset:0,zIndex:100}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.3)",cursor:"pointer"}} onClick={onClose}/>
      <div style={{width:300,background:C.bg,padding:"2rem 1.5rem",boxSizing:"border-box",borderLeft:`1px solid ${C.border}`,overflowY:"auto",boxShadow:"-8px 0 32px rgba(0,0,0,0.08)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem"}}>
          <p style={{fontSize:10,margin:0,color:C.textMuted,letterSpacing:"0.12em",textTransform:"uppercase"}}>Profile</p>
          <button type="button" onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.textMuted,padding:0,lineHeight:1}}>×</button>
        </div>
        <div style={{marginBottom:"2rem"}}>
          <p style={{...ls,marginBottom:8}}>Name</p>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input value={val} onChange={e=>setVal(e.target.value)} placeholder="Your name" style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,padding:"6px 0",fontSize:13,color:C.text,outline:"none"}}/>
            <button type="button" onClick={()=>{if(val.trim())onSaveName(val.trim());}} style={{fontSize:11,padding:"6px 12px",background:C.text,border:"none",cursor:"pointer",color:C.bg,letterSpacing:"0.05em"}}>Save</button>
          </div>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.5rem",marginBottom:"2rem"}}>
          <p style={{...ls,marginBottom:8}}>Reread Reminder</p>
          <p style={{fontSize:11,color:C.textMuted,margin:"0 0 10px"}}>다시 읽고 싶은 책을 몇 개월마다 알려드릴까요?</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[1,2,3,6,12].map(n=>{
              const active=remindMonths===n;
              return <button key={n} type="button" onClick={()=>onSaveRemind(n)} style={{padding:"5px 10px",borderRadius:2,border:`1px solid ${active?C.text:C.border}`,background:active?C.text:"transparent",color:active?C.bg:C.textSub,cursor:"pointer",fontSize:11,fontWeight:active?500:400}}>{n+"mo"}</button>;
            })}
          </div>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.5rem",marginBottom:"2rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <p style={{...ls,margin:0}}>Level</p>
            <span style={{fontSize:13,fontWeight:500,color:lv.color}}>{lv.title}</span>
          </div>
          <div style={{height:2,background:C.border,borderRadius:1,marginBottom:8}}>
            <div style={{height:"100%",width:lvPct+"%",background:lv.color,borderRadius:1,transition:"width 0.6s"}}/>
          </div>
          <p style={{fontSize:11,color:C.textMuted,margin:0}}>{xp+" XP"+(nxt?" · "+(nxt.min-xp)+" more to "+nxt.title:"")}</p>
        </div>
        {medals.length>0&&(
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.5rem",marginBottom:"2rem"}}>
            <p style={{...ls,marginBottom:"1rem"}}>Medals</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {MEDAL_TYPES.filter(m=>medals.indexOf(m.id)>=0).map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:16,color:m.color,minWidth:24}}>{m.symbol}</span>
                  <span style={{fontSize:12,color:C.text,fontWeight:500}}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.5rem"}}>
          <p style={{...ls,marginBottom:"1rem"}}>Achievements</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {BADGES.map(b=>{
              const earned=badges.indexOf(b.id)>=0;
              return(
                <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",opacity:earned?1:0.3}}>
                  <div>
                    <p style={{fontSize:12,color:C.text,margin:"0 0 1px",fontWeight:earned?500:400}}>{b.label}</p>
                    <p style={{fontSize:10,color:C.textMuted,margin:0}}>{b.desc}</p>
                  </div>
                  <span style={{fontSize:11,color:earned?C.accent:C.textMuted,fontWeight:500,flexShrink:0,marginLeft:12}}>{"+" + b.xp}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormView({initial,isEdit,onSave,onBack}){
  const [form,setForm]=useState(initial||EMPTY);
  const [cating,setCating]=useState(false);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const today=new Date().toISOString().split("T")[0];
  const ls={fontSize:10,color:C.textMuted,display:"block",marginBottom:6,letterSpacing:"0.1em",textTransform:"uppercase"};
  const iS={width:"100%",boxSizing:"border-box",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,padding:"8px 0",fontSize:14,color:C.text,outline:"none"};
  const tS={width:"100%",boxSizing:"border-box",resize:"none",fontFamily:"Georgia,serif",fontSize:14,padding:"10px 0",border:"none",borderBottom:`1px solid ${C.border}`,background:"transparent",color:C.text,lineHeight:1.8,outline:"none"};
  function autocat(t){
    if(!t.trim()||form.category)return;
    setCating(true);
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:20,messages:[{role:"user",content:"책 제목 \""+t+"\"의 분야를 다음 중 하나로만 단어 하나 답해: "+CATS.join(",")}]})})
      .then(r=>r.json()).then(d=>{var cat=(d.content[0].text||"").trim();if(CATS.indexOf(cat)>=0)set("category",cat);}).catch(()=>{}).then(()=>setCating(false));
  }
  return(
    <div style={{background:C.bg,padding:"2rem 1.5rem",maxWidth:520,margin:"0 auto",minHeight:"100vh"}}>
      <button type="button" onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.textMuted,padding:0,marginBottom:"2rem",letterSpacing:"0.1em",textTransform:"uppercase"}}>← Back</button>
      <h2 style={{fontSize:22,fontWeight:500,margin:"0 0 2rem",color:C.text,fontFamily:"Georgia,serif",letterSpacing:"-0.02em"}}>{isEdit?"Edit Record":"New Record"}</h2>
      <div style={{marginBottom:"1.75rem"}}><label style={ls}>Title *</label><input value={form.title} placeholder="Book title" onChange={e=>set("title",e.target.value)} onBlur={e=>autocat(e.target.value)} style={iS}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginBottom:"1.75rem"}}>
        <div><label style={ls}>Author</label><input value={form.author} placeholder="Author name" onChange={e=>set("author",e.target.value)} style={iS}/></div>
        <div><label style={ls}>Date Read</label><input type="date" value={form.dateRead} max={today} onChange={e=>set("dateRead",e.target.value)} style={iS}/></div>
        <div>
          <label style={ls}>{"Category"+(cating?" ...":"")}</label>
          <select value={form.category} onChange={e=>set("category",e.target.value)} style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,padding:"8px 0",fontSize:14,color:form.category?C.text:C.textMuted,outline:"none",cursor:"pointer"}}>
            <option value="">Select</option>
            {CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label style={ls}>Rating</label><div style={{paddingTop:8}}><Stars value={form.rating} onChange={v=>set("rating",v)}/></div></div>
      </div>
      <div style={{marginBottom:"1.75rem"}}><label style={ls}>Format</label><div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:4}}>{Object.keys(READ_TYPES).map(k=><Pill key={k} label={READ_TYPES[k]} active={form.readType===k} onClick={()=>set("readType",form.readType===k?"":k)}/>)}</div></div>
      <div style={{marginBottom:"1.75rem"}}><label style={ls}>Status</label><div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:4}}>{Object.keys(STATUS_LABELS).map(k=><Pill key={k} label={STATUS_LABELS[k]} active={form.status===k} onClick={()=>set("status",k)}/>)}</div></div>
      <div style={{marginBottom:"1.75rem"}}><label style={ls}>Memorable Quote</label><textarea value={form.quote} placeholder="A sentence that stayed with you..." onChange={e=>set("quote",e.target.value)} rows={2} style={tS}/></div>
      <div style={{marginBottom:"1.75rem"}}><label style={ls}>Insight</label><textarea value={form.insight} placeholder="What did this book change in you?" onChange={e=>set("insight",e.target.value)} rows={3} style={tS}/></div>
      <div style={{marginBottom:"2.5rem"}}><label style={ls}>Read Again?</label><div style={{display:"flex",gap:6,paddingTop:4}}><Pill label="Yes" active={form.reread===true} onClick={()=>set("reread",form.reread===true?null:true)}/><Pill label="No" active={form.reread===false} onClick={()=>set("reread",form.reread===false?null:false)}/></div></div>
      <div style={{display:"flex",gap:10,borderTop:`1px solid ${C.border}`,paddingTop:"1.5rem"}}>
        <button type="button" onClick={onBack} style={{flex:1,padding:"12px",background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:12,color:C.textSub,letterSpacing:"0.05em"}}>Cancel</button>
        <button type="button" onClick={()=>{if(form.title.trim())onSave(form);}} style={{flex:2,padding:"12px",background:form.title.trim()?C.text:C.border,border:"none",cursor:"pointer",fontSize:12,color:form.title.trim()?C.bg:C.textMuted,fontWeight:500,letterSpacing:"0.08em"}}>Save Record</button>
      </div>
    </div>
  );
}

function QuizPanel({book,onXP}){
  const [state,setState]=useState("idle");
  const [qs,setQs]=useState([]);
  const [ans,setAns]=useState({});
  const [res,setRes]=useState(null);
  const [debateQ,setDebateQ]=useState(null);
  const [chat,setChat]=useState([]);
  const [inp,setInp]=useState("");
  const [cloading,setCloading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{if(endRef.current)endRef.current.scrollIntoView({behavior:"smooth"});},[chat]);
  function gen(){
    setState("loading");
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:`책:"${book.title}" 저자:${book.author||"미상"} 인사이트:"${book.insight||""}" 문장:"${book.quote||""}"\n퀴즈 3개 JSON만:\n[{"type":"mc","question":"Q","options":["A","B","C","D"],"answer":"A","explanation":"E"},{"type":"sa","question":"Q","answer":"A","explanation":"E"},{"type":"open","question":"Q"}]`}]})})
      .then(r=>r.json()).then(d=>{setQs(JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim()));setState("quiz");}).catch(()=>setState("idle"));
  }
  function submitQuiz(){
    setState("grading");
    var out=[],xpE=0,all=true;
    var tasks=qs.map(q=>{
      if(q.type==="open"){out.push({...q,open:true});return Promise.resolve();}
      var ua=(ans[q.question]||"").trim();
      if(q.type==="mc"){var ok=ua===q.answer;if(ok)xpE+=15;else all=false;out.push({...q,correct:ok,userAns:ua});return Promise.resolve();}
      return fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:150,messages:[{role:"user",content:`질문:"${q.question}" 모범:"${q.answer}" 사용자:"${ua}"\nJSON만:{"correct":true,"feedback":"피드백"}`}]})})
        .then(r=>r.json()).then(d=>{var j=JSON.parse(d.content[0].text.replace(/```json|```/g,"").trim());if(j.correct)xpE+=15;else all=false;out.push({...q,correct:j.correct,feedback:j.feedback,userAns:ua});}).catch(()=>{out.push({...q,correct:false,userAns:ua});all=false;});
    });
    Promise.all(tasks).then(()=>{if(all)xpE+=20;setRes(out);setState("results");onXP(xpE,all);var oq=qs.find(q=>q.type==="open");if(oq)setDebateQ(oq.question);});
  }
  function send(){
    if(!inp.trim()||cloading)return;
    var msg={role:"user",content:inp};var nc=chat.concat([msg]);setChat(nc);setInp("");setCloading(true);
    fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`"${book.title}" 토론 파트너. 인사이트:"${book.insight||""}" 주제:"${debateQ}" 짧고 날카롭게.`}].concat(nc)})})
      .then(r=>r.json()).then(d=>{setChat(h=>h.concat([{role:"assistant",content:d.content[0].text}]));}).catch(()=>{setChat(h=>h.concat([{role:"assistant",content:"오류가 발생했어요."}]));}).then(()=>setCloading(false));
  }
  const sec={borderTop:`1px solid ${C.border}`,paddingTop:"1.5rem",marginTop:"1.5rem"};
  const lbS={fontSize:10,color:C.textMuted,letterSpacing:"0.1em",textTransform:"uppercase"};
  if(state==="idle")return(<div style={sec}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={lbS}>Quiz & Discussion</span><button type="button" onClick={gen} style={{fontSize:11,padding:"6px 16px",border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",color:C.textSub,letterSpacing:"0.05em"}}>Start Quiz</button></div></div>);
  if(state==="loading"||state==="grading")return <div style={sec}><p style={{fontSize:12,color:C.textMuted,letterSpacing:"0.05em"}}>{state==="loading"?"Generating...":"Grading..."}</p></div>;
  if(state==="quiz")return(
    <div style={sec}>
      <p style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"1.5rem"}}>Quiz</p>
      {qs.map((q,i)=>(
        <div key={i} style={{marginBottom:"1.5rem"}}>
          <p style={{fontSize:14,fontWeight:500,margin:"0 0 12px",lineHeight:1.6,color:C.text}}>{(i+1)+". "+q.question}</p>
          {q.type==="mc"&&<div style={{display:"flex",flexDirection:"column",gap:6}}>{q.options.map(o=>{var a=ans[q.question]===o;return <button key={o} type="button" onClick={()=>setAns(prev=>({...prev,[q.question]:o}))} style={{padding:"10px 14px",textAlign:"left",border:`1px solid ${a?C.text:C.border}`,background:a?C.text:"transparent",color:a?C.bg:C.text,cursor:"pointer",fontSize:13,borderRadius:2}}>{o}</button>;})}</div>}
          {(q.type==="sa"||q.type==="open")&&<textarea value={ans[q.question]||""} onChange={e=>setAns(prev=>({...prev,[q.question]:e.target.value}))} placeholder={q.type==="open"?"자유롭게 생각을 적어보세요...":"답변을 적어보세요..."} rows={3} style={{width:"100%",boxSizing:"border-box",fontFamily:"Georgia,serif",fontSize:14,padding:"10px 0",border:"none",borderBottom:`1px solid ${C.border}`,background:"transparent",color:C.text,resize:"none",outline:"none",lineHeight:1.8}}/>}
          {q.type==="open"&&<p style={{fontSize:11,color:C.textMuted,margin:"6px 0 0"}}>열린 질문 — 제출 후 토론할 수 있어요</p>}
        </div>
      ))}
      <button type="button" onClick={submitQuiz} style={{width:"100%",padding:"12px",background:C.text,border:"none",cursor:"pointer",fontSize:12,color:C.bg,letterSpacing:"0.08em"}}>Submit</button>
    </div>
  );
  return(
    <div style={sec}>
      <p style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"1.5rem"}}>Results</p>
      {res.map((r,i)=>(
        <div key={i} style={{marginBottom:"1.25rem",paddingBottom:"1.25rem",borderBottom:`1px solid ${C.border}`}}>
          <p style={{fontSize:13,fontWeight:500,margin:"0 0 8px",lineHeight:1.5,color:C.text}}>{(i+1)+". "+r.question}</p>
          {r.open?(
            <div>{chat.length===0&&<button type="button" onClick={()=>setChat([{role:"assistant",content:`"${debateQ}"에 대해 어떻게 생각하세요?`}])} style={{fontSize:11,padding:"6px 16px",border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",color:C.textSub,letterSpacing:"0.05em"}}>Start Discussion</button>}</div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,fontWeight:500,color:r.correct?C.good:C.danger}}>{r.correct?"Correct":"Incorrect"}</span>
              {!r.correct&&<span style={{fontSize:12,color:C.textMuted}}>{"→ "+r.answer}</span>}
              {r.feedback&&<span style={{fontSize:12,color:C.textSub}}>{r.feedback}</span>}
            </div>
          )}
        </div>
      ))}
      {chat.length>0&&(
        <div style={{marginTop:"1.5rem"}}>
          <p style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"1rem"}}>Discussion</p>
          <div style={{borderLeft:`2px solid ${C.border}`,paddingLeft:"1rem",maxHeight:280,overflowY:"auto",marginBottom:"1rem"}}>
            {chat.map((m,i)=>(
              <div key={i} style={{marginBottom:"1rem"}}>
                <p style={{fontSize:10,color:C.textMuted,margin:"0 0 4px",letterSpacing:"0.05em"}}>{m.role==="user"?"You":"Claude"}</p>
                <p style={{fontSize:13,margin:0,lineHeight:1.7,color:C.text,fontFamily:m.role==="assistant"?"Georgia,serif":"inherit"}}>{m.content}</p>
              </div>
            ))}
            {cloading&&<p style={{fontSize:12,color:C.textMuted}}>...</p>}
            <div ref={endRef}/>
          </div>
          <div style={{display:"flex",gap:8,borderTop:`1px solid ${C.border}`,paddingTop:"1rem"}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send();}} placeholder="Your thoughts..." style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,padding:"6px 0",fontSize:13,color:C.text,outline:"none"}}/>
            <button type="button" onClick={send} disabled={cloading} style={{padding:"6px 16px",background:C.text,border:"none",cursor:"pointer",fontSize:11,color:C.bg,letterSpacing:"0.05em"}}>Send</button>
          </div>
        </div>
      )}
      <button type="button" onClick={()=>{setState("idle");setQs([]);setAns({});setRes(null);setChat([]);}} style={{marginTop:"1rem",fontSize:11,color:C.textMuted,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.05em"}}>Close</button>
    </div>
  );
}

export default function App(){
  const now=new Date();
  const [books,setBooks]=useState(SAMPLE);
  const [loaded,setLoaded]=useState(false);
  const [xp,setXp]=useState(0);
  const [badges,setBadges]=useState([]);
  const [popup,setPopup]=useState(null);
  const [rereadPopup,setRereadPopup]=useState([]);
  const [goals,setGoals]=useState({});
  const [showPicker,setShowPicker]=useState(false);
  const [tab,setTab]=useState("month");
  const [selM,setSelM]=useState(now.getMonth());
  const [selY,setSelY]=useState(now.getFullYear());
  const [view,setView]=useState("list");
  const [selId,setSelId]=useState(null);
  const [editId,setEditId]=useState(null);
  const [search,setSearch]=useState("");
  const [fStatus,setFStatus]=useState("all");
  const [fTag,setFTag]=useState("");
  const [todayQ,setTodayQ]=useState(null);
  const [yearV,setYearV]=useState(now.getFullYear());
  const [editGoal,setEditGoal]=useState(false);
  const [goalInp,setGoalInp]=useState("");
  const [userName,setUserName]=useState("Reader");
  const [medals,setMedals]=useState([]);
  const [goalStreak,setGoalStreak]=useState(0);
  const [remindMonths,setRemindMonths]=useState(3);

  useEffect(()=>{
    Promise.all([
      safeGet("books_v2"),safeGet("xp_v2"),safeGet("bdg_v2"),safeGet("gls_v2"),
      safeGet("username"),safeGet("medals"),safeGet("streak"),
      safeGet("remindMonths"),safeGet("reread_last_shown")
    ]).then(v=>{
      var bks=v[0]?JSON.parse(v[0].value):SAMPLE;setBooks(bks);
      if(v[1])setXp(JSON.parse(v[1].value));
      if(v[2])setBadges(JSON.parse(v[2].value));
      if(v[3])setGoals(JSON.parse(v[3].value));
      if(v[4])setUserName(JSON.parse(v[4].value));
      if(v[5])setMedals(JSON.parse(v[5].value));
      if(v[6])setGoalStreak(JSON.parse(v[6].value));
      var rm=v[7]?JSON.parse(v[7].value):3;setRemindMonths(rm);
      var q=bks.filter(b=>b.quote);
      if(q.length)setTodayQ(q[now.getDate()%q.length]);
      setLoaded(true);
    });
  },[]);

  function addXP(n){var nx=xp+n;setXp(nx);safeSet("xp_v2",nx);return nx;}
  function giveBadge(id,cx){
    if(badges.indexOf(id)>=0)return cx;
    var def=BADGES.find(b=>b.id===id);if(!def)return cx;
    var nb=badges.concat([id]);setBadges(nb);safeSet("bdg_v2",nb);
    var nx=cx+def.xp;setXp(nx);safeSet("xp_v2",nx);
    setPopup({label:def.label,desc:def.desc,xp:def.xp,isMedal:false});
    return nx;
  }
  function giveMedal(id){
    if(medals.indexOf(id)>=0)return;
    var def=MEDAL_TYPES.find(m=>m.id===id);if(!def)return;
    var nm=medals.concat([id]);setMedals(nm);safeSet("medals",nm);
    setPopup({label:def.label,desc:"New medal earned!",xp:0,isMedal:true,symbol:def.symbol,color:def.color});
  }
  function onGoalAchieved(){
    var ns=goalStreak+1;setGoalStreak(ns);safeSet("streak",ns);
    var total=medals.filter(m=>m.startsWith("goal_")).length+1;
    if(total>=1)giveMedal("goal_1");if(total>=3)giveMedal("goal_3");
    if(total>=6)giveMedal("goal_6");if(total>=12)giveMedal("goal_12");
    if(ns>=3)giveMedal("streak_3");if(ns>=6)giveMedal("streak_6");
  }
  function checkBadges(bks,cx){
    var c=cx;
    if(bks.length>=1)c=giveBadge("first_book",c);
    if(bks.length>=10)c=giveBadge("10books",c);
    if(bks.filter(b=>b.rating===5).length>=3)c=giveBadge("5stars",c);
    var md=bks.filter(b=>{if(!b.dateRead)return false;var d=new Date(b.dateRead);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&b.status==="done";}).length;
    if(md>=3)c=giveBadge("3books_month",c);
    var gk=now.getFullYear()+"-"+now.getMonth();
    if(goals[gk]&&md>=goals[gk]){c=giveBadge("month_goal",c);onGoalAchieved();}
    return c;
  }
  function saveBooks(u){setBooks(u);safeSet("books_v2",u);}
  function addBook(f){var u=books.concat([{...f,id:Date.now()+""}]);saveBooks(u);setView("list");var nx=addXP(10);checkBadges(u,nx);}
  function updBook(f){var u=books.map(b=>b.id===editId?{...b,...f}:b);saveBooks(u);setView("detail");setEditId(null);checkBadges(u,xp);}
  function delBook(id){saveBooks(books.filter(b=>b.id!==id));setSelId(null);setView("list");}
  function navM(d){var m=selM+d,y=selY;if(m<0){m=11;y--;}if(m>11){m=0;y++;}setSelM(m);setSelY(y);}
  function saveGoal(){var g=parseInt(goalInp)||0;var u={...goals,[selY+"-"+selM]:g};setGoals(u);safeSet("gls_v2",u);setEditGoal(false);}
  function handleQuizXP(n,all){var nx=addXP(n);if(all)giveBadge("quiz_perfect",nx);}
  function exportData(){var t=books.map(b=>"["+b.dateRead+"] "+b.title+" — "+(b.author||"")+"\n"+(b.insight||"")).join("\n\n");navigator.clipboard.writeText(t).then(()=>alert("Copied!")).catch(()=>alert("Export done."));}

  const allTags=[];books.forEach(b=>{(b.tags||"").split(",").forEach(t=>{var tr=t.trim();if(tr&&allTags.indexOf(tr)<0)allTags.push(tr);});});
  const filtered=books.filter(b=>{var q=search.toLowerCase();return(!q||(b.title+b.author+b.insight+b.quote+b.tags).toLowerCase().indexOf(q)>=0)&&(fStatus==="all"||b.status===fStatus)&&(!fTag||(b.tags||"").split(",").map(t=>t.trim()).indexOf(fTag)>=0);});
  const gk=selY+"-"+selM;
  const curGoal=goals[gk]||0;
  const doneM=books.filter(b=>{if(!b.dateRead)return false;var d=new Date(b.dateRead);return d.getMonth()===selM&&d.getFullYear()===selY&&b.status==="done";}).length;
  const monthBooks=filtered.filter(b=>{if(!b.dateRead)return false;var d=new Date(b.dateRead);return d.getMonth()===selM&&d.getFullYear()===selY;});
  const yearBooks=books.filter(b=>b.dateRead&&new Date(b.dateRead).getFullYear()===yearV);
  const statsByMonth=[];for(var mi=0;mi<12;mi++){statsByMonth.push(books.filter(b=>b.dateRead&&new Date(b.dateRead).getFullYear()===now.getFullYear()&&new Date(b.dateRead).getMonth()===mi).length);}
  const maxStat=Math.max(...statsByMonth,1);
  const totalDone=books.filter(b=>b.status==="done").length;
  const ratedBooks=books.filter(b=>b.rating>0);
  const avgR=ratedBooks.length?(ratedBooks.reduce((a,b)=>a+b.rating,0)/ratedBooks.length).toFixed(1):"—";
  const hs={fontSize:10,color:C.textMuted,letterSpacing:"0.12em",textTransform:"uppercase"};

  if(!loaded)return <div style={{padding:"3rem",fontSize:12,letterSpacing:"0.1em",color:C.textMuted}}>LOADING...</div>;

  if(view==="form"){
    const fb=editId?books.find(b=>b.id===editId):undefined;
    return <FormView initial={fb} isEdit={!!editId} onSave={editId?updBook:addBook} onBack={()=>{setView(editId?"detail":"list");setEditId(null);}}/>;
  }

  function BookRow({b:bk}){
    return(
      <div onClick={()=>{setSelId(bk.id);setView("detail");}} style={{display:"flex",gap:16,alignItems:"center",padding:"1.1rem 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
        <BookCover title={bk.title} author={bk.author} size={44}/>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:16,fontWeight:500,margin:"0 0 3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:C.text,fontFamily:"Georgia,serif"}}>{bk.title}</p>
          <p style={{fontSize:11,color:C.textMuted,margin:"0 0 5px"}}>{bk.author||"—"}</p>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {bk.rating>0&&<div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(i=><span key={i} style={{fontSize:10,color:bk.rating>=i?C.accent:C.border}}>★</span>)}</div>}
            {bk.category&&<span style={{fontSize:10,color:C.textMuted}}>{bk.category}</span>}
            <span style={{fontSize:10,color:STATUS_COLORS[bk.status],fontWeight:500}}>{STATUS_LABELS[bk.status]}</span>
          </div>
        </div>
        <span style={{fontSize:14,color:C.border}}>→</span>
      </div>
    );
  }

  if(view==="detail"&&selId){
    const b=books.find(x=>x.id===selId);
    if(!b){setView("list");return null;}
    const so=["want","reading","done"],ns=so[(so.indexOf(b.status)+1)%so.length];
    return(
      <div style={{background:C.bg,padding:"2rem 1.5rem",maxWidth:520,margin:"0 auto",minHeight:"100vh"}}>
        <button type="button" onClick={()=>setView("list")} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.textMuted,padding:0,marginBottom:"2rem",letterSpacing:"0.1em",textTransform:"uppercase"}}>← Library</button>
        <div style={{display:"flex",gap:20,alignItems:"flex-start",marginBottom:"2rem"}}>
          <BookCover title={b.title} author={b.author} size={72}/>
          <div style={{flex:1}}>
            <h1 style={{fontSize:22,fontWeight:600,margin:"0 0 4px",color:C.text,fontFamily:"Georgia,serif",lineHeight:1.2,letterSpacing:"-0.02em"}}>{b.title}</h1>
            {b.author&&<p style={{fontSize:13,color:C.textMuted,margin:"0 0 10px"}}>{b.author}</p>}
            <Stars value={b.rating||0}/>
            <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
              <span onClick={()=>{var u=books.map(x=>x.id===b.id?{...x,status:ns}:x);saveBooks(u);checkBadges(u,xp);}} style={{fontSize:10,padding:"3px 10px",border:`1px solid ${STATUS_COLORS[b.status]}`,color:STATUS_COLORS[b.status],cursor:"pointer",letterSpacing:"0.05em",borderRadius:2}}>{STATUS_LABELS[b.status]+" ♥"}</span>
              {b.readType&&<span style={{fontSize:10,padding:"3px 10px",border:`1px solid ${C.border}`,color:C.textMuted,letterSpacing:"0.05em",borderRadius:2}}>{READ_TYPES[b.readType]}</span>}
              {b.category&&<span style={{fontSize:10,padding:"3px 10px",border:`1px solid ${C.border}`,color:C.textMuted,letterSpacing:"0.05em",borderRadius:2}}>{b.category}</span>}
              {b.reread===true&&<span style={{fontSize:10,color:C.textMuted,letterSpacing:"0.03em",padding:"3px 0"}}>↩ Read again</span>}
            </div>
            {b.dateRead&&<p style={{fontSize:11,color:C.textMuted,margin:"8px 0 0"}}>{new Date(b.dateRead).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>}
          </div>
        </div>
        {b.quote&&<div style={{borderLeft:`3px solid ${C.text}`,paddingLeft:"1.25rem",marginBottom:"2rem"}}><p style={{fontSize:17,fontFamily:"Georgia,serif",color:C.text,margin:0,lineHeight:1.8,fontStyle:"italic",letterSpacing:"-0.01em"}}>&ldquo;{b.quote}&rdquo;</p></div>}
        {b.insight&&<div style={{marginBottom:"2rem"}}><p style={{fontSize:10,color:C.textMuted,margin:"0 0 10px",letterSpacing:"0.1em",textTransform:"uppercase"}}>Insight</p><p style={{fontSize:15,color:C.text,margin:0,lineHeight:1.8}}>{b.insight}</p></div>}
        <QuizPanel book={b} onXP={handleQuizXP}/>
        <div style={{display:"flex",gap:8,marginTop:"2rem",borderTop:`1px solid ${C.border}`,paddingTop:"1.5rem"}}>
          <button type="button" onClick={()=>{setEditId(b.id);setView("form");}} style={{flex:1,padding:"10px",background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.textSub,letterSpacing:"0.05em"}}>Edit</button>
          <button type="button" onClick={()=>delBook(b.id)} style={{flex:1,padding:"10px",background:"transparent",border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:C.danger,letterSpacing:"0.05em"}}>Delete</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{background:C.bg,maxWidth:520,margin:"0 auto",minHeight:"100vh"}}>
      {rereadPopup.length>0&&(
        <div style={{margin:"1.5rem 1.5rem 0",padding:"1.25rem",borderLeft:`3px solid ${C.accent}`,background:C.bgSub}}>
          <p style={{fontSize:10,color:C.accent,margin:"0 0 4px",letterSpacing:"0.1em",textTransform:"uppercase"}}>Reading Reminder</p>
          <p style={{fontSize:13,color:C.text,margin:"0 0 10px"}}>{userName+"님, 다시 읽고 싶다고 하셨던 책들이에요."}</p>
          {rereadPopup.map(bk=><div key={bk.id} onClick={()=>{setRereadPopup([]);setSelId(bk.id);setView("detail");}} style={{fontSize:13,color:C.textSub,padding:"5px 0",cursor:"pointer",borderTop:`1px solid ${C.border}`}}>{"→ "+bk.title}</div>)}
          <div style={{display:"flex",gap:12,marginTop:"0.75rem",paddingTop:"0.75rem",borderTop:`1px solid ${C.border}`}}>
            <button type="button" onClick={()=>setRereadPopup([])} style={{fontSize:11,color:C.textMuted,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.05em",padding:0}}>Remind me later</button>
            <span style={{color:C.border}}>·</span>
            <button type="button" onClick={()=>setRereadPopup([])} style={{fontSize:11,color:C.textMuted,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.05em",padding:0}}>Dismiss</button>
          </div>
        </div>
      )}

      {popup&&(
        <div style={{margin:"1.5rem 1.5rem 0",padding:"1.5rem",border:`1px solid ${popup.isMedal?popup.color:C.border}`,background:C.bgSub}}>
          {popup.isMedal?(
            <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
              <span style={{fontSize:32,color:popup.color,lineHeight:1}}>{popup.symbol}</span>
              <div style={{flex:1}}>
                <p style={{fontSize:10,color:C.textMuted,margin:"0 0 4px",letterSpacing:"0.1em",textTransform:"uppercase"}}>Medal Earned</p>
                <p style={{fontSize:18,fontWeight:600,margin:0,fontFamily:"Georgia,serif",color:popup.color}}>{popup.label}</p>
              </div>
              <button type="button" onClick={()=>setPopup(null)} style={{fontSize:16,color:C.textMuted,background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:1}}>×</button>
            </div>
          ):(
            <div>
              <p style={{fontSize:10,color:C.textMuted,margin:"0 0 6px",letterSpacing:"0.1em",textTransform:"uppercase"}}>Achievement Unlocked</p>
              <p style={{fontSize:18,fontWeight:600,margin:"0 0 4px",fontFamily:"Georgia,serif",color:C.text}}>{popup.label}</p>
              <p style={{fontSize:12,color:C.textSub,margin:"0 0 12px"}}>{popup.desc}</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {popup.xp>0&&<span style={{fontSize:13,color:C.accent,fontWeight:500}}>{"+" + popup.xp + " XP"}</span>}
                <button type="button" onClick={()=>setPopup(null)} style={{fontSize:11,color:C.textMuted,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.05em",marginLeft:"auto"}}>Dismiss</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{padding:"1.5rem",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:curGoal>0||todayQ?"1.25rem":"0"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:10,color:C.textMuted,letterSpacing:"0.1em",textTransform:"uppercase"}}>Bibliotheca</span>
            {medals.length>0&&<div style={{display:"flex",gap:3}}>{MEDAL_TYPES.filter(m=>medals.indexOf(m.id)>=0).map(m=><span key={m.id} title={m.label} style={{fontSize:11,color:m.color}}>{m.symbol}</span>)}</div>}
          </div>
          <button type="button" onClick={()=>setShowPicker(p=>!p)} style={{background:"none",border:`1px solid ${C.border}`,cursor:"pointer",padding:"6px 12px",fontSize:11,color:C.textSub,letterSpacing:"0.05em",flexShrink:0}}>Profile</button>
        </div>

        {curGoal>0&&(
          <div style={{marginBottom:todayQ?"1.25rem":"0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:22,fontWeight:600,color:doneM>=curGoal?C.accent:C.text,fontFamily:"Georgia,serif",letterSpacing:"-0.02em"}}>{doneM}</span>
                <span style={{fontSize:13,color:C.textMuted}}>{"/ "+curGoal+" books · "+MONTHS_EN[selM]}</span>
                {goalStreak>0&&<span style={{fontSize:11,color:"#F97316",letterSpacing:"0.03em"}}>{"🔥 "+goalStreak}</span>}
              </div>
              <span style={{fontSize:11,color:doneM>=curGoal?C.accent:C.textMuted,fontWeight:doneM>=curGoal?600:400,letterSpacing:"0.05em"}}>{doneM>=curGoal?"Goal Reached ◆":Math.round((doneM/curGoal)*100)+"%"}</span>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {Array.from({length:curGoal},(_,i)=>{
                const filled=i<doneM;
                return <div key={i} style={{width:26,height:32,borderRadius:2,border:`1px solid ${filled?"transparent":C.border}`,background:filled?(doneM>=curGoal?C.accent:C.text):"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s"}}>{filled&&<span style={{fontSize:8,color:C.bg,fontWeight:700}}>{i+1}</span>}</div>;
              })}
            </div>
          </div>
        )}

        {todayQ&&(
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"1.25rem"}}>
            <p style={{fontSize:10,color:C.textMuted,margin:"0 0 8px",letterSpacing:"0.1em",textTransform:"uppercase"}}>Today's Quote</p>
            <p style={{fontSize:17,fontFamily:"Georgia,serif",fontStyle:"italic",color:C.text,margin:"0 0 6px",lineHeight:1.7,letterSpacing:"-0.01em"}}>&ldquo;{todayQ.quote}&rdquo;</p>
            <p style={{fontSize:11,color:C.textMuted,margin:0}}>{"— "+todayQ.title}</p>
          </div>
        )}
      </div>

      {showPicker&&<ProfilePanel xp={xp} badges={badges} medals={medals} userName={userName} remindMonths={remindMonths} onClose={()=>setShowPicker(false)} onSaveName={v=>{setUserName(v);safeSet("username",v);setShowPicker(false);}} onSaveRemind={n=>{setRemindMonths(n);safeSet("remindMonths",n);}}/>}

      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
        {[["month","Library"],["year","Timeline"],["stats","Stats"],["search","Search"]].map(item=>{
          const active=tab===item[0];
          return <button key={item[0]} type="button" onClick={()=>setTab(item[0])} style={{flex:1,padding:"12px 4px",border:"none",borderBottom:active?`2px solid ${C.text}`:"2px solid transparent",background:"transparent",cursor:"pointer",fontSize:11,fontWeight:active?500:400,color:active?C.text:C.textMuted,letterSpacing:"0.05em",marginBottom:"-1px"}}>{item[1]}</button>;
        })}
      </div>

      <div style={{padding:"1.5rem"}}>
        {tab==="month"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button type="button" onClick={()=>navM(-1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.textMuted,padding:0}}>←</button>
                <p style={{fontSize:15,fontWeight:500,margin:0,color:C.text}}>{MONTHS_EN[selM]+" "+selY}</p>
                <button type="button" onClick={()=>navM(1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.textMuted,padding:0}}>→</button>
              </div>
              <button type="button" onClick={exportData} style={{fontSize:11,color:C.textMuted,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.05em"}}>Export</button>
            </div>

            {curGoal>0?(
              <div style={{marginBottom:"1.5rem",padding:"1.25rem",border:`1px solid ${C.border}`,background:C.bgSub}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem"}}>
                  <span style={{fontSize:10,color:C.textMuted,letterSpacing:"0.08em",textTransform:"uppercase"}}>Monthly Goal</span>
                  <button type="button" onClick={()=>{setGoalInp(curGoal);setEditGoal(true);}} style={{fontSize:10,color:C.textMuted,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.05em",padding:0}}>Edit</button>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {Array.from({length:curGoal},(_,i)=>{
                    const filled=i<doneM;
                    return <div key={i} style={{width:26,height:32,borderRadius:2,border:`1px solid ${filled?"transparent":C.border}`,background:filled?(doneM>=curGoal?C.accent:C.text):"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s"}}>{filled&&<span style={{fontSize:8,color:C.bg,fontWeight:700}}>{i+1}</span>}</div>;
                  })}
                </div>
                {goalStreak>0&&<p style={{fontSize:10,color:"#F97316",margin:"8px 0 0",letterSpacing:"0.05em"}}>{"🔥 "+goalStreak+" month streak"}</p>}
              </div>
            ):(
              <button type="button" onClick={()=>{setGoalInp("");setEditGoal(true);}} style={{fontSize:11,color:C.textMuted,background:"none",border:`1px dashed ${C.border}`,cursor:"pointer",letterSpacing:"0.05em",padding:"8px 16px",width:"100%",marginBottom:"1.5rem"}}>+ Set monthly goal</button>
            )}

            {editGoal&&(
              <div style={{marginBottom:"1.5rem",padding:"1rem",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:11,color:C.textMuted,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>Goal:</span>
                <input autoFocus type="number" value={goalInp} onChange={e=>setGoalInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveGoal();}} min={1} max={30} style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,fontSize:14,color:C.text,outline:"none",padding:"4px 0"}}/>
                <span style={{fontSize:11,color:C.textMuted}}>books</span>
                <button type="button" onClick={saveGoal} style={{fontSize:11,padding:"5px 12px",background:C.text,border:"none",cursor:"pointer",color:C.bg,letterSpacing:"0.05em"}}>Save</button>
                <button type="button" onClick={()=>setEditGoal(false)} style={{fontSize:11,color:C.textMuted,background:"none",border:"none",cursor:"pointer"}}>×</button>
              </div>
            )}

            {books.filter(b=>b.status==="want").length>0&&(
              <div style={{marginBottom:"1.5rem"}}>
                <p style={{...hs,marginBottom:"0.75rem"}}>Reading List</p>
                {books.filter(b=>b.status==="want").map(bk=>(
                  <div key={bk.id} onClick={()=>{setSelId(bk.id);setView("detail");}} style={{fontSize:13,color:C.textSub,padding:"6px 0",cursor:"pointer",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>
                    <span>{bk.title+(bk.author?" — "+bk.author:"")}</span>
                    <span style={{fontSize:11,color:C.textMuted}}>→</span>
                  </div>
                ))}
              </div>
            )}

            {monthBooks.length>0&&(
              <div>
                <p style={{...hs,marginBottom:"0.5rem"}}>{monthBooks.length+(monthBooks.length===1?" Book":" Books")}</p>
                {monthBooks.map(bk=><BookRow key={bk.id} b={bk}/>)}
              </div>
            )}
            {monthBooks.length===0&&<p style={{fontSize:13,color:C.textMuted,textAlign:"center",padding:"3rem 0",letterSpacing:"0.03em"}}>No books recorded this month.</p>}
            <button type="button" onClick={()=>{setEditId(null);setView("form");}} style={{width:"100%",padding:"12px",background:"transparent",border:`1px dashed ${C.border}`,cursor:"pointer",fontSize:11,color:C.textMuted,letterSpacing:"0.08em",marginTop:"1.5rem"}}>+ Add Book</button>
          </div>
        )}

        {tab==="year"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.5rem"}}>
              <button type="button" onClick={()=>setYearV(y=>y-1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.textMuted,padding:0}}>←</button>
              <p style={{fontSize:15,fontWeight:500,margin:0,color:C.text}}>{yearV}</p>
              <button type="button" onClick={()=>setYearV(y=>y+1)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.textMuted,padding:0}}>→</button>
              <span style={{fontSize:11,color:C.textMuted,letterSpacing:"0.05em"}}>{yearBooks.length+" books"}</span>
            </div>
            {yearBooks.length===0?<p style={{fontSize:13,color:C.textMuted,textAlign:"center",padding:"3rem 0"}}>No books recorded this year.</p>:(
              <div>
                {MONTHS_EN.map((m,mi)=>{
                  const mBooks=yearBooks.filter(bk=>new Date(bk.dateRead).getMonth()===mi);
                  if(!mBooks.length)return null;
                  return(
                    <div key={mi} style={{marginBottom:"1.5rem"}}>
                      <p style={{...hs,marginBottom:"0.5rem"}}>{m}</p>
                      {mBooks.map(bk=><BookRow key={bk.id} b={bk}/>)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab==="stats"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,marginBottom:"2rem",border:`1px solid ${C.border}`}}>
              {[["Total",books.length],["Read",totalDone],["Avg ★",avgR]].map(item=>(
                <div key={item[0]} style={{padding:"1.5rem 1rem",background:C.bgSub,textAlign:"center"}}>
                  <p style={{fontSize:10,color:C.textMuted,margin:"0 0 8px",letterSpacing:"0.1em",textTransform:"uppercase"}}>{item[0]}</p>
                  <p style={{fontSize:32,fontWeight:300,margin:0,color:C.text,fontFamily:"Georgia,serif",letterSpacing:"-0.02em"}}>{item[1]}</p>
                </div>
              ))}
            </div>
            <p style={{...hs,marginBottom:"1rem"}}>{now.getFullYear()+" Activity"}</p>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:60,marginBottom:"2rem"}}>
              {statsByMonth.map((n,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:"100%",background:n>0?C.text:C.border,height:n>0?Math.round((n/maxStat)*50)+4:4,borderRadius:1,transition:"height 0.3s"}}/>
                  <p style={{fontSize:8,color:C.textMuted,margin:0,letterSpacing:"0.05em"}}>{MONTHS_EN[i].slice(0,1)}</p>
                </div>
              ))}
            </div>
            {allTags.length>0&&(
              <div>
                <p style={{...hs,marginBottom:"1rem"}}>By Category</p>
                {allTags.map(t=>{
                  const cnt=books.filter(bk=>(bk.tags||"").split(",").map(x=>x.trim()).indexOf(t)>=0).length;
                  const w=Math.round((cnt/books.length)*100);
                  return(
                    <div key={t} style={{marginBottom:"0.75rem"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,color:C.text}}>{t}</span>
                        <span style={{fontSize:11,color:C.textMuted}}>{cnt}</span>
                      </div>
                      <div style={{height:1,background:C.border}}><div style={{height:"100%",width:w+"%",background:C.text}}/></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab==="search"&&(
          <div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search books, authors, insights..." style={{width:"100%",boxSizing:"border-box",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,padding:"8px 0",fontSize:14,color:C.text,outline:"none",marginBottom:"1.25rem"}}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:"1.25rem"}}>
              {["all"].concat(Object.keys(STATUS_LABELS)).map(k=><Pill key={k} label={k==="all"?"All":STATUS_LABELS[k]} active={fStatus===k} onClick={()=>setFStatus(k)}/>)}
              {allTags.map(t=><Pill key={t} label={t} active={fTag===t} onClick={()=>setFTag(fTag===t?"":t)}/>)}
            </div>
            {filtered.length===0?<p style={{fontSize:13,color:C.textMuted,textAlign:"center",padding:"3rem 0"}}>No results.</p>:
              <div>{filtered.map(bk=><BookRow key={bk.id} b={bk}/>)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
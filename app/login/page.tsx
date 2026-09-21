"use client";
import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";

export default function Login(){ const [error,setError]=useState(""); const login=async()=>{try{setError(""); await signInWithPopup(auth,googleProvider);}catch(e:any){setError(e.message||"Login failed");}}; return <div className="login"><div className="login-card"><h1>Ask Rae Admin</h1><p className="muted">Sign in with an authorized Ask Rae administrator account.</p>{error&&<div className="error">{error}</div>}<button onClick={login} style={{width:"100%",marginTop:12}}>Continue with Google</button></div></div> }

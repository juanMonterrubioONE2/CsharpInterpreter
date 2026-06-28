function showAuth(which){
    document.getElementById('landing').style.display='none';
    document.getElementById('screen-login').classList.remove('show');
    document.getElementById('screen-register').classList.remove('show');
    document.getElementById('screen-'+which).classList.add('show');
    window.scrollTo(0,0);
}
function showLanding(){
    document.getElementById('screen-login').classList.remove('show');
    document.getElementById('screen-register').classList.remove('show');
    document.getElementById('landing').style.display='block';
    window.scrollTo(0,0);
}
function togglePw(id,btn){
    const inp=document.getElementById(id);
    inp.type=inp.type==='password'?'text':'password';
    btn.style.color=inp.type==='text'?'var(--green)':'';
}

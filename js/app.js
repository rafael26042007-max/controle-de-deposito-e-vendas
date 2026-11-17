const API_URL = `http://${window.location.hostname}:8000`;

let perfilAtivo = 'admin';

function selecionarPerfil(el, perfil) {
  document.querySelectorAll('.perfil-btn').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  perfilAtivo = perfil;
  document.getElementById('erro').classList.remove('show');
}

function toggleSenha() {
  const input = document.getElementById('senha');
  const ico = document.getElementById('toggle-ico');
  if (input.type === 'password') {
    input.type = 'text';
    ico.textContent = '🙈';
  } else {
    input.type = 'password';
    ico.textContent = '👁';
  }
}

async function logar() {
  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value;
  const btn = document.getElementById('btn-login');
  const txt = document.getElementById('btn-txt');
  const spin = document.getElementById('spinner');
  const erro = document.getElementById('erro');

  erro.classList.remove('show');
  document.getElementById('usuario').classList.remove('error');
  document.getElementById('senha').classList.remove('error');

  if (!usuario) {
    document.getElementById('usuario').classList.add('error');
    document.getElementById('erro-texto').textContent = 'Preencha o campo usuário!';
    erro.classList.add('show');
    return;
  }
  if (!senha) {
    document.getElementById('senha').classList.add('error');
    document.getElementById('erro-texto').textContent = 'Preencha o campo senha!';
    erro.classList.add('show');
    return;
  }

  btn.disabled = true;
  txt.style.display = 'none';
  spin.style.display = 'block';

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // BUG-FIX: envia perfilAtivo para o backend validar
      body: JSON.stringify({ usuario, senha, perfil: perfilAtivo })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('perfil', data.perfil);
      localStorage.setItem('nome', data.nome);
      document.getElementById('success').classList.add('show');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    } else {
      throw new Error('credenciais inválidas');
    }
  } catch (e) {
    btn.disabled = false;
    txt.style.display = 'block';
    spin.style.display = 'none';
    document.getElementById('usuario').classList.add('error');
    document.getElementById('senha').classList.add('error');
    document.getElementById('erro-texto').textContent = 'Usuário ou senha incorretos.';
    erro.classList.add('show');
  }
}

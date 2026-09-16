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

function logar() {
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
    return
  }
  if (!senha) {
    document.getElementById('usuario').classList.add('error');
    document.getElementById('erro-texto').textContent = 'Preencha o campo senha!';
    erro.classList.add('show');
    return;
  }
  btn.disabled = true;
  txt.style.display = 'none';
  spin.style.display = 'block';

  setTimeout(() => {
    const credenciais = {
      admin: {user: 'admin', senha: '1234'},
      vendedor: {user: 'vendedor', senha: '1234'},
      producao: {user: 'producao', senha: '1234'}
    };

    const cred = credenciais[perfilAtivo];
    if (usuario === cred.user && senha === cred.senha) {
      document.getElementById('success').classList.add('show');
      setTimeout(() => {
        alert('Redirecionando para o dashboard...');
        document.getElementById('success').classList.remove('show');
        btn.disabled = false;
        txt.style.display = 'block';
        spin.style.display = 'none';
      }, 2000);
    } else {
      btn.disabled = false;
      txt.style.display = 'block';
      spin.style.display = 'none';
      document.getElementById('usuario').classList.add('error');
      document.getElementById('senha').classList.add('error');
      document.getElementById('erro-texto').textContent =
        `Incorreto. (Dica: user="${cred.user}" senha="1234")`;
      erro.classList.add('show');
    }
  }, 1400);
}

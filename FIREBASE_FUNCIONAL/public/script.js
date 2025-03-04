// script.js
const listaTransacoes = document.getElementById('lista-transacoes');
const descricaoInput = document.getElementById('descricao');
const valorInput = document.getElementById('valor');
const tipoSelect = document.getElementById('tipo');
const adicionarBotao = document.getElementById('adicionar');

// Função para adicionar transação ao Firebase
function adicionarTransacao(descricao, valor, tipo) {
  const novaTransacao = {
    descricao: descricao,
    valor: parseFloat(valor),
    tipo: tipo,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };

  database.ref('transacoes').push(novaTransacao);
}

// Função para exibir transações na lista
function exibirTransacoes(transacoes) {
  listaTransacoes.innerHTML = '';

  transacoes.forEach(transacao => {
    const li = document.createElement('li');
    li.className = transacao.tipo;
    li.innerHTML = `
      <strong>${transacao.descricao}</strong>: R$ ${transacao.valor.toFixed(2)} (${transacao.tipo})
    `;
    listaTransacoes.appendChild(li);
  });
}

// Ouvir alterações no Firebase
database.ref('transacoes').on('value', snapshot => {
  const transacoesObj = snapshot.val();
  if (transacoesObj) {
    const transacoesArray = Object.values(transacoesObj);
    exibirTransacoes(transacoesArray);
  } else {
    listaTransacoes.innerHTML = '<li>Nenhuma transação registrada.</li>';
  }
});

// Evento de clique no botão "Adicionar"
adicionarBotao.addEventListener('click', () => {
  const descricao = descricaoInput.value;
  const valor = valorInput.value;
  const tipo = tipoSelect.value;

  if (descricao && valor) {
    adicionarTransacao(descricao, valor, tipo);
    descricaoInput.value = '';
    valorInput.value = '';
  }
});
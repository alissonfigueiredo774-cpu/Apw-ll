// ===== Conexão com o Supabase =====
// carrega SUPABASE_URL, SUPABASE_ANON_KEY e PORT para process.env
// isso precisa vir antes de qualquer uso de process.env
require('dotenv').config();

// importa a função que constrói o cliente HTTP do Supabase
const { createClient } = require('@supabase/supabase-js');

// lê as variáveis como texto simples (strings)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// validação defensiva: se o .env estiver incompleto,
// é melhor travar aqui com uma mensagem clara do que
// receber um erro confuso mais adiante
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
}

// "supabase" é o objeto que sabe conversar com o seu projeto
// por baixo dos panos ele usa HTTPS e envia a anon key no header
// de cada requisição, para o Postgres saber quem está pedindo
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== CURSOS (lado 1) =====

// equivalente a: INSERT INTO cursos (nome) VALUES (...)
async function inserirCurso(nome) {
  const { data, error } = await supabase
    .from('cursos')
    .insert([{ nome }])
    .select()
    .single();
  if (error) throw error;
  return data; // { id, nome, criado_em }
}

// lista os cursos e conta quantos alunos cada um tem
async function listarCursos() {
  const { data, error } = await supabase
    .from('cursos')
    .select('id, nome, alunos(count)') // conta os alunos relacionados
    .order('nome', { ascending: true });
  if (error) throw error;
  // o Supabase devolve: { id, nome, alunos: [{ count: 3 }] }
  // simplificamos para:   { id, nome, total_alunos: 3 }
  return data.map((curso) => ({
    id: curso.id,
    nome: curso.nome,
    total_alunos: curso.alunos[0]?.count ?? 0,
  }));
}

// se o curso ainda tiver alunos, o banco recusa (on delete restrict)
// e o erro vem com code '23503' (violação de chave estrangeira)
async function excluirCurso(id) {
  const { data, error } = await supabase
    .from('cursos').delete().eq('id', id).select();
  if (error) throw error;
  return data;
}

// Slides 39 em diante (funções de alunos) ficam para a próxima etapa.
module.exports = {
  supabase,
  inserirCurso,
  listarCursos,
  excluirCurso,
};

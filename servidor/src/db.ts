// Autor: Kauan Paixão
// Conexão com o MySQL. Todas as rotas importam o pool daqui:
//   import pool from '../db';

import 'dotenv/config';
import mysql from 'mysql2/promise';

// Avisa logo na subida do servidor se faltar alguma configuração no .env.
const obrigatorias = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
for (const nome of obrigatorias) {
  if (!process.env[nome]) {
    console.error(`Falta a variável ${nome} no .env (veja o .env.example).`);
  }
}

// Pool: reaproveita conexões em vez de abrir uma nova a cada requisição.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // datas chegam como texto ("2026-11-10"), mais fácil no front
});

// Testa a conexão uma vez quando o servidor sobe.
pool
  .getConnection()
  .then((conexao) => {
    console.log('Conectado ao MySQL.');
    conexao.release();
  })
  .catch((erro) => {
    console.error('Não foi possível conectar ao MySQL:', erro.message);
  });

export default pool;

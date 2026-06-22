// netlify/functions/listar-cierres.js
//
// Lee todos los registros de la tabla cierres_diarios y los devuelve como JSON.
// Usa la misma DATABASE_URL que ya configuraste para guardar-cierre.js.

const { Client } = require('pg');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const query = `
      SELECT
        id,
        fecha,
        responsable,
        firma,
        hora_cierre,
        ST_Y(ubicacion::geometry) AS lat,
        ST_X(ubicacion::geometry) AS lng,
        tareas,
        verificacion,
        creado_en
      FROM cierres_diarios
      ORDER BY fecha DESC, creado_en DESC
      LIMIT 200;
    `;

    const result = await client.query(query);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, registros: result.rows })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  } finally {
    await client.end();
  }
};

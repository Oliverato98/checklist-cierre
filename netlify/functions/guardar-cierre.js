// netlify/functions/guardar-cierre.js
//
// Esta función corre en la nube de Netlify (no en tu servidor).
// Recibe los datos del checklist desde el navegador y los inserta en tu Postgres/PostGIS.
//
// Necesitas instalar la dependencia "pg" y configurar la variable de entorno DATABASE_URL
// en el panel de Netlify (Site settings > Environment variables).
// Formato típico de DATABASE_URL:
//   postgres://usuario:password@tu-host:5432/tu_basededatos

const { Client } = require('pg');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'JSON inválido' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // ajusta según la config de tu servidor
  });

  try {
    await client.connect();

    const { fecha, responsable, firma, hora, lat, lng, tareas, verif } = data;

    const query = `
      INSERT INTO cierres_diarios (fecha, responsable, firma, hora_cierre, ubicacion, tareas, verificacion)
      VALUES ($1, $2, $3, $4,
        CASE WHEN $5::float8 IS NOT NULL AND $6::float8 IS NOT NULL
             THEN ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography
             ELSE NULL END,
        $7::jsonb, $8::jsonb)
      RETURNING id;
    `;
    // Nota: ST_MakePoint(lng, lat) -- el orden es longitud, luego latitud

    const values = [
      fecha || null,
      responsable || null,
      firma || null,
      hora || null,
      lat ?? null,
      lng ?? null,
      JSON.stringify(tareas || []),
      JSON.stringify(verif || [])
    ];

    const result = await client.query(query, values);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, id: result.rows[0].id })
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

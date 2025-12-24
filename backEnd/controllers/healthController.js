const mongoose = require('mongoose');

const getHealth = (req, res) => {
  const state = mongoose.connection.readyState;
  let dbStatus = 'disconnected';
  if (state === 1) dbStatus = 'connected';
  else if (state === 2) dbStatus = 'connecting';
  else if (state === 3) dbStatus = 'disconnecting';
  res.json({ ok: true, db: dbStatus });
};

module.exports = { getHealth };

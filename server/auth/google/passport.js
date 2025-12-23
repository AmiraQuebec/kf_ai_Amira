'use strict';
/**
 * Google OAuth: n'enregistre PAS la stratégie si les clés manquent.
 * Ainsi, le login local continue de fonctionner et l'app démarre.
 */
const passport = require('passport');
let GoogleStrategy;
try { GoogleStrategy = require('passport-google-oauth20').Strategy; } catch (e) {}

function loadSettings() {
  try { return require('../../settings.js'); } catch (e) {}
  try { return require('../../../settings.js'); } catch (e) {}
  return {};
}

exports.setup = function(User /*, config*/) {
  const settings = loadSettings() || {};
  const g = (settings.google || (settings.auth && settings.auth.google)) || {};
  const clientID = g.clientId || g.clientID;
  const clientSecret = g.clientSecret;
  const callbackURL = g.callbackURL || '/auth/google/callback';

  // Si pas de lib, ou pas de clés -> on désactive proprement
  if (!GoogleStrategy || !clientID || !clientSecret) {
    console.warn('[KF][auth/google] Désactivé (GoogleStrategy ou clientId/clientSecret manquants).');
    return; // ne pas enregistrer de stratégie, pas d’exception
  }

  // Si un jour tu renseignes les clés, la stratégie sera enregistrée et utilisable :
  passport.use(new GoogleStrategy(
    { clientID, clientSecret, callbackURL },
    function(accessToken, refreshToken, profile, done) {
      // Laisse la logique réelle du projet ici si nécessaire (findOrCreate).
      // Par sécurité minimale: on ne crée rien automatiquement si le code projet ne le fait pas.
      return done(null, false); // ajuster selon le besoin réel
    }
  ));
};

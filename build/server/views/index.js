var jade = require('jade/runtime');
module.exports = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (JSON, env, getLocale, t) {
var jade_indent = [];
buf.push("<!DOCTYPE html>\n<html" + (jade.attr("lang", getLocale(), true, true)) + ">\n  <head>\n    <meta charset=\"utf-8\">\n    <title>" + (jade.escape(null == (jade_interp = t('index title')) ? "" : jade_interp)) + "</title>\n    <meta name=\"description\"" + (jade.attr("content", t('index description'), true, true)) + ">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <link rel=\"apple-touch-icon\" sizes=\"57x57\" href=\"/apple-touch-icon-57x57.png\">\n    <link rel=\"apple-touch-icon\" sizes=\"60x60\" href=\"/apple-touch-icon-60x60.png\">\n    <link rel=\"apple-touch-icon\" sizes=\"72x72\" href=\"/apple-touch-icon-72x72.png\">\n    <link rel=\"apple-touch-icon\" sizes=\"76x76\" href=\"/apple-touch-icon-76x76.png\">\n    <link rel=\"apple-touch-icon\" sizes=\"114x114\" href=\"/apple-touch-icon-114x114.png\">\n    <link rel=\"apple-touch-icon\" sizes=\"120x120\" href=\"/apple-touch-icon-120x120.png\">\n    <link rel=\"apple-touch-icon\" sizes=\"144x144\" href=\"/apple-touch-icon-144x144.png\">\n    <link rel=\"apple-touch-icon\" sizes=\"152x152\" href=\"/apple-touch-icon-152x152.png\">\n    <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/apple-touch-icon-180x180.png\">\n    <link rel=\"icon\" type=\"image/png\" href=\"/favicon-32x32.png\" sizes=\"32x32\">\n    <link rel=\"icon\" type=\"image/png\" href=\"/favicon-194x194.png\" sizes=\"194x194\">\n    <link rel=\"icon\" type=\"image/png\" href=\"/favicon-96x96.png\" sizes=\"96x96\">\n    <link rel=\"icon\" type=\"image/png\" href=\"/android-chrome-192x192.png\" sizes=\"192x192\">\n    <link rel=\"icon\" type=\"image/png\" href=\"/favicon-16x16.png\" sizes=\"16x16\">\n    <link rel=\"manifest\" href=\"/manifest.json\">\n    <meta name=\"msapplication-TileColor\" content=\"#20a8f1\">\n    <meta name=\"msapplication-TileImage\" content=\"/mstile-144x144.png\">\n    <meta name=\"theme-color\" content=\"#20a8f1\">\n    <link rel=\"stylesheet\" href=\"/fonts/fonts.css\">\n    <link rel=\"stylesheet\" href=\"/styles/app.css\">\n  </head>\n  <body>\n    <main role=\"application\">\n      <noscript>\n        <section class=\"popup\">\n          <header><a title=\"Cozy Website\" href=\"https://cozy.io\"></a></header>\n          <div class=\"container\">\n            <h1>" + (jade.escape(null == (jade_interp = t('index noscript title')) ? "" : jade_interp)) + "</h1>\n            <p class=\"help\">" + (jade.escape(null == (jade_interp = t('index noscript message')) ? "" : jade_interp)) + "</p>\n          </div>\n        </section>\n      </noscript>\n    </main>\n    <script src=\"/scripts/vendor.js\"></script>");
if ( env)
{
buf.push("\n    <script>\n      require.register('env', function(exports, require, module) {\n        module.exports = " + (((jade_interp = JSON.stringify(env)) == null ? '' : jade_interp)) + "\n      })\n    </script>");
}
buf.push("\n    <script src=\"/scripts/app.js\" onload=\"require('initialize');\"></script>\n  </body>\n</html>");}.call(this,"JSON" in locals_for_with?locals_for_with.JSON:typeof JSON!=="undefined"?JSON:undefined,"env" in locals_for_with?locals_for_with.env:typeof env!=="undefined"?env:undefined,"getLocale" in locals_for_with?locals_for_with.getLocale:typeof getLocale!=="undefined"?getLocale:undefined,"t" in locals_for_with?locals_for_with.t:typeof t!=="undefined"?t:undefined));;return buf.join("");
}
// runtime can't be in strict mode because a global variable is assign and maybe created.
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([["instrumentation"],{

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   onRequestError: () => (/* binding */ onRequestError)\n/* harmony export */ });\n/**\n * Registro de errores del servidor en los logs (Railway), sin datos personales:\n * los enlaces secretos de las rutas se sustituyen por \":token\".\n * Es la base mínima mientras no haya un servicio de seguimiento de errores.\n */ const redact = (path)=>path.replace(/[A-Za-z0-9_-]{43}/g, ':token');\nasync function onRequestError(err, request, context) {\n    const e = err;\n    console.error('[server-error]', JSON.stringify({\n        method: request.method,\n        path: redact(request.path),\n        route: context.routePath,\n        type: context.routeType,\n        message: e?.message ?? String(err),\n        digest: e?.digest\n    }));\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztDQUlDLEdBQ0QsTUFBTUEsU0FBUyxDQUFDQyxPQUFpQkEsS0FBS0MsT0FBTyxDQUFDLHNCQUFzQjtBQUU3RCxlQUFlQyxlQUNwQkMsR0FBWSxFQUNaQyxPQUF5QyxFQUN6Q0MsT0FBcUU7SUFFckUsTUFBTUMsSUFBSUg7SUFDVkksUUFBUUMsS0FBSyxDQUNYLGtCQUNBQyxLQUFLQyxTQUFTLENBQUM7UUFDYkMsUUFBUVAsUUFBUU8sTUFBTTtRQUN0QlgsTUFBTUQsT0FBT0ssUUFBUUosSUFBSTtRQUN6QlksT0FBT1AsUUFBUVEsU0FBUztRQUN4QkMsTUFBTVQsUUFBUVUsU0FBUztRQUN2QkMsU0FBU1YsR0FBR1UsV0FBV0MsT0FBT2Q7UUFDOUJlLFFBQVFaLEdBQUdZO0lBQ2I7QUFFSiIsInNvdXJjZXMiOlsiL2hvbWUvdXNlci9KdWljaW8tbmF2aWRlLW8vaW5zdHJ1bWVudGF0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUmVnaXN0cm8gZGUgZXJyb3JlcyBkZWwgc2Vydmlkb3IgZW4gbG9zIGxvZ3MgKFJhaWx3YXkpLCBzaW4gZGF0b3MgcGVyc29uYWxlczpcbiAqIGxvcyBlbmxhY2VzIHNlY3JldG9zIGRlIGxhcyBydXRhcyBzZSBzdXN0aXR1eWVuIHBvciBcIjp0b2tlblwiLlxuICogRXMgbGEgYmFzZSBtw61uaW1hIG1pZW50cmFzIG5vIGhheWEgdW4gc2VydmljaW8gZGUgc2VndWltaWVudG8gZGUgZXJyb3Jlcy5cbiAqL1xuY29uc3QgcmVkYWN0ID0gKHBhdGg6IHN0cmluZykgPT4gcGF0aC5yZXBsYWNlKC9bQS1aYS16MC05Xy1dezQzfS9nLCAnOnRva2VuJyk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvblJlcXVlc3RFcnJvcihcbiAgZXJyOiB1bmtub3duLFxuICByZXF1ZXN0OiB7IHBhdGg6IHN0cmluZzsgbWV0aG9kOiBzdHJpbmcgfSxcbiAgY29udGV4dDogeyByb3V0ZXJLaW5kOiBzdHJpbmc7IHJvdXRlUGF0aDogc3RyaW5nOyByb3V0ZVR5cGU6IHN0cmluZyB9LFxuKSB7XG4gIGNvbnN0IGUgPSBlcnIgYXMgeyBtZXNzYWdlPzogc3RyaW5nOyBkaWdlc3Q/OiBzdHJpbmcgfTtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnW3NlcnZlci1lcnJvcl0nLFxuICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIG1ldGhvZDogcmVxdWVzdC5tZXRob2QsXG4gICAgICBwYXRoOiByZWRhY3QocmVxdWVzdC5wYXRoKSxcbiAgICAgIHJvdXRlOiBjb250ZXh0LnJvdXRlUGF0aCxcbiAgICAgIHR5cGU6IGNvbnRleHQucm91dGVUeXBlLFxuICAgICAgbWVzc2FnZTogZT8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyKSxcbiAgICAgIGRpZ2VzdDogZT8uZGlnZXN0LFxuICAgIH0pLFxuICApO1xufVxuIl0sIm5hbWVzIjpbInJlZGFjdCIsInBhdGgiLCJyZXBsYWNlIiwib25SZXF1ZXN0RXJyb3IiLCJlcnIiLCJyZXF1ZXN0IiwiY29udGV4dCIsImUiLCJjb25zb2xlIiwiZXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwibWV0aG9kIiwicm91dGUiLCJyb3V0ZVBhdGgiLCJ0eXBlIiwicm91dGVUeXBlIiwibWVzc2FnZSIsIlN0cmluZyIsImRpZ2VzdCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
/******/ (_ENTRIES = typeof _ENTRIES === "undefined" ? {} : _ENTRIES).middleware_instrumentation = __webpack_exports__;
/******/ }
]);
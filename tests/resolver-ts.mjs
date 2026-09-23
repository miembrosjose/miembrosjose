// Resolvedor mínimo para las pruebas.
//
// El código de la aplicación importa sin extensión ("./mappings"), que es lo
// que espera el empaquetador de Next. El cargador de módulos de Node, en
// cambio, exige la extensión. En vez de cambiar el estilo de importación de
// todo el proyecto —o de añadir una dependencia de pruebas— este enganche
// prueba a añadir ".ts" y "/index.ts" cuando la ruta no resuelve tal cual.
//
// Se registra con:  node --import ./tests/resolver-ts.mjs --test <archivo>

import { register } from "node:module"
import { pathToFileURL } from "node:url"

register("./resolver-ts-hook.mjs", pathToFileURL("./tests/"))

import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC_DIR = resolvePath(dirname(fileURLToPath(import.meta.url)), "../..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (specifier.startsWith("@/")) {
        const candidate = resolvePath(SRC_DIR, `${specifier.slice(2)}.ts`);
        if (existsSync(candidate)) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
      if (
        (specifier.startsWith("./") || specifier.startsWith("../")) &&
        context.parentURL
      ) {
        const baseDir = dirname(fileURLToPath(context.parentURL));
        const candidate = resolvePath(baseDir, `${specifier}.ts`);
        if (existsSync(candidate)) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
      throw err;
    }
  },
});


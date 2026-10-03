import { generateKeyPair, exportPKCS8, exportJWK } from "jose";
import { spawnSync } from "node:child_process";
const run = (args) => {
  const r = spawnSync("npx", ["convex", ...args], { encoding: "utf8" });
  if (r.status !== 0)
    throw new Error("Convex auth setup failed. Check dashboard access.");
};
const existing = spawnSync("npx", ["convex", "env", "get", "JWKS"], {
  encoding: "utf8",
});
if (existing.status !== 0 || !existing.stdout.trim()) {
  const keys = await generateKeyPair("RS256", { extractable: true });
  run([
    "env",
    "set",
    "JWT_PRIVATE_KEY=" +
      (await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g, " "),
  ]);
  run([
    "env",
    "set",
    "JWKS=" +
      JSON.stringify({
        keys: [{ use: "sig", ...(await exportJWK(keys.publicKey)) }],
      }),
  ]);
}
run(["env", "set", "SITE_URL=http://127.0.0.1:5173"]);
console.log(
  "Convex signing keys and local return address configured. No secrets printed.",
);

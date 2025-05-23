import { execSync } from "child_process";

// Obtén el mensaje del commit desde los argumentos
const commitMessage = process.argv[2] || "Actualización después de build";

try {
    // Ejecuta los comandos necesarios
    execSync('firebase deploy --only hosting:private', { stdio: "inherit" });
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });
    execSync("git push", { stdio: "inherit" });
} catch (error) {
    console.error("Error durante el postbuild:", error.message);
    process.exit(1);
}

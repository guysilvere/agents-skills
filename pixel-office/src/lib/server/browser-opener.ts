import { exec } from 'node:child_process';

let lastOpenCheckAt = 0;
const CHECK_COOLDOWN_MS = 6000; // Évite de saturer AppleScript en continu

/**
 * S'assure que https://pixel-office.test/ est ouvert dans Google Chrome.
 * Si un onglet existe déjà sur pixel-office.test, pixel-office.localhost ou 127.0.0.1:5173,
 * aucun doublon n'est créé.
 */
export function ensurePixelOfficeBrowserOpen(url = 'https://pixel-office.test/'): void {
	const now = Date.now();
	if (now - lastOpenCheckAt < CHECK_COOLDOWN_MS) {
		return;
	}
	lastOpenCheckAt = now;

	// Uniquement sur macOS
	if (process.platform !== 'darwin') return;

	const appleScript = `
tell application "System Events"
    set isRunning to (name of processes) contains "Google Chrome"
end tell
if not isRunning then
    do shell script "open -a 'Google Chrome' '${url}'"
else
    tell application "Google Chrome"
        set foundTab to false
        repeat with w in windows
            repeat with t in tabs of w
                set tURL to URL of t
                if tURL starts with "https://pixel-office.test" or tURL starts with "http://pixel-office.test" or tURL starts with "https://pixel-office.localhost" or tURL starts with "http://pixel-office.localhost" or tURL starts with "http://127.0.0.1:5173" then
                    set foundTab to true
                    exit repeat
                end if
            end repeat
            if foundTab then exit repeat
        end repeat
        if not foundTab then
            open location "${url}"
        end if
    end tell
end if
`;

	exec(`osascript -e '${appleScript.replace(/'/g, "'\\''")}'`, (err) => {
		if (err) {
			// En cas d'erreur de script ou si Chrome est fermé, fallback via open direct sans forcer
			// console.debug('[BrowserOpener] AppleScript check:', err.message);
		}
	});
}

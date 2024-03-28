/**
 * @typedef {Object} LauncherOptions
 * @property {string} Name - Título do aplicativo.
 * @property {string} Exec - Comando para executar o aplicativo.
 * @property {string} Icon - Ícone do aplicativo.
 * @property {string} Categories - Categorias do aplicativo.
 * @property {string} Terminal - Se o aplicativo deve ser executado no terminal.
 * @property {string} Type - Tipo do aplicativo.
 */

/**
 * Cria um arquivo .desktop para o aplicativo.
 * @param {LauncherOptions} options 
 * @returns {string} Conteúdo do arquivo .desktop.
 */
export function launcherFile(options) {
    return Object.entries(options).reduce((content, [key, value]) => {
        if ((value ?? null) !== null) {
            content += `${key}=${value}\n`;
        }

        return content;
    }, `[Desktop Entry]\n`);
}
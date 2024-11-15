/**
 * Módulo para manipulação de arquivos que estão sendo editados no editor
 * @module lenz:file 
 */

import { ensureInitialized } from "./util.js";

/**
 * Retorna o arquivo atualmente aberto no editor
 * @returns 
 */
export function getCurrentFile() {
  return ensureInitialized().files().currentFile;
}

/**
 * Abre um arquivo para edição no editor
 * @param filepath Caminho do arquivo a ser aberto
 */
export async function open(filepath: string) {
  await ensureInitialized().files().openFile(filepath);
}

/**
 * Escreve conteúdo no arquivo atual
 * @param content Conteúdo a ser escrito ou uma função que retorna o conteúdo
 * @param writeHistory Se deve escrever no histórico de edições
 */
export async function write(
  content: string | ((lastContent: string) => string | Promise<string>),
  writeHistory = true
) {
  const store = ensureInitialized().files();

  let lastContent = store.content;

  if (typeof content === "function") {
    content = (await content(lastContent)) ?? lastContent;
  }

  await store.writeFile(store.currentFile.filepath, content, writeHistory);
}

/**
 * Salva o arquivo atual
 */
export async function save() {
  await getCurrentFile().save();
}

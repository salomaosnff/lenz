import { invoke } from 'lenz:invoke';

export function readFile(path) {
  return invoke('fs.readFile', { path })
}
export function writeFile(path, data) {
  return invoke('fs.writeFile', { path, data: new Blob([data]) })
}
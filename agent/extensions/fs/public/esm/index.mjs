import { invoke } from 'lenz:invoke';

export function read(path) {
  return invoke('fs.read', { path })
}
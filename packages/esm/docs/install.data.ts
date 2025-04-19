export default {
    async load() {
        return fetch("https://api.github.com/repos/salomaosnff/lenz/releases/latest")
            .then((res) => res.json())
    }
}
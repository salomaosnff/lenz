---
title: 'Instalação'
---

<script setup>
    import { data } from './install.data'

    function formatDate(dateString) {
        const date = new Date(dateString);

        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
        });
    }

    function formatSize(size) {
        if (size < 1024) {
            return size + ' B';
        }

        const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const index = Math.floor(Math.log(size) / Math.log(1024));

        const formattedSize = (size / Math.pow(1024, index)).toFixed(2);
        return formattedSize + ' ' + units[index];
    }
</script>

# Instalação do Lenz Designer


## Requisitos
Para instalar o Lenz Designer, você precisa possuir os seguintes requisitos:

| Requisito                          | Descrição                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Sistema Operacional                | Qualquer distribuição Linux                                                              |
| Navegador Web moderno e atualizado | É recomendado um navegador baseado em Chromium como Google Chrome, Brave, Microsoft Edge |

## Downloads

Lenz Designer está disponível para todas as distribuições Linux. Escolha o pacote de instalação de acordo com o seu sistema operacional ou preferência:

::: tip
Se você não sabe qual pacote baixar, escolha o pacote .AppImage, ele é portátil, não requer instalação e funciona na maioria das distribuições Linux.
:::

<table>
    <tbody>
    <tr>
        <th>Nome do arquivo</th>
        <th>Tamanho</th>
        <th>Data de publicação</th>
        <th></th>
    </tr>
        <!-- <tr>
            <td>Debian/Ubuntu e derivados</td>
            <td>Pacote Debian (.deb)</td>
            <td><a href="https://github.com/salomaosnff/lenz/releases/download/v0.2.0/lenz-designer.deb">Baixar arquivo</a></td>
        </tr> -->
        <tr v-for="asset in data.assets">
            <td>{{asset.name}}</td>
            <td>{{formatSize(asset.size)}}</td>
            <td>{{formatDate(asset.created_at)}}</td>
            <td><a :href="asset.browser_download_url">Baixar arquivo</a></td>
        </tr>
    </tbody>
</table>

<!-- ## Debian/Ubuntu e derivados

Para instalar o Lenz Designer no Debian/Ubuntu e derivados, [baixe o pacote .deb](https://github.com/salomaosnff/lenz-designer/releases/download/v0.2.0/lenz-designer.deb) e execute o comando abaixo no terminal para instalar o pacote:

```bash
sudo dpkg -i lenz-designer.deb
```

::: warning
É necessário privilégios de administrador para instalar o pacote .deb.
::: -->

## AppImage (portátil)

::: tip
Este método é recomendado para usuários que desejam testar o Lenz Designer sem instalar no sistema operacional ou não possuem privilégios de administrador.
:::


Após efetuar o download do arquivo .AppImage, execute os comandos abaixo no terminal para conceder permissão de execução.

::: info
Este passo é necessário somente na primeira execução.
:::

```bash
chmod +x lenz-designer.AppImage
```

Execute o arquivo .AppImage para iniciar a aplicação:

```bash
./lenz-designer.AppImage
```

## Outras distribuições Linux

Para instalar o Lenz Designer a partir de um arquivo compactado, siga os passos abaixo:

### Extração do arquivo .tar.gz

```bash
# extrai o arquivo .tar.gz para a pasta /opt/lenz
sudo tar -xvf lenz-designer.tar.gz -C /opt/lenz
```

### Extração do arquivo .tar.xz

```bash
# extrai o arquivo .tar.xz para a pasta /opt/lenz
sudo tar -xvf lenz-designer.tar.xz -C /opt/lenz
```

::: tip
Caso você não tenha privilégios de administrador, poderá extrair o arquivo compactado em qualquer outra pasta do seu sistema.
:::

### Permissão de execução

Após a extração do arquivo compactado, execute o comando abaixo para conceder permissão de execução ao arquivo binário:

```bash
sudo chmod +x /opt/lenz/bin/lenz
```

### Iniciar o Lenz Designer

Após a extração do arquivo compactado, execute o comando abaixo no terminal para iniciar o Lenz Designer:

```bash
/opt/lenz/bin/lenz
```
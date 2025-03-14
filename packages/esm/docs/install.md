---
title: 'Instalação'
---

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
        <th>Sistema Operacional</th>
        <th>Notas</th>
        <th>Download</th>
    </tr>
    <!-- <tr>
        <td>Debian/Ubuntu e derivados</td>
        <td>Pacote Debian (.deb)</td>
        <td><a href="https://github.com/salomaosnff/lenz/releases/download/v0.2.0/lenz-designer.deb">Baixar arquivo</a></td>
    </tr> -->
    <tr>
        <td rowspan="4">Todas as distribuições Linux</td>
        <td>Executável portátil (.AppImage)</td>
        <td><a href="https://github.com/salomaosnff/lenz/releases/download/v0.2.0/lenz-designer.AppImage">Baixar arquivo</a></td>
    </tr>
    <tr>
        <td>Arquivo compactado (.tar.gz)</td>
        <td><a href="https://github.com/salomaosnff/lenz/releases/download/v0.2.0/lenz-designer.tar.gz">Baixar arquivo</a></td>
    </tr>
    <tr>
        <td>Arquivo compactado (.tar.xz)</td>
        <td><a href="https://github.com/salomaosnff/lenz/releases/download/v0.2.0/lenz-designer.tar.xz">Baixar arquivo</a></td>
    </tr>
    <tr>
        <td>Arquivo compactado (.zip)</td>
        <td><a href="https://github.com/salomaosnff/lenz/releases/download/v0.2.0/lenz-designer.zip">Baixar arquivo</a></td>
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

### Extração do arquivo .zip

```bash
# extrai o arquivo .zip para a pasta /opt/lenz
sudo unzip lenz-designer.zip -d /opt/lenz
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
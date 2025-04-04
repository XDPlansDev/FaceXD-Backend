# CONFIG GIT

git config --global user.name "Xavier, David"
git config --global user.email "xdplansdev@gmail.com"

## GIT TUTORIAL

# 1. Acesse o diretório do seu projeto local

Abra o Git Bash e navegue até a pasta do seu projeto com o comando:

cd /c/caminho/do/seu/projeto
(substitua pelo caminho real do seu projeto)

# 2. Adicionar o repositório remoto

Use o comando abaixo para adicionar esse repositório remoto com o nome origin (ou outro nome, se quiser):

    git remote add origin git@github.com:xdplansprojetos/facexd-backend.git

Se o remoto já existir e você quiser substituir, use:

    git remote set-url origin git@github.com:xdplansprojetos/facexd-backend.git

    git remote set-url origin git@github.com:XDPlansDev/FaceXD-Backend.git

# 3. Verifique se foi adicionado corretamente

Rode:

    git remote -v

Você verá algo como:

    origin  git@github.com:xdplansprojetos/facexd-backend.git (fetch)
    origin  git@github.com:xdplansprojetos/facexd-backend.git (push)

# 4. Dar push para o repositório remoto

Se for o primeiro push, faça:

    git push -u origin main
(ou master, dependendo do nome da sua branch)

# CRIAR SSH KEY

ssh-keygen -t ed25519 -C "xdplansdev@gmail.com"

# TESTAR SSH KEY

ssh -T git@github.com

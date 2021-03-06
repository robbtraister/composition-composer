FROM alpine:3.9

RUN \
    apk update && \
    apk upgrade && \
    apk add --no-cache \
            nodejs-npm \
            && \
    npm i -g npm && \
    node -v && \
    npm -v

WORKDIR /opt/composition

COPY package*.json ./
RUN \
    npm install --ignore-scripts

COPY . .
RUN \
    npm run build && \
    npm run test && \
    rm -rf ./project/{build,src}

ENV PATH=${PATH}:/opt/composition/node_modules/.bin
ENV PROJECT_ROOT=/opt/composition/project
WORKDIR ${PROJECT_ROOT}

ENTRYPOINT ["npm", "--prefix=/opt/composition/bin", "run"]
CMD ["dev"]

ONBUILD COPY package*.json ./
ONBUILD RUN npm install --production --ignore-scripts


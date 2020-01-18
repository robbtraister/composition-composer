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
    # npm run test && \
    rm -rf ./bundle/{build,src}

ENV PROJECT_ROOT=/opt/composition/bundle
WORKDIR ${PROJECT_ROOT}

ENTRYPOINT ["npm", "--prefix=/opt/composition/bin", "run"]
CMD ["dev"]

ONBUILD COPY package*.json ./
ONBUILD RUN npm install --production --ignore-scripts

